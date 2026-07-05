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

// Floating analytical data sheet SVG shape
function FloatingDataSheet({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
      {/* Page base */}
      <rect x="2" y="2" width="96" height="126" rx="8" fill="var(--color-inquest-surface)" stroke="var(--color-inquest-rule)" strokeWidth="1.5" />
      {/* Ruled lines inside */}
      <line x1="12" y1="20" x2="88" y2="20" stroke="var(--color-inquest-rule)" strokeWidth="0.8" />
      <line x1="12" y1="35" x2="88" y2="35" stroke="var(--color-inquest-rule)" strokeWidth="0.8" />
      {/* Mini analytical bar chart watermark */}
      <rect x="15" y="70" width="10" height="40" rx="2" fill="var(--color-inquest-accent)" fillOpacity="0.25" />
      <rect x="32" y="55" width="10" height="55" rx="2" fill="var(--color-inquest-accent)" fillOpacity="0.35" />
      <rect x="49" y="80" width="10" height="30" rx="2" fill="var(--color-inquest-accent)" fillOpacity="0.25" />
      <rect x="66" y="45" width="10" height="65" rx="2" fill="var(--color-inquest-accent)" fillOpacity="0.45" />
      {/* Trend line */}
      <path d="M 20,70 Q 40,50 60,65 T 80,45" fill="none" stroke="var(--color-inquest-ink-soft)" strokeWidth="1.2" strokeOpacity="0.3" />
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

// Floating Magnifying Glass SVG
function FloatingMagnifier({ size = 60 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
      <circle cx="11" cy="11" r="7" stroke="var(--color-inquest-rule)" strokeWidth="1.5" fill="var(--color-inquest-surface)" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="var(--color-inquest-ink)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="9" cy="9" r="3" fill="var(--color-inquest-accent)" fillOpacity="0.15" />
    </svg>
  );
}

// Reduced to 3 planes (was 6) — fewer concurrent infinite animations = less GPU pressure
const planes = [
  { id: 1, startX: -5,  startY: 12, endX: 105, endY: 8,  size: 32, duration: 45, delay: 0,  rotate: -15 },
  { id: 3, startX: -5,  startY: 55, endX: 105, endY: 48, size: 36, duration: 50, delay: 15, rotate: -10 },
  { id: 6, startX: 105, startY: 18, endX: -5,  endY: 15, size: 26, duration: 52, delay: 30, rotate: 175 },
];

// Reduced to 2 floating sheets (was 4) — decorative value maintained with lower paint cost
const floatingSheets = [
  { id: 's1', type: 'page',    startX: -10,  startY: 22, endX: 110, endY: 16, size: 70, duration: 72, delay: 2,  rotateStart: 12,  rotateEnd: 36 },
  { id: 's3', type: 'feather', startX: -10,  startY: 78, endX: 110, endY: 70, size: 55, duration: 65, delay: 8,  rotateStart: -30, rotateEnd: 30 },
];

// Trend lines data for chart-like watermarks
const trendLines = [
  { id: 't1', d: 'M 0,200 Q 300,120 600,160 T 1200,100 T 1800,140', delay: 0 },
  { id: 't2', d: 'M 0,450 Q 250,350 500,380 T 1000,300 T 1500,340 T 2000,280', delay: 3 },
];

// Scatter dots
const dots = [
  { cx: 200, cy: 180, r: 3 },
  { cx: 480, cy: 150, r: 2.5 },
  { cx: 720, cy: 130, r: 3.5 },
  { cx: 950, cy: 160, r: 2 },
  { cx: 300, cy: 400, r: 2.5 },
  { cx: 650, cy: 350, r: 3 },
  { cx: 1050, cy: 270, r: 2 },
  { cx: 1300, cy: 310, r: 2.5 },
];

export function BackgroundWatermarks() {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    >
      {/* ── Trend Lines & Scatter Dots ──────────────────── */}
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
        {dots.map((dot, i) => (
          <motion.circle
            key={i}
            cx={dot.cx}
            cy={dot.cy}
            r={dot.r}
            fill="currentColor"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 0.4, 0.25, 0.4], scale: 1 }}
            transition={{
              opacity: { duration: 6, delay: i * 0.8, repeat: Infinity, repeatType: 'reverse' },
              scale: { duration: 1, delay: i * 0.8 },
            }}
          />
        ))}
      </svg>

      {/* ── Paper Planes ────────────────────────────────── */}
      {planes.map((plane) => (
        <motion.div
          key={plane.id}
          className="absolute opacity-[0.16] dark:opacity-[0.24] text-inquest-ink"
          style={{
            top: `${plane.startY}%`,
            rotate: `${plane.rotate}deg`,
          }}
          initial={{ left: `${plane.startX}%`, top: `${plane.startY}%` }}
          animate={{
            left: [`${plane.startX}%`, `${plane.endX}%`],
            top: [
              `${plane.startY}%`,
              `${plane.startY + (Math.random() * 6 - 3)}%`,
              `${(plane.startY + plane.endY) / 2 + (Math.random() * 4 - 2)}%`,
              `${plane.endY}%`,
            ],
          }}
          transition={{
            duration: plane.duration,
            delay: plane.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <PaperPlane size={plane.size} />
        </motion.div>
      ))}

      {/* ── Floating Pages/Data Sheets/Feathers/Magnifiers ── */}
      {floatingSheets.map((sheet) => (
        <motion.div
          key={sheet.id}
          className="absolute opacity-[0.07] dark:opacity-[0.09] text-inquest-ink"
          style={{
            top: `${sheet.startY}%`,
            zIndex: -5,
          }}
          initial={{ left: `${sheet.startX}%`, top: `${sheet.startY}%`, rotate: sheet.rotateStart }}
          animate={{
            left: [`${sheet.startX}%`, `${sheet.endX}%`],
            top: [
              `${sheet.startY}%`,
              `${sheet.startY + 4}%`,
              `${(sheet.startY + sheet.endY) / 2 - 2}%`,
              `${sheet.endY}%`,
            ],
            rotate: [sheet.rotateStart, (sheet.rotateStart + sheet.rotateEnd) / 2, sheet.rotateEnd],
          }}
          transition={{
            duration: sheet.duration,
            delay: sheet.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {sheet.type === 'page' ? (
            <FloatingPage size={sheet.size} />
          ) : sheet.type === 'data' ? (
            <FloatingDataSheet size={sheet.size} />
          ) : sheet.type === 'feather' ? (
            <FloatingFeather size={sheet.size} />
          ) : (
            <FloatingMagnifier size={sheet.size} />
          )}
        </motion.div>
      ))}
    </div>
  );
}
