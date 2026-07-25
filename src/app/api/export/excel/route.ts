import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import * as xlsx from 'xlsx'
import { format } from 'date-fns'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get('id')

  if (!id) {
    return new NextResponse('Missing document ID', { status: 400 })
  }

  const supabase = await createClient()

  // Fetch document
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select(`
      *,
      client:clients(*),
      supplier:suppliers(*)
    `)
    .eq('id', id)
    .single()

  if (docError || !document) {
    return new NextResponse('Document not found', { status: 404 })
  }

  // Fetch lines
  const { data: lines } = await supabase
    .from('document_lines')
    .select('*')
    .eq('document_id', id)
    .order('sort_order', { ascending: true })

  // Fetch settings
  const { data: settings } = await supabase
    .from('settings')
    .select('*')
    .single()

  try {
    const isWCC = document.type === 'wcc'
    const isDC = document.type === 'dc'
    
    // Create Excel Workbook
    const wb = xlsx.utils.book_new()
    
    // Build data array for the sheet
    const wsData: any[][] = []
    
    // Header
    wsData.push([settings?.business_name || 'Unity Enterprises'])
    wsData.push([`Mumbai Office: ${settings?.mumbai_office_address}`])
    wsData.push([`Contact no: ${settings?.contact_numbers}`])
    wsData.push([]) // empty row
    
    // Title
    wsData.push([`DOCUMENT: ${document.type.toUpperCase()} - ${document.document_number}`])
    wsData.push([`DATE: ${format(new Date(document.document_date), 'dd/MM/yyyy')}`])
    wsData.push([])
    
    // Client/Supplier Info
    const contact = document.type === 'po' ? document.supplier : document.client
    wsData.push(['TO:'])
    wsData.push([contact?.name])
    wsData.push([contact?.address])
    if (contact?.gstin) wsData.push([`GSTIN: ${contact.gstin}`])
    wsData.push([])
    
    if (document.subject) {
      wsData.push([`Subject: ${document.subject}`])
      wsData.push([])
    }
    
    // Table Headers
    const headers = ['Sr No', 'Description']
    if (isWCC) headers.push('Make')
    headers.push('Quantity', 'Unit')
    if (!isDC && !isWCC) headers.push('Rate (Rs)', 'Amount (Rs)')
    
    wsData.push(headers)
    
    // Table Rows
    lines?.forEach((line: any, index: number) => {
      const row = [index + 1, line.description]
      if (isWCC) row.push(line.make || '')
      row.push(line.quantity, line.unit)
      if (!isDC && !isWCC) row.push(line.rate, line.amount)
      wsData.push(row)
    })
    
    // Totals
    if (!isDC && !isWCC) {
      wsData.push([])
      wsData.push(['', '', '', 'Subtotal', document.subtotal])
      if (document.type === 'invoice' || document.type === 'po') {
        wsData.push(['', '', '', 'CGST (9%)', document.cgst])
        wsData.push(['', '', '', 'SGST (9%)', document.sgst])
      }
      wsData.push(['', '', '', 'Total (Rs)', document.total])
    }
    
    // Terms
    if (document.metadata?.terms) {
      wsData.push([])
      wsData.push(['Terms & Conditions:'])
      wsData.push([document.metadata.terms])
    }

    const ws = xlsx.utils.aoa_to_sheet(wsData)
    
    // Auto-size columns roughly
    ws['!cols'] = [
      { wch: 10 }, // Sr
      { wch: 40 }, // Desc
      { wch: 15 }, // Make/Qty
      { wch: 10 }, // Unit
      { wch: 15 }, // Rate
      { wch: 15 }, // Amount
    ]

    xlsx.utils.book_append_sheet(wb, ws, 'Document')
    
    // Generate buffer
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' })
    
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${document.type}_${document.document_number.replace(/\//g, '_')}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Excel Generation Error:', error)
    return new NextResponse('Failed to generate Excel', { status: 500 })
  }
}
