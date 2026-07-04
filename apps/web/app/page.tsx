'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useGetuser } from '~/hooks/api/auth';
import { ArrowRight, BarChart3, Lock, Palette, Sun, Moon, BookOpen, PenLine, Shield, Eye, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const router = useRouter();
  const { isSignedIn, isLoading } = useGetuser();
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

  return (
    <div className="relative min-h-screen flex flex-col text-inquest-ink">

      {/* ─── Floating pen in corner — subtle diary accent ─── */}
      <motion.div
        className="fixed top-8 left-4 sm:left-8 opacity-[0.06] dark:opacity-[0.04] pointer-events-none z-0"
        animate={{ rotate: [0, 3, -3, 0], y: [0, -4, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <PenLine size={80} className="text-inquest-accent" />
      </motion.div>

      {/* ─── Navigation ─── */}
      <nav className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5 max-w-7xl w-full mx-auto">
        <Link href="/" className="flex items-center gap-2 text-xl font-serif tracking-tight text-inquest-ink font-semibold">
          <BookOpen size={22} className="text-inquest-accent" />
          Inquest
        </Link>
        <div className="flex items-center gap-3 sm:gap-5">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-inquest-surface/70 hover:bg-inquest-depth/50 text-inquest-ink-soft hover:text-inquest-ink transition-colors border border-inquest-rule/40 cursor-pointer"
            title="Toggle theme"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {!isLoading && (
            <>
              {isSignedIn ? (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-5 py-2 rounded-full bg-inquest-accent text-white hover:bg-inquest-accent-soft transition font-medium terracotta-glow text-sm cursor-pointer"
                >
                  Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => router.push('/login')}
                    className="text-inquest-ink-mid hover:text-inquest-ink transition font-medium text-sm hidden sm:block cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => router.push('/sign-up')}
                    className="px-5 py-2 rounded-full bg-inquest-accent text-white hover:bg-inquest-accent-soft transition font-medium terracotta-glow text-sm cursor-pointer"
                  >
                    Get Started
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════
          HERO SECTION — "Open your diary"
          ═══════════════════════════════════════════════════════ */}
      <section className="relative z-10 flex-1 px-6 sm:px-10 max-w-7xl mx-auto w-full pt-8 sm:pt-16 pb-20 sm:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">

          {/* Left: Copy */}
          <div className="lg:col-span-7 space-y-7">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-inquest-surface/70 border border-inquest-rule/50 text-xs text-inquest-ink-mid font-medium">
                <PenLine size={12} className="text-inquest-accent" />
                Don&apos;t trust intuition. Collect data.
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-serif text-inquest-ink leading-[1.1] tracking-tight font-extrabold"
            >
              Your diary for
              <br />
              <span className="text-inquest-accent italic">meaningful</span>
              <br />
              enquiries.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="text-base sm:text-lg text-inquest-ink-mid max-w-lg leading-relaxed"
            >
              Craft beautiful, distraction-free forms on pages that feel like writing in your favorite notebook.
              Analyze every response with structured data — because insight comes from evidence, not guesswork.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="flex gap-4 flex-wrap"
            >
              <button
                onClick={() => router.push('/sign-up')}
                className="px-8 py-3.5 rounded-full bg-inquest-accent text-white text-base font-medium hover:bg-inquest-accent-soft transition terracotta-glow flex items-center gap-2 cursor-pointer"
              >
                Open Your Diary <ArrowRight size={18} />
              </button>
              <button
                onClick={() => router.push('/login')}
                className="px-8 py-3.5 rounded-full border border-inquest-rule text-inquest-ink font-medium hover:bg-inquest-depth/30 transition text-base cursor-pointer"
              >
                Sign In
              </button>
            </motion.div>
          </div>

          {/* Right: Diary page illustration */}
          <div className="lg:col-span-5 flex justify-center">
            <motion.div
              initial={{ opacity: 0, rotate: 3, y: 30 }}
              animate={{ opacity: 1, rotate: -1, y: 0 }}
              transition={{ type: 'spring', stiffness: 60, damping: 12, delay: 0.4 }}
              className="relative w-full max-w-[340px]"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="relative w-full h-full"
              >
                {/* Diary page */}
                <div
                  className="bg-inquest-surface/95 rounded-[1.5rem] border border-inquest-rule/50 p-7 sm:p-8 warm-shadow relative overflow-hidden"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, transparent 23px, rgba(200, 80, 80, 0.12) 23px, rgba(200, 80, 80, 0.12) 25px, transparent 25px),
                      repeating-linear-gradient(to bottom, transparent, transparent 27px, rgba(160,140,120,0.18) 27px, rgba(160,140,120,0.18) 28px)
                    `,
                  }}
                >
                  {/* Date header */}
                  <div className="flex items-center justify-between mb-5 pb-3 border-b border-inquest-rule/40">
                    <span className="text-[10px] text-inquest-ink-ghost font-mono uppercase tracking-wider">Today&apos;s Entry</span>
                    <span className="text-[10px] text-inquest-accent font-bold">Live Preview</span>
                  </div>

                  {/* Mini form preview */}
                  <div className="space-y-4 pl-5">
                    <div>
                      <h3 className="font-serif font-bold text-inquest-ink text-sm mb-1">Customer Feedback</h3>
                      <p className="text-[10px] text-inquest-ink-soft italic">How was your studio experience?</p>
                    </div>

                    {/* Rating stars */}
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <motion.span
                          key={s}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.8 + s * 0.1 }}
                          className="text-amber-500 text-sm"
                        >
                          ★
                        </motion.span>
                      ))}
                    </div>

                    {/* Text field */}
                    <div className="h-8 bg-inquest-base/50 rounded-lg border border-inquest-rule/40 flex items-center px-3">
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.5, 0.5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 1.5 }}
                        className="text-[10px] text-inquest-ink-ghost"
                      >
                        Type your answer...|
                      </motion.span>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end">
                      <div className="h-7 w-16 bg-inquest-accent rounded-full flex items-center justify-center">
                        <span className="text-white text-[9px] font-bold">Submit</span>
                      </div>
                    </div>
                  </div>

                  {/* Floating analytics card */}
                  <motion.div
                    initial={{ opacity: 0, x: 20, y: 10 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ delay: 1.2, type: 'spring', stiffness: 80 }}
                    className="absolute -right-4 -bottom-4 bg-inquest-surface border border-inquest-rule/60 rounded-2xl p-3 shadow-lg w-[140px]"
                  >
                    <span className="text-[8px] text-inquest-ink-ghost uppercase tracking-wider block mb-1.5">Analytics</span>
                    <div className="h-10 flex items-end gap-1">
                      {[30, 55, 45, 75, 60].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: 1.4 + i * 0.1, type: 'spring', stiffness: 60 }}
                          className="flex-1 bg-inquest-accent/70 rounded-t-sm"
                        />
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Shadow page underneath — depth effect */}
                <div className="absolute -bottom-2 left-3 right-3 h-full bg-inquest-depth/30 rounded-[1.5rem] -z-10" />
                <div className="absolute -bottom-4 left-6 right-6 h-full bg-inquest-depth/15 rounded-[1.5rem] -z-20" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          PHILOSOPHY STRIP
          ═══════════════════════════════════════════════════════ */}
      <section className="relative z-10 py-10 sm:py-14 px-6 border-y border-inquest-rule/20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.blockquote
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xl sm:text-2xl font-serif text-inquest-ink italic leading-relaxed"
          >
            &ldquo;We usually rely on intuition, but we shouldn&apos;t. Because at the end,
            it is structured data that is truly reliable.&rdquo;
          </motion.blockquote>
          <p className="text-inquest-ink-ghost text-xs uppercase tracking-[0.3em] mt-4">Inquest Data Philosophy</p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          HOW IT WORKS — 3-step diary flow
          ═══════════════════════════════════════════════════════ */}
      <section className="relative z-10 py-16 sm:py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h3
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-xs font-bold text-inquest-ink-soft uppercase tracking-[0.3em] mb-14"
          >
            The Diary Flow
          </motion.h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01', title: 'Write Your Questions', icon: PenLine,
                desc: 'Add fields with a smooth, spacious editor. Drag to reorder. No clutter, no friction — just writing.',
              },
              {
                step: '02', title: 'Design the Pages', icon: Palette,
                desc: 'Preview your form exactly as respondents see it. Choose warm parchment or moonlit dark themes. Add curated backgrounds.',
              },
              {
                step: '03', title: 'Analyze, Don\'t Guess', icon: BarChart3,
                desc: 'View chronological timelines, min/max/avg stats, and completion rates. Structured data replaces gut feeling.',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ delay: i * 0.12 }}
                className="bg-inquest-surface/70 backdrop-blur-sm p-8 rounded-[1.75rem] border border-inquest-rule/40 hover:border-inquest-accent/40 hover:-translate-y-1.5 hover:shadow-md transition-all duration-300 relative overflow-hidden"
              >
                {/* Faint lines inside */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-20"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 23px, rgba(160,140,120,0.15) 23px, rgba(160,140,120,0.15) 24px)',
                  }}
                />
                <div className="relative z-10">
                  <span className="text-4xl font-serif text-inquest-accent/15 font-bold block mb-3">{item.step}</span>
                  <div className="w-9 h-9 rounded-xl bg-inquest-accent/10 flex items-center justify-center mb-4">
                    <item.icon size={18} className="text-inquest-accent" />
                  </div>
                  <h4 className="text-lg font-serif text-inquest-ink font-bold mb-2">{item.title}</h4>
                  <p className="text-inquest-ink-mid text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          THEME SHOWCASE — Light & Dark diary pages
          ═══════════════════════════════════════════════════════ */}
      <section className="relative z-10 py-16 sm:py-24 px-6 border-t border-inquest-rule/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <span className="text-xs font-bold tracking-[0.2em] text-inquest-accent uppercase bg-inquest-accent/10 px-3 py-1 rounded-full">
                Real-Time Theme Editor
              </span>
              <h3 className="text-3xl sm:text-4xl font-serif font-extrabold text-inquest-ink leading-tight">
                Two modes. One diary.
              </h3>
              <p className="text-inquest-ink-mid leading-relaxed text-sm sm:text-base">
                Design separate light and dark themes for your respondents. See exactly
                how your form will appear — live — while you adjust colors, backgrounds, and
                accents. The notebook feeling persists in both.
              </p>
              <div className="flex gap-3 flex-wrap">
                <span className="text-xs font-bold text-inquest-ink-soft bg-inquest-surface/80 border border-inquest-rule/40 px-3 py-1.5 rounded-full">
                  ☀️ Warm Parchment
                </span>
                <span className="text-xs font-bold text-inquest-ink-soft bg-inquest-surface/80 border border-inquest-rule/40 px-3 py-1.5 rounded-full">
                  🌙 Moonlit Studio
                </span>
                <span className="text-xs font-bold text-inquest-ink-soft bg-inquest-surface/80 border border-inquest-rule/40 px-3 py-1.5 rounded-full">
                  🖼️ Curated Backdrops
                </span>
              </div>
            </div>

            {/* Theme card stack */}
            <div className="relative h-[340px] flex items-center justify-center">
              {/* Light card */}
              <motion.div
                initial={{ rotate: -8, x: -30, opacity: 0 }}
                whileInView={{ rotate: -4, x: -20, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                className="absolute z-20 w-[260px] sm:w-[280px]"
              >
                <div
                  className="bg-[#F5EFEB] text-[#3A2312] p-6 rounded-[1.5rem] border border-[#DFD0C4] shadow-xl"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, transparent 19px, rgba(200,80,80,0.10) 19px, rgba(200,80,80,0.10) 21px, transparent 21px),
                      repeating-linear-gradient(to bottom, transparent, transparent 23px, rgba(160,140,120,0.18) 23px, rgba(160,140,120,0.18) 24px)
                    `,
                  }}
                >
                  <div className="pl-4">
                    <div className="h-1.5 w-10 bg-[#D97436] rounded-full mb-3" />
                    <h4 className="font-serif font-bold text-sm mb-1">Warm Parchment</h4>
                    <p className="text-[10px] opacity-70 mb-4">Writing by the window on a warm afternoon.</p>
                    <div className="space-y-2">
                      <div className="h-6 w-full bg-white/60 rounded-lg border border-[#DFD0C4] flex items-center px-2 text-[9px] opacity-50">Your answer...</div>
                      <div className="h-5 w-14 bg-[#D97436] rounded-full text-white text-[8px] flex items-center justify-center font-bold">Submit</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Dark card */}
              <motion.div
                initial={{ rotate: 8, x: 30, opacity: 0 }}
                whileInView={{ rotate: 4, x: 20, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 80, damping: 15, delay: 0.15 }}
                className="absolute z-10 w-[260px] sm:w-[280px]"
              >
                <div
                  className="bg-[#0B0705] text-[#F2EBE5] p-6 rounded-[1.5rem] border border-[#2D1D16] shadow-2xl"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 23px, rgba(224,111,40,0.08) 23px, rgba(224,111,40,0.08) 24px)',
                  }}
                >
                  <div className="h-1.5 w-10 bg-[#E06F28] rounded-full mb-3" />
                  <h4 className="font-serif font-bold text-sm mb-1">Midnight Studio</h4>
                  <p className="text-[10px] opacity-60 mb-4">Moonlit lake, stars, amber ink.</p>
                  <div className="space-y-2">
                    <div className="h-6 w-full bg-[#130D0B] rounded-lg border border-[#2D1D16] flex items-center px-2 text-[9px] opacity-50">Your answer...</div>
                    <div className="h-5 w-14 bg-[#E06F28] rounded-full text-white text-[8px] flex items-center justify-center font-bold">Submit</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          DATA ANALYTICS SHOWCASE
          ═══════════════════════════════════════════════════════ */}
      <section className="relative z-10 py-16 sm:py-24 px-6 border-t border-inquest-rule/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Chart */}
            <div className="lg:col-span-6 order-2 lg:order-1 flex justify-center">
              <div className="bg-inquest-surface/80 backdrop-blur-sm p-6 sm:p-8 rounded-[2rem] border border-inquest-rule/40 warm-shadow w-full max-w-md space-y-5">
                <div className="flex items-center justify-between border-b border-inquest-rule/30 pb-3">
                  <div>
                    <h4 className="font-serif font-bold text-inquest-ink text-base">Response Timeline</h4>
                    <p className="text-[11px] text-inquest-ink-soft">Chronological submission velocity</p>
                  </div>
                  <span className="text-[9px] font-bold text-inquest-accent bg-inquest-accent/15 px-2 py-1 rounded-full uppercase tracking-wider">Live</span>
                </div>

                <div className="h-32 flex items-end justify-between gap-2 pt-3">
                  {[
                    { label: 'Mon', h: '30%' }, { label: 'Tue', h: '55%' }, { label: 'Wed', h: '45%' },
                    { label: 'Thu', h: '85%' }, { label: 'Fri', h: '60%' }, { label: 'Sat', h: '25%' }, { label: 'Sun', h: '40%' }
                  ].map((bar, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <motion.div
                        initial={{ height: 0 }}
                        whileInView={{ height: bar.h }}
                        viewport={{ once: true }}
                        transition={{ type: 'spring', stiffness: 50, damping: 10, delay: i * 0.08 }}
                        className="w-full bg-inquest-accent/80 rounded-t-md"
                      />
                      <span className="text-[8px] text-inquest-ink-ghost font-mono">{bar.label}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-3 border-t border-inquest-rule/30 pt-3 text-center">
                  <div>
                    <span className="text-[10px] text-inquest-ink-soft block">Responses</span>
                    <span className="text-base font-serif font-bold text-inquest-ink">1,402</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-inquest-ink-soft block">Avg. Time</span>
                    <span className="text-base font-serif font-bold text-inquest-ink">2.4m</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-inquest-ink-soft block">Completion</span>
                    <span className="text-base font-serif font-bold text-inquest-ink">94.8%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Copy */}
            <div className="lg:col-span-6 order-1 lg:order-2 space-y-5">
              <span className="text-xs font-bold tracking-[0.2em] text-inquest-ink-soft uppercase">Empirical Clarity</span>
              <h3 className="text-3xl sm:text-4xl font-serif font-extrabold text-inquest-ink leading-tight">
                Your intuition says one thing. Your data says another.
              </h3>
              <p className="text-inquest-ink-mid leading-relaxed text-sm sm:text-base">
                Never guess. Analyze submissions over chronological timelines and spot patterns.
                Min, max, average — structured analytical data that replaces bias with evidence.
              </p>
              <blockquote className="border-l-2 border-inquest-accent pl-4 italic text-sm text-inquest-ink-soft">
                &ldquo;Structured analytical data is the path away from bias and toward alignment.&rdquo;
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FEATURES — Security & Versatility
          ═══════════════════════════════════════════════════════ */}
      <section className="relative z-10 py-16 sm:py-24 px-6 border-t border-inquest-rule/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold tracking-[0.2em] text-inquest-accent uppercase bg-inquest-accent/10 px-3 py-1 rounded-full">
              Versatility
            </span>
            <h3 className="text-3xl sm:text-4xl font-serif font-bold text-inquest-ink mt-4">Built for Every Enquiry</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Secure Access', desc: 'Passcode-gated forms with login requirements.', icon: Lock },
              { title: 'Live Theme Preview', desc: 'See changes in real-time as you design.', icon: Eye },
              { title: 'Rich Field Types', desc: 'Ratings, dates, dropdowns, and validations.', icon: Star },
              { title: 'Data Security', desc: 'Curated images only — no arbitrary uploads.', icon: Shield },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.08 }}
                className="bg-inquest-surface/60 backdrop-blur-sm p-6 rounded-[1.5rem] border border-inquest-rule/40 hover:border-inquest-accent/40 hover:-translate-y-1.5 hover:shadow-md transition-all duration-300"
              >
                <div className="w-9 h-9 rounded-xl bg-inquest-accent/10 flex items-center justify-center mb-4">
                  <item.icon size={18} className="text-inquest-accent" />
                </div>
                <h4 className="font-serif font-bold text-inquest-ink text-base mb-2">{item.title}</h4>
                <p className="text-xs text-inquest-ink-mid leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CTA
          ═══════════════════════════════════════════════════════ */}
      <section className="relative z-10 py-20 sm:py-28 px-6 border-t border-inquest-rule/20">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-5xl font-serif font-extrabold text-inquest-ink leading-tight"
          >
            Don&apos;t guess. <span className="text-inquest-accent">Ask.</span>
            <br />
            Then listen to what the data says.
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="text-inquest-ink-mid max-w-lg mx-auto text-sm sm:text-base leading-relaxed"
          >
            Build elegant enquiries on diary-like pages. Access secure analytics that keep decisions grounded in reality.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 80 }}
          >
            <button
              onClick={() => router.push('/sign-up')}
              className="px-10 py-4 rounded-full bg-inquest-accent text-white text-lg font-bold hover:bg-inquest-accent-soft transition terracotta-glow flex items-center gap-2 cursor-pointer mx-auto shadow-md"
            >
              Open Your Diary <ArrowRight size={20} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 text-center border-t border-inquest-rule/20">
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-inquest-ink-mid mb-3">
          <Link href="/" className="hover:text-inquest-ink transition">Home</Link>
          <Link href="/privacy" className="hover:text-inquest-ink transition">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-inquest-ink transition">Terms of Service</Link>
        </div>
        <p className="text-sm text-inquest-ink-ghost">
          © {new Date().getFullYear()} Inquest — Thoughtful enquiries, meaningful insights.
        </p>
      </footer>
    </div>
  );
}