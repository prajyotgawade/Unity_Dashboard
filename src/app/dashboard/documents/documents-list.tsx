'use client'

import React, { useState } from 'react'
import { Search, FileText, Download, Edit2, ChevronDown, ChevronUp, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type DocumentItem = {
  id: string
  type: string
  document_number: string
  document_date: string
  status: string
  total: number
  parent_id?: string | null
  client?: { name: string }
  supplier?: { name: string }
}

const statusColors: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-800',
  Sent: 'bg-blue-100 text-blue-800',
  'In Process': 'bg-purple-100 text-purple-800',
  Paid: 'bg-green-100 text-green-800',
}

const childTypes = ['invoice', 'dc', 'po', 'wcc']

export function DocumentsList({ initialDocuments }: { initialDocuments: DocumentItem[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeType, setActiveType] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const topLevelDocs = initialDocuments.filter((doc) => {
    const matchesSearch = 
      doc.document_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.client?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.supplier?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      
    let matchesType = false
    if (activeType === 'all') {
      // For 'all', show Quotations AND standalone docs (docs with no parent)
      matchesType = doc.type === 'quotation' || !doc.parent_id
    } else {
      matchesType = doc.type === activeType
    }

    return matchesSearch && matchesType
  })

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="bg-white shadow-sm border border-brand-100 rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-brand-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-50/50">
        <div className="flex space-x-1 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto p-1 bg-brand-100/50 rounded-xl">
          {['all', 'quotation'].map((type) => (
            <button
              key={type}
              onClick={() => { setActiveType(type); setExpandedId(null); }}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-200 ${
                activeType === type
                  ? 'bg-white text-brand-900 shadow-sm border border-brand-200/50'
                  : 'text-brand-600 hover:text-brand-900 hover:bg-white/50'
              }`}
            >
              {type === 'all' ? 'All' : type.toUpperCase()}
            </button>
          ))}
        </div>
        
        <div className="relative w-full sm:max-w-xs">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-brand-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-xl border border-brand-200 bg-white pl-10 pr-4 py-2 text-sm focus:border-accent-500 focus:ring-accent-500 transition-colors shadow-sm"
            placeholder="Search docs, clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-brand-100">
          <thead className="bg-brand-50/50">
            <tr>
              <th className="px-6 py-4 w-10"></th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider">Document</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider">Client / Supplier</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-brand-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-brand-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-brand-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-brand-50">
            {topLevelDocs.map((doc) => (
              <React.Fragment key={doc.id}>
                <tr className="hover:bg-brand-50/80 transition-colors group">
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    {doc.type === 'quotation' && (
                      <button 
                        onClick={() => toggleExpand(doc.id)} 
                        className="p-1 rounded hover:bg-brand-100 text-brand-600 transition-colors"
                      >
                        {expandedId === doc.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-brand-100 flex items-center justify-center group-hover:bg-brand-200 transition-colors cursor-pointer" onClick={() => doc.type === 'quotation' && toggleExpand(doc.id)}>
                        <FileText className="h-5 w-5 text-brand-600" />
                      </div>
                      <div className="ml-4 cursor-pointer" onClick={() => doc.type === 'quotation' && toggleExpand(doc.id)}>
                        <div className="text-sm font-semibold text-brand-900">{doc.document_number}</div>
                        <div className="text-xs font-medium text-brand-500 uppercase tracking-wider mt-0.5">{doc.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-600 font-medium cursor-pointer" onClick={() => doc.type === 'quotation' && toggleExpand(doc.id)}>
                    {format(new Date(doc.document_date), 'dd MMM yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-900 font-medium cursor-pointer" onClick={() => doc.type === 'quotation' && toggleExpand(doc.id)}>
                    {doc.client?.name || doc.supplier?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-900 text-right font-bold cursor-pointer" onClick={() => doc.type === 'quotation' && toggleExpand(doc.id)}>
                    {doc.type === 'dc' || doc.type === 'wcc' ? '-' : `₹ ${doc.total?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center cursor-pointer" onClick={() => doc.type === 'quotation' && toggleExpand(doc.id)}>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[doc.status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Link href={`/dashboard/documents/${doc.id}`} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-brand-500 hover:bg-brand-100 hover:text-brand-900 transition-colors" title="Edit">
                      <Edit2 className="h-4 w-4" />
                    </Link>
                    <a href={`/api/export/pdf?id=${doc.id}`} download className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors" title="Download PDF">
                      <Download className="h-4 w-4" />
                    </a>
                  </td>
                </tr>
                {expandedId === doc.id && doc.type === 'quotation' && (
                  <tr className="bg-brand-50/30">
                    <td colSpan={7} className="p-0 border-b border-brand-100">
                      <div className="p-6 pl-20">
                        <h4 className="text-sm font-bold text-brand-900 mb-4 flex items-center">
                          <div className="w-1.5 h-4 bg-brand-500 rounded-full mr-2"></div>
                          Linked Documents
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {childTypes.map(cType => {
                            const childDoc = initialDocuments.find(d => d.parent_id === doc.id && d.type === cType)
                            
                            if (childDoc) {
                              return (
                                <div key={cType} className="bg-white border border-brand-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                  <div className="absolute top-0 right-0 w-16 h-16 bg-brand-50 rounded-full -mt-8 -mr-8 transition-transform group-hover:scale-150 duration-500"></div>
                                  <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div>
                                      <div className="text-xs font-bold text-brand-400 uppercase tracking-wider mb-1">{cType}</div>
                                      <div className="text-sm font-semibold text-brand-900 mb-2">{childDoc.document_number}</div>
                                    </div>
                                    <div className="flex items-center justify-between mt-4">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${statusColors[childDoc.status] || 'bg-gray-50 text-gray-700'}`}>
                                        {childDoc.status}
                                      </span>
                                      <div className="flex space-x-1">
                                        <Link href={`/dashboard/documents/${childDoc.id}`} className="text-brand-600 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 p-1.5 rounded-md transition-colors">
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </Link>
                                        <a href={`/api/export/pdf?id=${childDoc.id}`} download className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded-md transition-colors" title="Download PDF">
                                          <Download className="w-3.5 h-3.5" />
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            }

                            return (
                              <div key={cType} className="bg-brand-50/50 border border-brand-200 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-brand-50 transition-colors">
                                <div className="text-xs font-bold text-brand-400 uppercase tracking-wider mb-2">{cType}</div>
                                <Link 
                                  href={`/dashboard/documents/new?parent_id=${doc.id}&type=${cType}`}
                                  className="inline-flex items-center text-sm font-semibold text-brand-600 hover:text-brand-800"
                                >
                                  <PlusCircle className="w-4 h-4 mr-1.5" />
                                  Generate
                                </Link>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}

            {topLevelDocs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-brand-500">
                  <div className="flex flex-col items-center justify-center">
                    <FileText className="h-10 w-10 text-brand-200 mb-3" />
                    <p className="text-sm font-medium">No documents found.</p>
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
