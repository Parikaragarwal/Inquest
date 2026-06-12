'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useGetuser } from '~/hooks/api/auth';
import { Shield, Sparkles, BarChart3, ArrowRight, MessageSquare, Lock, Palette } from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.7 },
};

export default function LandingPage() {
  const router = useRouter();
  const { isSignedIn, isLoading } = useGetuser();

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col bg-inquest-base text-inquest-ink">
      {/* Ambient Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{ x: [0, 80, 0], y: [0, -40, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-15%] left-[-15%] w-[45vw] h-[45vw] rounded-full bg-inquest-accent-pale/30 mix-blend-multiply filter blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -80, 0], y: [0, 80, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-15%] right-[-15%] w-[55vw] h-[55vw] rounded-full bg-inquest-sage/20 mix-blend-multiply filter blur-3xl"
        />
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, -60, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute top-[40%] right-[10%] w-[25vw] h-[25vw] rounded-full bg-inquest-accent/10 mix-blend-multiply filter blur-3xl"
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 sm:px-8 py-6 sm:py-8 max-w-6xl w-full mx-auto">
        <h1 className="text-2xl font-serif tracking-tight text-inquest-ink font-semibold">
          Inquest
        </h1>
        <div className="flex items-center gap-4 sm:gap-6">
          {!isLoading && (
            <>
              {isSignedIn ? (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-5 py-2.5 rounded-full bg-inquest-accent text-white hover:bg-inquest-accent-soft transition font-medium terracotta-glow text-sm"
                >
                  Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => router.push('/login')}
                    className="text-inquest-ink-mid hover:text-inquest-ink transition font-medium text-sm hidden sm:block"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => router.push('/sign-up')}
                    className="px-5 py-2.5 rounded-full bg-inquest-accent text-white hover:bg-inquest-accent-soft transition font-medium terracotta-glow text-sm"
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
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 max-w-4xl mx-auto text-center w-full pt-8 sm:pt-16 pb-16 sm:pb-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.8 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-inquest-surface border border-inquest-rule text-xs sm:text-sm text-inquest-ink-mid font-medium">
            <Sparkles size={14} className="text-inquest-sage" />
            Thoughtful enquiries, meaningful insights
          </span>
        </motion.div>

        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.8 }}
          className="text-4xl sm:text-5xl md:text-7xl font-serif text-inquest-ink leading-[1.1] tracking-tight mb-6 sm:mb-8"
        >
          Simple to create.
          <br />
          <span className="text-inquest-accent">Powerful</span>
          <br />
          to analyze.
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-base sm:text-lg md:text-xl text-inquest-ink-mid max-w-2xl mb-10 sm:mb-14 leading-relaxed"
        >
          Inquest makes form building incredibly simple while offering deep, detailed analytics to understand your responses. Create beautiful forms in seconds and gain powerful insights instantly.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <button
            onClick={() => router.push('/sign-up')}
            className="px-8 py-4 rounded-full bg-inquest-accent text-white text-lg font-medium hover:bg-inquest-accent-soft transition terracotta-glow flex items-center justify-center gap-2"
          >
            Start Your First Enquiry <ArrowRight size={20} />
          </button>
          <button
            onClick={() => router.push('/login')}
            className="px-8 py-4 rounded-full border border-inquest-rule text-inquest-ink font-medium hover:bg-inquest-depth/30 transition text-lg"
          >
            Sign In
          </button>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-16 sm:py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.h3 {...fadeInUp} className="text-center text-sm font-medium text-inquest-ink-soft uppercase tracking-widest mb-12 sm:mb-16">
            How It Works
          </motion.h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                step: '01',
                title: 'Create',
                description: 'Build your form in seconds with our intuitive drag-and-drop visual builder. No complex setup required.',
                icon: MessageSquare,
              },
              {
                step: '02',
                title: 'Share',
                description: 'Send the link to anyone. Respondents sign in to share their perspective in a beautiful, distraction-free space.',
                icon: ArrowRight,
              },
              {
                step: '03',
                title: 'Discover',
                description: 'Dive deep into detailed analytics. Visualize your data with beautiful Recharts, pie charts, and distribution graphs.',
                icon: BarChart3,
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                {...fadeInUp}
                transition={{ delay: i * 0.15, duration: 0.7 }}
                className="bg-inquest-surface rounded-3xl p-8 border border-inquest-rule/50 warm-shadow"
              >
                <div className="text-5xl font-serif text-inquest-accent/20 font-bold mb-4">{item.step}</div>
                <div className="w-10 h-10 rounded-2xl bg-inquest-accent/10 flex items-center justify-center mb-4">
                  <item.icon size={20} className="text-inquest-accent" />
                </div>
                <h4 className="text-xl font-serif text-inquest-ink mb-3">{item.title}</h4>
                <p className="text-inquest-ink-mid leading-relaxed text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-16 sm:py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.h3 {...fadeInUp} className="text-center text-sm font-medium text-inquest-ink-soft uppercase tracking-widest mb-4">
            Why Inquest
          </motion.h3>
          <motion.p {...fadeInUp} className="text-center text-3xl sm:text-4xl font-serif text-inquest-ink mb-12 sm:mb-16 max-w-2xl mx-auto leading-tight">
            Powerful Insights, Seamless Experience
          </motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Lock, title: 'Privacy First', desc: 'Secure codes protect sensitive enquiries. Only people you invite can respond.' },
              { icon: Palette, title: 'Thoughtful Design', desc: 'Warm colors, generous spacing, and serif typography create a reflective experience.' },
              { icon: BarChart3, title: 'Real-time Analytics', desc: 'See answer distributions, response counts, and individual submissions as they arrive.' },
              { icon: Shield, title: 'Your Data, Your Auth', desc: 'No third-party auth services. Your data lives in your database, secured by your own JWT tokens.' },
              { icon: MessageSquare, title: 'Rich Field Types', desc: 'Text, numbers, dates, yes/no, single choice, multi choice, email, and phone — all beautifully rendered.' },
              { icon: Sparkles, title: 'Simplicity of Use', desc: 'Create an enquiry in seconds. Share a link. Start listening. No complex setup required.' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                {...fadeInUp}
                transition={{ delay: i * 0.08, duration: 0.7 }}
                className="bg-inquest-surface/60 backdrop-blur-sm rounded-3xl p-6 border border-inquest-rule/30 hover:border-inquest-accent/30 transition-colors"
              >
                <feature.icon size={22} className="text-inquest-accent mb-4" />
                <h4 className="font-serif text-lg text-inquest-ink mb-2">{feature.title}</h4>
                <p className="text-sm text-inquest-ink-mid leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy Quote */}
      <section className="relative z-10 py-16 sm:py-24 px-6">
        <motion.div
          {...fadeInUp}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="w-12 h-px bg-inquest-accent mx-auto mb-8" />
          <blockquote className="text-2xl sm:text-3xl md:text-4xl font-serif text-inquest-ink leading-snug italic mb-8">
            &ldquo;We believe that creating forms shouldn't be a chore, and understanding the data shouldn't require a data science degree.&rdquo;
          </blockquote>
          <p className="text-inquest-ink-soft text-sm uppercase tracking-widest">— The Inquest Philosophy</p>
        </motion.div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-16 sm:py-24 px-6 mb-8">
        <motion.div
          {...fadeInUp}
          className="max-w-xl mx-auto bg-inquest-surface rounded-[2.5rem] p-8 sm:p-12 text-center warm-shadow border border-inquest-rule/50"
        >
          <h3 className="text-3xl sm:text-4xl font-serif text-inquest-ink mb-4">Ready to listen?</h3>
          <p className="text-inquest-ink-mid mb-8 leading-relaxed">
            Create your first enquiry in under a minute. It&rsquo;s free, thoughtful, and entirely yours.
          </p>
          <button
            onClick={() => router.push('/sign-up')}
            className="px-8 py-4 rounded-full bg-inquest-accent text-white text-lg font-medium hover:bg-inquest-accent-soft transition terracotta-glow"
          >
            Create Your First Enquiry
          </button>
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