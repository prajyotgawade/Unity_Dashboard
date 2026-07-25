import { createClient } from '@/lib/supabase/server'
import { CatalogClient } from './catalog-client'

export default async function CatalogPage() {
  const supabase = await createClient()

  const { data: items } = await supabase
    .from('items')
    .select('*')
    .order('description', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-900">Item Catalog</h1>
        <p className="text-sm text-brand-500">
          Manage reusable items and services for your documents.
        </p>
      </div>
      
      <CatalogClient initialItems={items || []} />
    </div>
  )
}
