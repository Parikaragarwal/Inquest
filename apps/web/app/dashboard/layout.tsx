'use client';

import { useGetuser } from '~/hooks/api/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { LogOut, LayoutDashboard, Menu, X, UserCog, Sun, Moon, BookOpen, House, FileText, Shield, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '~/trpc/client';
import { toast } from 'sonner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isSignedIn } = useGetuser();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [newName, setNewName] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const profilePopoverRef = useRef<HTMLDivElement>(null);

  const utils = trpc.useUtils();

  // Sync dark mode state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDarkMode(document.documentElement.classList.contains('dark'));
    }
  }, []);

  // Close profile popover on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profilePopoverRef.current && !profilePopoverRef.current.contains(e.target as Node)) {
        setShowProfilePopover(false);
      }
    }
    if (showProfilePopover) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProfilePopover]);

  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success('Name updated successfully');
      setShowProfileEdit(false);
      utils.auth.getLoggedInUserInfo.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update name');
    },
  });

  useEffect(() => {
    if (!isLoading && !isSignedIn) {
      router.push('/login');
    }
  }, [isLoading, isSignedIn, router]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (showProfileEdit && user) {
      setNewName(user.fullName);
    }
  }, [showProfileEdit, user]);

  const signOutMutation = trpc.auth.signOut.useMutation({
    onSettled: () => {
      document.cookie = "authentication-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = '/login';
    }
  });

  const logout = async () => {
    try {
      await signOutMutation.mutateAsync();
    } catch {
      document.cookie = "authentication-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = '/login';
    }
  };

  const toggleTheme = () => {
    if (typeof window !== 'undefined' && typeof (window as any).__toggleTheme === 'function') {
      (window as any).__toggleTheme();
    }
    setDarkMode(!darkMode);
  };

  if (isLoading || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-inquest-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  const navLinks = [
    { href: '/', label: 'Home', tooltip: 'Home — Landing Page', icon: House, active: pathname === '/' },
    { href: '/dashboard', label: 'Dashboard', tooltip: 'Dashboard — My Forms', icon: LayoutDashboard, active: pathname === '/dashboard' || pathname.startsWith('/dashboard/forms') },
    { href: '/terms', label: 'Terms', tooltip: 'Terms of Service', icon: FileText, active: pathname === '/terms' },
    { href: '/privacy', label: 'Privacy', tooltip: 'Privacy Policy', icon: Shield, active: pathname === '/privacy' },
  ];

  // ─── Slim sidebar icon rail content ─────────────────────
  const RailContent = () => (
    <div className="flex flex-col items-center h-full py-4 gap-2">
      {/* Logo icon */}
      <Link
        href="/dashboard"
        className="flex items-center justify-center w-10 h-10 rounded-2xl bg-inquest-accent/10 text-inquest-accent hover:bg-inquest-accent/20 transition-colors mb-3"
        title="Inquest Home"
      >
        <BookOpen size={18} />
      </Link>

      <div className="w-6 h-px bg-inquest-rule/50 mb-1" />

      {/* Nav links — Home first, then others */}
      <nav className="flex flex-col items-center gap-1.5 flex-1">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            title={link.tooltip}
            className={`flex items-center justify-center w-10 h-10 rounded-2xl transition-all cursor-pointer ${
              link.active
                ? 'bg-inquest-accent text-white shadow-md'
                : 'text-inquest-ink-soft hover:bg-inquest-depth/60 hover:text-inquest-ink'
            }`}
          >
            <link.icon size={18} />
          </Link>
        ))}
      </nav>

      {/* Bottom actions — theme + profile */}
      <div className="flex flex-col items-center gap-1.5 mt-auto">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-10 h-10 rounded-2xl text-inquest-ink-soft hover:bg-inquest-depth/60 hover:text-inquest-ink transition-colors cursor-pointer"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Profile button with popover */}
        <div className="relative" ref={profilePopoverRef}>
          <button
            onClick={() => setShowProfilePopover(!showProfilePopover)}
            className="flex items-center justify-center w-10 h-10 rounded-2xl bg-inquest-depth/60 text-inquest-ink-soft hover:text-inquest-ink hover:bg-inquest-depth transition-colors cursor-pointer"
            title={user?.fullName || 'Profile'}
          >
            <span className="text-xs font-bold uppercase">
              {user?.fullName?.charAt(0) || 'U'}
            </span>
          </button>

          {/* Profile Popover */}
          <AnimatePresence>
            {showProfilePopover && (
              <motion.div
                initial={{ opacity: 0, x: -8, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute left-full bottom-0 ml-3 w-56 bg-inquest-surface rounded-2xl border border-inquest-rule/50 shadow-xl p-4 z-50"
              >
                {/* User info */}
                <div className="mb-3 pb-3 border-b border-inquest-rule/40">
                  <p className="text-sm font-medium text-inquest-ink truncate">{user?.fullName}</p>
                  <p className="text-[11px] text-inquest-ink-ghost truncate">{user?.email}</p>
                </div>

                {/* Edit name */}
                <button
                  onClick={() => {
                    setShowProfilePopover(false);
                    setShowProfileEdit(true);
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-inquest-ink-mid hover:text-inquest-ink hover:bg-inquest-depth/50 rounded-xl transition-colors cursor-pointer"
                >
                  <Edit3 size={14} />
                  Edit Display Name
                </button>

                {/* Sign Out */}
                <button
                  onClick={() => {
                    setShowProfilePopover(false);
                    logout();
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 mt-1 text-sm text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors cursor-pointer font-medium"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  // Full sidebar content for mobile
  const MobileSidebarContent = () => (
    <>
      <div className="p-5 sm:p-6">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-xl font-serif tracking-tight text-inquest-ink font-semibold">
          <BookOpen size={20} className="text-inquest-accent" />
          Inquest
        </Link>
      </div>

      {/* Navigation — Home first */}
      <nav className="flex-1 px-3 space-y-1">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-sm ${
              link.active
                ? 'bg-inquest-depth text-inquest-ink font-medium'
                : 'text-inquest-ink-mid hover:bg-inquest-depth/50 hover:text-inquest-ink'
            }`}
          >
            <link.icon size={17} />
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Bottom: Profile section + actions */}
      <div className="p-4 space-y-1 border-t border-inquest-rule/30 mt-auto">
        {/* User info */}
        <div className="px-4 py-2 mb-1">
          <p className="text-sm font-medium text-inquest-ink truncate">{user?.fullName}</p>
          <p className="text-[11px] text-inquest-ink-ghost truncate">{user?.email}</p>
        </div>

        {/* Edit profile */}
        <button
          onClick={() => setShowProfileEdit(true)}
          className="flex items-center gap-3 px-4 py-2.5 w-full text-left rounded-xl text-inquest-ink-soft hover:bg-inquest-depth/50 hover:text-inquest-ink transition-colors cursor-pointer text-sm"
        >
          <Edit3 size={17} />
          Edit Display Name
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-4 py-2.5 w-full text-left rounded-xl text-inquest-ink-soft hover:bg-inquest-depth/50 hover:text-inquest-ink transition-colors cursor-pointer text-sm"
        >
          {darkMode ? <Sun size={17} /> : <Moon size={17} />}
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>

        {/* Sign Out — prominent red bg */}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2.5 w-full text-left rounded-xl text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer text-sm font-medium mt-2"
        >
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex">
      {/* Desktop: Slim icon rail sidebar */}
      <aside className="hidden md:flex w-16 bg-gradient-to-r from-inquest-surface/85 via-inquest-surface/75 to-inquest-surface/40 backdrop-blur-md border-r border-inquest-rule/40 flex-col h-screen sticky top-0 shrink-0">
        <RailContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-inquest-surface/90 backdrop-blur-sm border-b border-inquest-rule/50 px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-lg font-serif tracking-tight text-inquest-ink font-semibold">
          <BookOpen size={18} className="text-inquest-accent" />
          Inquest
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 text-inquest-ink-soft hover:text-inquest-ink rounded-xl hover:bg-inquest-depth/50 transition-colors cursor-pointer"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 text-inquest-ink-mid hover:text-inquest-ink rounded-xl hover:bg-inquest-depth/50 transition-colors cursor-pointer"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/30 z-40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute left-0 top-0 bottom-0 w-64 max-w-[80vw] bg-inquest-surface shadow-xl flex flex-col"
            >
              <div className="flex justify-end p-4">
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-inquest-ink-soft hover:text-inquest-ink cursor-pointer">
                  <X size={20} />
                </button>
              </div>
              <MobileSidebarContent />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Name Modal */}
      <AnimatePresence>
        {showProfileEdit && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
            onClick={() => setShowProfileEdit(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-inquest-surface rounded-3xl p-8 max-w-sm w-full warm-shadow border border-inquest-rule/30"
            >
              <h3 className="text-xl font-serif text-inquest-ink mb-1">Update Display Name</h3>
              <p className="text-sm text-inquest-ink-soft mb-6">This is the name visible to others on Inquest.</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newName.trim()) return;
                  updateProfile.mutate({ fullName: newName.trim() });
                }}
                className="space-y-4"
              >
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  placeholder="Your full name"
                  className="w-full bg-inquest-base/60 border border-inquest-rule focus:border-inquest-accent focus:ring-1 focus:ring-inquest-accent/30 rounded-xl px-4 py-3 text-inquest-ink text-sm"
                />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowProfileEdit(false)}
                    className="flex-1 py-3 rounded-full border border-inquest-rule text-inquest-ink font-medium hover:bg-inquest-depth/30 transition-colors cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" disabled={updateProfile.isPending || !newName.trim()}
                    className="flex-1 py-3 rounded-full bg-inquest-accent text-white font-medium hover:bg-inquest-accent-soft transition-colors terracotta-glow disabled:opacity-50 cursor-pointer">
                    {updateProfile.isPending ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content — transparent so background shows through */}
      <main className="flex-1 overflow-y-auto md:max-h-screen">
        <div className="p-6 sm:p-8 md:p-12 pt-20 md:pt-12">
          {children}
        </div>
      </main>
    </div>
  );
}
