'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '~/trpc/client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'sonner';
import { KeyRound, Mail, ArrowLeft } from 'lucide-react';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const [otp, setOtp] = useState('');
  const [isResending, setIsResending] = useState(false);

  const verifyOTP = trpc.auth.verifyOTP.useMutation({
    onSuccess: () => {
      toast.success('Email verified successfully! Welcome to Inquest.');
      router.push(redirectUrl);
    },
    onError: (err) => {
      toast.error(err.message || 'Verification failed. Please check the code.');
    },
  });

  const resendOTP = trpc.auth.resendOTP.useMutation({
    onSuccess: () => {
      toast.success('A new verification code has been sent to your email.');
      setIsResending(false);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to resend code. Please try again.');
      setIsResending(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit code.');
      return;
    }
    verifyOTP.mutate({ email, otp });
  };

  const handleResend = () => {
    if (!email) {
      toast.error('Email is missing. Please go back and sign up again.');
      return;
    }
    setIsResending(true);
    resendOTP.mutate({ email });
  };

  return (
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
          <Mail size={24} />
        </div>
        <h1 className="text-3xl font-serif text-inquest-ink mb-2">Verify Email</h1>
        <p className="text-inquest-ink-soft text-sm">
          We sent a 6-digit code to <br />
          <span className="font-semibold text-inquest-ink-mid break-all">{email || 'your email'}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1.5 text-center">
          <label className="block text-sm font-medium text-inquest-ink-mid mb-2">Verification Code</label>
          <input
            type="text"
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            className="w-full bg-inquest-base border border-inquest-rule focus:border-inquest-accent focus:ring-1 focus:ring-inquest-accent rounded-xl px-4 py-3.5 text-center tracking-widest text-2xl font-mono text-inquest-ink uppercase focus:outline-none transition-colors"
            placeholder="000000"
            maxLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={verifyOTP.isPending}
          className="w-full py-3.5 rounded-full bg-inquest-accent text-white font-medium hover:bg-inquest-accent-soft transition terracotta-glow disabled:opacity-70 cursor-pointer"
        >
          {verifyOTP.isPending ? 'Verifying...' : 'Verify & Continue'}
        </button>
      </form>

      <div className="mt-8 text-center text-inquest-ink-soft text-sm">
        Didn't receive the code?{' '}
        <button
          onClick={handleResend}
          disabled={isResending}
          className="text-inquest-accent hover:underline font-medium bg-transparent border-none cursor-pointer"
        >
          {isResending ? 'Sending...' : 'Resend Code'}
        </button>
      </div>
    </motion.div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-inquest-base px-4 py-12">
      <Suspense fallback={
        <div className="min-h-screen bg-inquest-base flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-inquest-accent border-t-transparent animate-spin" />
        </div>
      }>
        <VerifyEmailForm />
      </Suspense>
    </div>
  );
}
