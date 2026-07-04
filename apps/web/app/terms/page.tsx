'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Scale, ArrowLeft, Sun, Moon, CheckCircle2, AlertTriangle, FileText, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TermsOfServicePage() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDarkMode(document.documentElement.classList.contains('dark'));
    }
  }, []);

  const toggleDarkMode = () => {
    if (typeof window !== 'undefined' && typeof (window as any).__toggleTheme === 'function') {
      (window as any).__toggleTheme();
    }
    setDarkMode(!darkMode);
  };

  const sections = [
    {
      icon: CheckCircle2,
      title: "1. Acceptance of Terms",
      content: [
        "By accessing or using Inquest, you agree to be bound by these Terms of Service.",
        "If you do not agree to these terms, please do not use or access our enquiry platform."
      ]
    },
    {
      icon: FileText,
      title: "2. Account & Registration",
      content: [
        "Account Security: You are responsible for safeguarding your login credentials and for all activity occurring under your account.",
        "Accurate Information: You agree to provide accurate and complete registration information during signup."
      ]
    },
    {
      icon: ShieldAlert,
      title: "3. Acceptable Use & Content Guidelines",
      content: [
        "Prohibited Form Content: You may not use Inquest to host phishing scams, malicious software, hate speech, or content violating privacy rights.",
        "Automated Submissions: Spamming, abuse of form submission endpoints, or attempting to bypass rate limiters is strictly prohibited.",
        "Content Ownership: You retain ownership of all form content and responses you create or collect using Inquest."
      ]
    },
    {
      icon: AlertTriangle,
      title: "4. Availability & Disclaimers",
      content: [
        "As-Is Basis: Inquest is provided 'as is' without warranties of any kind, whether express or implied.",
        "Service Updates: We continuously improve our platform and reserve the right to modify or discontinue features with reasonable notice."
      ]
    }
  ];

  return (
    <div className="relative min-h-screen flex flex-col text-inquest-ink">
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5 max-w-5xl w-full mx-auto">
        <Link href="/" className="flex items-center gap-2 text-xl font-serif tracking-tight text-inquest-ink font-semibold">
          <BookOpen size={22} className="text-inquest-accent" />
          Inquest
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-inquest-surface/70 hover:bg-inquest-depth/50 text-inquest-ink-soft hover:text-inquest-ink transition-colors border border-inquest-rule/40 cursor-pointer"
            title="Toggle theme"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium text-inquest-ink-mid hover:text-inquest-ink bg-inquest-surface/70 border border-inquest-rule/40 transition"
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="relative z-10 max-w-4xl mx-auto w-full px-6 pt-10 pb-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-inquest-accent/10 border border-inquest-accent/20 text-xs text-inquest-accent font-medium mb-4"
        >
          <Scale size={14} />
          Terms & Conditions
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-5xl font-serif font-extrabold tracking-tight text-inquest-ink mb-3"
        >
          Terms of Service
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-inquest-ink-mid max-w-lg mx-auto"
        >
          Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </motion.p>
      </header>

      {/* Main Content Card */}
      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-6 pb-20">
        <div className="rounded-2xl bg-inquest-surface/80 border border-inquest-rule/40 p-6 sm:p-10 shadow-sm backdrop-blur-sm space-y-10">
          <p className="text-sm sm:text-base leading-relaxed text-inquest-ink-mid border-b border-inquest-rule/30 pb-6">
            Welcome to <strong className="text-inquest-ink">Inquest</strong>. By accessing our services, creating forms, or submitting responses, you agree to comply with the terms and conditions outlined below.
          </p>

          <div className="space-y-8">
            {sections.map((sec, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-inquest-accent/10 border border-inquest-accent/20 flex items-center justify-center text-inquest-accent">
                    <sec.icon size={18} />
                  </div>
                  <h2 className="text-lg font-serif font-bold text-inquest-ink">
                    {sec.title}
                  </h2>
                </div>
                <ul className="pl-10 space-y-2 list-disc text-sm text-inquest-ink-mid leading-relaxed marker:text-inquest-accent">
                  {sec.content.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <div className="pt-6 border-t border-inquest-rule/30 text-xs text-inquest-ink-soft text-center">
            For questions regarding these Terms of Service, contact{' '}
            <a href="mailto:terms@inquest.parikar.in" className="text-inquest-accent hover:underline font-medium">
              terms@inquest.parikar.in
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 text-center border-t border-inquest-rule/20">
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-inquest-ink-mid mb-3">
          <Link href="/" className="hover:text-inquest-ink transition">Home</Link>
          <Link href="/privacy" className="hover:text-inquest-ink transition">Privacy Policy</Link>
          <Link href="/terms" className="text-inquest-accent font-medium hover:underline">Terms of Service</Link>
        </div>
        <p className="text-xs text-inquest-ink-ghost">
          © {new Date().getFullYear()} Inquest — Thoughtful enquiries, meaningful insights.
        </p>
      </footer>
    </div>
  );
}
