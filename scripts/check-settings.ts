import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl!, supabaseKey!)

async function check() {
  await supabase.auth.signInWithPassword({
    email: 'test@unity.com',
    password: '12345678'
  })
  const { data, error } = await supabase.from('settings').select('*').limit(1)
  console.log('Data:', data?.[0])
  console.log('Error:', error)
}

check()
