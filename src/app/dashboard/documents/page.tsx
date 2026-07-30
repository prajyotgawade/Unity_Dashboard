import { createClient } from '@/lib/supabase/server'
import { DocumentsList } from './documents-list'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DocumentsPage() {
  const supabase = await createClient()

  // Fetch documents with their associated client/supplier
  const { data: documents } = await supabase
    .from('documents')
    .select(`
      *,
      client:clients(name),
      supplier:suppliers(name)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-900">Documents</h1>
          <p className="text-sm text-brand-500">
            Manage Quotations, Invoices, Delivery Challans, Purchase Orders, and Work Completion Certificates.
          </p>
        </div>
        <Link
          href="/dashboard/documents/new"
          className="inline-flex items-center justify-center rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-800"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Document
        </Link>
      </div>
      
      <DocumentsList initialDocuments={documents || []} />
    </div>
  )
}
