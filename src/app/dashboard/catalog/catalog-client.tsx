'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, X, Check, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Supplier = {
  id: string
  name: string
}

type Item = {
  id: string
  description: string
  supplier_id: string | null
  suppliers?: { name: string } | null
  ue_cost: number
  profit_percentage: number
  quantity: number
  unit: string
  rate: number
  gst_rate: number
  category: string | null
}

export function CatalogClient({
  initialItems,
  suppliers,
}: {
  initialItems: Item[]
  suppliers: Supplier[]
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [items, setItems] = useState<Item[]>(initialItems)
  const [formData, setFormData] = useState<Partial<Item>>({})
  
  const supabase = createClient()

  const filteredItems = items.filter((i) =>
    i.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (i.category && i.category.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleEdit = (record: Item) => {
    setEditingId(record.id)
    setFormData(record)
  }

  const handleNew = () => {
    setEditingId('new')
    setFormData({ 
      unit: 'Nos', 
      rate: 0, 
      gst_rate: 18,
      ue_cost: 0,
      profit_percentage: 0,
      quantity: 1
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData({})
  }

  const currentUeCost = Number(formData.ue_cost) || 0
  const currentProfit = Number(formData.profit_percentage) || 0
  const currentQuantity = Number(formData.quantity) || 1
  const currentGst = Number(formData.gst_rate) || 18
  
  const calculatedRate = currentUeCost + (currentUeCost * currentProfit / 100)
  const calculatedTotalRate = calculatedRate * currentQuantity
  const calculatedTotalAmount = Math.round(calculatedTotalRate + (calculatedTotalRate * currentGst / 100))

  const handleSave = async () => {
    if (!formData.description) return alert('Description is required')
    if (!formData.unit) return alert('Unit is required')
    
    const payload = {
      description: formData.description,
      supplier_id: formData.supplier_id || null,
      ue_cost: currentUeCost,
      profit_percentage: currentProfit,
      quantity: currentQuantity,
      unit: formData.unit,
      rate: calculatedRate,
      gst_rate: currentGst,
      category: formData.category || null,
    }

    if (editingId === 'new') {
      const { data, error } = await supabase.from('items').insert([payload]).select('*, suppliers(name)').single()
      if (error) return alert(error.message)
      setItems([...items, data])
    } else {
      const { data, error } = await supabase.from('items').update(payload).eq('id', editingId!).select('*, suppliers(name)').single()
      if (error) return alert(error.message)
      setItems(items.map(i => i.id === editingId ? data : i))
    }
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item? Ensure it is not used in any documents.')) return

    const { error } = await supabase.from('items').delete().eq('id', id)
    if (error) {
      alert(`Could not delete: ${error.message}`)
    } else {
      setItems(items.filter(i => i.id !== id))
    }
  }

  return (
    <div className="bg-white shadow-sm border border-brand-100 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="p-5 border-b border-brand-100 bg-brand-50/50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative flex-1 w-full sm:max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-brand-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-xl border border-brand-200 bg-white pl-10 pr-4 py-2 text-sm focus:border-accent-500 focus:ring-accent-500 transition-colors shadow-sm"
              placeholder="Search by description or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={handleNew}
            disabled={editingId !== null}
            className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-brand-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 disabled:opacity-50 transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-brand-100 text-sm">
          <thead className="bg-brand-50/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-brand-500 w-12">Sr. No.</th>
              <th className="px-4 py-3 text-left font-semibold text-brand-500 min-w-[200px]">Description</th>
              <th className="px-4 py-3 text-left font-semibold text-brand-500 w-32">Supplier</th>
              <th className="px-4 py-3 text-right font-semibold text-brand-500 w-24">UE Cost</th>
              <th className="px-4 py-3 text-right font-semibold text-brand-500 w-24">Profit (%)</th>
              <th className="px-4 py-3 text-right font-semibold text-brand-500 w-20">Quantity</th>
              <th className="px-4 py-3 text-left font-semibold text-brand-500 w-20">Unit</th>
              <th className="px-4 py-3 text-right font-semibold text-brand-500 w-24">Rate</th>
              <th className="px-4 py-3 text-right font-semibold text-brand-500 w-28">Total Rate</th>
              <th className="px-4 py-3 text-center font-semibold text-brand-500 w-20">GST (%)</th>
              <th className="px-4 py-3 text-right font-semibold text-brand-500 w-32">Total Amount</th>
              <th className="px-4 py-3 text-right font-semibold text-brand-500 w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-brand-50">
            {editingId === 'new' && (
              <tr className="bg-brand-50/80 align-top">
                <td className="px-4 py-3">-</td>
                <td className="px-4 py-3">
                  <textarea placeholder="Description" rows={2} className="w-full border border-brand-200 rounded-lg p-2 resize-none focus:ring-accent-500 focus:border-accent-500 shadow-sm" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} autoFocus />
                </td>
                <td className="px-4 py-3">
                  <select className="w-full border border-brand-200 rounded-lg p-2 focus:ring-accent-500 focus:border-accent-500 shadow-sm" value={formData.supplier_id || ''} onChange={e => setFormData({...formData, supplier_id: e.target.value})}>
                    <option value="">None</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input type="number" step="0.01" className="w-full border border-brand-200 rounded-lg p-2 text-right focus:ring-accent-500 focus:border-accent-500 shadow-sm" value={formData.ue_cost || ''} onChange={e => setFormData({...formData, ue_cost: parseFloat(e.target.value) || 0})} />
                </td>
                <td className="px-4 py-3">
                  <input type="number" step="0.1" className="w-full border border-brand-200 rounded-lg p-2 text-right focus:ring-accent-500 focus:border-accent-500 shadow-sm" value={formData.profit_percentage || ''} onChange={e => setFormData({...formData, profit_percentage: parseFloat(e.target.value) || 0})} />
                </td>
                <td className="px-4 py-3">
                  <input type="number" step="1" className="w-full border border-brand-200 rounded-lg p-2 text-right focus:ring-accent-500 focus:border-accent-500 shadow-sm" value={formData.quantity || ''} onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value) || 0})} />
                </td>
                <td className="px-4 py-3">
                  <input type="text" className="w-full border border-brand-200 rounded-lg p-2 focus:ring-accent-500 focus:border-accent-500 shadow-sm" value={formData.unit || ''} onChange={e => setFormData({...formData, unit: e.target.value})} />
                </td>
                <td className="px-4 py-3 text-right font-medium">{calculatedRate.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-medium">{calculatedTotalRate.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <select className="w-full border border-brand-200 rounded-lg p-2 focus:ring-accent-500 focus:border-accent-500 shadow-sm" value={formData.gst_rate || 18} onChange={e => setFormData({...formData, gst_rate: Number(e.target.value)})}>
                    <option value={18}>18</option>
                    <option value={9}>9</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-right font-bold text-brand-900">{calculatedTotalAmount.toFixed(2)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-right font-medium space-x-2">
                  <button onClick={handleSave} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-green-600 bg-green-50 hover:bg-green-100 transition-colors"><Check className="h-4 w-4" /></button>
                  <button onClick={handleCancel} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-brand-500 bg-brand-100 hover:bg-brand-200 transition-colors"><X className="h-4 w-4" /></button>
                </td>
              </tr>
            )}

            {filteredItems.map((record, index) => {
              if (editingId === record.id) {
                return (
                  <tr key={record.id} className="bg-brand-50/80 align-top">
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3">
                      <textarea rows={2} className="w-full border border-brand-200 rounded-lg p-2 resize-none focus:ring-accent-500 focus:border-accent-500 shadow-sm" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} autoFocus />
                    </td>
                    <td className="px-4 py-3">
                      <select className="w-full border border-brand-200 rounded-lg p-2 focus:ring-accent-500 focus:border-accent-500 shadow-sm" value={formData.supplier_id || ''} onChange={e => setFormData({...formData, supplier_id: e.target.value})}>
                        <option value="">None</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" step="0.01" className="w-full border border-brand-200 rounded-lg p-2 text-right focus:ring-accent-500 focus:border-accent-500 shadow-sm" value={formData.ue_cost !== undefined ? formData.ue_cost : ''} onChange={e => setFormData({...formData, ue_cost: parseFloat(e.target.value) || 0})} />
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" step="0.1" className="w-full border border-brand-200 rounded-lg p-2 text-right focus:ring-accent-500 focus:border-accent-500 shadow-sm" value={formData.profit_percentage !== undefined ? formData.profit_percentage : ''} onChange={e => setFormData({...formData, profit_percentage: parseFloat(e.target.value) || 0})} />
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" step="1" className="w-full border border-brand-200 rounded-lg p-2 text-right focus:ring-accent-500 focus:border-accent-500 shadow-sm" value={formData.quantity !== undefined ? formData.quantity : ''} onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value) || 0})} />
                    </td>
                    <td className="px-4 py-3">
                      <input type="text" className="w-full border border-brand-200 rounded-lg p-2 focus:ring-accent-500 focus:border-accent-500 shadow-sm" value={formData.unit || ''} onChange={e => setFormData({...formData, unit: e.target.value})} />
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{calculatedRate.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-medium">{calculatedTotalRate.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <select className="w-full border border-brand-200 rounded-lg p-2 focus:ring-accent-500 focus:border-accent-500 shadow-sm" value={formData.gst_rate !== undefined ? formData.gst_rate : 18} onChange={e => setFormData({...formData, gst_rate: Number(e.target.value)})}>
                        <option value={18}>18</option>
                        <option value={9}>9</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-brand-900">{calculatedTotalAmount.toFixed(2)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right font-medium space-x-2">
                      <button onClick={handleSave} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-green-600 bg-green-50 hover:bg-green-100 transition-colors"><Check className="h-4 w-4" /></button>
                      <button onClick={handleCancel} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-brand-500 bg-brand-100 hover:bg-brand-200 transition-colors"><X className="h-4 w-4" /></button>
                    </td>
                  </tr>
                )
              }

              const rowRate = record.rate;
              const rowTotalRate = rowRate * record.quantity;
              const rowTotalAmount = Math.round(rowTotalRate + (rowTotalRate * record.gst_rate / 100));

              return (
                <tr key={record.id} className="hover:bg-brand-50/80 transition-colors group align-top">
                  <td className="px-4 py-3 font-medium text-brand-500">{index + 1}</td>
                  <td className="px-4 py-3 font-semibold text-brand-900 whitespace-pre-wrap">{record.description}</td>
                  <td className="px-4 py-3 text-brand-600 truncate">{record.suppliers?.name || ''}</td>
                  <td className="px-4 py-3 text-right font-medium text-brand-700">{record.ue_cost?.toLocaleString('en-IN') || '0'}</td>
                  <td className="px-4 py-3 text-right font-medium text-brand-700">{record.profit_percentage || '0'}</td>
                  <td className="px-4 py-3 text-right font-medium text-brand-700">{record.quantity || '0'}</td>
                  <td className="px-4 py-3 text-brand-600">{record.unit}</td>
                  <td className="px-4 py-3 text-right font-medium text-brand-800">{rowRate.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-medium text-brand-800">{rowTotalRate.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center text-brand-700">{record.gst_rate}</td>
                  <td className="px-4 py-3 text-right font-bold text-brand-900">{rowTotalAmount.toFixed(2)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right font-medium space-x-2">
                    <button onClick={() => handleEdit(record)} disabled={editingId !== null} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-brand-500 hover:bg-brand-100 hover:text-brand-900 disabled:opacity-50 transition-colors"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(record.id)} disabled={editingId !== null} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              )
            })}
            
            {filteredItems.length === 0 && editingId !== 'new' && (
              <tr>
                <td colSpan={12} className="px-6 py-12 text-center text-brand-500">
                  <div className="flex flex-col items-center justify-center">
                    <Search className="h-10 w-10 text-brand-200 mb-3" />
                    <p className="font-medium">No items found. Click "Add Item" to create one.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
