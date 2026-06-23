'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '~/trpc/client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'sonner';
import { KeyRound, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const forgotPassword = trpc.auth.forgotPassword.useMutation({
    onSuccess: (data) => {
      toast.success('If an account exists, a reset code was sent.');
      router.push(`/reset-password?email=${encodeURIComponent(data.email)}`);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to request reset. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    forgotPassword.mutate({ email });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-inquest-base px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-inquest-surface rounded-[2rem] p-8 md:p-10 warm-shadow border border-inquest-rule/50"
      >
        <div className="mb-6">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-inquest-ink-soft hover:text-inquest-ink transition">
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
        </div>

        <div className="mb-8 text-center">
          <div className="mx-auto w-12 h-12 bg-inquest-accent/10 rounded-full flex items-center justify-center mb-4 text-inquest-accent">
            <KeyRound size={24} />
          </div>
          <h1 className="text-3xl font-serif text-inquest-ink mb-2">Reset Password</h1>
          <p className="text-inquest-ink-soft text-sm">
            Enter your email and we'll send you a 6-digit OTP code to verify your identity.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-inquest-ink-mid px-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-inquest-base border border-inquest-rule focus:border-inquest-accent focus:ring-1 focus:ring-inquest-accent rounded-xl px-4 py-3.5 text-inquest-ink placeholder-inquest-ink-ghost transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={forgotPassword.isPending}
            className="w-full py-3.5 rounded-full bg-inquest-accent text-white font-medium hover:bg-inquest-accent-soft transition terracotta-glow disabled:opacity-70 cursor-pointer"
          >
            {forgotPassword.isPending ? 'Sending code...' : 'Send Verification Code'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
