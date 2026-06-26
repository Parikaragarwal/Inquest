import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { GlobalProviders } from "~/providers/global";
import { BackgroundWatermarks } from "~/components/background-watermarks";
import './globals.css'

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Inquest | Thoughtful Enquiries",
  description: "Ask questions that reach the people who know. Data over intuition.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Dark-mode hydration + Paper Roll toggle + OS preference listener */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var storedTheme = localStorage.getItem('theme');
              var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              var shouldBeDark = storedTheme === 'dark' || (!storedTheme && prefersDark);
              if (shouldBeDark) document.documentElement.classList.add('dark');
              else document.documentElement.classList.remove('dark');

              function applyThemeWithRoll(toDark) {
                var overlay = document.createElement('div');
                overlay.className = 'paper-roll-overlay';
                if (toDark) {
                  overlay.style.backgroundColor = '#0B0705';
                  overlay.style.backgroundImage = 'repeating-linear-gradient(to bottom, transparent, transparent 31px, rgba(224,111,40,0.12) 31px, rgba(224,111,40,0.12) 32px)';
                }
                document.body.appendChild(overlay);
                overlay.getBoundingClientRect();
                overlay.classList.add('rolling-down');
                overlay.addEventListener('animationend', function onDown(e) {
                  if (e.animationName !== 'roll-down') return;
                  overlay.removeEventListener('animationend', onDown);
                  if (toDark) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
                  else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
                  overlay.classList.remove('rolling-down');
                  overlay.classList.add('rolling-up');
                  overlay.addEventListener('animationend', function onUp(e2) {
                    if (e2.animationName !== 'roll-up') return;
                    overlay.removeEventListener('animationend', onUp);
                    overlay.remove();
                  });
                });
              }

              window.__toggleTheme = function() {
                var isDark = document.documentElement.classList.contains('dark');
                applyThemeWithRoll(!isDark);
              };

              window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
                var manual = localStorage.getItem('theme');
                if (!manual) applyThemeWithRoll(e.matches);
              });
            } catch (e) {}
          })();
        ` }} />
      </head>
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        {/* Animated watermarks — paper planes + data trend lines */}
        <BackgroundWatermarks />

        {/* Content — transparent background so body's lined-paper shows through */}
        <div className="relative z-10 min-h-screen flex flex-col">
          <GlobalProviders>{children}</GlobalProviders>
        </div>
      </body>
    </html>
  );
}
