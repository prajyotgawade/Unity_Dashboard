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
    <div className="bg-white shadow-sm border border-brand-200 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-brand-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-50/50">
        <div className="flex space-x-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
          {['all', 'quotation', 'invoice', 'dc', 'po', 'wcc'].map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                activeType === type
                  ? 'bg-brand-700 text-white shadow-sm'
                  : 'text-brand-600 hover:bg-brand-100'
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
            className="block w-full rounded-md border border-brand-200 pl-10 pr-3 py-2 text-sm focus:border-brand-500 focus:ring-brand-500"
            placeholder="Search docs, clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-brand-200">
          <thead className="bg-brand-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-brand-500 uppercase tracking-wider">Document</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-brand-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-brand-500 uppercase tracking-wider">Client / Supplier</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-brand-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-brand-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-brand-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-brand-200">
            {filteredDocs.map((doc) => (
              <tr key={doc.id} className="hover:bg-brand-50/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-brand-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-brand-900">{doc.document_number}</div>
                      <div className="text-xs text-brand-500 uppercase">{doc.type}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-500">
                  {format(new Date(doc.document_date), 'dd MMM yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-900 font-medium">
                  {doc.client?.name || doc.supplier?.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-900 text-right font-medium">
                  {doc.type === 'dc' || doc.type === 'wcc' ? '-' : `₹ ${doc.total?.toFixed(2)}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[doc.status] || 'bg-gray-100 text-gray-800'}`}>
                    {doc.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link href={`/dashboard/documents/${doc.id}`} className="text-brand-600 hover:text-brand-900 mx-1" title="Edit">
                    <Edit2 className="h-4 w-4 inline" />
                  </Link>
                  <a href={`/api/export/pdf?id=${doc.id}`} download className="text-red-600 hover:text-red-900 mx-1" title="Download PDF">
                    <Download className="h-4 w-4 inline" />
                  </a>
                  <a href={`/api/export/excel?id=${doc.id}`} download className="text-green-600 hover:text-green-900 mx-1" title="Download Excel">
                    <FileText className="h-4 w-4 inline" />
                  </a>
                </td>
              </tr>
            ))}

            {filteredDocs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-brand-500">
                  No documents found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
