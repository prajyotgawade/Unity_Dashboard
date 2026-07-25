'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { Plus, Trash2, Save, ArrowRight, Loader2, ChevronDown, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

type LineItem = {
  id?: string
  item_id: string | null
  description: string
  quantity: number
  unit: string
  rate: number
  amount: number
  make?: string | null
}

type DocumentData = {
  id?: string
  type: 'quotation' | 'invoice' | 'dc' | 'po' | 'wcc'
  document_number: string
  document_date: string
  status: 'Draft' | 'Sent' | 'Pending' | 'Paid' | 'Overdue'
  client_id: string | null
  supplier_id: string | null
  parent_id: string | null
  reference_number: string | null
  subject: string | null
  metadata: any
  subtotal: number
  cgst: number
  sgst: number
  total: number
  lines: LineItem[]
}

const DEFAULT_TERMS = {
  quotation: "1. GST 18% extra applicable\n2. Quotation validity: 2 days\n3. Delivery: within 15 days of PO\n4. Payment: 100% against invoice",
  po: "1. Material should strictly conform to specifications\n2. Invoice must be GST compliant\n3. Delivery strictly as per timeline\n4. Defective material must be replaced immediately\n5. Payment will be processed upon receipt of material",
  wcc: "Successfully completed the electrical work as per the scope and requirements."
}

