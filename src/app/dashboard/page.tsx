import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  // For a real app, you might want to filter by the current financial year.
  // We'll keep it simple and just get all data or data from the last 12 months.
  
  const { data: invoices } = await supabase
    .from('documents')
    .select('status, total, cgst, sgst')
    .eq('type', 'invoice')

  const { data: quotations } = await supabase
    .from('documents')
    .select('id')
    .eq('type', 'quotation')

  const numQuotations = quotations?.length || 0
  const numInvoices = invoices?.length || 0
  
  let totalInvoiced = 0
  let totalGST = 0
  let totalPaid = 0
  let totalPending = 0

  invoices?.forEach(inv => {
    totalInvoiced += inv.total || 0
    totalGST += (inv.cgst || 0) + (inv.sgst || 0)
    
    if (inv.status === 'Paid') {
      totalPaid += inv.total || 0
    } else if (inv.status === 'Pending' || inv.status === 'Sent' || inv.status === 'Overdue') {
      totalPending += inv.total || 0
    }
  })

  const stats = [
    { name: 'Total Invoiced', value: `₹ ${totalInvoiced.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` },
    { name: 'Total GST Collected', value: `₹ ${totalGST.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` },
    { name: 'Quotations Sent', value: numQuotations },
    { name: 'Invoices Raised', value: numInvoices },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-900">Dashboard</h1>
        <p className="text-sm text-brand-500">
          Overview of your business performance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="overflow-hidden rounded-lg bg-white shadow-sm border border-brand-200 px-4 py-5 sm:p-6">
            <dt className="truncate text-sm font-medium text-brand-500">{item.name}</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-brand-900">{item.value}</dd>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg bg-white shadow-sm border border-brand-200">
          <div className="px-4 py-5 sm:px-6 border-b border-brand-200 bg-brand-50/50">
            <h3 className="text-lg leading-6 font-medium text-brand-900">Payment Status (Invoices)</h3>
          </div>
          <div className="px-4 py-5 sm:p-6 flex flex-col items-center justify-center space-y-6">
            <div className="w-full flex justify-between items-center bg-green-50 p-4 rounded-lg border border-green-200">
              <span className="text-green-800 font-medium">Paid</span>
              <span className="text-2xl font-bold text-green-700">₹ {totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="w-full flex justify-between items-center bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <span className="text-yellow-800 font-medium">Pending</span>
              <span className="text-2xl font-bold text-yellow-700">₹ {totalPending.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            
            {/* Simple Progress Bar Chart */}
            <div className="w-full pt-4">
              <div className="flex justify-between text-xs text-brand-500 mb-1">
                <span>Paid ({((totalPaid / (totalInvoiced || 1)) * 100).toFixed(0)}%)</span>
                <span>Pending ({((totalPending / (totalInvoiced || 1)) * 100).toFixed(0)}%)</span>
              </div>
              <div className="w-full bg-yellow-200 rounded-full h-4 overflow-hidden flex">
                <div 
                  className="bg-green-500 h-4" 
                  style={{ width: `${(totalPaid / (totalInvoiced || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
