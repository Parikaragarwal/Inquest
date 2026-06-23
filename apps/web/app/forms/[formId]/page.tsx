'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { trpc } from '~/trpc/client';
import { motion } from 'framer-motion';
import { useGetuser } from '~/hooks/api/auth';
import { toast } from 'sonner';
import { Lock, CheckCircle2, AlertCircle, Star } from 'lucide-react';
import Link from 'next/link';

// Common dial codes for phone fields
const COUNTRY_CODES = [
  { label: 'None', value: '' },
  { label: '+1 (US/CA)', value: '+1' },
  { label: '+44 (UK)', value: '+44' },
  { label: '+91 (India)', value: '+91' },
  { label: '+61 (AU)', value: '+61' },
  { label: '+49 (DE)', value: '+49' },
  { label: '+33 (FR)', value: '+33' },
  { label: '+81 (JP)', value: '+81' },
  { label: '+86 (CN)', value: '+86' },
  { label: '+55 (BR)', value: '+55' },
  { label: '+7 (RU)', value: '+7' },
  { label: '+34 (ES)', value: '+34' },
  { label: '+39 (IT)', value: '+39' },
  { label: '+82 (KR)', value: '+82' },
  { label: '+65 (SG)', value: '+65' },
  { label: '+971 (UAE)', value: '+971' },
  { label: '+966 (SA)', value: '+966' },
  { label: '+20 (EG)', value: '+20' },
  { label: '+27 (ZA)', value: '+27' },
  { label: '+52 (MX)', value: '+52' },
];

