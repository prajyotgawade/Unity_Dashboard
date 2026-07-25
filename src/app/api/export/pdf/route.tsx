import { createClient } from '@/lib/supabase/server'
import { renderToStream } from '@react-pdf/renderer'
import { DocumentTemplate } from '@/components/pdf/DocumentTemplate'
import { NextRequest, NextResponse } from 'next/server'

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
    const stream = await renderToStream(
      <DocumentTemplate
        document={document}
        settings={settings || {}}
        client={document.client}
        supplier={document.supplier}
        lines={lines || []}
      />
    )

    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${document.type}_${document.document_number.replace(/\//g, '_')}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF Generation Error:', error)
    return new NextResponse('Failed to generate PDF', { status: 500 })
  }
}
