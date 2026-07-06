'use client';

import { motion } from 'framer-motion';

// Paper plane SVG path (small, elegant)
function PaperPlane({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
        fill="currentColor"
        fillOpacity="0.9"
      />
    </svg>
  );
}

// Floating notebook page SVG shape
function FloatingPage({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
      {/* Page base */}
      <rect x="2" y="2" width="96" height="126" rx="8" fill="var(--color-inquest-surface)" stroke="var(--color-inquest-rule)" strokeWidth="1.5" />
      {/* Left red margin line */}
      <line x1="20" y1="2" x2="20" y2="128" stroke="rgba(200, 80, 80, 0.25)" strokeWidth="1" />
      {/* Ruled lines */}
      <line x1="25" y1="20" x2="90" y2="20" stroke="var(--color-inquest-rule)" strokeWidth="0.8" strokeDasharray="1 1" />
      <line x1="25" y1="35" x2="90" y2="35" stroke="var(--color-inquest-rule)" strokeWidth="0.8" />
      <line x1="25" y1="50" x2="90" y2="50" stroke="var(--color-inquest-rule)" strokeWidth="0.8" />
      <line x1="25" y1="65" x2="90" y2="65" stroke="var(--color-inquest-rule)" strokeWidth="0.8" />
      <line x1="25" y1="80" x2="90" y2="80" stroke="var(--color-inquest-rule)" strokeWidth="0.8" strokeDasharray="2 1" />
      <line x1="25" y1="95" x2="90" y2="95" stroke="var(--color-inquest-rule)" strokeWidth="0.8" />
      <line x1="25" y1="110" x2="90" y2="110" stroke="var(--color-inquest-rule)" strokeWidth="0.8" />
    </svg>
  );
}

// Floating Feather Quill SVG
function FloatingFeather({ size = 60 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
      <path
        d="M20.24 3.76a6 6 0 0 0-8.49 0L5.41 10.1a9.9 9.9 0 0 0-1.85 2.58L2 19.5a1 1 0 0 0 1.21 1.21l6.82-1.56a9.9 9.9 0 0 0 2.58-1.85l6.34-6.34a6 6 0 0 0 0-8.49z"
        stroke="var(--color-inquest-rule)"
        strokeWidth="1.5"
        fill="var(--color-inquest-surface)"
      />
      <path
        d="M11.83 12.17c-2.3 2.3-5.26 3.96-8.52 4.79L3 17.5l.54-.31c.83-3.26 2.49-6.22 4.79-8.52"
        stroke="var(--color-inquest-ink)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M17.5 6.5l-8.5 8.5"
        stroke="var(--color-inquest-ink)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Trend lines data for chart-like watermarks
const trendLines = [
  { id: 't1', d: 'M 0,200 Q 300,120 600,160 T 1200,100 T 1800,140', delay: 0 },
  { id: 't2', d: 'M 0,450 Q 250,350 500,380 T 1000,300 T 1500,340 T 2000,280', delay: 3 },
];

// Reduced scatter dots (was 8, now 4) — fewer concurrent CSS animations
const dots = [
  { cx: 200, cy: 180, r: 3, delay: '0s' },
  { cx: 720, cy: 130, r: 3.5, delay: '1.6s' },
  { cx: 300, cy: 400, r: 2.5, delay: '3.2s' },
  { cx: 1050, cy: 270, r: 2, delay: '4.8s' },
];

export function BackgroundWatermarks() {
  return (
    <>
      {/* CSS Keyframes for all infinite animations — no JS per-frame cost */}
      <style jsx global>{`
        @keyframes wm-plane-1 {
          0% { left: -5%; top: 12%; }
          50% { top: 10%; }
          100% { left: 105%; top: 8%; }
        }
        @keyframes wm-plane-2 {
          0% { left: -5%; top: 55%; }
          50% { top: 52%; }
          100% { left: 105%; top: 48%; }
        }
        @keyframes wm-plane-3 {
          0% { left: 105%; top: 18%; }
          50% { top: 16%; }
          100% { left: -5%; top: 15%; }
        }
        @keyframes wm-sheet-page {
          0% { left: -10%; top: 22%; rotate: 12deg; }
          50% { top: 19%; rotate: 24deg; }
          100% { left: 110%; top: 16%; rotate: 36deg; }
        }
        @keyframes wm-sheet-feather {
          0% { left: -10%; top: 78%; rotate: -30deg; }
          50% { top: 74%; rotate: 0deg; }
          100% { left: 110%; top: 70%; rotate: 30deg; }
        }
        @keyframes wm-dot-pulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <div
        className="fixed inset-0 pointer-events-none overflow-hidden z-0"
        style={{ contain: 'layout style' }}
        aria-hidden="true"
      >
        {/* ── Trend Lines (one-time path draw — kept as framer-motion since it only fires once) ── */}
        <svg
          className="w-full h-full opacity-[0.08] dark:opacity-[0.12] text-inquest-ink"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          {trendLines.map((line) => (
            <motion.path
              key={line.id}
              d={line.d}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="8,6"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                pathLength: { duration: 8, delay: line.delay, ease: 'easeInOut' },
                opacity: { duration: 2, delay: line.delay },
              }}
            />
          ))}

          {/* Scatter dots — CSS-driven infinite pulse */}
          {dots.map((dot, i) => (
            <circle
              key={i}
              cx={dot.cx}
              cy={dot.cy}
              r={dot.r}
              fill="currentColor"
              style={{
                animation: `wm-dot-pulse 6s ease-in-out ${dot.delay} infinite`,
                opacity: 0.15,
              }}
            />
          ))}
        </svg>

        {/* ── Paper Planes — CSS keyframe animations ── */}
        <div
          className="absolute opacity-[0.16] dark:opacity-[0.24] text-inquest-ink"
          style={{
            animation: 'wm-plane-1 45s linear 0s infinite',
            rotate: '-15deg',
            willChange: 'left, top',
          }}
        >
          <PaperPlane size={32} />
        </div>
        <div
          className="absolute opacity-[0.16] dark:opacity-[0.24] text-inquest-ink"
          style={{
            animation: 'wm-plane-2 50s linear 15s infinite',
            rotate: '-10deg',
            willChange: 'left, top',
          }}
        >
          <PaperPlane size={36} />
        </div>
        <div
          className="absolute opacity-[0.16] dark:opacity-[0.24] text-inquest-ink"
          style={{
            animation: 'wm-plane-3 52s linear 30s infinite',
            rotate: '175deg',
            willChange: 'left, top',
          }}
        >
          <PaperPlane size={26} />
        </div>

        {/* ── Floating Sheets — CSS keyframe animations ── */}
        <div
          className="absolute opacity-[0.07] dark:opacity-[0.09] text-inquest-ink"
          style={{
            animation: 'wm-sheet-page 72s linear 2s infinite',
            willChange: 'left, top, rotate',
            zIndex: -5,
          }}
        >
          <FloatingPage size={70} />
        </div>
        <div
          className="absolute opacity-[0.07] dark:opacity-[0.09] text-inquest-ink"
          style={{
            animation: 'wm-sheet-feather 65s linear 8s infinite',
            willChange: 'left, top, rotate',
            zIndex: -5,
          }}
        >
          <FloatingFeather size={55} />
        </div>
      </div>
    </>
  );
}
