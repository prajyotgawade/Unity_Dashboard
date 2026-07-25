'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Package, 
  Settings, 
  LogOut 
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
    { name: 'Catalog', href: '/dashboard/catalog', icon: Package },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-brand-900 text-white flex flex-col min-h-[60px] md:min-h-screen shrink-0 relative z-10 border-b md:border-b-0 md:border-r border-brand-800">
        <div className="h-16 flex items-center px-6 border-b border-brand-800">
          <span className="font-bold text-lg tracking-tight truncate">Unity Enterprises</span>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto hidden md:block">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  isActive 
                    ? 'bg-brand-800 text-white' 
                    : 'text-brand-300 hover:bg-brand-800 hover:text-white'
                }`}
              >
                <item.icon className={`mr-3 shrink-0 h-5 w-5 ${isActive ? 'text-white' : 'text-brand-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Nav Header (Placeholder for hamburger, keeping it simple for now) */}
        <div className="md:hidden flex items-center justify-between px-4 py-2 overflow-x-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center p-2 rounded-md ${
                  isActive ? 'text-white' : 'text-brand-300'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] mt-1">{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-brand-800 hidden md:block">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-brand-300 rounded-md hover:bg-brand-800 hover:text-white transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 text-brand-400" />
            Sign out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
