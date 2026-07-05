'use client';

import dynamic from 'next/dynamic';

export const LazyBackgroundWatermarks = dynamic(
  () => import('./background-watermarks').then((m) => ({ default: m.BackgroundWatermarks })),
  { ssr: false }
);
