import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Key')
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runTests() {
  console.log('🔄 Authenticating with test account...')
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test@unity.com',
    password: '12345678'
  })

  if (authError) {
    console.error('❌ Authentication failed:', authError.message)
    return
  }

  console.log('✅ Logged in successfully as:', authData.user?.email)

  try {
    // 1. Fetch a client
    console.log('🔄 Fetching clients...')
    let { data: clients, error: clientErr } = await supabase
      .from('clients')
      .select('id')
      .limit(1)

    if (clientErr) throw clientErr

    let clientId = clients?.[0]?.id
    if (!clientId) {
      console.log('No client found. Creating a test client...')
      const { data: newClient, error: createClientErr } = await supabase
        .from('clients')
        .insert([{ 
          name: 'QA Test Client', 
          email: 'qa@example.com',
          phone: '1234567890',
          address: '123 QA Street'
        }])
        .select()
        .single()

      if (createClientErr) throw createClientErr
      clientId = newClient.id
    }
    console.log('✅ Client ready:', clientId)

    // 2. Fetch some products
    console.log('🔄 Fetching products...')
    let { data: products, error: prodErr } = await supabase
      .from('items')
      .select('*')
      .limit(5)

    if (prodErr) throw prodErr

    if (!products || products.length === 0) {
      console.log('No products found. Creating 5 dummy products...')
      const dummyProducts = Array.from({ length: 5 }).map((_, i) => {
        const ue_cost = 100 * (i + 1)
        const profit_percentage = 20
        return {
          description: `QA Product ${i + 1}`,
          ue_cost,
          profit_percentage,
          quantity: 1,
          unit: 'Nos',
          rate: ue_cost * 1.2,
          gst_rate: 18,
          category: 'Hardware'
        }
      })
      const { data: newProds, error: insertProdErr } = await supabase
        .from('items')
        .insert(dummyProducts)
        .select('*')
      if (insertProdErr) throw insertProdErr
      products = newProds || []
    }
    console.log('✅ Products ready:', products.length)

    // Helper to create document
    async function createDocument(type: string, parentId: string | null = null) {
      const subtotal = products!.reduce((acc, p) => acc + (p.rate * 2), 0)
      const cgst = subtotal * 0.09
      const sgst = subtotal * 0.09
      const total = subtotal + cgst + sgst

      const numMap: Record<string, string> = {
        quotation: 'QT',
        po: 'PO',
        dc: 'DC',
        wcc: 'WCC',
        invoice: 'INV'
      }

      const docNumber = `TEST-${numMap[type]}-${Math.floor(Math.random() * 10000)}`

      const payload = {
        type,
        document_number: docNumber,
        document_date: new Date().toISOString().split('T')[0],
        status: type === 'quotation' ? 'Sent' : 'In Process',
        client_id: clientId,
        subject: `E2E Test ${type.toUpperCase()}`,
        subtotal,
        cgst,
        sgst,
        total,
        parent_id: parentId
      }

      const { data: doc, error: docErr } = await supabase
        .from('documents')
        .insert([payload])
        .select()
        .single()

      if (docErr) throw docErr

      const lines = products!.map((p, i) => ({
        document_id: doc.id,
        item_id: p.id,
        description: p.description,
        quantity: 2,
        unit: p.unit,
        rate: p.rate,
        amount: p.rate * 2,
        sort_order: i
      }))

      const { error: lineErr } = await supabase.from('document_lines').insert(lines)
      if (lineErr) throw lineErr

      console.log(`✅ Created ${type.toUpperCase()} successfully: ${docNumber}`)
      return doc
    }

    // 3. Create Quotation
    console.log('\n--- SCENARIO: Creating Full Document Flow ---')
    const quotation = await createDocument('quotation')
    
    // 4. Create child documents
    const po = await createDocument('po', quotation.id)
    const dc = await createDocument('dc', quotation.id)
    const wcc = await createDocument('wcc', quotation.id)
    const invoice = await createDocument('invoice', quotation.id)

    console.log('\n🎉 ALL SCENARIOS TESTED SUCCESSFULLY!')
    console.log(`Quotation: ${quotation.document_number}`)
    console.log(`Purchase Order: ${po.document_number}`)
    console.log(`Delivery Challan: ${dc.document_number}`)
    console.log(`Work Completion Cert: ${wcc.document_number}`)
    console.log(`Invoice: ${invoice.document_number}`)

  } catch (err: any) {
    console.error('\n❌ TEST FAILED:', err.message)
  }
}

runTests()
