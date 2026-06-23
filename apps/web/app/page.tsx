'use client';

import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetuser } from '~/hooks/api/auth';
import { Shield, Sparkles, BarChart3, ArrowRight, MessageSquare, Lock, Palette, Sun, Moon, HelpCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const router = useRouter();
  const { isSignedIn, isLoading } = useGetuser();
  const [darkMode, setDarkMode] = useState(false);

  // Sync dark mode state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDark = document.documentElement.classList.contains('dark');
      setDarkMode(isDark);
    }
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col bg-inquest-base text-inquest-ink transition-colors duration-500">
      
      {/* ─── Watermark Graph & Chart Backdrop ─── */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] dark:opacity-[0.08] overflow-hidden z-0">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Decorative chart lines */}
          <path d="M 0,200 Q 150,120 300,180 T 600,80 T 900,150 T 1200,60 L 1200,1000 L 0,1000 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" />
          <path d="M 0,350 Q 250,220 500,280 T 1000,180 T 1500,250" fill="none" stroke="currentColor" strokeWidth="3" />
        </svg>
      </div>

      {/* Ambient background glowing blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{ x: [0, 60, 0], y: [0, -30, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-inquest-accent-pale/30 dark:bg-inquest-accent-pale/10 mix-blend-screen dark:mix-blend-color-dodge filter blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -60, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-inquest-sage/20 dark:bg-inquest-sage/5 mix-blend-screen dark:mix-blend-color-dodge filter blur-3xl"
        />

        {/* Flying Paper Planes & Data Sheets */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {/* Paper Plane 1 */}
          <motion.div
            initial={{ x: "-10%", y: "40%", rotate: -15, opacity: 0 }}
            animate={{ 
              x: ["0%", "110%"], 
              y: ["40%", "20%", "40%"],
              rotate: [-15, 0, 15],
              opacity: [0, 0.4, 0.4, 0] 
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute w-10 h-10 text-inquest-accent/30 dark:text-inquest-accent/20"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 2L2 9.7M22 2L15 22M22 2L11 13" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15 22L11 13M11 13L2 9.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
          
          {/* Paper Plane 2 */}
          <motion.div
            initial={{ x: "110%", y: "60%", rotate: 165, opacity: 0 }}
            animate={{ 
              x: ["100%", "-10%"], 
              y: ["60%", "75%", "60%"],
              rotate: [165, 180, 195],
              opacity: [0, 0.3, 0.3, 0] 
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 8 }}
            className="absolute w-8 h-8 text-inquest-ink-soft/30"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 2L2 9.7M22 2L15 22M22 2L11 13" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15 22L11 13M11 13L2 9.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>

          {/* Floating Data Sheets */}
          <motion.div
            initial={{ y: "110%", x: "20%", rotate: 0, opacity: 0 }}
            animate={{ 
              y: ["105%", "-10%"], 
              x: ["20%", "25%", "20%"],
              rotate: [0, 25, -25],
              opacity: [0, 0.15, 0.15, 0] 
            }}
            transition={{ duration: 35, repeat: Infinity, ease: "linear", delay: 1 }}
            className="absolute w-24 h-32 bg-inquest-surface border border-inquest-rule rounded-xl shadow-sm p-3 opacity-20 dark:opacity-5"
          >
            <div className="w-1/2 h-2 bg-inquest-accent/30 rounded mb-2" />
            <div className="w-full h-1 bg-inquest-ink-ghost/40 rounded mb-1.5" />
            <div className="w-full h-1 bg-inquest-ink-ghost/40 rounded mb-1.5" />
            <div className="w-5/6 h-1 bg-inquest-ink-ghost/40 rounded mb-3" />
            <div className="w-full h-12 bg-inquest-accent/10 rounded flex items-end p-1 gap-1">
              <div className="bg-inquest-accent/40 w-full h-1/2 rounded-xs" />
              <div className="bg-inquest-accent/60 w-full h-3/4 rounded-xs" />
              <div className="bg-inquest-accent w-full h-full rounded-xs" />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: "110%", x: "80%", rotate: 10, opacity: 0 }}
            animate={{ 
              y: ["105%", "-10%"], 
              x: ["80%", "75%", "80%"],
              rotate: [10, -15, 15],
              opacity: [0, 0.12, 0.12, 0] 
            }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear", delay: 15 }}
            className="absolute w-20 h-28 bg-inquest-surface border border-inquest-rule rounded-xl shadow-sm p-3 opacity-20 dark:opacity-5"
          >
            <div className="w-3/4 h-2 bg-inquest-sage/30 rounded mb-2" />
            <div className="w-full h-1.5 bg-inquest-ink-ghost/40 rounded mb-1.5" />
            <div className="w-2/3 h-1.5 bg-inquest-ink-ghost/40 rounded" />
          </motion.div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 sm:px-8 py-6 sm:py-8 max-w-6xl w-full mx-auto">
        <h1 className="text-2xl font-serif tracking-tight text-inquest-ink font-semibold flex items-center gap-2">
          <Palette className="text-inquest-accent animate-pulse" size={24} />
          Inquest
        </h1>
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-inquest-surface hover:bg-inquest-depth/50 text-inquest-ink-soft hover:text-inquest-ink transition-colors border border-inquest-rule/40 cursor-pointer"
            title="Toggle theme mode"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {!isLoading && (
            <>
              {isSignedIn ? (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-5 py-2.5 rounded-full bg-inquest-accent text-white hover:bg-inquest-accent-soft transition font-medium terracotta-glow text-sm cursor-pointer"
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
                    className="px-5 py-2.5 rounded-full bg-inquest-accent text-white hover:bg-inquest-accent-soft transition font-medium terracotta-glow text-sm cursor-pointer"
                  >
                    Get Started
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center px-6 max-w-6xl mx-auto w-full pt-8 pb-16 sm:pb-24">
        
        {/* Left column: copywriting */}
        <div className="lg:col-span-7 text-left space-y-6 sm:space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-inquest-surface border border-inquest-rule text-xs sm:text-sm text-inquest-ink-mid font-medium dark:border-inquest-rule/30">
              <Sparkles size={14} className="text-inquest-accent" />
              Human-centered feedback, beautiful design.
            </span>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-7xl font-serif text-inquest-ink leading-[1.1] tracking-tight font-extrabold"
          >
            A quiet space
            <br />
            for <span className="text-inquest-accent dark:text-[#E06F28] italic">meaningful</span>
            <br />
            conversation.
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-base sm:text-lg md:text-xl text-inquest-ink-mid max-w-xl leading-relaxed"
          >
            Move beyond bureaucratic forms. Inquest creates distraction-free, elegant spaces that honor the respondent's time and provide deep, structured analytical data.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex gap-4 flex-wrap"
          >
            <button
              onClick={() => router.push('/sign-up')}
              className="px-8 py-4 rounded-full bg-inquest-accent text-white text-lg font-medium hover:bg-inquest-accent-soft transition terracotta-glow flex items-center justify-center gap-2 cursor-pointer"
            >
              Build Your First Enquiry <ArrowRight size={20} />
            </button>
            <button
              onClick={() => router.push('/login')}
              className="px-8 py-4 rounded-full border border-inquest-rule text-inquest-ink font-medium hover:bg-inquest-depth/30 transition text-lg cursor-pointer"
            >
              Sign In
            </button>
          </motion.div>
        </div>

        {/* Right column: animated illustration & flying cards */}
        <div className="lg:col-span-5 relative w-full h-[450px] flex items-center justify-center">
          
          {/* Metaphorical Hand SVG Overlay */}
          <div className="absolute inset-0 z-0 opacity-40 dark:opacity-20 flex items-center justify-center">
            <svg className="w-full h-full max-w-[400px]" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Creator hand (reaching from top left to query) */}
              <motion.path 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
                d="M 20,40 Q 60,60 100,50 Q 120,45 130,55" 
                stroke="currentColor" 
                strokeWidth="4" 
                strokeLinecap="round" 
              />
              <circle cx="130" cy="55" r="4" fill="currentColor" />

              {/* Public reply hand (reaching from bottom right to respond) */}
              <motion.path 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
                d="M 180,160 Q 140,140 100,150 Q 80,155 70,145" 
                stroke="#C85A17" 
                strokeWidth="4" 
                strokeLinecap="round" 
              />
              <circle cx="70" cy="145" r="4" fill="#C85A17" />
              
              {/* Abstract dialogue bubble */}
              <path d="M 80,90 Q 100,70 120,90 Q 100,110 80,90 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3,3" />
            </svg>
          </div>

          {/* Flying Cards Stack */}
          <div className="relative z-10 w-full max-w-[280px] space-y-4">
            
            {/* Flying Card 1 */}
            <motion.div
              initial={{ x: 100, y: -40, opacity: 0, rotate: 12 }}
              animate={{ x: 0, y: 0, opacity: 1, rotate: -4 }}
              transition={{ type: "spring", stiffness: 60, damping: 10, delay: 0.5 }}
              className="bg-inquest-surface p-5 rounded-3xl border border-inquest-rule/60 shadow-lg cursor-pointer transform hover:scale-105 transition-transform"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] uppercase tracking-wider text-inquest-accent font-bold">Feedback Form</span>
                <span className="w-2.5 h-2.5 rounded-full bg-inquest-accent animate-ping" />
              </div>
              <h4 className="font-serif font-bold text-inquest-ink text-sm">How was your studio experience?</h4>
              <div className="mt-3 flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className="text-xs text-amber-500">★</span>
                ))}
              </div>
            </motion.div>

            {/* Flying Card 2 */}
            <motion.div
              initial={{ x: -100, y: 60, opacity: 0, rotate: -12 }}
              animate={{ x: 0, y: 0, opacity: 1, rotate: 3 }}
              transition={{ type: "spring", stiffness: 50, damping: 12, delay: 0.8 }}
              className="bg-inquest-surface p-5 rounded-3xl border border-inquest-rule/60 shadow-lg transform translate-x-4 hover:scale-105 transition-transform"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] uppercase tracking-wider text-inquest-ink-soft">Analytics Insight</span>
                <BarChart3 size={12} className="text-inquest-ink-ghost" />
              </div>
              <p className="text-[11px] text-inquest-ink-soft">Chronological responses grouped daily:</p>
              <div className="mt-2 h-10 flex items-end gap-1.5">
                <div className="bg-inquest-accent/30 w-full h-4 rounded-sm" />
                <div className="bg-inquest-accent/50 w-full h-8 rounded-sm" />
                <div className="bg-inquest-accent w-full h-6 rounded-sm" />
                <div className="bg-inquest-accent/80 w-full h-9 rounded-sm" />
              </div>
            </motion.div>

            {/* Flying Card 3 */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, rotate: -1 }}
              transition={{ type: "spring", stiffness: 70, damping: 8, delay: 1.1 }}
              className="bg-inquest-surface p-4 rounded-2xl border border-inquest-rule/60 shadow-md text-center max-w-[200px] mx-auto"
            >
              <span className="text-xs font-mono tracking-widest text-inquest-ink font-semibold">🔒 SECURE CODE GATE</span>
            </motion.div>

          </div>

        </div>

      </section>

      {/* How It Works */}
      <section className="relative z-10 py-16 sm:py-24 px-6 border-t border-inquest-rule/20 bg-inquest-surface/30">
        <div className="max-w-5xl mx-auto">
          <motion.h3 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-sm font-medium text-inquest-ink-soft uppercase tracking-widest mb-12 sm:mb-16"
          >
            The Conversation Flow
          </motion.h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Thoughtful Design',
                description: 'Add various questions including ratings and text choices in seconds. Style them with responsive colors or custom image backdrops.',
                icon: Palette,
              },
              {
                step: '02',
                title: 'Secure Access',
                description: 'Control your audience. Enable login limits or private passcode protection to receive responses only from verified users.',
                icon: Lock,
              },
              {
                step: '03',
                title: 'Data Over Intuition',
                description: 'Rely on data. Analyze submissions over chronological timelines and view min/max/average stats on rating and number inputs.',
                icon: BarChart3,
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="bg-inquest-surface p-8 rounded-[2rem] border border-inquest-rule/50 shadow-sm hover:border-inquest-accent/40 transition-colors"
              >
                <div className="text-5xl font-serif text-inquest-accent/15 font-bold mb-4">{item.step}</div>
                <div className="w-10 h-10 rounded-2xl bg-inquest-accent/10 flex items-center justify-center mb-4">
                  <item.icon size={20} className="text-inquest-accent" />
                </div>
                <h4 className="text-xl font-serif text-inquest-ink mb-3 font-bold">{item.title}</h4>
                <p className="text-inquest-ink-mid leading-relaxed text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy Quote */}
      <section className="relative z-10 py-16 sm:py-24 px-6">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="w-12 h-px bg-inquest-accent mx-auto mb-8" />
          <blockquote className="text-2xl sm:text-3xl md:text-4xl font-serif text-inquest-ink leading-snug italic mb-8">
            &ldquo;We usually rely on intuition, but we shouldn't. Because at the end, it is structured data that is truly reliable.&rdquo;
          </blockquote>
          <p className="text-inquest-ink-soft text-sm uppercase tracking-widest">— Inquest Data Philosophy</p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 text-center border-t border-inquest-rule/30">
        <p className="text-sm text-inquest-ink-ghost">
          © {new Date().getFullYear()} Inquest — Thoughtful enquiries, meaningful insights.
        </p>
      </footer>
    </div>
  );
}