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
    <div className="bg-white shadow-sm border border-brand-200 rounded-lg overflow-hidden">
      <div className="p-6 border-b border-brand-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-brand-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-md border border-brand-200 pl-10 pr-3 py-2 text-sm focus:border-brand-500 focus:ring-brand-500"
              placeholder="Search by description or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={handleNew}
            disabled={editingId !== null}
            className="inline-flex items-center justify-center rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-800 disabled:opacity-50"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-brand-200">
          <thead className="bg-brand-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-brand-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-brand-500 uppercase tracking-wider w-32">Unit</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-brand-500 uppercase tracking-wider w-32">Rate (₹)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-brand-500 uppercase tracking-wider w-40">Category</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-brand-500 uppercase tracking-wider w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-brand-200">
            {editingId === 'new' && (
              <tr className="bg-blue-50/50">
                <td className="px-6 py-4">
                  <textarea placeholder="Description" rows={2} className="w-full text-sm border-brand-200 rounded p-1 resize-none" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} autoFocus />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input type="text" placeholder="Unit (e.g. Nos)" className="w-full text-sm border-brand-200 rounded p-1" value={formData.unit || ''} onChange={e => setFormData({...formData, unit: e.target.value})} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input type="number" step="0.01" placeholder="Rate" className="w-full text-sm border-brand-200 rounded p-1 text-right" value={formData.rate || ''} onChange={e => setFormData({...formData, rate: parseFloat(e.target.value) || 0})} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input type="text" placeholder="Category" className="w-full text-sm border-brand-200 rounded p-1" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={handleSave} className="text-green-600 hover:text-green-900 mr-3"><Check className="h-5 w-5" /></button>
                  <button onClick={handleCancel} className="text-brand-400 hover:text-brand-600"><X className="h-5 w-5" /></button>
                </td>
              </tr>
            )}

            {filteredItems.map((record) => (
              editingId === record.id ? (
                <tr key={record.id} className="bg-blue-50/50">
                  <td className="px-6 py-4">
                    <textarea rows={2} className="w-full text-sm border-brand-200 rounded p-1 resize-none" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} autoFocus />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input type="text" className="w-full text-sm border-brand-200 rounded p-1" value={formData.unit || ''} onChange={e => setFormData({...formData, unit: e.target.value})} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input type="number" step="0.01" className="w-full text-sm border-brand-200 rounded p-1 text-right" value={formData.rate !== undefined ? formData.rate : ''} onChange={e => setFormData({...formData, rate: parseFloat(e.target.value) || 0})} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input type="text" className="w-full text-sm border-brand-200 rounded p-1" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={handleSave} className="text-green-600 hover:text-green-900 mr-3"><Check className="h-5 w-5" /></button>
                    <button onClick={handleCancel} className="text-brand-400 hover:text-brand-600"><X className="h-5 w-5" /></button>
                  </td>
                </tr>
              ) : (
                <tr key={record.id} className="hover:bg-brand-50/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-brand-900 whitespace-pre-wrap">{record.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-500">{record.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-900 text-right font-medium">₹ {record.rate.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-500">
                    {record.category ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-100 text-brand-800">
                        {record.category}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(record)} disabled={editingId !== null} className="text-brand-600 hover:text-brand-900 mr-3 disabled:opacity-50"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(record.id)} disabled={editingId !== null} className="text-red-500 hover:text-red-700 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              )
            ))}
            
            {filteredItems.length === 0 && editingId !== 'new' && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-brand-500">No items found. Click "Add Item" to create one.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