export function DocumentEditor({
  initialData,
  initialLines,
  clients,
  suppliers,
  items,
  isNew,
}: {
  initialData: any
  initialLines: any[]
  clients: any[]
  suppliers: any[]
  items: any[]
  isNew: boolean
}) {
  const router = useRouter()
  const supabase = createClient()
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [documentId, setDocumentId] = useState<string | null>(initialData?.id || null)

  const defaultValues: DocumentData = useMemo(() => {
    if (!isNew && initialData) {
      return {
        ...initialData,
        document_date: initialData.document_date || format(new Date(), 'yyyy-MM-dd'),
        metadata: initialData.metadata || {},
        lines: initialLines.length > 0 ? initialLines : [{ item_id: null, description: '', quantity: 1, unit: 'Nos', rate: 0, amount: 0 }],
      }
    }
    
    return {
      type: 'quotation',
      document_number: '', // Auto-generate later or user inputs
      document_date: format(new Date(), 'yyyy-MM-dd'),
      status: 'Draft',
      client_id: null,
      supplier_id: null,
      parent_id: null,
      reference_number: '',
      subject: '',
      metadata: { terms: DEFAULT_TERMS['quotation'] },
      subtotal: 0,
      cgst: 0,
      sgst: 0,
      total: 0,
      lines: [{ item_id: null, description: '', quantity: 1, unit: 'Nos', rate: 0, amount: 0 }],
    }
  }, [initialData, initialLines, isNew])

  const { register, control, handleSubmit, watch, setValue, getValues, reset } = useForm<DocumentData>({
    defaultValues,
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  })

  const formValues = watch()
  const watchType = watch('type')
  const watchLines = watch('lines')

  // Live Calculations
  useEffect(() => {
    let newSubtotal = 0
    const updatedLines = getValues('lines').map(line => {
      // WCC and DC don't use rates usually, but we keep the math generic. 
      // If rate is 0, amount is 0.
      const amount = (line.quantity || 0) * (line.rate || 0)
      newSubtotal += amount
      return { ...line, amount }
    })

    // Avoid infinite loop by only updating if amounts changed
    const currentLines = getValues('lines')
    const needsUpdate = currentLines.some((l, i) => l.amount !== updatedLines[i].amount)
    
    if (needsUpdate) {
      setValue('lines', updatedLines, { shouldDirty: true })
    }

    // Taxes only apply to Invoice and PO in the layout requirements
    let cgst = 0
    let sgst = 0
    let total = newSubtotal

    if (watchType === 'invoice' || watchType === 'po') {
      cgst = newSubtotal * 0.09
      sgst = newSubtotal * 0.09
      total = newSubtotal + cgst + sgst
    }

    if (
      getValues('subtotal') !== newSubtotal ||
      getValues('cgst') !== cgst ||
      getValues('sgst') !== sgst ||
      getValues('total') !== total
    ) {
      setValue('subtotal', newSubtotal, { shouldDirty: true })
      setValue('cgst', cgst, { shouldDirty: true })
      setValue('sgst', sgst, { shouldDirty: true })
      setValue('total', total, { shouldDirty: true })
    }
  }, [watchLines, watchType, setValue, getValues])

  // Handle Type Change (Reset specific fields)
  useEffect(() => {
    if (isNew) {
       // set default terms when type changes
       const currentTerms = getValues('metadata.terms')
       if (!currentTerms || Object.values(DEFAULT_TERMS).includes(currentTerms)) {
          setValue('metadata.terms', DEFAULT_TERMS[watchType as keyof typeof DEFAULT_TERMS] || '')
       }
    }
  }, [watchType, isNew, setValue, getValues])

  const handleItemSelect = (index: number, itemId: string) => {
    if (!itemId) return
    const item = items.find(i => i.id === itemId)
    if (item) {
      setValue(`lines.${index}.description`, item.description, { shouldDirty: true })
      setValue(`lines.${index}.unit`, item.unit, { shouldDirty: true })
      setValue(`lines.${index}.rate`, item.rate, { shouldDirty: true })
    }
  }

  // Debounced Auto-save
  useEffect(() => {
    if (isNew && !documentId) return // Don't auto-save completely new empty forms instantly

    const handler = setTimeout(async () => {
      // Only auto save if there's a document number and client/supplier selected
      if (!getValues('document_number')) return
      if (watchType === 'po' && !getValues('supplier_id')) return
      if (watchType !== 'po' && !getValues('client_id')) return

      setSaveStatus('saving')
      await saveDocument(getValues(), true)
    }, 1500)

    return () => clearTimeout(handler)
  }, [formValues])

  const saveDocument = async (data: DocumentData, isAutoSave = false) => {
    try {
      if (!isAutoSave) setIsSaving(true)

      const docPayload = {
        type: data.type,
        document_number: data.document_number,
        document_date: data.document_date,
        status: data.status,
        client_id: data.type === 'po' ? null : data.client_id,
        supplier_id: data.type === 'po' ? data.supplier_id : null,
        reference_number: data.reference_number,
        subject: data.subject,
        metadata: data.metadata,
        subtotal: data.subtotal,
        cgst: data.cgst,
        sgst: data.sgst,
        total: data.total,
        parent_id: data.parent_id,
      }

      let savedDocId = documentId

      if (!savedDocId) {
        const { data: newDoc, error } = await supabase.from('documents').insert([docPayload]).select().single()
        if (error) throw error
        savedDocId = newDoc.id
        setDocumentId(newDoc.id)
        if (isNew) {
           window.history.replaceState(null, '', `/dashboard/documents/${newDoc.id}`)
        }
      } else {
        const { error } = await supabase.from('documents').update(docPayload).eq('id', savedDocId)
        if (error) throw error
      }

      // Save Lines (Delete all existing for this doc and re-insert for simplicity in auto-save, 
      // or handle intelligent upserts. For a simple app, delete and insert is robust enough for lines)
      const { error: delError } = await supabase.from('document_lines').delete().eq('document_id', savedDocId)
      if (delError) throw delError

      const linesPayload = data.lines.map((line, index) => ({
        document_id: savedDocId,
        item_id: line.item_id || null,
        description: line.description,
        quantity: line.quantity,
        unit: line.unit,
        rate: line.rate,
        amount: line.amount,
        make: line.make,
        sort_order: index,
      }))

      const { error: lineError } = await supabase.from('document_lines').insert(linesPayload)
      if (lineError) throw lineError

      setSaveStatus('saved')
      if (!isAutoSave) {
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    } catch (error) {
      console.error('Save error', error)
      setSaveStatus('error')
    } finally {
      if (!isAutoSave) setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit((data) => saveDocument(data, false))} className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-brand-200 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <select
            {...register('type')}
            disabled={!isNew}
            className="block w-40 rounded-md border-brand-300 bg-brand-50 py-2 pl-3 pr-10 text-base focus:border-brand-500 focus:outline-none focus:ring-brand-500 sm:text-sm font-semibold uppercase disabled:opacity-50"
          >
            <option value="quotation">Quotation</option>
            <option value="invoice">Tax Invoice</option>
            <option value="dc">Delivery Challan</option>
            <option value="po">Purchase Order</option>
            <option value="wcc">Work Completion</option>
          </select>
          <div className="flex items-center text-sm font-medium">
            {saveStatus === 'saving' && <span className="text-brand-500 flex items-center"><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Saving...</span>}
            {saveStatus === 'saved' && <span className="text-green-600 flex items-center"><Check className="w-4 h-4 mr-1" /> Saved</span>}
            {saveStatus === 'error' && <span className="text-red-600">Error saving</span>}
          </div>
        </div>

        <div className="flex gap-2">
          {/* Action to chain document if not new */}
          {!isNew && documentId && (
            <div className="relative group">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md border border-brand-300 bg-white px-4 py-2 text-sm font-medium text-brand-700 shadow-sm hover:bg-brand-50"
              >
                Convert To <ChevronDown className="ml-2 h-4 w-4" />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white border border-brand-200 rounded-md shadow-lg hidden group-hover:block z-50 overflow-hidden">
                {['quotation', 'invoice', 'dc', 'po', 'wcc'].filter(t => t !== watchType).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={async () => {
                      const { convertDocument } = await import('./actions');
                      await convertDocument(documentId, type);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-brand-700 hover:bg-brand-50 uppercase"
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-800 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Manually
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-brand-200 space-y-6">
            <h2 className="text-lg font-medium text-brand-900 border-b border-brand-100 pb-2">Document Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-brand-700">Document No. *</label>
                <input {...register('document_number')} required className="mt-1 block w-full rounded-md border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-brand-500" placeholder="e.g. Q108_26_27" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-brand-700">Date</label>
                <input type="date" {...register('document_date')} required className="mt-1 block w-full rounded-md border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-brand-500" />
              </div>

              {watchType === 'po' ? (
                <div>
                  <label className="block text-sm font-medium text-brand-700">Supplier *</label>
                  <select {...register('supplier_id')} required className="mt-1 block w-full rounded-md border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-brand-500">
                    <option value="">Select a supplier...</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-brand-700">Client *</label>
                  <select {...register('client_id')} required className="mt-1 block w-full rounded-md border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-brand-500">
                    <option value="">Select a client...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-brand-700">
                  {watchType === 'invoice' ? 'Client PO Number' : 'Reference Number'}
                </label>
                <input {...register('reference_number')} className="mt-1 block w-full rounded-md border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-brand-500" />
              </div>

              {(watchType === 'quotation' || watchType === 'dc') && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-brand-700">Subject</label>
                  <input {...register('subject')} className="mt-1 block w-full rounded-md border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-brand-500" />
                </div>
              )}

              {watchType === 'wcc' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-brand-700">Work Order Value</label>
                    <input {...register('metadata.work_order_value')} className="mt-1 block w-full rounded-md border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-700">Work Period (e.g. Jan - Mar)</label>
                    <input {...register('metadata.work_period')} className="mt-1 block w-full rounded-md border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-brand-500" />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-lg shadow-sm border border-brand-200 overflow-hidden">
            <div className="p-4 border-b border-brand-200 flex justify-between items-center bg-brand-50/50">
              <h2 className="text-lg font-medium text-brand-900">Items</h2>
              <button
                type="button"
                onClick={() => append({ item_id: null, description: '', quantity: 1, unit: 'Nos', rate: 0, amount: 0 })}
                className="inline-flex items-center text-sm font-medium text-brand-600 hover:text-brand-900"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Row
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-brand-200">
                <thead className="bg-brand-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-brand-500 w-10">Sr</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-brand-500">Description</th>
                    {watchType === 'wcc' && <th className="px-4 py-2 text-left text-xs font-medium text-brand-500 w-32">Make</th>}
                    <th className="px-4 py-2 text-left text-xs font-medium text-brand-500 w-24">Qty</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-brand-500 w-24">Unit</th>
                    {watchType !== 'dc' && watchType !== 'wcc' && (
                      <th className="px-4 py-2 text-right text-xs font-medium text-brand-500 w-32">Rate</th>
                    )}
                    {watchType !== 'dc' && watchType !== 'wcc' && (
                      <th className="px-4 py-2 text-right text-xs font-medium text-brand-500 w-32">Amount</th>
                    )}
                    <th className="px-4 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-200 bg-white">
                  {fields.map((field, index) => (
                    <tr key={field.id} className="align-top group">
                      <td className="px-4 py-3 text-sm text-brand-500 pt-5">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          <select
                            {...register(`lines.${index}.item_id`)}
                            onChange={(e) => {
                              setValue(`lines.${index}.item_id`, e.target.value)
                              handleItemSelect(index, e.target.value)
                            }}
                            className="block w-full rounded-md border-brand-200 px-2 py-1 text-sm focus:border-brand-500 focus:ring-brand-500 text-brand-600 bg-brand-50"
                          >
                            <option value="">-- Custom Item --</option>
                            {items.map(i => <option key={i.id} value={i.id}>{i.description.substring(0, 40)}...</option>)}
                          </select>
                          <textarea
                            {...register(`lines.${index}.description`)}
                            rows={2}
                            required
                            placeholder="Description details..."
                            className="block w-full rounded-md border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-brand-500 resize-y"
                          />
                        </div>
                      </td>
                      {watchType === 'wcc' && (
                        <td className="px-4 py-3">
                          <input {...register(`lines.${index}.make`)} className="block w-full rounded-md border border-brand-200 px-2 py-1 text-sm focus:border-brand-500 focus:ring-brand-500 mt-8" placeholder="Make" />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <input type="number" step="0.01" {...register(`lines.${index}.quantity`)} required className="block w-full rounded-md border border-brand-200 px-2 py-1 text-sm focus:border-brand-500 focus:ring-brand-500 text-right mt-8" />
                      </td>
                      <td className="px-4 py-3">
                        <input type="text" {...register(`lines.${index}.unit`)} required className="block w-full rounded-md border border-brand-200 px-2 py-1 text-sm focus:border-brand-500 focus:ring-brand-500 mt-8" />
                      </td>
                      {watchType !== 'dc' && watchType !== 'wcc' && (
                        <td className="px-4 py-3">
                          <input type="number" step="0.01" {...register(`lines.${index}.rate`)} required className="block w-full rounded-md border border-brand-200 px-2 py-1 text-sm focus:border-brand-500 focus:ring-brand-500 text-right mt-8" />
                        </td>
                      )}
                      {watchType !== 'dc' && watchType !== 'wcc' && (
                        <td className="px-4 py-3 text-right text-sm font-medium text-brand-900 pt-10">
                          ₹ {watchLines[index]?.amount?.toFixed(2) || '0.00'}
                        </td>
                      )}
                      <td className="px-4 py-3 pt-10 text-right">
                        <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - Totals & Extras */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-brand-200 space-y-4">
            <h2 className="text-lg font-medium text-brand-900 border-b border-brand-100 pb-2">Status & Extras</h2>
            
            <div>
              <label className="block text-sm font-medium text-brand-700">Status</label>
              <select {...register('status')} className="mt-1 block w-full rounded-md border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-brand-500">
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            {(watchType === 'quotation' || watchType === 'po' || watchType === 'wcc') && (
              <div>
                <label className="block text-sm font-medium text-brand-700">
                  {watchType === 'wcc' ? 'Scope of Work (Notes)' : 'Terms & Conditions'}
                </label>
                <textarea
                  {...register('metadata.terms')}
                  rows={6}
                  className="mt-1 block w-full rounded-md border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-brand-500"
                />
              </div>
            )}
            
            {watchType === 'po' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-brand-700">Delivery Location</label>
                  <input {...register('metadata.delivery_location')} className="mt-1 block w-full rounded-md border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-700">Delivery Date</label>
                  <input type="date" {...register('metadata.delivery_date')} className="mt-1 block w-full rounded-md border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-brand-500" />
                </div>
              </>
            )}
          </div>

          {/* Totals Box */}
          {watchType !== 'dc' && watchType !== 'wcc' && (
            <div className="bg-brand-900 text-white p-6 rounded-lg shadow-sm border border-brand-800 space-y-4">
              <h2 className="text-lg font-medium border-b border-brand-700 pb-2">Summary</h2>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-brand-300">Subtotal</span>
                  <span>₹ {formValues.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                
                {(watchType === 'invoice' || watchType === 'po') && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-brand-300">CGST (9%)</span>
                      <span>₹ {formValues.cgst?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-brand-300">SGST (9%)</span>
                      <span>₹ {formValues.sgst?.toFixed(2) || '0.00'}</span>
                    </div>
                  </>
                )}
                
                <div className="flex justify-between font-bold text-lg pt-4 border-t border-brand-700 mt-2">
                  <span>Grand Total</span>
                  <span>₹ {formValues.total?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  )
}
