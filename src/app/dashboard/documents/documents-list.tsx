'use client'

import { useState } from 'react'
import { Search, FileText, Download, MoreVertical, Edit2 } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

type DocumentItem = {
  id: string
  type: string
  document_number: string
  document_date: string
  status: string
  total: number
  client?: { name: string }
  supplier?: { name: string }
}

const statusColors: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-800',
  Sent: 'bg-blue-100 text-blue-800',
  Pending: 'bg-yellow-100 text-yellow-800',
  Paid: 'bg-green-100 text-green-800',
  Overdue: 'bg-red-100 text-red-800',
}

export function DocumentsList({ initialDocuments }: { initialDocuments: DocumentItem[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeType, setActiveType] = useState<string>('all')

  const filteredDocs = initialDocuments.filter((doc) => {
    const matchesSearch = 
      doc.document_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.client?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.supplier?.name.toLowerCase().includes(searchQuery.toLowerCase())
      
    const matchesType = activeType === 'all' || doc.type === activeType

    return matchesSearch && matchesType
  })

  return (
    <div className="bg-white shadow-sm border border-brand-100 rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-brand-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-50/50">
        <div className="flex space-x-1 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto p-1 bg-brand-100/50 rounded-xl">
          {['all', 'quotation', 'invoice', 'dc', 'po', 'wcc'].map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
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
              <th className="px-6 py-4 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider">Document</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider">Client / Supplier</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-brand-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-brand-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-brand-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-brand-50">
            {filteredDocs.map((doc) => (
              <tr key={doc.id} className="hover:bg-brand-50/80 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-brand-100 flex items-center justify-center group-hover:bg-brand-200 transition-colors">
                      <FileText className="h-5 w-5 text-brand-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-semibold text-brand-900">{doc.document_number}</div>
                      <div className="text-xs font-medium text-brand-500 uppercase tracking-wider mt-0.5">{doc.type}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-600 font-medium">
                  {format(new Date(doc.document_date), 'dd MMM yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-900 font-medium">
                  {doc.client?.name || doc.supplier?.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-900 text-right font-bold">
                  {doc.type === 'dc' || doc.type === 'wcc' ? '-' : `₹ ${doc.total?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
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
                  <a href={`/api/export/excel?id=${doc.id}`} download className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-green-600 hover:bg-green-50 hover:text-green-800 transition-colors" title="Download Excel">
                    <FileText className="h-4 w-4" />
                  </a>
                </td>
              </tr>
            ))}

            {filteredDocs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-brand-500">
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
