'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Package, 
  Settings, 
  LogOut,
  Menu
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Documents', href: '/dashboard/documents', icon: FileText },
    { name: 'Contacts', href: '/dashboard/contacts', icon: Users },
    { name: 'Master Sheet', href: '/dashboard/catalog', icon: Package },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-brand-50">
      {/* Sidebar for Desktop */}
      <aside className="hidden w-64 overflow-y-auto border-r border-brand-800 bg-brand-900 md:block shadow-xl z-20 flex-shrink-0">
        <div className="flex h-16 items-center justify-center border-b border-brand-800 px-4 py-6 sticky top-0 bg-brand-900 z-10">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center">
            <span className="text-accent-500 mr-2 text-2xl">⚡</span>
            Unity
          </h1>
        </div>
        
        <div className="flex flex-col justify-between min-h-[calc(100vh-4rem)]">
          <nav className="mt-6 flex flex-col space-y-1 px-3">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/') && item.href !== '/dashboard';
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-brand-800 text-white shadow-sm border border-brand-700/50'
                      : 'text-brand-300 hover:bg-brand-800/50 hover:text-white'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                      isActive ? 'text-accent-500' : 'text-brand-400 group-hover:text-brand-300'
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-brand-800 mt-auto">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-brand-300 rounded-lg hover:bg-brand-800 hover:text-white transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5 text-brand-400" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Mobile Header (Sticky Glassmorphism) */}
        <header className="flex h-16 items-center justify-between border-b border-brand-200 bg-white/80 backdrop-blur-md px-4 md:hidden z-30 sticky top-0 shadow-sm">
          <h1 className="text-lg font-bold text-brand-900 flex items-center">
             <span className="text-accent-500 mr-2">⚡</span> Unity
          </h1>
          <button className="text-brand-600 hover:bg-brand-100 p-2 rounded-md">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Mobile Nav (Bottom Bar) */}
        <div className="md:hidden flex items-center justify-between px-2 py-2 overflow-x-auto bg-brand-900 border-t border-brand-800 fixed bottom-0 w-full z-30 pb-safe">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/') && item.href !== '/dashboard';
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center p-2 rounded-lg flex-1 min-w-[64px] ${
                  isActive ? 'text-accent-500 bg-brand-800' : 'text-brand-300 hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5 mb-1" />
                <span className="text-[10px] truncate w-full text-center">{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 pb-20 md:pb-6 bg-brand-50">
          <div className="mx-auto max-w-7xl animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
