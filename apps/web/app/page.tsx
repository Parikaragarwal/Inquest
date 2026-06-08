'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useGetuser } from '~/hooks/api/auth';
import { useState } from 'react';

export default function LandingPage() {
  const router = useRouter();
  const { isSignedIn, isLoading } = useGetuser();
  const [demoText, setDemoText] = useState('');

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col bg-inquest-base text-inquest-ink">
      {/* Ambient Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-inquest-accent-pale/40 mix-blend-multiply filter blur-3xl opacity-70"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-inquest-sage/30 mix-blend-multiply filter blur-3xl opacity-60"
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-8 max-w-6xl w-full mx-auto animate-fade-in-up">
        <h1 className="text-2xl font-serif tracking-tight text-inquest-ink font-semibold">
          Inquest
        </h1>
        <div className="flex items-center gap-6">
          {!isLoading && (
            <>
              {isSignedIn ? (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-inquest-ink-mid hover:text-inquest-ink transition font-medium"
                >
                  Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => router.push('/login')}
                    className="text-inquest-ink-mid hover:text-inquest-ink transition font-medium"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => router.push('/sign-up')}
                    className="px-6 py-2.5 rounded-full bg-inquest-accent text-white hover:bg-inquest-accent-soft transition font-medium terracotta-glow"
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
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 max-w-4xl mx-auto text-center w-full mt-10 mb-24">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.8 }}
          className="text-5xl md:text-7xl font-serif text-inquest-ink leading-[1.1] tracking-tight mb-8"
        >
          Ask questions that reach the people who know.
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-lg md:text-xl text-inquest-ink-mid max-w-2xl mb-16 leading-relaxed"
        >
          Inquest is a warm, thoughtful space for gathering insights. Step away from clinical surveys and invite meaningful reflection.
        </motion.p>

        {/* Interactive Demo Container */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="w-full max-w-xl bg-inquest-surface rounded-3xl p-8 warm-shadow fluid-border text-left"
        >
          <div className="mb-6">
            <h3 className="text-xl font-serif text-inquest-ink mb-2">What is a lesson you learned the hard way?</h3>
            <p className="text-sm text-inquest-ink-soft">Shared by Alexander</p>
          </div>
          
          <textarea
            value={demoText}
            onChange={(e) => setDemoText(e.target.value)}
            placeholder="Type your reflection here..."
            className="w-full bg-inquest-base border-0 focus:ring-1 focus:ring-inquest-accent rounded-2xl p-4 min-h-[120px] resize-none text-inquest-ink placeholder-inquest-ink-ghost transition-shadow"
          />
          
          <div className="mt-6 flex justify-end">
            <button 
              onClick={() => {
                if(demoText) {
                  setDemoText('');
                  alert('This is just a demo! Sign up to create real enquiries.');
                  router.push('/sign-up');
                }
              }}
              className="px-8 py-3 rounded-full bg-inquest-ink text-white hover:bg-inquest-ink-mid transition font-medium"
            >
              Share Answer
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}