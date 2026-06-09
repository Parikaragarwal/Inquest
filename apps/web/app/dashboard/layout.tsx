'use client';

import { useGetuser } from '~/hooks/api/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogOut, LayoutDashboard, Library, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isSignedIn } = useGetuser();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isSignedIn) {
      router.push('/login');
    }
  }, [isLoading, isSignedIn, router]);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const logout = () => {
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

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, active: pathname === '/dashboard' },
    { href: '/dashboard/philosophy', label: 'Philosophy', icon: Library, active: pathname === '/dashboard/philosophy' },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-6 sm:p-8">
        <Link href="/dashboard" className="text-2xl font-serif tracking-tight text-inquest-ink font-semibold">
          Inquest
        </Link>
        <p className="mt-2 text-sm font-medium text-inquest-ink-soft truncate">
          {user?.fullName}'s Workspace
        </p>
      </div>

      <nav className="flex-1 px-3 sm:px-4 space-y-1.5">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors ${
              link.active
                ? 'bg-inquest-depth text-inquest-ink font-medium'
                : 'text-inquest-ink-mid hover:bg-inquest-depth/50 hover:text-inquest-ink'
            }`}
          >
            <link.icon size={18} />
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 sm:p-6">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-2xl text-inquest-ink-soft hover:bg-inquest-depth/50 hover:text-inquest-caution transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-inquest-base flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 bg-inquest-surface border-r border-inquest-rule flex-col h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-inquest-surface border-b border-inquest-rule px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-serif tracking-tight text-inquest-ink font-semibold">
          Inquest
        </Link>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 text-inquest-ink-mid hover:text-inquest-ink rounded-xl hover:bg-inquest-depth/50 transition-colors"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/30 z-40"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute left-0 top-0 bottom-0 w-72 max-w-[80vw] bg-inquest-surface shadow-xl flex flex-col"
            >
              <div className="flex justify-end p-4">
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-inquest-ink-soft hover:text-inquest-ink">
                  <X size={20} />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto md:max-h-screen">
        <div className="max-w-4xl mx-auto p-6 sm:p-8 md:p-12 pt-20 md:pt-12">
          {children}
        </div>
      </main>
    </div>
  );
}
