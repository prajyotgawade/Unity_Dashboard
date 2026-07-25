'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function convertDocument(documentId: string, nextType: string) {
  const supabase = await createClient()

  // Fetch original doc
  const { data: originalDoc, error: docError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single()

  if (docError || !originalDoc) {
    throw new Error('Document not found')
  }

  // Fetch original lines
  const { data: originalLines } = await supabase
    .from('document_lines')
    .select('*')
    .eq('document_id', documentId)

  // Create new document payload
  const newDocPayload = {
    type: nextType,
    document_number: '', // Let user fill this in
    document_date: new Date().toISOString().split('T')[0],
    status: 'Draft',
    client_id: nextType === 'po' ? null : originalDoc.client_id,
    supplier_id: nextType === 'po' ? originalDoc.supplier_id : null, // Probably null unless converting PO to PO?
    parent_id: documentId,
    reference_number: originalDoc.type === 'quotation' && nextType === 'invoice' ? '' : originalDoc.document_number,
    subject: originalDoc.subject,
    metadata: { ...originalDoc.metadata },
    subtotal: nextType === 'dc' || nextType === 'wcc' ? 0 : originalDoc.subtotal,
    cgst: nextType === 'invoice' || nextType === 'po' ? originalDoc.cgst : 0,
    sgst: nextType === 'invoice' || nextType === 'po' ? originalDoc.sgst : 0,
    total: nextType === 'dc' || nextType === 'wcc' ? 0 : (nextType === 'quotation' ? originalDoc.subtotal : originalDoc.total),
  }

  const { data: newDoc, error: insertError } = await supabase
    .from('documents')
    .insert([newDocPayload])
    .select()
    .single()

  if (insertError) {
    throw new Error('Failed to create new document')
  }

  // Insert lines
  if (originalLines && originalLines.length > 0) {
    const newLinesPayload = originalLines.map(line => ({
      document_id: newDoc.id,
      item_id: line.item_id,
      description: line.description,
      quantity: line.quantity,
      unit: line.unit,
      rate: nextType === 'dc' || nextType === 'wcc' ? 0 : line.rate,
      amount: nextType === 'dc' || nextType === 'wcc' ? 0 : line.amount,
      make: line.make,
      sort_order: line.sort_order,
    }))

    await supabase.from('document_lines').insert(newLinesPayload)
  }

  redirect(`/dashboard/documents/${newDoc.id}`)
}
