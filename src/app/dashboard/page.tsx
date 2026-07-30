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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-900">Overview</h1>
        <p className="text-base text-brand-500 mt-1">
          Your business performance at a glance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="relative overflow-hidden rounded-2xl bg-white shadow-sm border border-brand-100 p-6 hover:shadow-md transition-shadow duration-300 group">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-brand-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700 ease-in-out"></div>
            <dt className="truncate text-sm font-medium text-brand-500 relative z-10">{item.name}</dt>
            <dd className="mt-2 text-3xl font-bold tracking-tight text-brand-900 relative z-10">{item.value}</dd>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-brand-100">
          <div className="px-6 py-5 border-b border-brand-100 bg-brand-50/30">
            <h3 className="text-lg font-semibold text-brand-900">Invoices Payment Status</h3>
          </div>
          <div className="px-6 py-6 flex flex-col items-center justify-center space-y-6">
            <div className="w-full flex justify-between items-center bg-green-50/50 p-5 rounded-xl border border-green-100/50 hover:bg-green-50 transition-colors duration-200">
              <span className="text-green-800 font-medium">Paid</span>
              <span className="text-2xl font-bold text-green-700">₹ {totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="w-full flex justify-between items-center bg-purple-50/50 p-5 rounded-xl border border-purple-100/50 hover:bg-purple-50 transition-colors duration-200">
              <span className="text-purple-800 font-medium">In Process</span>
              <span className="text-2xl font-bold text-purple-700">₹ {totalInProcess.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="w-full flex justify-between items-center bg-amber-50/50 p-5 rounded-xl border border-amber-100/50 hover:bg-amber-50 transition-colors duration-200">
              <span className="text-amber-800 font-medium">Sent</span>
              <span className="text-2xl font-bold text-amber-700">₹ {totalSent.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            
            {/* Animated Progress Bar Chart */}
            <div className="w-full pt-4">
              <div className="flex justify-between text-sm font-medium text-brand-600 mb-2">
                <span>Paid ({((totalPaid / (totalInvoiced || 1)) * 100).toFixed(0)}%)</span>
                <span>In Process ({((totalInProcess / (totalInvoiced || 1)) * 100).toFixed(0)}%)</span>
                <span>Sent ({((totalSent / (totalInvoiced || 1)) * 100).toFixed(0)}%)</span>
              </div>
              <div className="w-full bg-brand-100 rounded-full h-3 overflow-hidden flex shadow-inner">
                <div 
                  className="bg-green-500 h-3 transition-all duration-1000 ease-out" 
                  style={{ width: `${(totalPaid / (totalInvoiced || 1)) * 100}%` }}
                ></div>
                <div 
                  className="bg-purple-400 h-3 transition-all duration-1000 ease-out border-l border-white/20" 
                  style={{ width: `${(totalInProcess / (totalInvoiced || 1)) * 100}%` }}
                ></div>
                {/* Remaining is implied by the background or can be filled with amber if needed */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
