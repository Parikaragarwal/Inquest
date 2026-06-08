'use client';

import { useGetuser } from '~/hooks/api/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { trpc } from '~/trpc/client';
import { LogOut, LayoutDashboard, Library } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isSignedIn } = useGetuser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isSignedIn) {
      router.push('/login');
    }
  }, [isLoading, isSignedIn, router]);

  const logout = () => {
    // Clear the authentication cookie manually
    document.cookie = "authentication-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = '/login';
  };

  if (isLoading || !isSignedIn) {
    return (
      <div className="min-h-screen bg-inquest-base flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-inquest-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-inquest-base flex">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-inquest-surface border-r border-inquest-rule flex flex-col h-screen sticky top-0">
        <div className="p-8">
          <Link href="/dashboard" className="text-2xl font-serif tracking-tight text-inquest-ink font-semibold">
            Inquest
          </Link>
          <p className="mt-2 text-sm font-medium text-inquest-ink-soft">
            {user?.fullName}'s Workspace
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors ${
              pathname === '/dashboard' 
                ? 'bg-inquest-depth text-inquest-ink font-medium' 
                : 'text-inquest-ink-mid hover:bg-inquest-depth/50 hover:text-inquest-ink'
            }`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </Link>
          <Link
            href="/dashboard/philosophy"
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors ${
              pathname === '/dashboard/philosophy' 
                ? 'bg-inquest-depth text-inquest-ink font-medium' 
                : 'text-inquest-ink-mid hover:bg-inquest-depth/50 hover:text-inquest-ink'
            }`}
          >
            <Library size={18} />
            Philosophy
          </Link>
        </nav>

        <div className="p-6">
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-2xl text-inquest-ink-soft hover:bg-inquest-depth/50 hover:text-inquest-caution transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto p-12"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
