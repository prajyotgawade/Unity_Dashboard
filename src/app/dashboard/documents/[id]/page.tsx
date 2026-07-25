import { createClient } from '@/lib/supabase/server'
import { DocumentEditor } from './document-editor'
import { notFound } from 'next/navigation'

export default async function DocumentPage({
  params,
}: {
  params: { id: string }
}) {
  const { id } = await params; // Next.js 15 requires awaiting params
  
  const supabase = await createClient()

  let documentData = null
  let documentLines = []

  if (id !== 'new') {
    const { data: doc, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !doc) {
      notFound()
    }

    documentData = doc

    const { data: lines } = await supabase
      .from('document_lines')
      .select('*')
      .eq('document_id', id)
      .order('sort_order', { ascending: true })

    documentLines = lines || []
  }

  // We need to fetch clients, suppliers, and items for the dropdowns
  const { data: clients } = await supabase.from('clients').select('id, name').order('name')
  const { data: suppliers } = await supabase.from('suppliers').select('id, name').order('name')
  const { data: items } = await supabase.from('items').select('*').order('description')

  return (
    <div className="space-y-6">
      <DocumentEditor
        initialData={documentData}
        initialLines={documentLines}
        clients={clients || []}
        suppliers={suppliers || []}
        items={items || []}
        isNew={id === 'new'}
      />
    </div>
  )
}
