import { createClient } from '@/lib/supabase/server'
import { DocumentEditor } from './document-editor'
import { notFound } from 'next/navigation'

export default async function DocumentPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const { id } = await params;
  const sp = await searchParams;
  
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
  } else if (sp?.parent_id) {
    // We are creating a new document from a parent document (e.g. Quotation)
    const parentId = Array.isArray(sp.parent_id) ? sp.parent_id[0] : sp.parent_id
    const targetType = Array.isArray(sp.type) ? sp.type[0] : sp.type || 'invoice'

    const { data: parentDoc } = await supabase
      .from('documents')
      .select('*')
      .eq('id', parentId)
      .single()

    if (parentDoc) {
      documentData = {
        type: targetType,
        parent_id: parentId,
        document_number: parentDoc.document_number, // Same number as parent
        client_id: parentDoc.client_id,
        supplier_id: parentDoc.supplier_id,
        subject: parentDoc.subject,
        reference_number: parentDoc.reference_number,
        metadata: parentDoc.metadata,
      }

      const { data: parentLines } = await supabase
        .from('document_lines')
        .select('*')
        .eq('document_id', parentId)
        .order('sort_order', { ascending: true })

      if (parentLines) {
        documentLines = parentLines.map((line) => ({
          ...line,
          id: undefined, // remove id so it creates a new line
          document_id: undefined,
        }))
      }
    }
  } else if (id === 'new') {
    // We are creating a brand new standalone document
    const targetType = Array.isArray(sp?.type) ? sp.type[0] : (sp?.type || 'quotation')

    const { data: lastDoc } = await supabase
      .from('documents')
      .select('document_number')
      .eq('type', targetType)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let nextNumber = `${targetType.toUpperCase()}-0001`

    if (lastDoc?.document_number) {
      const lastNumber = lastDoc.document_number
      const match = lastNumber.match(/(\d+)$/)
      if (match) {
        const numStr = match[1]
        const numLength = Math.max(numStr.length, 3) // At least 3 digits
        const nextNum = (parseInt(numStr, 10) + 1).toString().padStart(numLength, '0')
        nextNumber = lastNumber.substring(0, match.index) + nextNum
      } else {
        nextNumber = `${lastNumber}-001`
      }
    }

    documentData = {
      type: targetType,
      document_number: nextNumber,
    }
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
