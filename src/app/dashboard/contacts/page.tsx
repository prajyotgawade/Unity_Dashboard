import { createClient } from '@/lib/supabase/server'
import { ContactsClient } from './contacts-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ContactsPage() {
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true })

  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('*')
    .order('name', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-900">Contacts</h1>
        <p className="text-sm text-brand-500">
          Manage your clients and suppliers.
        </p>
      </div>
      
      <ContactsClient initialClients={clients || []} initialSuppliers={suppliers || []} />
    </div>
  )
}
