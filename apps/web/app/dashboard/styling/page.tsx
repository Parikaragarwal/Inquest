'use client';

import { motion } from 'framer-motion';
import { Palette, ExternalLink, Image as ImageIcon, Sparkles, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function StylingGuidePage() {
  const sampleUrls = [
    { label: 'Minimalist Desk (Warm tone)', url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1000' },
    { label: 'Calm Cream Gradient', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000' },
    { label: 'Soft Terracotta Textured Wall', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1000' },
    { label: 'Void Aesthetic Gradients (Dark)', url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=1000' },
  ];

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Background URL copied!');
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-12 text-inquest-ink">
      <header className="space-y-4">
        <h1 className="text-4xl font-serif font-bold text-inquest-ink tracking-tight">
          Form Themes & Styling Guide
        </h1>
        <p className="text-lg text-inquest-ink-mid leading-relaxed">
          Create calming, aesthetic, and eye-friendly spaces that encourage reflective dialogue.
        </p>
      </header>

      <div className="h-px bg-inquest-rule" />

      {/* Preset Placeholders */}
      <section className="space-y-6">
        <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
          <Palette size={20} className="text-inquest-accent" />
          Recommended Design Presets
        </h2>
        <p className="text-sm text-inquest-ink-soft">
          In the Form Builder settings overlay, you can select these preview placeholders instantly:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#FCFAF8] p-5 rounded-2xl border border-[#DFD0C4] shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#3A2312]">Warm Parchment</h3>
              <p className="text-xs text-[#856953] mt-1">Light Mode</p>
              <p className="text-sm text-[#5B402B] mt-3">A warm, relaxing cream backdrop that mimics reading from textured paper.</p>
            </div>
            <div className="mt-4 flex gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#F5EFEB] border border-gray-300" title="Base" />
              <span className="w-4 h-4 rounded-full bg-[#3A2312]" title="Ink" />
              <span className="w-4 h-4 rounded-full bg-[#C85A17]" title="Accent" />
            </div>
          </div>

          <div className="bg-[#130D0B] p-5 rounded-2xl border border-[#2D1D16] shadow-sm flex flex-col justify-between text-[#F2EBE5]">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#F2EBE5]">Midnight Studio</h3>
              <p className="text-xs text-[#A39387] mt-1">Dark Mode</p>
              <p className="text-sm text-[#D9CFC6] mt-3">Void black base layout with glowing orange-brown borders that feel premium and modern.</p>
            </div>
            <div className="mt-4 flex gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#0B0705]" title="Base" />
              <span className="w-4 h-4 rounded-full bg-[#F2EBE5]" title="Ink" />
              <span className="w-4 h-4 rounded-full bg-[#E06F28]" title="Accent Glow" />
            </div>
          </div>

          <div className="bg-gradient-to-tr from-[#FCF4ED] to-[#FFE0D0] p-5 rounded-2xl border border-[#DFD0C4] shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#3A2312]">Aesthetic Sunset</h3>
              <p className="text-xs text-[#856953] mt-1">Light Mode Gradient</p>
              <p className="text-sm text-[#5B402B] mt-3">Soft peach and terracotta color gradient transitions that look extremely beautiful.</p>
            </div>
            <div className="mt-4 flex gap-1.5">
              <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#FCF4ED] to-[#FFE0D0]" title="Base" />
              <span className="w-4 h-4 rounded-full bg-[#3A2312]" title="Ink" />
              <span className="w-4 h-4 rounded-full bg-[#C85A17]" title="Accent" />
            </div>
          </div>
        </div>
      </section>

      {/* Copy Paste Guide */}
      <section className="bg-inquest-surface p-6 rounded-3xl border border-inquest-rule space-y-4">
        <h3 className="font-serif font-bold text-xl flex items-center gap-2">
          <HelpCircle size={18} className="text-inquest-accent" />
          How to add Custom Background Images?
        </h3>
        <div className="text-sm text-inquest-ink-mid space-y-2 leading-relaxed">
          <p>
            We support dynamic background images using a simple image URL. Follow these steps to find one:
          </p>
          <ol className="list-decimal pl-5 space-y-1.5 mt-2">
            <li>Open a new tab and search for an image (e.g. <em>"aesthetic texture minimalist desktop background"</em>) on Google Images.</li>
            <li>Right-click the image you like and select <strong>"Copy Image Address"</strong> (or "Copy Image Link").</li>
            <li>Go to the Form settings drawer, enable the Custom Theme, and paste the URL in the <strong>Background Image URL</strong> field.</li>
            <li>You will immediately see the layout refresh and preview the chosen image!</li>
          </ol>
        </div>
      </section>

      {/* Copy-Paste Samples */}
      <section className="space-y-4">
        <h3 className="font-serif font-bold text-xl flex items-center gap-2">
          <ImageIcon size={18} className="text-inquest-accent" />
          calming Background Image Presets
        </h3>
        <p className="text-sm text-inquest-ink-soft">
          Click any address below to copy it, then paste it directly into your form settings background config:
        </p>

        <div className="space-y-3">
          {sampleUrls.map((preset) => (
            <div key={preset.label} className="bg-inquest-surface/50 p-4 rounded-2xl border border-inquest-rule flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-inquest-ink truncate">{preset.label}</p>
                <p className="text-xs text-inquest-ink-ghost truncate font-mono mt-0.5">{preset.url}</p>
              </div>
              <button
                onClick={() => copyToClipboard(preset.url)}
                className="px-4 py-1.5 rounded-full bg-inquest-depth text-xs font-semibold text-inquest-ink hover:bg-inquest-surface transition-colors cursor-pointer shrink-0"
              >
                Copy Link
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
