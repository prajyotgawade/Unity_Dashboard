import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from './settings-form'

export default async function SettingsPage() {
  const supabase = await createClient()

  // Fetch settings. Since it's a singleton, we can just grab the first row.
  const { data: settings, error } = await supabase
    .from('settings')
    .select('*')
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    // Log error, but if PGRST116 (No rows found), we can pass empty/defaults
    console.error('Error fetching settings:', error)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-900">Business Settings</h1>
        <p className="text-sm text-brand-500">
          Manage your company details, logo, and bank information for documents.
        </p>
      </div>
      
      <div className="bg-white shadow-sm border border-brand-200 rounded-lg p-6">
        <SettingsForm initialData={settings || {}} />
      </div>
    </div>
  )
}
