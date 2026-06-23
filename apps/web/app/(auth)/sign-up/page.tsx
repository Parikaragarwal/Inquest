'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '~/trpc/client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/trpc', '') || 'http://localhost:8000';

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signUp = trpc.auth.createUserWithEmailAndPassword.useMutation({
    onSuccess: (data) => {
      toast.success('Account created successfully! Please verify your email.');
      router.push(`/verify-email?email=${encodeURIComponent(data.email || email)}&redirect=${encodeURIComponent(redirectUrl)}`);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create account.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signUp.mutate({ fullName: name, email, password });
  };

  const handleGoogleSignIn = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md bg-inquest-surface rounded-[2rem] p-8 md:p-10 warm-shadow"
    >
      <div className="mb-8 text-center">
        <Link href="/" className="text-2xl font-serif tracking-tight text-inquest-ink font-semibold">Inquest</Link>
        <h1 className="text-3xl font-serif text-inquest-ink mb-2 mt-6">Create Account</h1>
        <p className="text-inquest-ink-soft">Join Inquest to start gathering insights.</p>
      </div>

      {/* Google Sign-Up */}
      <button
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center gap-3 py-3.5 rounded-full border border-inquest-rule bg-white hover:bg-inquest-depth/30 transition-colors font-medium text-inquest-ink cursor-pointer"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-inquest-rule" />
        <span className="text-xs text-inquest-ink-ghost uppercase tracking-widest font-medium">or</span>
        <div className="flex-1 h-px bg-inquest-rule" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-inquest-ink-mid px-1">Full Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-inquest-base border border-inquest-rule focus:border-inquest-accent focus:ring-1 focus:ring-inquest-accent rounded-xl px-4 py-3 text-inquest-ink placeholder-inquest-ink-ghost transition-colors"
            placeholder="Jane Doe"
          />
        </div>

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
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={signUp.isPending}
          className="w-full py-3.5 rounded-full bg-inquest-accent text-white font-medium hover:bg-inquest-accent-soft transition terracotta-glow disabled:opacity-70 cursor-pointer"
        >
          {signUp.isPending ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <div className="mt-8 text-center text-inquest-ink-soft text-sm">
        Already have an account?{' '}
        <Link href={`/login?redirect=${encodeURIComponent(redirectUrl)}`} className="text-inquest-accent hover:underline font-medium">
          Sign in
        </Link>
      </div>
    </motion.div>
  );
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-inquest-base px-4 py-12">
      <Suspense fallback={
        <div className="min-h-screen bg-inquest-base flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-inquest-accent border-t-transparent animate-spin" />
        </div>
      }>
        <SignUpForm />
      </Suspense>
    </div>
  );
}