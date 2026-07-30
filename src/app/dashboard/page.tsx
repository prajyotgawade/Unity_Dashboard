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
  let totalSent = 0
  let totalInProcess = 0

  invoices?.forEach(inv => {
    totalInvoiced += inv.total || 0
    totalGST += (inv.cgst || 0) + (inv.sgst || 0)

    if (inv.status === 'Paid') {
      totalPaid += inv.total || 0
    } else if (inv.status === 'In Process') {
      totalInProcess += inv.total || 0
    } else if (inv.status === 'Sent' || inv.status === 'Draft') {
      totalSent += inv.total || 0
    }
  })

  const stats = [
    { name: 'Total Invoiced', value: `₹ ${totalInvoiced.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` },
    { name: 'Total GST Collected', value: `₹ ${totalGST.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` },
    { name: 'Quotations Sent', value: numQuotations },
    { name: 'Invoices Raised', value: numInvoices },
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-4 sm:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out max-w-6xl mx-auto">
      <div className="flex-none">
        <h1 className="text-2xl font-extrabold tracking-tight text-brand-900">Overview</h1>
        <p className="text-sm text-brand-500 mt-0.5">
          Your business performance at a glance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 flex-none">
        {stats.map((item) => (
          <div key={item.name} className="relative overflow-hidden rounded-2xl bg-white shadow-sm border border-brand-100 p-6 h-32 flex flex-col justify-center hover:shadow-md transition-shadow duration-300 group">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-brand-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700 ease-in-out"></div>
            <dt className="truncate text-base font-medium text-brand-500 relative z-10">{item.name}</dt>
            <dd className="mt-2 text-3xl font-bold tracking-tight text-brand-900 relative z-10">{item.value}</dd>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 flex-1 min-h-0 pb-2">
        <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm border border-brand-100 h-full">
          <div className="px-5 py-4 border-b border-brand-100 bg-brand-50/30 flex-none">
            <h3 className="text-base font-semibold text-brand-900">Invoices Payment Status</h3>
          </div>
          <div className="px-5 py-4 flex flex-col justify-around flex-1 min-h-0">
            <div className="w-full max-w-lg mx-auto flex flex-col justify-between h-full gap-4">
              <div className="flex flex-col justify-around flex-1 min-h-0 gap-2">
                <div className="w-full flex justify-between items-center bg-green-50/50 p-4 rounded-xl border border-green-100/50 hover:bg-green-50 transition-colors duration-200">
                  <span className="text-green-800 font-medium text-sm">Paid</span>
                  <span className="text-xl font-bold text-green-700">₹ {totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="w-full flex justify-between items-center bg-purple-50/50 p-4 rounded-xl border border-purple-100/50 hover:bg-purple-50 transition-colors duration-200">
                  <span className="text-purple-800 font-medium text-sm">In Process</span>
                  <span className="text-xl font-bold text-purple-700">₹ {totalInProcess.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="w-full flex justify-between items-center bg-amber-50/50 p-4 rounded-xl border border-amber-100/50 hover:bg-amber-50 transition-colors duration-200">
                  <span className="text-amber-800 font-medium text-sm">Sent</span>
                  <span className="text-xl font-bold text-amber-700">₹ {totalSent.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
              </div>
              
              {/* Animated Progress Bar Chart */}
              <div className="w-full pt-2 flex-none">
                <div className="flex justify-between text-xs font-medium text-brand-600 mb-2">
                  <span>Paid ({((totalPaid / (totalInvoiced || 1)) * 100).toFixed(0)}%)</span>
                  <span>In Process ({((totalInProcess / (totalInvoiced || 1)) * 100).toFixed(0)}%)</span>
                  <span>Sent ({((totalSent / (totalInvoiced || 1)) * 100).toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-brand-100 rounded-full h-2 overflow-hidden flex shadow-inner">
                  <div 
                    className="bg-green-500 h-2 transition-all duration-1000 ease-out" 
                    style={{ width: `${(totalPaid / (totalInvoiced || 1)) * 100}%` }}
                  ></div>
                  <div 
                    className="bg-purple-400 h-2 transition-all duration-1000 ease-out border-l border-white/20" 
                    style={{ width: `${(totalInProcess / (totalInvoiced || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
