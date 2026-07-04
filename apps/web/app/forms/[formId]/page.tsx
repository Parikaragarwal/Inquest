'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { trpc } from '~/trpc/client';
import { motion } from 'framer-motion';
import { useGetuser } from '~/hooks/api/auth';
import { toast } from 'sonner';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { FormPreview } from '~/components/form-preview';

function FormSubmissionComponent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const formId = params?.formId as string;
  const secureCode = searchParams.get('code');

  const { user, isSignedIn, isLoading: isAuthLoading } = useGetuser();
  
  // answers[fieldId] = string
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [multiSelectAnswers, setMultiSelectAnswers] = useState<Record<string, string[]>>({});
  const [phoneCountryCodes, setPhoneCountryCodes] = useState<Record<string, string>>({});
  const [codeInputValue, setCodeInputValue] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [isBotSuccess, setIsBotSuccess] = useState(false);
  const [visitorMode, setVisitorMode] = useState<'light' | 'dark'>('light');

  const { data: form, isLoading: isFormLoading, error: formError } = trpc.form.getFormForSubmission.useQuery(
    { formId, secureCode: secureCode || undefined },
    { retry: false, refetchOnWindowFocus: false }
  );

  const utils = trpc.useUtils();

  const { data: checkSubmission, isLoading: isCheckLoading } = trpc.submission.checkUserSubmission.useQuery(
    { formId },
    { enabled: !!user?.id && !!formId }
  );

  const submitForm = trpc.submission.submitForm.useMutation({
    onSuccess: () => {
      utils.submission.checkUserSubmission.invalidate({ formId });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to submit response');
    }
  });

  const themeObj = (form?.theme as Record<string, any>) || {};

  // Setup visitor theme mode with unmount restore
  useEffect(() => {
    if (typeof window !== 'undefined' && form) {
      let mode: 'light' | 'dark' = 'light';
      
      const themeVal = form.theme as Record<string, any> | undefined;
      if (themeVal?.mode) {
        mode = themeVal.mode;
      } else if (themeVal?.lightMode || themeVal?.darkMode) {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        mode = systemPrefersDark ? 'dark' : 'light';
      }
      
      setVisitorMode(mode);

      // Cache current layout theme classes
      const initialIsDark = document.documentElement.classList.contains('dark');
      
      if (mode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      return () => {
        // Restore initial theme class on unmount
        if (initialIsDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      };
    }
  }, [form]);

  // Pre-fill answers for logged-in users
  useEffect(() => {
    if (form && user && isSignedIn) {
      setAnswers((prev) => {
        const next = { ...prev };
        let hasChanges = false;
        
        (form.fields as any[]).forEach((field) => {
          const fid = field.id as string;
          if (!next[fid]) { 
            if (field.type === 'email' && user.email) {
              next[fid] = user.email;
              hasChanges = true;
            } else if (field.type === 'text' && field.label.toLowerCase().includes('name') && user.fullName) {
              next[fid] = user.fullName;
              hasChanges = true;
            }
          }
        });
        
        return hasChanges ? next : prev;
      });
    }
  }, [form, user, isSignedIn]);

  // Show error on invalid secure code
  useEffect(() => {
    if (formError?.message?.toLowerCase().includes('secure code') && secureCode) {
      toast.error('Invalid secure code. Please try again.');
    }
  }, [formError, secureCode]);

  const isMissingCodeError = formError?.message?.toLowerCase().includes('secure code');

  if (isAuthLoading || isFormLoading || isCheckLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-inquest-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  // 1. Secure Code Gate
  if (isMissingCodeError) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-inquest-surface rounded-[2rem] p-8 text-center warm-shadow border border-inquest-rule/60 page-lines"
          style={{ '--line-height': '2rem' } as React.CSSProperties}
        >
          <div className="mx-auto w-12 h-12 bg-inquest-depth rounded-full flex items-center justify-center mb-6 border border-inquest-rule">
            <Lock className="text-inquest-ink" size={20} />
          </div>
          <h2 className="text-2xl font-serif text-inquest-ink mb-2 font-bold">Private Enquiry</h2>
          <p className="text-inquest-ink-mid text-sm mb-8">This form requires a secure code for access.</p>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (codeInputValue) router.replace(`/forms/${formId}?code=${codeInputValue}`);
          }}>
            <input
              type="text"
              value={codeInputValue}
              onChange={(e) => setCodeInputValue(e.target.value.toUpperCase())}
              placeholder="Enter 6-character code"
              className="w-full bg-inquest-base border border-inquest-rule focus:border-inquest-accent rounded-xl px-4 py-3 text-center tracking-widest text-lg font-mono text-inquest-ink uppercase mb-4 focus:ring-1 focus:ring-inquest-accent transition-colors"
              maxLength={6}
            />
            <button type="submit" disabled={!codeInputValue} className="w-full py-3 rounded-full bg-inquest-accent text-white font-bold hover:bg-inquest-accent-soft transition-colors disabled:opacity-50 terracotta-glow text-sm cursor-pointer shadow-sm">
              Unlock Enquiry
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Generic Error
  if (formError) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="mx-auto text-inquest-caution mb-4" size={32} />
          <h2 className="text-2xl font-serif text-inquest-ink mb-2">Unavailable</h2>
          <p className="text-inquest-ink-mid">{formError.message}</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Gate
  if (form?.requiresAuth && !isSignedIn) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-inquest-surface rounded-[2rem] p-8 text-center warm-shadow border border-inquest-rule/60 page-lines"
          style={{ '--line-height': '2rem' } as React.CSSProperties}
        >
          <h2 className="text-2xl font-serif text-inquest-ink mb-3 font-bold">Session Required</h2>
          <p className="text-inquest-ink-mid text-sm mb-8 leading-relaxed">
            You must be logged in to thoughtfully respond to &ldquo;{form?.title}&rdquo;. We verify identities to maintain a high-quality space for dialogue.
          </p>
          <div className="space-y-3">
            <button onClick={() => router.push(`/login?redirect=/forms/${formId}${secureCode ? `?code=${secureCode}` : ''}`)}
              className="w-full py-3 rounded-full bg-inquest-accent text-white font-bold hover:bg-inquest-accent-soft transition-colors terracotta-glow text-sm cursor-pointer shadow-sm">
              Sign In
            </button>
            <button onClick={() => router.push(`/sign-up?redirect=/forms/${formId}${secureCode ? `?code=${secureCode}` : ''}`)}
              className="w-full py-3 rounded-full bg-transparent border border-inquest-rule text-inquest-ink font-bold hover:bg-inquest-depth/30 transition-colors text-sm cursor-pointer">
              Create Account
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // 3. Already Submitted or Bot Success
  if (checkSubmission?.hasSubmitted || submitForm.isSuccess || isBotSuccess) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg bg-inquest-surface rounded-[2.5rem] p-10 text-center warm-shadow border border-inquest-rule/50 page-lines"
          style={{ '--line-height': '2rem' } as React.CSSProperties}
        >
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
            className="w-16 h-16 bg-inquest-sage/20 rounded-full flex items-center justify-center mx-auto mb-6 text-inquest-sage border border-inquest-rule"
          >
            <CheckCircle2 size={32} />
          </motion.div>
          <h2 className="text-3xl font-serif text-inquest-ink mb-4 font-bold">Response Submitted</h2>
          <p className="text-inquest-ink-mid text-lg leading-relaxed mb-8">
            Thank you for taking the time to share your perspective. Your insight has been safely recorded.
          </p>
          <Link href="/dashboard" className="inline-block px-8 py-3 rounded-full bg-inquest-ink text-white font-bold hover:bg-inquest-ink-mid transition-colors text-sm cursor-pointer">
            Return to Dashboard
          </Link>
        </motion.div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (honeypot) {
      setIsBotSuccess(true);
      return;
    }

    const payload: { formFieldId: string; answer: string }[] = [];

    for (const field of form!.fields as any[]) {
      const fid = field.id as string;
      let answer: string;

      if (field.type === 'multi_select') {
        const selected = multiSelectAnswers[fid] || [];
        if (field.required && selected.length === 0) {
          toast.error(`Please answer: ${field.label}`);
          return;
        }
        answer = JSON.stringify(selected);
      } else if (field.type === 'phone') {
        const digits = answers[fid] || '';
        if (field.required && !digits) {
          toast.error(`Please answer: ${field.label}`);
          return;
        }
        const countryCode = phoneCountryCodes[fid] || field.validation?.countryCode || '';
        answer = countryCode ? `${countryCode}|${digits}` : digits;
      } else {
        answer = answers[fid] || '';
        if (field.required && !answer) {
          toast.error(`Please answer: ${field.label}`);
          return;
        }
      }

      // Detailed validation
      if (answer && field.validation) {
        if (field.type === 'text' || field.type === 'textarea' || field.type === 'phone') {
          const checkVal = field.type === 'phone' ? (answers[fid] || '') : answer;
          if (field.validation.minLength !== undefined && checkVal.length < field.validation.minLength) {
            toast.error(`${field.label}: Must be at least ${field.validation.minLength} characters`);
            return;
          }
          if (field.validation.maxLength !== undefined && checkVal.length > field.validation.maxLength) {
            toast.error(`${field.label}: Must be at most ${field.validation.maxLength} characters`);
            return;
          }
          if (field.validation.pattern) {
            try {
              if (!new RegExp(field.validation.pattern).test(answer)) {
                toast.error(`${field.label}: Does not match required format`);
                return;
              }
            } catch(e) {}
          }
        }
        if (field.type === 'number') {
          const num = Number(answer);
          if (field.validation.min !== undefined && num < field.validation.min) {
            toast.error(`${field.label}: Minimum value is ${field.validation.min}`);
            return;
          }
          if (field.validation.max !== undefined && num > field.validation.max) {
            toast.error(`${field.label}: Maximum value is ${field.validation.max}`);
            return;
          }
        }
        if (field.type === 'rating') {
          const num = Number(answer);
          const minVal = field.validation.min ?? 1;
          const maxVal = field.validation.max ?? 5;
          if (isNaN(num) || num < minVal || num > maxVal) {
            toast.error(`${field.label}: Rating must be between ${minVal} and ${maxVal}`);
            return;
          }
        }
        if (field.type === 'date') {
          const d = new Date(answer);
          if (field.validation.minDate && d < new Date(field.validation.minDate)) {
            toast.error(`${field.label}: Date cannot be before ${field.validation.minDate}`);
            return;
          }
          if (field.validation.maxDate && d > new Date(field.validation.maxDate)) {
            toast.error(`${field.label}: Date cannot be after ${field.validation.maxDate}`);
            return;
          }
        }
      }

      payload.push({ formFieldId: fid, answer });
    }

    submitForm.mutate({ formId, secureCode: secureCode || undefined, answers: payload });
  };

  const setAnswer = (fieldId: string, value: string) =>
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));

  const toggleVisitorMode = () => {
    setVisitorMode((m) => (m === 'light' ? 'dark' : 'light'));
  };

  if (!form) return null;

  return (
    <>
      <FormPreview
        fields={form.fields as any}
        title={form.title}
        description={form.description || ''}
        theme={themeObj}
        mode={visitorMode}
        interactive={true}
        onModeToggle={toggleVisitorMode}
        answers={answers}
        onAnswerChange={setAnswer}
        multiSelectAnswers={multiSelectAnswers}
        onMultiSelectChange={(fid, val) => setMultiSelectAnswers((p) => ({ ...p, [fid]: val }))}
        phoneCountryCodes={phoneCountryCodes}
        onPhoneCountryCodeChange={(fid, code) => setPhoneCountryCodes((p) => ({ ...p, [fid]: code }))}
        onSubmit={handleSubmit}
        submitButtonText="Submit Response"
        isSubmitting={submitForm.isPending}
      />

      {/* HONEYPOT FIELD (Anti-Spam) */}
      <div style={{ opacity: 0, position: 'absolute', top: 0, left: 0, height: 0, width: 0, zIndex: -1 }} aria-hidden="true">
        <label htmlFor="website_url_honey">Please leave this field blank</label>
        <input
          type="text"
          id="website_url_honey"
          name="website_url_honey"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>
    </>
  );
}

export default function PublicFormSubmissionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-inquest-accent border-t-transparent animate-spin" />
      </div>
    }>
      <FormSubmissionComponent />
    </Suspense>
  );
}
