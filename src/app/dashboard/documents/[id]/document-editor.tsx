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
  gst_rate: number
  amount: number
  make?: string | null
}

type DocumentData = {
  id?: string
  type: 'quotation' | 'invoice' | 'dc' | 'po' | 'wcc'
  document_number: string
  document_date: string
  status: 'Draft' | 'Sent' | 'In Process' | 'Paid'
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
    const defaults: DocumentData = {
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
      lines: [{ item_id: null, description: '', quantity: 1, unit: 'Nos', rate: 0, gst_rate: 18, amount: 0 }],
    }

    if (initialData) {
      return {
        ...defaults,
        ...initialData,
        document_date: initialData.document_date || defaults.document_date,
        metadata: initialData.metadata || { terms: DEFAULT_TERMS[initialData.type as keyof typeof DEFAULT_TERMS] || '' },
        lines: initialLines && initialLines.length > 0 
          ? initialLines.map(l => ({...l, gst_rate: l.gst_rate ?? 18})) 
          : defaults.lines,
      }
    }
    
    return defaults
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
    let cgst = 0
    let sgst = 0

    const updatedLines = getValues('lines').map(line => {
      // WCC and DC don't use rates usually, but we keep the math generic. 
      // If rate is 0, amount is 0.
      const amount = (line.quantity || 0) * (line.rate || 0)
      newSubtotal += amount
      
      if (watchType === 'invoice' || watchType === 'po') {
        const rate = Number(line.gst_rate) || 18
        cgst += (amount * (rate / 100)) / 2
        sgst += (amount * (rate / 100)) / 2
      }
      
      return { ...line, amount }
    })

    // Avoid infinite loop by only updating if amounts changed
    const currentLines = getValues('lines')
    const needsUpdate = currentLines.some((l, i) => l.amount !== updatedLines[i].amount)
    
    if (needsUpdate) {
      setValue('lines', updatedLines, { shouldDirty: true })
    }

    // Taxes only apply to Invoice and PO in the layout requirements
    let total = newSubtotal
    if (watchType === 'invoice' || watchType === 'po') {
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
      setValue(`lines.${index}.gst_rate`, item.gst_rate !== undefined ? item.gst_rate : 18, { shouldDirty: true })
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
        gst_rate: line.gst_rate,
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 backdrop-blur-xl p-5 rounded-2xl shadow-sm border border-brand-100 sticky top-4 z-40 transition-all animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-4">
          <select
            {...register('type')}
            disabled={!isNew}
            className="block w-40 rounded-xl border-brand-200 bg-white py-2 pl-3 pr-10 text-base focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20 sm:text-sm font-bold uppercase disabled:opacity-50 shadow-sm"
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
                className="inline-flex items-center justify-center rounded-xl border border-brand-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 shadow-sm hover:bg-brand-50 transition-colors"
              >
                Convert To <ChevronDown className="ml-2 h-4 w-4" />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white border border-brand-100 rounded-xl shadow-xl hidden group-hover:block z-50 overflow-hidden py-1">
                {['quotation', 'invoice', 'dc', 'po', 'wcc'].filter(t => t !== watchType).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={async () => {
                      const { convertDocument } = await import('./actions');
                      await convertDocument(documentId, type);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 uppercase transition-colors"
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
            className="inline-flex items-center justify-center rounded-xl bg-brand-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 disabled:opacity-50 transition-colors"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Manually
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-100 space-y-6">
            <h2 className="text-lg font-semibold text-brand-900 border-b border-brand-100 pb-3">Document Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-brand-700 mb-1.5">Document No. *</label>
                <input {...register('document_number')} required className="block w-full rounded-xl border border-brand-200 bg-white/50 px-4 py-2 text-sm focus:bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all shadow-sm" placeholder="e.g. Q108_26_27" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-brand-700 mb-1.5">Date</label>
                <input type="date" {...register('document_date')} required className="block w-full rounded-xl border border-brand-200 bg-white/50 px-4 py-2 text-sm focus:bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all shadow-sm" />
              </div>

              {watchType === 'po' ? (
                <div>
                  <label className="block text-sm font-semibold text-brand-700 mb-1.5">Supplier *</label>
                  <select {...register('supplier_id')} required className="block w-full rounded-xl border border-brand-200 bg-white/50 px-4 py-2 text-sm focus:bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all shadow-sm">
                    <option value="">Select a supplier...</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-brand-700 mb-1.5">Client *</label>
                  <select {...register('client_id')} required className="block w-full rounded-xl border border-brand-200 bg-white/50 px-4 py-2 text-sm focus:bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all shadow-sm">
                    <option value="">Select a client...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-brand-700 mb-1.5">
                  {watchType === 'invoice' || watchType === 'dc' ? 'Client PO Number *' : 'Reference Number *'}
                </label>
                <input {...register('reference_number', { required: true })} required className="block w-full rounded-xl border border-brand-200 bg-white/50 px-4 py-2 text-sm focus:bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all shadow-sm" />
              </div>

              {(watchType === 'quotation' || watchType === 'dc') && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-brand-700 mb-1.5">Subject *</label>
                  <input {...register('subject', { required: true })} required className="block w-full rounded-xl border border-brand-200 bg-white/50 px-4 py-2 text-sm focus:bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all shadow-sm" />
                </div>
              )}

              {watchType === 'wcc' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-brand-700 mb-1.5">Work Order Value *</label>
                    <input {...register('metadata.work_order_value', { required: true })} required className="block w-full rounded-xl border border-brand-200 bg-white/50 px-4 py-2 text-sm focus:bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-700 mb-1.5">Work Period (e.g. Jan - Mar) *</label>
                    <input {...register('metadata.work_period', { required: true })} required className="block w-full rounded-xl border border-brand-200 bg-white/50 px-4 py-2 text-sm focus:bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all shadow-sm" />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-2xl shadow-sm border border-brand-100 overflow-hidden">
            <div className="p-5 border-b border-brand-100 flex justify-between items-center bg-brand-50/50">
              <h2 className="text-lg font-semibold text-brand-900">Items</h2>
              <button
                type="button"
                onClick={() => append({ item_id: null, description: '', quantity: 1, unit: 'Nos', rate: 0, gst_rate: 18, amount: 0 })}
                className="inline-flex items-center text-sm font-semibold text-brand-600 hover:text-brand-900 transition-colors"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Row
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-brand-100">
                <thead className="bg-brand-50/80">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-brand-500 w-10 uppercase tracking-wider">Sr</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-brand-500 uppercase tracking-wider">Description</th>
                    {watchType === 'wcc' && <th className="px-4 py-3 text-left text-xs font-bold text-brand-500 w-32 uppercase tracking-wider">Make</th>}
                    <th className="px-4 py-3 text-left text-xs font-bold text-brand-500 w-24 uppercase tracking-wider">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-brand-500 w-24 uppercase tracking-wider">Unit</th>
                    {watchType !== 'dc' && watchType !== 'wcc' && (
                      <th className="px-4 py-3 text-right text-xs font-bold text-brand-500 w-32 uppercase tracking-wider">Rate</th>
                    )}
                    {watchType !== 'dc' && watchType !== 'wcc' && (
                      <th className="px-4 py-3 text-center text-xs font-bold text-brand-500 w-24 uppercase tracking-wider">GST %</th>
                    )}
                    {watchType !== 'dc' && watchType !== 'wcc' && (
                      <th className="px-4 py-3 text-right text-xs font-bold text-brand-500 w-32 uppercase tracking-wider">Amount</th>
                    )}
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-100 bg-white">
                  {fields.map((field, index) => (
                    <tr key={field.id} className="align-top group hover:bg-brand-50/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-brand-500 pt-5">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          <select
                            {...register(`lines.${index}.item_id`)}
                            onChange={(e) => {
                              setValue(`lines.${index}.item_id`, e.target.value)
                              handleItemSelect(index, e.target.value)
                            }}
                            className="block w-full rounded-xl border border-brand-200 px-3 py-2 text-sm focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 text-brand-600 bg-brand-50/50 shadow-sm transition-all"
                          >
                            <option value="">-- Custom Item --</option>
                            {items.map(i => <option key={i.id} value={i.id}>{i.description.substring(0, 40)}...</option>)}
                          </select>
                          <textarea
                            {...register(`lines.${index}.description`)}
                            rows={2}
                            required
                            placeholder="Description details..."
                            className="block w-full rounded-xl border border-brand-200 bg-white/50 px-3 py-2 text-sm focus:bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 resize-y shadow-sm transition-all"
                          />
                        </div>
                      </td>
                      {watchType === 'wcc' && (
                        <td className="px-4 py-3">
                          <input {...register(`lines.${index}.make`)} className="block w-full rounded-xl border border-brand-200 bg-white/50 px-3 py-2 text-sm focus:bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 mt-11 shadow-sm transition-all" placeholder="Make" />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <input type="number" step="0.01" {...register(`lines.${index}.quantity`)} required className="block w-full rounded-xl border border-brand-200 bg-white/50 px-3 py-2 text-sm focus:bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 text-right mt-11 shadow-sm transition-all" />
                      </td>
                      <td className="px-4 py-3">
                        <input type="text" {...register(`lines.${index}.unit`)} required className="block w-full rounded-xl border border-brand-200 bg-white/50 px-3 py-2 text-sm focus:bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 mt-11 shadow-sm transition-all" />
                      </td>
                      {watchType !== 'dc' && watchType !== 'wcc' && (
                        <td className="px-4 py-3">
                          <input type="number" step="0.01" {...register(`lines.${index}.rate`)} required className="block w-full rounded-xl border border-brand-200 bg-white/50 px-3 py-2 text-sm focus:bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 text-right mt-11 shadow-sm transition-all" />
                        </td>
                      )}
                      {watchType !== 'dc' && watchType !== 'wcc' && (
                        <td className="px-4 py-3">
                          <select {...register(`lines.${index}.gst_rate`)} className="block w-full rounded-xl border border-brand-200 bg-white/50 px-2 py-2 text-sm focus:bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 mt-11 shadow-sm transition-all text-center">
                            <option value={18}>18%</option>
                            <option value={9}>9%</option>
                          </select>
                        </td>
                      )}
                      {watchType !== 'dc' && watchType !== 'wcc' && (
                        <td className="px-4 py-3 text-right text-sm font-bold text-brand-900 pt-14">
                          ₹ {watchLines[index]?.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                        </td>
                      )}
                      <td className="px-4 py-3 pt-12 text-right">
                        <button type="button" onClick={() => remove(index)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors opacity-0 group-hover:opacity-100">
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
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-100 space-y-4">
            <h2 className="text-lg font-semibold text-brand-900 border-b border-brand-100 pb-3">Status & Extras</h2>
            
            <div>
              <label className="block text-sm font-semibold text-brand-700 mb-1.5">Status</label>
              <select {...register('status')} className="block w-full rounded-xl border border-brand-200 bg-white/50 px-3 py-2 text-sm focus:bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 shadow-sm transition-all font-semibold">
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="In Process">In Process</option>
                <option value="Paid">Paid</option>
              </select>
            </div>

            {(watchType === 'quotation' || watchType === 'po' || watchType === 'wcc') && (
              <div>
                <label className="block text-sm font-semibold text-brand-700 mb-1.5">
                  {watchType === 'wcc' ? 'Scope of Work (Notes)' : 'Terms & Conditions'}
                </label>
                <textarea
                  {...register('metadata.terms')}
                  rows={6}
                  className="block w-full rounded-xl border border-brand-200 bg-white/50 px-4 py-2 text-sm focus:bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all shadow-sm resize-y"
                />
              </div>
            )}
            
            {watchType === 'po' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-brand-700 mb-1.5">Delivery Location</label>
                  <input {...register('metadata.delivery_location')} className="block w-full rounded-xl border border-brand-200 bg-white/50 px-4 py-2 text-sm focus:bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-700 mb-1.5">Delivery Date</label>
                  <input type="date" {...register('metadata.delivery_date')} className="block w-full rounded-xl border border-brand-200 bg-white/50 px-4 py-2 text-sm focus:bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all shadow-sm" />
                </div>
              </>
            )}
          </div>

          {/* Totals Box (Receipt Style) */}
          {watchType !== 'dc' && watchType !== 'wcc' && (
            <div className="bg-gradient-to-b from-brand-900 to-brand-950 text-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 space-y-4">
                <h2 className="text-lg font-bold border-b border-white/20 pb-3 flex items-center justify-between">
                  <span>Summary</span>
                  <span className="text-white/60 text-sm font-normal">INR</span>
                </h2>
                
                <div className="space-y-3 text-sm font-medium text-brand-100">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹ {formValues.subtotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}</span>
                  </div>
                  
                  {(watchType === 'invoice' || watchType === 'po') && (
                    <>
                      <div className="flex justify-between text-white/70">
                        <span>Total CGST</span>
                        <span>₹ {formValues.cgst?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between text-white/70">
                        <span>Total SGST</span>
                        <span>₹ {formValues.sgst?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Receipt cutoff styling */}
              <div className="relative h-2 w-full">
                <div className="absolute inset-0 border-t-2 border-dashed border-white/20"></div>
              </div>

              <div className="p-6 bg-brand-950">
                <div className="flex justify-between items-end">
                  <span className="font-semibold text-brand-200">Grand Total</span>
                  <span className="text-3xl font-black tracking-tight text-white">
                    ₹ {formValues.total?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  )
}
