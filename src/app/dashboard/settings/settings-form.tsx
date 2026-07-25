'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Save, Upload, Loader2, CheckCircle2 } from 'lucide-react'

const settingsSchema = z.object({
  id: z.string().optional(),
  business_name: z.string().min(1, 'Business name is required'),
  mumbai_office_address: z.string().min(1, 'Office address is required'),
  contact_numbers: z.string().min(1, 'Contact numbers are required'),
  regd_office_address: z.string().min(1, 'Registered office address is required'),
  gstin: z.string().min(1, 'GSTIN is required'),
  bank_name: z.string().min(1, 'Bank name is required'),
  bank_account_no: z.string().min(1, 'Account number is required'),
  bank_ifsc: z.string().min(1, 'IFSC code is required'),
  email_invoice: z.string().email('Invalid email'),
  email_other: z.string().email('Invalid email'),
  logo_url: z.string().nullable().optional(),
  signature_url: z.string().nullable().optional(),
})

type SettingsValues = z.infer<typeof settingsSchema>

export function SettingsForm({ initialData }: { initialData: Partial<SettingsValues> }) {
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingSignature, setUploadingSignature] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      business_name: initialData.business_name || 'UNITY ENTERPRISES',
      mumbai_office_address: initialData.mumbai_office_address || 'A/5, Navjeevan seva society, Shingare wadi, Kurla (West), Mumbai- 400070.',
      contact_numbers: initialData.contact_numbers || '8623925697 / 8982691044',
      regd_office_address: initialData.regd_office_address || '344B, Walope, Tal- Chiplun, Dist- Ratnagiri-415605',
      gstin: initialData.gstin || '27JTJPS1876M1ZL',
      bank_name: initialData.bank_name || 'Kotak Mahindra Bank Avashi branch Lote Parshuram',
      bank_account_no: initialData.bank_account_no || '5647987721',
      bank_ifsc: initialData.bank_ifsc || 'KKBK0001994',
      email_invoice: initialData.email_invoice || 'unityenterprises36@gmail.com',
      email_other: initialData.email_other || 'sales@unitytech.in',
      logo_url: initialData.logo_url || null,
      signature_url: initialData.signature_url || null,
      id: initialData.id,
    },
  })

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'logo_url' | 'signature_url',
    setUploading: (val: boolean) => void
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${field}-${Math.random()}.${fileExt}`
    const filePath = `settings/${fileName}`

    const { error: uploadError, data } = await supabase.storage
      .from('assets')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Upload error', uploadError)
      alert('Error uploading file!')
    } else {
      const { data: publicUrlData } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath)
      setValue(field, publicUrlData.publicUrl)
    }
    setUploading(false)
  }

  const onSubmit = async (data: SettingsValues) => {
    setIsSaving(true)
    setSaveStatus('idle')

    try {
      if (data.id) {
        const { error } = await supabase
          .from('settings')
          .update(data)
          .eq('id', data.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('settings').insert([data])
        if (error) throw error
      }
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      console.error('Save error', error)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const logoUrl = watch('logo_url')
  const signatureUrl = watch('signature_url')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* General Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-brand-700">Business Name</label>
          <input
            {...register('business_name')}
            className="mt-1 block w-full rounded-md border border-brand-200 px-3 py-2 text-foreground focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          {errors.business_name && <p className="mt-1 text-sm text-red-600">{errors.business_name.message}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-brand-700">GSTIN</label>
          <input
            {...register('gstin')}
            className="mt-1 block w-full rounded-md border border-brand-200 px-3 py-2 text-foreground focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          {errors.gstin && <p className="mt-1 text-sm text-red-600">{errors.gstin.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-brand-700">Mumbai Office Address</label>
          <input
            {...register('mumbai_office_address')}
            className="mt-1 block w-full rounded-md border border-brand-200 px-3 py-2 text-foreground focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-brand-700">Registered Office Address</label>
          <input
            {...register('regd_office_address')}
            className="mt-1 block w-full rounded-md border border-brand-200 px-3 py-2 text-foreground focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-700">Contact Numbers</label>
          <input
            {...register('contact_numbers')}
            className="mt-1 block w-full rounded-md border border-brand-200 px-3 py-2 text-foreground focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="border-t border-brand-100 pt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-brand-700">Email (Invoice)</label>
          <input
            {...register('email_invoice')}
            className="mt-1 block w-full rounded-md border border-brand-200 px-3 py-2 text-foreground focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-brand-700">Email (Other Documents)</label>
          <input
            {...register('email_other')}
            className="mt-1 block w-full rounded-md border border-brand-200 px-3 py-2 text-foreground focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="border-t border-brand-100 pt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-brand-700">Bank Name & Branch</label>
          <input
            {...register('bank_name')}
            className="mt-1 block w-full rounded-md border border-brand-200 px-3 py-2 text-foreground focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-700">Account Number</label>
          <input
            {...register('bank_account_no')}
            className="mt-1 block w-full rounded-md border border-brand-200 px-3 py-2 text-foreground focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-700">IFSC Code</label>
          <input
            {...register('bank_ifsc')}
            className="mt-1 block w-full rounded-md border border-brand-200 px-3 py-2 text-foreground focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="border-t border-brand-100 pt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="block text-sm font-medium text-brand-700 mb-2">Company Logo</label>
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-16 w-16 object-contain border border-brand-200 rounded p-1" />
            ) : (
              <div className="h-16 w-16 bg-brand-50 border border-brand-200 rounded flex items-center justify-center text-xs text-brand-400">None</div>
            )}
            <label className="cursor-pointer bg-white px-3 py-2 border border-brand-300 rounded-md shadow-sm text-sm font-medium text-brand-700 hover:bg-brand-50 focus:outline-none flex items-center gap-2">
              {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload Logo
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo_url', setUploadingLogo)} disabled={uploadingLogo} />
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-700 mb-2">Signature / Stamp</label>
          <div className="flex items-center gap-4">
            {signatureUrl ? (
              <img src={signatureUrl} alt="Signature" className="h-16 w-16 object-contain border border-brand-200 rounded p-1" />
            ) : (
              <div className="h-16 w-16 bg-brand-50 border border-brand-200 rounded flex items-center justify-center text-xs text-brand-400">None</div>
            )}
            <label className="cursor-pointer bg-white px-3 py-2 border border-brand-300 rounded-md shadow-sm text-sm font-medium text-brand-700 hover:bg-brand-50 focus:outline-none flex items-center gap-2">
              {uploadingSignature ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload Stamp
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'signature_url', setUploadingSignature)} disabled={uploadingSignature} />
            </label>
          </div>
        </div>
      </div>

      <div className="border-t border-brand-100 pt-6 flex items-center justify-end gap-4">
        {saveStatus === 'success' && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" /> Saved successfully
          </span>
        )}
        {saveStatus === 'error' && (
          <span className="text-sm text-red-600">Failed to save settings</span>
        )}
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Settings
        </button>
      </div>
    </form>
  )
}
