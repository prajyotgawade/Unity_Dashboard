'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, X, Check, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Item = {
  id: string
  description: string
  unit: string
  rate: number
  category: string | null
}

export function CatalogClient({
  initialItems,
}: {
  initialItems: Item[]
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
    setFormData({ unit: 'Nos', rate: 0 })
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData({})
  }

  const handleSave = async () => {
    if (!formData.description) return alert('Description is required')
    if (!formData.unit) return alert('Unit is required')
    
    const payload = {
      description: formData.description,
      unit: formData.unit,
      rate: Number(formData.rate) || 0,
      category: formData.category || null,
    }

    if (editingId === 'new') {
      const { data, error } = await supabase.from('items').insert([payload]).select().single()
      if (error) return alert(error.message)
      setItems([...items, data])
    } else {
      const { data, error } = await supabase.from('items').update(payload).eq('id', editingId!).select().single()
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
        <table className="min-w-full divide-y divide-brand-100">
          <thead className="bg-brand-50/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider w-32">Unit</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-brand-500 uppercase tracking-wider w-32">Rate (₹)</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider w-40">Category</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-brand-500 uppercase tracking-wider w-28">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-brand-50">
            {editingId === 'new' && (
              <tr className="bg-brand-50/80">
                <td className="px-6 py-4">
                  <textarea placeholder="Description" rows={2} className="w-full text-sm border border-brand-200 rounded-lg p-2 resize-none focus:ring-accent-500 focus:border-accent-500 shadow-sm" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} autoFocus />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input type="text" placeholder="Unit" className="w-full text-sm border border-brand-200 rounded-lg p-2 focus:ring-accent-500 focus:border-accent-500 shadow-sm" value={formData.unit || ''} onChange={e => setFormData({...formData, unit: e.target.value})} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input type="number" step="0.01" placeholder="Rate" className="w-full text-sm border border-brand-200 rounded-lg p-2 text-right focus:ring-accent-500 focus:border-accent-500 shadow-sm" value={formData.rate || ''} onChange={e => setFormData({...formData, rate: parseFloat(e.target.value) || 0})} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input type="text" placeholder="Category" className="w-full text-sm border border-brand-200 rounded-lg p-2 focus:ring-accent-500 focus:border-accent-500 shadow-sm" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button onClick={handleSave} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-green-600 bg-green-50 hover:bg-green-100 transition-colors"><Check className="h-4 w-4" /></button>
                  <button onClick={handleCancel} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-brand-500 bg-brand-100 hover:bg-brand-200 transition-colors"><X className="h-4 w-4" /></button>
                </td>
              </tr>
            )}

            {filteredItems.map((record) => (
              editingId === record.id ? (
                <tr key={record.id} className="bg-brand-50/80">
                  <td className="px-6 py-4">
                    <textarea rows={2} className="w-full text-sm border border-brand-200 rounded-lg p-2 resize-none focus:ring-accent-500 focus:border-accent-500 shadow-sm" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} autoFocus />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input type="text" className="w-full text-sm border border-brand-200 rounded-lg p-2 focus:ring-accent-500 focus:border-accent-500 shadow-sm" value={formData.unit || ''} onChange={e => setFormData({...formData, unit: e.target.value})} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input type="number" step="0.01" className="w-full text-sm border border-brand-200 rounded-lg p-2 text-right focus:ring-accent-500 focus:border-accent-500 shadow-sm" value={formData.rate !== undefined ? formData.rate : ''} onChange={e => setFormData({...formData, rate: parseFloat(e.target.value) || 0})} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input type="text" className="w-full text-sm border border-brand-200 rounded-lg p-2 focus:ring-accent-500 focus:border-accent-500 shadow-sm" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button onClick={handleSave} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-green-600 bg-green-50 hover:bg-green-100 transition-colors"><Check className="h-4 w-4" /></button>
                    <button onClick={handleCancel} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-brand-500 bg-brand-100 hover:bg-brand-200 transition-colors"><X className="h-4 w-4" /></button>
                  </td>
                </tr>
              ) : (
                <tr key={record.id} className="hover:bg-brand-50/80 transition-colors group">
                  <td className="px-6 py-4 text-sm font-semibold text-brand-900 whitespace-pre-wrap leading-relaxed">{record.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-600">{record.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-900 text-right font-bold">₹ {record.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-500">
                    {record.category ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-brand-100/50 text-brand-700 border border-brand-200/50">
                        {record.category}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button onClick={() => handleEdit(record)} disabled={editingId !== null} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-brand-500 hover:bg-brand-100 hover:text-brand-900 disabled:opacity-50 transition-colors"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(record.id)} disabled={editingId !== null} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              )
            ))}
            
            {filteredItems.length === 0 && editingId !== 'new' && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-brand-500">
                  <div className="flex flex-col items-center justify-center">
                    <Search className="h-10 w-10 text-brand-200 mb-3" />
                    <p className="font-medium text-sm">No items found. Click "Add Item" to create one.</p>
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
