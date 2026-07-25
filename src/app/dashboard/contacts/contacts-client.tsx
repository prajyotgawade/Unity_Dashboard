'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, X, Check, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Client = {
  id: string
  name: string
  address: string | null
  gstin: string | null
  kind_attention: string | null
  email: string | null
}

type Supplier = {
  id: string
  name: string
  address: string | null
  gstin: string | null
}

export function ContactsClient({
  initialClients,
  initialSuppliers,
}: {
  initialClients: Client[]
  initialSuppliers: Supplier[]
}) {
  const [activeTab, setActiveTab] = useState<'clients' | 'suppliers'>('clients')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Local state for optimistic UI updates
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers)
  
  const [formData, setFormData] = useState<Partial<Client & Supplier>>({})
  const supabase = createClient()
  const router = useRouter()

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleEdit = (record: any) => {
    setEditingId(record.id)
    setFormData(record)
  }

  const handleNew = () => {
    setEditingId('new')
    setFormData({})
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData({})
  }

  const handleSaveClient = async () => {
    if (!formData.name) return alert('Name is required')
    const payload = {
      name: formData.name,
      address: formData.address || null,
      gstin: formData.gstin || null,
      kind_attention: formData.kind_attention || null,
      email: formData.email || null,
    }

    if (editingId === 'new') {
      const { data, error } = await supabase.from('clients').insert([payload]).select().single()
      if (error) return alert(error.message)
      setClients([...clients, data])
    } else {
      const { data, error } = await supabase.from('clients').update(payload).eq('id', editingId!).select().single()
      if (error) return alert(error.message)
      setClients(clients.map(c => c.id === editingId ? data : c))
    }
    setEditingId(null)
  }

  const handleSaveSupplier = async () => {
    if (!formData.name) return alert('Name is required')
    const payload = {
      name: formData.name,
      address: formData.address || null,
      gstin: formData.gstin || null,
    }

    if (editingId === 'new') {
      const { data, error } = await supabase.from('suppliers').insert([payload]).select().single()
      if (error) return alert(error.message)
      setSuppliers([...suppliers, data])
    } else {
      const { data, error } = await supabase.from('suppliers').update(payload).eq('id', editingId!).select().single()
      if (error) return alert(error.message)
      setSuppliers(suppliers.map(s => s.id === editingId ? data : s))
    }
    setEditingId(null)
  }

  const handleDelete = async (id: string, type: 'clients' | 'suppliers') => {
    if (!confirm('Are you sure you want to delete this contact? Ensure it is not used in any documents.')) return

    const { error } = await supabase.from(type).delete().eq('id', id)
    if (error) {
      alert(`Could not delete: ${error.message}`)
    } else {
      if (type === 'clients') setClients(clients.filter(c => c.id !== id))
      else setSuppliers(suppliers.filter(s => s.id !== id))
    }
  }

  return (
    <div className="bg-white shadow-sm border border-brand-100 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="border-b border-brand-100 bg-brand-50/50 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex space-x-1 p-1 bg-brand-100/50 rounded-xl overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => { setActiveTab('clients'); setEditingId(null); }}
            className={`px-6 py-2 font-medium text-sm rounded-lg whitespace-nowrap transition-all duration-200 ${
              activeTab === 'clients'
                ? 'bg-white text-brand-900 shadow-sm border border-brand-200/50'
                : 'text-brand-600 hover:text-brand-900 hover:bg-white/50'
            }`}
          >
            Clients
          </button>
          <button
            onClick={() => { setActiveTab('suppliers'); setEditingId(null); }}
            className={`px-6 py-2 font-medium text-sm rounded-lg whitespace-nowrap transition-all duration-200 ${
              activeTab === 'suppliers'
                ? 'bg-white text-brand-900 shadow-sm border border-brand-200/50'
                : 'text-brand-600 hover:text-brand-900 hover:bg-white/50'
            }`}
          >
            Suppliers
          </button>
        </div>
        
        <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-3 items-center">
          <div className="relative w-full sm:w-64">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-brand-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-xl border border-brand-200 bg-white pl-10 pr-4 py-2 text-sm focus:border-accent-500 focus:ring-accent-500 transition-colors shadow-sm"
              placeholder="Search by name..."
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
            Add {activeTab === 'clients' ? 'Client' : 'Supplier'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-brand-100">
          <thead className="bg-brand-50/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider">GSTIN</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider">Address</th>
              {activeTab === 'clients' && (
                <>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider">Attention / Email</th>
                </>
              )}
              <th className="px-6 py-4 text-right text-xs font-semibold text-brand-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-brand-50">
            {editingId === 'new' && (
              <tr className="bg-brand-50/80">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input type="text" placeholder="Name" className="w-full text-sm border border-brand-200 rounded-lg p-2 focus:ring-accent-500 focus:border-accent-500" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} autoFocus />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input type="text" placeholder="GSTIN" className="w-full text-sm border border-brand-200 rounded-lg p-2 focus:ring-accent-500 focus:border-accent-500" value={formData.gstin || ''} onChange={e => setFormData({...formData, gstin: e.target.value})} />
                </td>
                <td className="px-6 py-4">
                  <input type="text" placeholder="Address" className="w-full text-sm border border-brand-200 rounded-lg p-2 focus:ring-accent-500 focus:border-accent-500" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
                </td>
                {activeTab === 'clients' && (
                  <td className="px-6 py-4 text-sm">
                    <input type="text" placeholder="Kind Attention" className="w-full text-sm border border-brand-200 rounded-lg p-2 mb-2 focus:ring-accent-500 focus:border-accent-500" value={formData.kind_attention || ''} onChange={e => setFormData({...formData, kind_attention: e.target.value})} />
                    <input type="email" placeholder="Email" className="w-full text-sm border border-brand-200 rounded-lg p-2 focus:ring-accent-500 focus:border-accent-500" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button onClick={activeTab === 'clients' ? handleSaveClient : handleSaveSupplier} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-green-600 bg-green-50 hover:bg-green-100 transition-colors"><Check className="h-4 w-4" /></button>
                  <button onClick={handleCancel} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-brand-500 bg-brand-100 hover:bg-brand-200 transition-colors"><X className="h-4 w-4" /></button>
                </td>
              </tr>
            )}

            {(activeTab === 'clients' ? filteredClients : filteredSuppliers).map((record) => (
              editingId === record.id ? (
                <tr key={record.id} className="bg-brand-50/80">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input type="text" className="w-full text-sm border border-brand-200 rounded-lg p-2 focus:ring-accent-500 focus:border-accent-500" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} autoFocus />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input type="text" className="w-full text-sm border border-brand-200 rounded-lg p-2 focus:ring-accent-500 focus:border-accent-500" value={formData.gstin || ''} onChange={e => setFormData({...formData, gstin: e.target.value})} />
                  </td>
                  <td className="px-6 py-4">
                    <input type="text" className="w-full text-sm border border-brand-200 rounded-lg p-2 focus:ring-accent-500 focus:border-accent-500" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
                  </td>
                  {activeTab === 'clients' && (
                    <td className="px-6 py-4 text-sm">
                      <input type="text" placeholder="Attention" className="w-full text-sm border border-brand-200 rounded-lg p-2 mb-2 focus:ring-accent-500 focus:border-accent-500" value={formData.kind_attention || ''} onChange={e => setFormData({...formData, kind_attention: e.target.value})} />
                      <input type="email" placeholder="Email" className="w-full text-sm border border-brand-200 rounded-lg p-2 focus:ring-accent-500 focus:border-accent-500" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button onClick={activeTab === 'clients' ? handleSaveClient : handleSaveSupplier} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-green-600 bg-green-50 hover:bg-green-100 transition-colors"><Check className="h-4 w-4" /></button>
                    <button onClick={handleCancel} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-brand-500 bg-brand-100 hover:bg-brand-200 transition-colors"><X className="h-4 w-4" /></button>
                  </td>
                </tr>
              ) : (
                <tr key={record.id} className="hover:bg-brand-50/80 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-brand-900">{record.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-500">{record.gstin || '-'}</td>
                  <td className="px-6 py-4 text-sm font-medium text-brand-600 max-w-xs truncate">{record.address || '-'}</td>
                  {activeTab === 'clients' && (
                    <td className="px-6 py-4 text-sm">
                      <div className="font-semibold text-brand-700">{(record as Client).kind_attention || '-'}</div>
                      <div className="text-xs text-brand-500 mt-0.5">{(record as Client).email || '-'}</div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button onClick={() => handleEdit(record)} disabled={editingId !== null} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-brand-500 hover:bg-brand-100 hover:text-brand-900 disabled:opacity-50 transition-colors"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(record.id, activeTab)} disabled={editingId !== null} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              )
            ))}
            
            {/* Empty state */}
            {activeTab === 'clients' && filteredClients.length === 0 && editingId !== 'new' && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-brand-500">
                  <div className="flex flex-col items-center justify-center">
                    <Users className="h-10 w-10 text-brand-200 mb-3" />
                    <p className="font-medium">No clients found. Click "Add Client" to create one.</p>
                  </div>
                </td>
              </tr>
            )}
            {activeTab === 'suppliers' && filteredSuppliers.length === 0 && editingId !== 'new' && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm text-brand-500">
                   <div className="flex flex-col items-center justify-center">
                    <Users className="h-10 w-10 text-brand-200 mb-3" />
                    <p className="font-medium">No suppliers found. Click "Add Supplier" to create one.</p>
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
