'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Shield, ArrowLeft, Sun, Moon, Lock, Eye, Server, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PrivacyPolicyPage() {
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
      icon: Eye,
      title: "1. Information We Collect",
      content: [
        "Account Details: When you register, we collect your email address, full name, and hashed passwords.",
        "Form & Survey Content: We store the custom forms, questions, fields, and styling options created by authors.",
        "Response Submissions: Responses submitted to forms are saved securely for the form owner to analyze.",
        "Technical & Device Logs: IP addresses and user agents are processed for rate-limiting, security validation, and preventing spam submissions."
      ]
    },
    {
      icon: Server,
      title: "2. How We Use Your Information",
      content: [
        "Core Service Operation: To render interactive forms, validate submissions, and present real-time analytics.",
        "Security & Abuse Prevention: Using IP-based rate limiting to protect your forms from automated spam.",
        "Communications: To send account verification codes, transactional notifications, and system updates via Resend."
      ]
    },
    {
      icon: Lock,
      title: "3. Data Protection & Storage",
      content: [
        "Encryption: Passwords are salted and hashed using industry-standard cryptography. Sessions are verified with secure JWT tokens.",
        "Third-Party Services: We do not sell your personal data to advertisers. We only integrate with trusted infrastructure providers (such as Resend for email delivery and Google for authentication)."
      ]
    },
    {
      icon: UserCheck,
      title: "4. Your Data Rights",
      content: [
        "Form Access & Deletion: You own your forms and response data. You can export or delete your forms at any time from your dashboard.",
        "Account Rights: You may request account deletion or data exports by reaching out to our support team."
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
          <Shield size={14} />
          Your Privacy Matters
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-5xl font-serif font-extrabold tracking-tight text-inquest-ink mb-3"
        >
          Privacy Policy
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-inquest-ink-mid max-w-lg mx-auto"
        >
          Effective Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </motion.p>
      </header>

      {/* Main Content Card */}
      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-6 pb-20">
        <div className="rounded-2xl bg-inquest-surface/80 border border-inquest-rule/40 p-6 sm:p-10 shadow-sm backdrop-blur-sm space-y-10">
          <p className="text-sm sm:text-base leading-relaxed text-inquest-ink-mid border-b border-inquest-rule/30 pb-6">
            At <strong className="text-inquest-ink">Inquest</strong>, we believe data collection should be intentional, respectful, and transparent. This Privacy Policy details how we handle information collected through our web applications and enquiry services.
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
            Questions regarding this Privacy Policy? Contact us at{' '}
            <a href="mailto:privacy@inquest.parikar.in" className="text-inquest-accent hover:underline font-medium">
              privacy@inquest.parikar.in
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 text-center border-t border-inquest-rule/20">
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-inquest-ink-mid mb-3">
          <Link href="/" className="hover:text-inquest-ink transition">Home</Link>
          <Link href="/privacy" className="text-inquest-accent font-medium hover:underline">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-inquest-ink transition">Terms of Service</Link>
        </div>
        <p className="text-xs text-inquest-ink-ghost">
          © {new Date().getFullYear()} Inquest — Thoughtful enquiries, meaningful insights.
        </p>
      </footer>
    </div>
  );
}