function FormSubmissionComponent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const formId = params?.formId as string;
  const secureCode = searchParams.get('code');

  const { user, isSignedIn, isLoading: isAuthLoading } = useGetuser();
  // answers[fieldId] = string (stringified as needed)
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // separate state for multi_select (arrays) and phone (country code)
  const [multiSelectAnswers, setMultiSelectAnswers] = useState<Record<string, string[]>>({});
  const [phoneCountryCodes, setPhoneCountryCodes] = useState<Record<string, string>>({});
  const [hoveredRating, setHoveredRating] = useState<Record<string, number>>({});
  const [codeInputValue, setCodeInputValue] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [isBotSuccess, setIsBotSuccess] = useState(false);

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
  const hasCustomBg = !!(themeObj.backgroundColor || themeObj.backgroundImageUrl);
  const containerStyle: React.CSSProperties = {};

  if (themeObj.backgroundColor) {
    containerStyle.backgroundColor = themeObj.backgroundColor;
  }
  if (themeObj.backgroundImageUrl) {
    containerStyle.backgroundImage = `url(${themeObj.backgroundImageUrl})`;
    containerStyle.backgroundSize = 'cover';
    containerStyle.backgroundPosition = 'center';
    containerStyle.backgroundAttachment = 'fixed';
  }

  useEffect(() => {
    if (themeObj.mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (themeObj.mode === 'light') {
      document.documentElement.classList.remove('dark');
    }
  }, [themeObj.mode]);

  // Pre-fill answers for logged-in users
  useEffect(() => {
    if (form && user && isSignedIn) {
      setAnswers((prev) => {
        const next = { ...prev };
        let hasChanges = false;
        
        (form.fields as any[]).forEach((field) => {
          const fid = field.id as string;
          if (!next[fid]) { // Only prefill if currently empty
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

  // Show toast if the secure code was invalid
  useEffect(() => {
    if (formError?.message?.toLowerCase().includes('secure code') && secureCode) {
      toast.error('Invalid secure code. Please try again.');
    }
  }, [formError, secureCode]);

  const isMissingCodeError = formError?.message?.toLowerCase().includes('secure code');

  if (isAuthLoading || isFormLoading || isCheckLoading) {
    return (
      <div className="min-h-screen bg-inquest-base flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-inquest-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  // 1. Secure Code Gate
  if (isMissingCodeError) {
    return (
      <div className="min-h-screen bg-inquest-base flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-inquest-surface rounded-3xl p-8 text-center warm-shadow border border-inquest-rule/50"
        >
          <div className="mx-auto w-12 h-12 bg-inquest-depth rounded-full flex items-center justify-center mb-6">
            <Lock className="text-inquest-ink" size={24} />
          </div>
          <h2 className="text-2xl font-serif text-inquest-ink mb-2">Private Enquiry</h2>
          <p className="text-inquest-ink-mid mb-8">This form requires a secure code for access.</p>

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
            <button type="submit" disabled={!codeInputValue} className="w-full py-3 rounded-full bg-inquest-accent text-white font-medium hover:bg-inquest-accent-soft transition-colors disabled:opacity-50 terracotta-glow">
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
      <div className="min-h-screen bg-inquest-base flex items-center justify-center px-4">
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
      <div className="min-h-screen bg-inquest-base flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-inquest-surface rounded-3xl p-8 text-center warm-shadow border border-inquest-rule/50"
        >
          <h2 className="text-2xl font-serif text-inquest-ink mb-3">Session Required</h2>
          <p className="text-inquest-ink-mid mb-8 leading-relaxed">
            You must be logged in to thoughtfully respond to &ldquo;{form?.title}&rdquo;. We verify identities to maintain a high-quality space for dialogue.
          </p>
          <div className="space-y-3">
            <button onClick={() => router.push(`/login?redirect=/forms/${formId}${secureCode ? `?code=${secureCode}` : ''}`)}
              className="w-full py-3 rounded-full bg-inquest-accent text-white font-medium hover:bg-inquest-accent-soft transition-colors terracotta-glow">
              Sign In
            </button>
            <button onClick={() => router.push(`/sign-up?redirect=/forms/${formId}${secureCode ? `?code=${secureCode}` : ''}`)}
              className="w-full py-3 rounded-full bg-transparent border border-inquest-rule text-inquest-ink font-medium hover:bg-inquest-depth/30 transition-colors">
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
      <div className="min-h-screen bg-inquest-base flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg bg-inquest-surface rounded-3xl p-10 text-center warm-shadow"
        >
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
            className="w-16 h-16 bg-inquest-sage/20 rounded-full flex items-center justify-center mx-auto mb-6 text-inquest-sage"
          >
            <CheckCircle2 size={32} />
          </motion.div>
          <h2 className="text-3xl font-serif text-inquest-ink mb-4">Response Submitted</h2>
          <p className="text-inquest-ink-mid text-lg leading-relaxed mb-8">
            Thank you for taking the time to share your perspective. Your insight has been safely recorded.
          </p>
          <Link href="/dashboard" className="inline-block px-8 py-3 rounded-full bg-inquest-ink text-white font-medium hover:bg-inquest-ink-mid transition-colors">
            Return to Dashboard
          </Link>
        </motion.div>
      </div>
    );
  }

  // Build submit payload
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (honeypot) {
      // It's a bot. Silently drop the submission and show success UI.
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
        // Backend expects JSON-stringified array
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

      // Detailed frontend validation
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

  const toggleMultiSelect = (fieldId: string, opt: string) => {
    setMultiSelectAnswers((prev) => {
      const current = prev[fieldId] || [];
      const next = current.includes(opt)
        ? current.filter((v) => v !== opt)
        : [...current, opt];
      return { ...prev, [fieldId]: next };
    });
  };

  return (
    <div style={containerStyle} className={`min-h-screen py-12 px-4 sm:px-6 transition-all duration-300 ${!hasCustomBg ? 'bg-inquest-base' : ''}`}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-serif text-inquest-ink mb-4 tracking-tight">{form?.title}</h1>
          {form?.description && (
            <p className="text-lg text-inquest-ink-mid max-w-xl mx-auto">{form.description}</p>
          )}
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {(form?.fields as any[] | undefined)?.map((field: any, index: number) => (
            <motion.div
              key={field.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              className="bg-inquest-surface p-6 sm:p-8 rounded-3xl warm-shadow border border-inquest-rule/50"
            >
              <label className="block mb-5">
                <span className="text-xl font-serif text-inquest-ink block mb-1">
                  {field.label}
                  {field.required && <span className="text-inquest-accent ml-2">*</span>}
                </span>
                {field.placeholder && <span className="text-sm text-inquest-ink-soft">{field.placeholder}</span>}
              </label>

              {/* SHORT TEXT */}
              {field.type === 'text' && (
                <div>
                  <input
                    type="text"
                    required={field.required}
                    value={answers[field.id] || ''}
                    onChange={(e) => setAnswer(field.id, e.target.value)}
                    minLength={field.validation?.minLength}
                    maxLength={field.validation?.maxLength}
                    pattern={field.validation?.pattern}
                    className="w-full bg-inquest-base border border-inquest-rule focus:border-inquest-accent focus:ring-2 focus:ring-inquest-accent/20 rounded-xl px-4 py-3 text-lg text-inquest-ink transition"
                  />
                  <ValidationHints validation={field.validation} type="text" />
                </div>
              )}

              {/* LONG TEXT */}
              {field.type === 'textarea' && (
                <div>
                  <textarea
                    required={field.required}
                    value={answers[field.id] || ''}
                    onChange={(e) => setAnswer(field.id, e.target.value)}
                    minLength={field.validation?.minLength}
                    maxLength={field.validation?.maxLength}
                    className="w-full bg-inquest-base border border-inquest-rule focus:border-inquest-accent focus:ring-2 focus:ring-inquest-accent/20 rounded-2xl px-4 py-4 min-h-[120px] resize-none text-lg text-inquest-ink transition"
                  />
                  <ValidationHints validation={field.validation} type="text" />
                </div>
              )}

              {/* NUMBER */}
              {field.type === 'number' && (
                <div>
                  <input
                    type="number"
                    required={field.required}
                    value={answers[field.id] || ''}
                    onChange={(e) => setAnswer(field.id, e.target.value)}
                    min={field.validation?.min}
                    max={field.validation?.max}
                    className="w-full bg-inquest-base border border-inquest-rule focus:border-inquest-accent focus:ring-2 focus:ring-inquest-accent/20 rounded-xl px-4 py-3 text-lg text-inquest-ink transition"
                  />
                  <ValidationHints validation={field.validation} type="number" />
                </div>
              )}

              {/* EMAIL */}
              {field.type === 'email' && (
                <input
                  type="email"
                  required={field.required}
                  value={answers[field.id] || ''}
                  onChange={(e) => setAnswer(field.id, e.target.value)}
                  className="w-full bg-inquest-base border border-inquest-rule focus:border-inquest-accent focus:ring-2 focus:ring-inquest-accent/20 rounded-xl px-4 py-3 text-lg text-inquest-ink transition"
                />
              )}

              {/* PHONE — country code prefix selector */}
              {field.type === 'phone' && (
                <div>
                  <div className="flex gap-2">
                    <select
                      value={phoneCountryCodes[field.id] || field.validation?.countryCode || ''}
                      onChange={(e) => setPhoneCountryCodes((p) => ({ ...p, [field.id]: e.target.value }))}
                      className="bg-inquest-base border border-inquest-rule rounded-xl px-3 py-3 text-inquest-ink text-sm shrink-0"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      required={field.required}
                      value={answers[field.id] || ''}
                      onChange={(e) => setAnswer(field.id, e.target.value)}
                      placeholder="Phone number"
                      className="flex-1 bg-inquest-base border border-inquest-rule focus:border-inquest-accent focus:ring-2 focus:ring-inquest-accent/20 rounded-xl px-4 py-3 text-lg text-inquest-ink transition"
                    />
                  </div>
                  <ValidationHints validation={field.validation} type="phone" />
                </div>
              )}

              {/* DATE */}
              {field.type === 'date' && (
                <div>
                  <input
                    type="date"
                    required={field.required}
                    value={answers[field.id] || ''}
                    onChange={(e) => setAnswer(field.id, e.target.value)}
                    min={field.validation?.minDate}
                    max={field.validation?.maxDate}
                    className="w-full bg-inquest-base border border-inquest-rule focus:border-inquest-accent focus:ring-2 focus:ring-inquest-accent/20 rounded-xl px-4 py-3 text-lg text-inquest-ink transition"
                  />
                </div>
              )}

              {/* BOOLEAN */}
              {field.type === 'boolean' && (
                <div className="grid grid-cols-2 gap-4">
                  {['true', 'false'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAnswer(field.id, val)}
                      className={`py-4 rounded-2xl text-lg font-medium transition-all ${
                        answers[field.id] === val
                          ? val === 'true'
                            ? 'bg-inquest-accent text-white terracotta-glow border-transparent'
                            : 'bg-inquest-ink text-white shadow-lg border-transparent'
                          : 'bg-inquest-base border border-inquest-rule text-inquest-ink hover:border-inquest-accent'
                      }`}
                    >
                      {val === 'true' ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              )}

              {/* RATING */}
              {field.type === 'rating' && (
                <div>
                  <div className="flex items-center gap-1.5 mt-2">
                    {Array.from({ length: field.validation?.max ?? 5 }).map((_, i) => {
                      const starValue = i + 1;
                      const currentAnswer = Number(answers[field.id] || '0');
                      const isActive = starValue <= (hoveredRating[field.id] ?? currentAnswer);
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setAnswer(field.id, starValue.toString())}
                          onMouseEnter={() => setHoveredRating((prev) => ({ ...prev, [field.id]: starValue }))}
                          onMouseLeave={() => setHoveredRating((prev) => {
                            const copy = { ...prev };
                            delete copy[field.id];
                            return copy;
                          })}
                          className="p-1 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                        >
                          <Star
                            size={36}
                            className={`transition-all duration-150 ${
                              isActive
                                ? 'fill-amber-400 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] scale-105'
                                : 'text-inquest-ink-ghost hover:text-inquest-ink-soft'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="hidden"
                    required={field.required}
                    value={answers[field.id] || ''}
                  />
                </div>
              )}

              {/* SINGLE SELECT */}
              {field.type === 'single_select' && (
                <div className="space-y-3">
                  {field.validation?.options?.map((opt: string) => (
                    <label key={opt} className={`flex items-center p-4 rounded-2xl border cursor-pointer transition-colors ${
                      answers[field.id] === opt
                        ? 'bg-inquest-accent-pale border-inquest-accent'
                        : 'bg-inquest-base border-inquest-rule hover:border-inquest-accent'
                    }`}>
                      <input
                        type="radio"
                        name={field.id}
                        value={opt}
                        checked={answers[field.id] === opt}
                        onChange={(e) => setAnswer(field.id, e.target.value)}
                        className="w-5 h-5 text-inquest-accent focus:ring-inquest-accent border-inquest-rule bg-inquest-base"
                      />
                      <span className="ml-3 text-lg text-inquest-ink">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* MULTI SELECT — stored as JSON array, not comma string */}
              {field.type === 'multi_select' && (
                <div className="space-y-3">
                  {field.validation?.options?.map((opt: string) => {
                    const selected = multiSelectAnswers[field.id] || [];
                    const isChecked = selected.includes(opt);
                    const maxSel = field.validation?.maxSelections;
                    const isDisabled = !isChecked && maxSel !== undefined && selected.length >= maxSel;
                    return (
                      <label key={opt} className={`flex items-center p-4 rounded-2xl border cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-inquest-accent-pale border-inquest-accent'
                          : isDisabled
                            ? 'bg-inquest-base border-inquest-rule opacity-50 cursor-not-allowed'
                            : 'bg-inquest-base border-inquest-rule hover:border-inquest-accent'
                      }`}>
                        <input
                          type="checkbox"
                          value={opt}
                          checked={isChecked}
                          disabled={isDisabled}
                          onChange={() => toggleMultiSelect(field.id, opt)}
                          className="w-5 h-5 rounded text-inquest-accent focus:ring-inquest-accent border-inquest-rule bg-inquest-base"
                        />
                        <span className="ml-3 text-lg text-inquest-ink">{opt}</span>
                      </label>
                    );
                  })}
                  {field.validation?.maxSelections && (
                    <p className="text-xs text-inquest-ink-soft mt-2">
                      Select up to {field.validation.maxSelections} options
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          ))}

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

          <div className="pt-6 pb-20">
            <button
              type="submit"
              disabled={submitForm.isPending}
              className="w-full py-4 rounded-full bg-inquest-accent text-white text-xl font-medium hover:bg-inquest-accent-soft transition-colors terracotta-glow disabled:opacity-50"
            >
              {submitForm.isPending ? 'Submitting...' : 'Submit Response'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function PublicFormSubmissionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-inquest-base flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-inquest-accent border-t-transparent animate-spin" />
      </div>
    }>
      <FormSubmissionComponent />
    </Suspense>
  );
}

// ─── Inline validation hints component ───────────────────────

function ValidationHints({ validation, type }: { validation: any; type: string }) {
  if (!validation) return null;
  const hints: string[] = [];
  if (type === 'text' || type === 'phone') {
    if (validation.minLength != null) hints.push(`Min ${validation.minLength} chars`);
    if (validation.maxLength != null) hints.push(`Max ${validation.maxLength} chars`);
    if (validation.pattern) hints.push(`Pattern: ${validation.pattern}`);
  }
  if (type === 'number') {
    if (validation.min != null) hints.push(`Min: ${validation.min}`);
    if (validation.max != null) hints.push(`Max: ${validation.max}`);
  }
  if (hints.length === 0) return null;
  return (
    <p className="mt-1.5 text-xs text-inquest-ink-ghost">{hints.join(' · ')}</p>
  );
}
