'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '~/trpc/client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'sonner';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const resetPassword = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      toast.success('Password updated successfully! Please sign in with your new credentials.');
      router.push('/login');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update password. Please check the code.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit validation code.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    resetPassword.mutate({ email, otp, password });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md bg-inquest-surface rounded-[2rem] p-8 md:p-10 warm-shadow border border-inquest-rule/50"
    >
      <div className="mb-6">
        <Link href="/forgot-password" className="inline-flex items-center gap-2 text-sm text-inquest-ink-soft hover:text-inquest-ink transition">
          <ArrowLeft size={16} /> Back
        </Link>
      </div>

      <div className="mb-8 text-center">
        <div className="mx-auto w-12 h-12 bg-inquest-caution/10 rounded-full flex items-center justify-center mb-4 text-inquest-caution">
          <ShieldAlert size={24} />
        </div>
        <h1 className="text-3xl font-serif text-inquest-ink mb-2">Create New Password</h1>
        <p className="text-inquest-ink-soft text-sm">
          Enter the 6-digit validation code sent to your email to verify password reset.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5 text-center">
          <label className="block text-sm font-medium text-inquest-ink-mid mb-1.5">Validation Code</label>
          <input
            type="text"
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            className="w-full bg-inquest-base border border-inquest-rule focus:border-inquest-accent focus:ring-1 focus:ring-inquest-accent rounded-xl px-4 py-3 text-center tracking-widest text-xl font-mono text-inquest-ink focus:outline-none transition-colors"
            placeholder="000000"
            maxLength={6}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-inquest-ink-mid px-1">New Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-inquest-base border border-inquest-rule focus:border-inquest-accent focus:ring-1 focus:ring-inquest-accent rounded-xl px-4 py-3 text-inquest-ink placeholder-inquest-ink-ghost transition-colors"
            placeholder="••••••••"
            minLength={6}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-inquest-ink-mid px-1">Confirm New Password</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-inquest-base border border-inquest-rule focus:border-inquest-accent focus:ring-1 focus:ring-inquest-accent rounded-xl px-4 py-3 text-inquest-ink placeholder-inquest-ink-ghost transition-colors"
            placeholder="••••••••"
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={resetPassword.isPending}
          className="w-full py-3.5 rounded-full bg-inquest-accent text-white font-medium hover:bg-inquest-accent-soft transition terracotta-glow disabled:opacity-70 cursor-pointer"
        >
          {resetPassword.isPending ? 'Updating password...' : 'Update Password'}
        </button>
      </form>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-inquest-base px-4 py-12">
      <Suspense fallback={
        <div className="min-h-screen bg-inquest-base flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-inquest-accent border-t-transparent animate-spin" />
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
