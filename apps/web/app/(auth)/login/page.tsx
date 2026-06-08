'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '~/trpc/client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signIn = trpc.auth.signInUserWithEmailAndPassword.useMutation({
    onSuccess: () => {
      toast.success('Welcome back!');
      router.push(redirectUrl);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to sign in. Please check your credentials.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-inquest-base px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-inquest-surface rounded-[2rem] p-8 md:p-10 warm-shadow"
      >
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-serif text-inquest-ink mb-2">Welcome Back</h1>
          <p className="text-inquest-ink-soft">Sign in to continue to Inquest.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-inquest-ink-mid px-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-inquest-base border border-inquest-rule focus:border-inquest-accent focus:ring-1 focus:ring-inquest-accent rounded-xl px-4 py-3 text-inquest-ink placeholder-inquest-ink-ghost transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-inquest-ink-mid px-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-inquest-base border border-inquest-rule focus:border-inquest-accent focus:ring-1 focus:ring-inquest-accent rounded-xl px-4 py-3 text-inquest-ink placeholder-inquest-ink-ghost transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={signIn.isPending}
            className="w-full py-3.5 rounded-full bg-inquest-accent text-white font-medium hover:bg-inquest-accent-soft transition terracotta-glow disabled:opacity-70"
          >
            {signIn.isPending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-inquest-ink-soft text-sm">
          Don't have an account?{' '}
          <Link href={`/sign-up?redirect=${encodeURIComponent(redirectUrl)}`} className="text-inquest-accent hover:underline font-medium">
            Create one
          </Link>
        </div>
      </motion.div>
    </div>
  );
}