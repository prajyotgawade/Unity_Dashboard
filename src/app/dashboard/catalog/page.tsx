import { createClient } from '@/lib/supabase/server'
import { CatalogClient } from './catalog-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CatalogPage() {
  const supabase = await createClient()

  const { data: items } = await supabase
    .from('items')
    .select(`
      *,
      suppliers(name)
    `)
    .order('description', { ascending: true })

  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, name')
    .order('name', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-900">Master Sheet</h1>
        <p className="text-sm text-brand-500">
          Manage reusable items and services for your documents.
        </p>
      </div>
      
      <CatalogClient initialItems={items || []} suppliers={suppliers || []} />
    </div>
  )
}
