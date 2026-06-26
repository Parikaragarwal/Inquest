# Inquest — Frontend Implementation Plan
**Theme: The Nostalgic Diary**
**Philosophy: "Don't trust intuition, collect data."**

---

## Table of Contents
1. [Current State Analysis](#1-current-state-analysis)
2. [Design System: Nostalgic Diary Tokens](#2-design-system-nostalgic-diary-tokens)
3. [Global Layout & Copy-Page Aesthetic](#3-global-layout--copy-page-aesthetic)
4. [Form Builder Redesign (Multi-Step)](#4-form-builder-redesign-multi-step)
5. [Theme Selection Center (Step 2)](#5-theme-selection-center-step-2)
6. [Secure Backgrounds via JSON Config](#6-secure-backgrounds-via-json-config)
7. [Form Settings & Finalization (Step 3)](#7-form-settings--finalization-step-3)
8. [Post-Creation Dashboard Card Actions](#8-post-creation-dashboard-card-actions)
9. [Form Submission Page (`/forms/[formId]`)](#9-form-submission-page-formsformid)
10. [Landing Page Overhaul](#10-landing-page-overhaul)
11. [Dark Mode Architecture](#11-dark-mode-architecture)
12. [Responsive Design Rules](#12-responsive-design-rules)
13. [Drag-and-Drop Fix](#13-drag-and-drop-fix)
14. [File-by-File Change Plan](#14-file-by-file-change-plan)
15. [New Files to Create](#15-new-files-to-create)
16. [Verification Plan](#16-verification-plan)

---

## 1. Current State Analysis

### What Exists
The project is a **Next.js 16 + TailwindCSS v4 + tRPC monorepo** under `apps/web/`. Key facts from reading the source:

#### `apps/web/app/globals.css`
- **Design tokens already defined** as CSS custom properties (`:root` and `.dark`).
- Light mode: Creamy warm palette (`--color-inquest-base: #F5EFEB`, deep coffee ink, terracotta orange accent).
- Dark mode: Void black (`#0B0705`), shiny black cards, terracotta orange glow.
- **Both palettes are good.** No changes needed to color tokens themselves.
- **Missing:** A "copy/notebook page" texture layer, glowing dark mode line effects, and the data-analysis watermark grid is only on the landing page (not site-wide).
- `@theme` block maps CSS vars to Tailwind classes — this is Tailwind v4 syntax and must be preserved exactly.

#### `apps/web/app/layout.tsx`
- Fonts: `Inter` (sans) + `Playfair Display` (serif) — already loaded from Google Fonts.
- Dark mode hydration script reads `localStorage.getItem('theme')` and applies `.dark` class on `<html>` before paint. This pattern is correct.
- `next-themes` is listed in `package.json` but NOT wired up — the dark mode toggle manually manipulates `document.documentElement.classList`. This should remain as-is (consistent with existing pattern, no need to add `ThemeProvider` complexity).

#### `apps/web/app/dashboard/forms/[formId]/page.tsx` (1748 lines — The Builder)
**Critical observations:**

**State structure** (lines 123–139):
```
title, description, isOpenForSubmission, requiresAuth, secureCode, theme (JSONB), fields[]
selectedFieldIndex, showMobileSidebar, showDeleteConfirm, showDescriptionModal,
showSettingsModal, hasDraft, shareUrl, activeSidebarTab ('question'|'settings'), darkMode
```

**Current layout** (lines 445–1053): A single vertical stack inside `h-[calc(100vh-60px)]`:
- **Header** (sticky): title input, description click-to-edit, nav buttons (dark mode toggle, Responses link, Copy Link, Save Changes).
- **Main Workspace** = `flex-1 flex md:flex-row`: 
  - **Canvas** (left, flex-1): `Reorder.Group` of field cards + add-field button grid below + bottom "Save Changes" if hasDraft.
  - **Desktop Sidebar** (right, `w-80`): Tabs ("Question Config" | "Styles & Setup") that swap between `FieldConfigPanel` and `FormSettingsSidebarPanel`.
  - **Mobile Sidebar** (overlay, `right-0`): Same tabs in a slide-in overlay.

**Problems identified:**
1. **Everything is cramped.** The canvas and sidebar compete on the same screen at 320px sidebar width. The add-field button grid is at the bottom of the canvas — below all the form fields — so users must scroll down constantly.
2. **The flow is non-linear.** Theme Designer, security settings, and field editing are all in the same sidebar with no guided progression.
3. **Drag-and-drop** uses Framer Motion's `Reorder.Group` which works but has no visual feedback during drag (no shadow lift, no "ghost" card). The `GripVertical` icon is visible but the cursor change is via pure CSS class `cursor-grab active:cursor-grabbing` on the icon's parent div, not on the `Reorder.Item` itself — this causes missed drag targets.
4. **Background image feature** accepts arbitrary URLs — a moderation risk.
5. **No multi-step flow** — all steps are collapsed into one page with sidebars.
6. **The save button appears at the top header AND at the bottom of both panels** — confusing placement, three identical buttons.
7. **`showSettingsModal`** is a small centered dialog with title/description/toggles/link — it conflates publish flow with settings.

**`FormSettingsSidebarPanel`** (lines 1408–1746): Contains:
- Share link + Copy Link button (large and prominent ✓)
- Title & Description inputs
- 3 toggle checkboxes (isOpenForSubmission, requiresAuth, secureCode)
- Theme Designer with: mini form preview, 3 preset swatches, custom hex color input, custom background image URL input, accent color picker, light/dark mode toggle
- Danger Zone (delete with "DELETE" confirmation)

**`FieldConfigPanel`** (lines 1058–1352): Contains:
- Field type dropdown selector
- Label input, placeholder input, required checkbox
- Per-type validation rules (minLength/maxLength/pattern for text; min/max for number/rating; date range; phone; options list for selects)

#### `apps/web/app/page.tsx` (Landing Page — 420 lines)
- Already has: watermark SVG grid, animated ambient blobs, flying paper planes (2 planes), floating data sheets (2 cards), hero with flying cards, "How It Works" 3-step section, Philosophy quote section.
- **Needs:** More sections (advertise Theme Selection Center), more novel animations, "page" feel.

#### `apps/web/app/dashboard/page.tsx` (Dashboard)
- Simple: Quick-Start Companion (dismissible), form title input to create, list of form cards.
- Form cards show title, Public/Private badge, response count, and action buttons (copy link, copy secure code, eye/preview, chevron).
- **Needs:** Better form card layout, more tactile feel.

#### `apps/web/app/dashboard/layout.tsx`
- Desktop: fixed left sidebar (`w-72`) with Inquest logo, user name/email, nav links (Dashboard, Styling Guide), sign out.
- Mobile: sticky top bar + hamburger → slide-in left sidebar.
- This layout **wraps** the builder page — important: the builder page uses `-mx-6 -my-6 sm:-mx-8 sm:-my-8 md:-mx-12 md:-my-12` negative margins to break out of the layout padding. This is the correct approach and must be preserved.

#### `apps/web/app/forms/[formId]/page.tsx` (Public Form Submission — 665 lines)
- Reads `theme` JSONB and applies `backgroundColor`, `backgroundImageUrl`, and `mode` (dark class on `<html>`).
- Renders form header (title, description), fields (all 10 field types), submit button.
- Has bot-trap honeypot, secure code gate, auth check, already-submitted check.
- **Needs:** The "copy page" texture should appear here when a form has the diary theme set. The end-user experience should reflect whatever theme the creator picked.

#### `apps/web/app/dashboard/forms/[formId]/responses/` (not listed in detail but exists)
- Analytics page with charts — likely uses Recharts which is already installed.

#### Key Dependencies Already Installed:
- `framer-motion: ^12.40.0` — for all animations
- `tailwindcss: ^4.1.18` — v4 syntax, `@theme` block in CSS
- `next-themes: ^0.4.6` — installed but NOT used
- `qrcode.react: ^4.2.0` — used in settings modal
- `lucide-react: ^0.562.0` — all icons
- `recharts: 2.15.4` — analytics charts
- `sonner: ^2.0.7` — toast notifications
- `@radix-ui/*` — full Radix suite for headless components
- `react-resizable-panels: ^4.2.1` — for resizable panel layouts

> **NOT installed:** `dnd-kit` — Reorder.Group from Framer Motion is used instead. We will fix the drag behavior within Framer Motion, not replace the library.

---

## 2. Design System: Nostalgic Diary Tokens

### Existing tokens to keep (in `globals.css`)
All 12 CSS custom properties in `:root` and `.dark` are correct and should not change.

### New tokens/utilities to ADD to `globals.css`

#### Copy-Page Texture Utility Classes
```css
/* Notebook ruled-line effect — horizontal lines like a copy page */
.page-lines {
  background-image: repeating-linear-gradient(
    to bottom,
    transparent,
    transparent calc(var(--line-height, 2rem) - 1px),
    var(--color-inquest-rule) calc(var(--line-height, 2rem) - 1px),
    var(--color-inquest-rule) var(--line-height, 2rem)
  );
}

/* Watermark data analysis grid — very faint, behind everything */
.data-watermark {
  background-image: 
    linear-gradient(var(--color-inquest-rule)/8% 1px, transparent 1px),
    linear-gradient(90deg, var(--color-inquest-rule)/8% 1px, transparent 1px);
  background-size: 40px 40px;
}

/* Dark mode: glowing orange-brown lines */
.dark .page-lines {
  background-image: repeating-linear-gradient(
    to bottom,
    transparent,
    transparent calc(var(--line-height, 2rem) - 1px),
    color-mix(in srgb, var(--color-inquest-accent) 15%, transparent) calc(var(--line-height, 2rem) - 1px),
    color-mix(in srgb, var(--color-inquest-accent) 15%, transparent) var(--line-height, 2rem)
  );
}

/* Page flip animation keyframes */
@keyframes page-flip-forward {
  0% { transform: rotateY(0deg); transform-origin: left center; }
  50% { transform: rotateY(-90deg); transform-origin: left center; }
  100% { transform: rotateY(-180deg); transform-origin: left center; }
}
@keyframes page-flip-back {
  0% { transform: rotateY(-180deg); transform-origin: left center; }
  50% { transform: rotateY(-90deg); transform-origin: left center; }
  100% { transform: rotateY(0deg); transform-origin: left center; }
}

/* Field card hover lift (builder) */
.field-card-lift {
  transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
}
.field-card-lift:hover {
  transform: translateY(-2px) scale(1.005);
  box-shadow: 0 8px 24px -4px rgba(200, 90, 23, 0.12);
}
.dark .field-card-lift:hover {
  box-shadow: 0 8px 24px -4px rgba(224, 111, 40, 0.18);
}

/* Glow border for selected field in dark mode */
.dark .field-selected {
  box-shadow: 0 0 0 1px var(--color-inquest-accent), 0 0 12px 2px rgba(224, 111, 40, 0.3);
}
```

#### Body texture
```css
body {
  background-color: var(--color-inquest-base);
  color: var(--color-inquest-ink);
  font-family: var(--font-sans);
  /* Add subtle copy-page texture to entire site */
  background-image: 
    repeating-linear-gradient(
      to bottom,
      transparent,
      transparent 31px,
      color-mix(in srgb, var(--color-inquest-rule) 40%, transparent) 31px,
      color-mix(in srgb, var(--color-inquest-rule) 40%, transparent) 32px
    );
  background-attachment: local;
}
```

---

## 3. Global Layout & Copy-Page Aesthetic

### Site-wide diary background
Every page should feel like a sheet from a notebook. The body background defined above gives ruled lines. On top of this, add a very faint data-watermark grid (SVG pattern) as a `position: fixed` overlay in the root layout (`layout.tsx`), similar to how the landing page already has it but applying globally.

**Implementation in `layout.tsx`:**
Add a `<div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">` containing:
1. The SVG grid pattern (copy from `page.tsx` landing page's watermark backdrop)
2. Set opacity: `opacity: [0.025]` in light mode, `opacity-[0.045]` in dark mode

This means the watermark appears consistently on every page (landing, dashboard, builder, form submission) without touching individual page files.

### Page-flip Transitions
Use Framer Motion's `AnimatePresence` with a custom `pageFlipVariants` for the multi-step builder flow. The "flip" is simulated with:
```ts
// variants for step transitions
const pageFlipVariants = {
  enter: (direction: 1 | -1) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    rotateY: direction > 0 ? 15 : -15,
    scale: 0.97,
  }),
  center: { x: 0, opacity: 1, rotateY: 0, scale: 1 },
  exit: (direction: 1 | -1) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0,
    rotateY: direction > 0 ? -15 : 15,
    scale: 0.97,
  }),
};
// transition: { type: 'spring', stiffness: 260, damping: 30, duration: 0.4 }
```
Use `perspective: '1200px'` on the parent container and `style={{ perspective: '1200px' }}` on the `motion.div`.

---

## 4. Form Builder Redesign (Multi-Step)

### Overview of new flow
The builder page at `/dashboard/forms/[formId]` is redesigned from a single-screen layout into a **3-step wizard** with a progress indicator. The steps are:

| Step | Name | Panel Content |
|------|------|---------------|
| 1 | **Build Questions** | Canvas (drag/drop fields) + right sidebar (field config) |
| 2 | **Design Theme** | Full-width theme preview + left control panel |
| 3 | **Publish & Settings** | Settings card with all toggles + share/QR |

### Progress Indicator (Novel "Bookmark Tab" Design)
Instead of a bottom trackline or a standard stepper, use vertical **bookmark tabs** on the right edge of the screen (desktop), aligned to the page content like physical bookmark dividers in a notebook. On mobile, use a compact horizontal step indicator at the top, just below the header.

The bookmark tabs design:
- 3 tall narrow vertical pills on the **right edge** (`fixed right-0 top-1/2 -translate-y-1/2`)
- Each tab has a step number (01, 02, 03) written vertically
- Active tab is pulled to the left (like a bookmark pulled forward), colored with `inquest-accent`
- Inactive tabs are `inquest-surface` with a slight shadow, recessed to the right
- Clicking a tab navigates to that step (with page-flip animation)

```tsx
// Bookmark tab component concept
<div className="fixed right-0 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2 pr-0">
  {steps.map((step, i) => (
    <button
      key={i}
      onClick={() => navigateStep(i + 1)}
      className={cn(
        "flex flex-col items-center justify-center",
        "w-10 h-24 rounded-l-2xl border border-r-0 transition-all duration-300",
        "text-[10px] font-bold tracking-widest writing-mode-vertical",
        currentStep === i + 1
          ? "bg-inquest-accent text-white translate-x-0 shadow-lg border-inquest-accent"
          : "bg-inquest-surface text-inquest-ink-soft translate-x-2 border-inquest-rule hover:translate-x-0"
      )}
      style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
    >
      {`0${i + 1}`}<br/>{step.label}
    </button>
  ))}
</div>
```

On mobile: hide the bookmark tabs, show a simple step indicator bar:
```tsx
<div className="flex gap-0 border-b border-inquest-rule overflow-hidden">
  {steps.map((step, i) => (
    <button className={cn("flex-1 py-2.5 text-[10px] font-bold", ...)}>
      {i + 1}. {step.shortLabel}
    </button>
  ))}
</div>
```

### Step 1 — Build Questions (Canvas)

#### Layout Change
Remove the right sidebar that's always visible. Instead, the canvas fills the full available width (`flex-1`). When a field is selected, a **bottom drawer** (on mobile) or **floating right panel** (on desktop) slides in.

On **desktop** (`md:`): A 320px right panel slides in from the right only when a field is selected (`AnimatePresence` with `x: '100%'` → `x: 0`). When no field is selected, the canvas gets full width.

On **mobile**: The right panel becomes a **bottom sheet** (uses Radix Drawer via `vaul` which is already installed).

This eliminates the "crammed" feeling because the canvas can now be as wide as the screen.

#### Add-Field Controls
Move the "add field" controls from the bottom of the canvas (below all fields) to a **floating action button** (FAB) and a **collapsible field palette** that appears near the canvas.

Two variants:
1. **FAB approach:** A large `+` button in the bottom right corner (`fixed bottom-8 right-[calc(bookmark-width+16px)] z-20`). Clicking it expands into a grid of field type tiles with an animation (`scale: 0 → 1`, stagger children).
2. **In-canvas prompt:** When the canvas is empty, show a beautiful "Start your enquiry" empty state with field type cards that are **bigger**, with icons and labels, and playful hover animations (slight rotation + lift).

When fields exist, the FAB opens the field palette. This palette appears as an animated card with a `2×5` grid of field type buttons (10 types). Each tile is 80×70px (much larger than current ~44px items). Icons are 24px. On hover: `scale(1.05)`, `rotate(-1deg)`, and a warm terracotta shadow.

#### Field Cards in Canvas
Replace the current compact list cards with **diary-entry style** field cards:

Current: small `p-5` card with Q1 label, field label, type badge, delete button, grip icon.

New:
```
┌───────────────────────────────────────────┐
│ ≡  [grip]   Q1 · Required            [✕]  │  ← 40px top bar
│                                           │
│  What is your name?                       │  ← Large serif label (text-xl)
│                                           │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  [placeholder answer line]  │
│  Short Answer                             │  ← type tag (small, italic)
└───────────────────────────────────────────┘
```

Cards have:
- `min-h-[96px]` (much larger than current `p-5`)
- A faint `page-lines` rule inside the card body (like a ruled page)
- In dark mode: `dark .field-selected` glow effect
- The grip handle (`GripVertical`) should be on the `Reorder.Item` directly, not a child div, to fix drag targeting
- "Add field below" micro-action that appears on hover (small `+` between cards)

#### Field Config Right Panel (when field selected)
The slide-in panel at step 1 contains the same `FieldConfigPanel` logic, but redesigned:
- No longer a sidebar "tab" — it's a standalone `motion.div` at `position: fixed right-0`
- Header: "Configure Field" with an `X` to close (deselect)
- Sections are collapsible accordions (use Radix `Accordion` which is already installed)
- Bottom: "Done" button to deselect; if `hasDraft`, show "Save Changes" below

### Step 1 State Management
The state management does NOT change — same `useState` hooks, same `handleSave`, same tRPC mutations. Only the **presentation** changes. `selectedFieldIndex`, `fields`, etc. all remain in the parent `FormBuilderPage` component. The step (`currentStep: 1|2|3`) is new local state added to `FormBuilderPage`.

```ts
const [currentStep, setCurrentStep] = useState<1|2|3>(1);
const [stepDirection, setStepDirection] = useState<1|-1>(1);

const navigateStep = (newStep: 1|2|3) => {
  setStepDirection(newStep > currentStep ? 1 : -1);
  setCurrentStep(newStep);
};
```

No data is lost between steps because all state is at the top level and persists in `localStorage` draft as before.

---

## 5. Theme Selection Center (Step 2)

### Concept
Step 2 is a **full-screen form preview** that shows exactly what the form filler will see, with a small control panel overlay. The creator sees their actual form, rendered with the chosen theme, and can interactively change the theme and see updates in real time.

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────┐    │
│  │           LIVE FORM PREVIEW (full width)            │    │
│  │  (Exact replica of /forms/[formId] — same fields,   │    │
│  │   same layout, same fonts — but non-interactive)    │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌──────────────────────────────────────┐                   │
│  │  THEME CONTROL PANEL (overlay card)  │  ← draggable,    │
│  │  Position: bottom-left, or pull up   │     collapsible  │
│  └──────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

The preview renders a non-interactive read-only version of all `fields[]` using the same rendering logic from `/apps/web/app/forms/[formId]/page.tsx`. This should be extracted into a shared `FormPreview` component.

### Theme Control Panel
A card (`rounded-3xl`, `warm-shadow`, `bg-inquest-surface/95 backdrop-blur-xl`) that is **draggable** (use Framer Motion's `drag` prop with `dragConstraints`). It sits in the bottom-left corner by default but can be dragged anywhere.

Content of the panel:
```
┌─────────────────────────────────────────────────┐
│  🎨 Theme Designer          [Collapse ▲]        │
├─────────────────────────────────────────────────┤
│  Mode:  [☀ Light]  [🌙 Dark]                    │
├─────────────────────────────────────────────────┤
│  Color Themes (for this mode):                   │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐        │
│  │      │  │      │  │      │  │      │        │
│  │  W1  │  │  D1  │  │  W2  │  │  W3  │        │
│  └──────┘  └──────┘  └──────┘  └──────┘        │
│  (4 light themes + 4 dark themes, tab-separated)│
├─────────────────────────────────────────────────┤
│  Background Image:                               │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │  bg1 │ │  bg2 │ │  bg3 │ │  bg4 │ │  bg5 │  │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘  │
│  (thumbnail grid from backgrounds.json)         │
├─────────────────────────────────────────────────┤
│  Accent Color:  [🔴] [🟠] [🟡] ● custom picker │
└─────────────────────────────────────────────────┘
```

#### Preset Themes Expansion
Expand from 3 presets to at least 8 (4 light, 4 dark):

**Light Themes:**
1. Warm Parchment — `#F5EFEB`, accent `#D97436` (current default)
2. Linen Cream — `#FEFAF3`, accent `#B56B20`
3. Dusty Rose Diary — `#FDF0EF`, accent `#C45E5E`
4. Sage Notebook — `#F3F5F0`, accent `#5E7A5E`

**Dark Themes:**
1. Midnight Studio — `#0B0705`, accent `#E06F28` (current default)
2. Deep Ocean — `#070B12`, accent `#2980B9`
3. Ink Well — `#0D0D0D`, accent `#D4AF37`
4. Charcoal Draft — `#131313`, accent `#8B7355`

Each preset is presented as a visual tile:
- A mini card with the background color fill
- A small dot of the accent color in the center
- Name label below
- Active state: `ring-2 ring-inquest-accent scale-105`
- A "Light" or "Dark" badge

#### Light vs Dark Mode Division
Two tab headers: "Light Mode Theme" | "Dark Mode Theme". Selecting a theme from the Light tab sets `theme.lightMode = { ... }` and from the Dark tab sets `theme.darkMode = { ... }`.

Wait — this requires a **schema change**. Currently `theme` is:
```ts
{ backgroundColor, backgroundImageUrl, accentColor, mode, backgroundId }
```

The new schema should be:
```ts
{
  lightMode: {
    backgroundColor: string,
    accentColor: string,
    backgroundId: string | null,
  },
  darkMode: {
    backgroundColor: string,
    accentColor: string,
    backgroundId: string | null,
  },
  // 'mode' remains the creator's current toggle — which preview they see
  creatorPreviewMode: 'light' | 'dark'
}
```

The form submission page (`/forms/[formId]/page.tsx`) will read from `theme.lightMode` or `theme.darkMode` based on the visitor's system preference (or explicit toggle if provided). This is a backward-compatible extension — old forms with `theme.backgroundColor` still work via a fallback.

The builder preview at step 2 shows the selected `creatorPreviewMode` — toggling between light and dark tabs instantly shows the preview of what either experience looks like.

---

## 6. Secure Backgrounds via JSON Config

### Problem
Currently `theme.backgroundImageUrl` accepts any arbitrary URL. Users can enter inappropriate image URLs.

### Solution
Replace the free-form URL input with a **curated image picker** backed by a JSON file.

### New file: `apps/web/public/backgrounds.json`
```json
{
  "backgrounds": [
    {
      "id": "none",
      "label": "None",
      "url": null,
      "thumbnail": null
    },
    {
      "id": "parchment_texture",
      "label": "Aged Parchment",
      "url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80&auto=format&fit=crop",
      "thumbnail": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&q=60&auto=format&fit=crop",
      "category": "texture"
    },
    {
      "id": "grid_paper",
      "label": "Graph Paper",
      "url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80",
      "thumbnail": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=60",
      "category": "texture"
    },
    {
      "id": "marble_white",
      "label": "White Marble",
      "url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80",
      "thumbnail": "...",
      "category": "texture"
    },
    {
      "id": "forest_mist",
      "label": "Forest Mist",
      "url": "...",
      "thumbnail": "...",
      "category": "nature"
    }
    // Add more as needed — any new image requires editing this file only
  ]
}
```

### Rendering in Theme Control Panel
```tsx
// Load backgrounds.json (static import — no API call needed)
import backgrounds from '~/public/backgrounds.json'; // or fetch('/backgrounds.json')

// Render as a horizontal scroll of thumbnail cards
<div className="flex gap-2 overflow-x-auto pb-2">
  {backgrounds.backgrounds.map((bg) => (
    <button
      key={bg.id}
      onClick={() => setTheme(prev => ({
        ...prev,
        [activeMode + 'Mode']: { ...prev[activeMode + 'Mode'], backgroundId: bg.id }
      }))}
      className={cn("shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all",
        selectedBgId === bg.id ? "border-inquest-accent scale-105" : "border-inquest-rule"
      )}
    >
      {bg.thumbnail ? (
        <img src={bg.thumbnail} className="w-full h-full object-cover" alt={bg.label} />
      ) : (
        <div className="w-full h-full bg-inquest-depth flex items-center justify-center text-[8px] text-inquest-ink-ghost">None</div>
      )}
    </button>
  ))}
</div>
```

### In Form Submission (`/forms/[formId]/page.tsx`)
Instead of applying `theme.backgroundImageUrl`, resolve the ID:
```ts
import backgrounds from '~/public/backgrounds.json';

const bgEntry = backgrounds.backgrounds.find(b => b.id === themeObj.lightMode?.backgroundId);
if (bgEntry?.url) {
  containerStyle.backgroundImage = `url(${bgEntry.url})`;
}
```

### Backwards Compatibility
If `themeObj.backgroundImageUrl` exists (old forms), still use it. If `themeObj.lightMode?.backgroundId` exists (new forms), use the JSON lookup.

### Background + Copy-Page Overlay
When a background is selected, the form page STILL shows the copy-page texture on top. Achieve this with:
```css
/* In the form container, after background image is applied: */
.form-page-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    to bottom,
    transparent,
    transparent 31px,
    rgba(180, 140, 100, 0.08) 31px,
    rgba(180, 140, 100, 0.08) 32px
  );
  pointer-events: none;
  z-index: 1;
}
```
This makes the background image show through while keeping the diary feel.

---

## 7. Form Settings & Finalization (Step 3)

### Layout
Step 3 is NOT a modal — it's a full step in the wizard. It has two columns on desktop, one column on mobile:

**Left column (or top on mobile): Form Identity**
- Title input (large, serif font, prominent)
- Description textarea (tall, with placeholder "Tell your respondents what this is about...")
- Preview of how it looks to respondents (compact form header preview card)

**Right column (or bottom on mobile): Security & Publishing**
- **"Accepting Responses"** — styled Toggle (Radix Switch component, already installed) with label and subtext
- **"Require User Login"** — Toggle
- **"Require Secure Code"** — Toggle; when enabled, shows the generated code in a styled box with Copy + Regenerate buttons
- **Shareable Link** box (read-only input + Copy button, large and obvious)
- **QR Code** section (collapsible)
- **"Publish & Save"** button (large, full width, terracotta glow, pulsing if hasDraft)

The Delete (danger zone) is removed from this step. Move it to a separate "Advanced" section accessible via a small text link at the bottom of the settings column.

### Replace HTML checkboxes with Radix Switch
Currently all toggles are `<input type="checkbox">`. Replace with Radix `<Switch>` for better UX:
```tsx
import * as Switch from '@radix-ui/react-switch';

<div className="flex items-center justify-between">
  <div>
    <label className="text-sm font-medium text-inquest-ink">Accepting Responses</label>
    <p className="text-xs text-inquest-ink-soft">Allow public submissions</p>
  </div>
  <Switch.Root
    checked={isOpenForSubmission}
    onCheckedChange={setIsOpenForSubmission}
    className="w-12 h-6 bg-inquest-depth rounded-full relative data-[state=checked]:bg-inquest-accent transition-colors"
  >
    <Switch.Thumb className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform data-[state=checked]:translate-x-6 shadow-sm" />
  </Switch.Root>
</div>
```

### Settings Save flow (clarified)
The "Save & Publish" button at step 3 directly calls `handleSave()` — no intermediate modal needed. The flow is:
1. User clicks "Publish & Save" 
2. Button shows loading state ("Publishing...")
3. On success: toast "Changes saved" + step resets to 1 (or redirects to dashboard)

Remove `showSettingsModal` entirely — it is replaced by Step 3.

---

## 8. Post-Creation Dashboard Card Actions

### Problem
After a form is created and saved, the dashboard card actions are small icon buttons that are not obvious.

### New Form Card Design
On the dashboard, form cards expand their action section. Keep click-to-edit behavior, but make the actions visible labels (not just icons):

```
┌──────────────────────────────────────────────────────────┐
│  📋 Customer Feedback Survey           🔒 Private        │
│  "A quick survey to understand your experience."         │
│  👥 14 responses · Created Jun 22                        │
├──────────────────────────────────────────────────────────┤
│  [📋 Copy Link]  [🔑 Copy Code]  [👁 Preview]  [→ Edit]  │
└──────────────────────────────────────────────────────────┘
```

The bottom action bar is always visible (not hover-reveal). On mobile, actions collapse to a "..." menu using Radix DropdownMenu.

Key button labels:
- **Copy Link** — copies `window.location.origin + /forms/{id}` (or with `?code=` if private) 
- **Copy Code** — copies `secureCode` (only visible if form is private)
- **Preview** — opens `/forms/{id}` in a new tab
- **Edit** — navigates to `/dashboard/forms/{id}`
- **Delete** — small destructive link (not a button), triggers a confirmation modal

---

## 9. Form Submission Page (`/forms/[formId]`)

### Changes needed
The submission page (`apps/web/app/forms/[formId]/page.tsx`) reads the `theme` JSONB and applies styling. Update it to:

1. **Apply the new theme schema** (read from `theme.lightMode` or `theme.darkMode` based on system/user preference, with fallback to old `theme.backgroundColor`).
2. **Resolve background from `backgrounds.json`** instead of arbitrary URL.
3. **Add copy-page texture overlay** on top of background.
4. **Apply `mode` to `<html>` class** — already done at line 90–96, keep this.
5. **Field cards** should also feel like diary entries (same `page-lines` effect inside cards if theme has the diary texture enabled).

### Extract `FormPreview` Component
For step 2 (Theme Selection Center), we need to render a preview of the form. Extract the field rendering logic from `/forms/[formId]/page.tsx` into a reusable component at:
`apps/web/components/form-preview.tsx`

This component takes:
```ts
interface FormPreviewProps {
  fields: FormField[];
  title: string;
  description: string;
  theme: Record<string, any>;
  interactive?: boolean; // false in builder preview, true in submission page
}
```

---

## 10. Landing Page Overhaul

### New Sections to Add

#### Current sections:
1. Nav
2. Hero (with flying cards)
3. How It Works (3 steps)
4. Philosophy Quote
5. Footer

#### New sections to add:
1. **Theme Showcase** — After "How It Works". Shows the Theme Selection Center feature. A side-by-side (or before/after) mockup of a form in light vs dark mode. Animation: the two cards "deal out" like playing cards when scrolled into view.
2. **"Collect, Then Trust"** — Before the Philosophy Quote. Shows a mini dashboard with animated bar charts (using pure CSS animated bars, no real data needed). Philosophy copy: "Your intuition says one thing. Your data says another. Trust your data." 
3. **Social Proof / Use Cases** — Small cards flying in with example use cases (Employee Surveys, Research Forms, Event Registrations, Customer Feedback).

#### Landing Page Animations Enhancement
Currently: 2 paper planes, 2 floating data sheets.

**Add more:**
- 3rd paper plane that arcs differently (e.g., curves down and back up)
- A floating "notebook page" — a slightly larger white rectangle with ruled lines, tumbling slowly from left to right
- A "data dot" particle effect: ~12 small dots `w-1.5 h-1.5 bg-inquest-accent/20` scattered, each with `animate-float` (floating up and down on different offsets), like particles in a data visualization

**Hero enhancement:**
Add a second hero illustration element — "two hands" SVG is already there but very simple. Expand it with:
- A more visible "person extending hand" SVG silhouette on the right (creator)
- A small form card floating toward the center from the creator's hand
- On the opposite side, a "crowd" of small avatars (simple circles) reaching for the form card

This visually conveys: "Creator asks → public responds → data is collected."

#### CTA Section (Before Footer)
New final CTA block:
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│    Don't guess. Ask.                                │
│    Then listen to what the data says.               │
│                                                     │
│    [  Build Your First Enquiry  →  ]                │
│                                                     │
└─────────────────────────────────────────────────────┘
```
Animated: the entire section appears with a "page sliding in" effect as you scroll to it. The text appears word by word with a stagger.

---

## 11. Dark Mode Architecture

### Current Implementation (Correct — Keep It)
1. `layout.tsx` has an inline `<script>` that reads `localStorage.getItem('theme')` and sets/removes `.dark` class on `<html>` before paint. This prevents FOUC.
2. Individual pages (`page.tsx` landing, builder page, form submission page) each maintain a local `darkMode` state and call `document.documentElement.classList.add/remove('dark')` on toggle.

### Issues to Fix

**Issue 1: Three sources of truth for dark mode**
- `localStorage.getItem('theme')` (global)
- `theme.mode` in form builder (form-specific, builder preview only)
- `themeObj.mode` in form submission (form-specific, end-user experience)

These should NOT interfere. The form builder's dark mode toggle should ONLY affect the builder UI (not persist to `localStorage`). The form submission page should apply the form's theme mode to `<html>` independently.

**Fix:** 
- Keep the `localStorage` `'theme'` key for the global site toggle.
- The builder's dark mode toggle (`toggleDarkMode` in builder page) should temporarily set `<html>` class for preview, but when the user navigates away, it restores from `localStorage`.
- Add a `useEffect` cleanup in the builder that restores `localStorage` theme on unmount.

**Issue 2: Form submission overrides global dark mode permanently**
The submission page does `document.documentElement.classList.add('dark')` based on form theme but never cleans it up. Fix: use a `useEffect` cleanup that removes the class on unmount.

### New Dark Mode Variables to Utilize
Add these missing utilities that are used by the new design but not currently in `globals.css`:
```css
.dark .glow-text-accent {
  text-shadow: 0 0 12px rgba(224, 111, 40, 0.6);
}
.dark .glow-border-accent {
  box-shadow: 0 0 0 1px var(--color-inquest-accent), 0 0 8px rgba(224, 111, 40, 0.25);
}
.dark .glow-bg-surface {
  box-shadow: 0 4px 24px rgba(224, 111, 40, 0.08);
}
```

---

## 12. Responsive Design Rules

### Breakpoints in Use (Tailwind v4)
Tailwind's default breakpoints apply: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`.

### Builder Page Responsiveness

**Mobile (< 768px):**
- Step indicator: horizontal compact bar at top (below sticky header)
- Bookmark tabs: HIDDEN
- Step 1 Canvas: full width, no sidebar
- Field selected: bottom sheet (Radix `vaul` Drawer) for field config
- Step 2 Theme Center: stacked (preview on top, control panel below)
- Step 3 Settings: single column

**Tablet (768px–1024px):**
- Bookmark tabs: visible, right edge
- Step 1: Canvas fills `calc(100% - 280px)`, config panel is 280px right slide-in
- Step 2: Preview takes 60%, control panel 40%
- Step 3: Two columns (55%/45%)

**Desktop (> 1024px):**
- Same as tablet but more spacious

### Landing Page Responsiveness
Currently mostly responsive. Additions:
- New sections use `grid-cols-1 md:grid-cols-2` for side-by-side layouts
- Flying elements are CSS-only on mobile (no Framer Motion, for performance)
- Hero: on mobile, right column (flying cards) stacks below copywriting

### Dashboard Responsiveness
Currently: Desktop has left sidebar, mobile has top bar + hamburger. Keep this.

Form cards: on mobile, the action bar collapses to `...` dropdown using Radix `DropdownMenu` (already installed).

### Form Submission Page Responsiveness
The form renders in a `max-w-2xl mx-auto` container that already works on all screen sizes. The diary page texture should scale correctly.

---

## 13. Drag-and-Drop Fix

### Root Cause of Poor DnD Experience
The current implementation uses `framer-motion`'s `Reorder.Group` and `Reorder.Item`. These work but have issues:

1. **Grip icon is on a child `div`, not the `Reorder.Item`** — The `cursor-grab` class is set on the icon's parent div, but Framer Motion needs the drag to start on the `Reorder.Item` itself. This means clicking outside the grip icon but still on the card unexpectedly triggers drag.

2. **No visual drag feedback** — When dragging, the dragged card looks identical to its resting state. No shadow, no opacity change, no "lifted" appearance.

3. **No drop zone hint** — Other cards don't react when something is dragged over them.

### Fix Plan

**Fix 1: `dragListener` on Reorder.Item**
Set the `Reorder.Item` to have `dragListener={false}` (don't auto-drag on the whole item) and instead use a custom `useDragControls()` bound to the grip handle:

```tsx
const controls = useDragControls();
<Reorder.Item
  value={field}
  dragListener={false}
  dragControls={controls}
  ...
>
  <div onPointerDown={(e) => controls.start(e)} className="cursor-grab active:cursor-grabbing">
    <GripVertical size={20} />
  </div>
  {/* rest of card */}
</Reorder.Item>
```

This makes the grip handle the ONLY drag trigger, preventing accidental card drags when clicking elsewhere.

**Fix 2: Visual drag state via `whileDrag`**
```tsx
<Reorder.Item
  whileDrag={{
    scale: 1.03,
    boxShadow: "0 20px 40px -8px rgba(200, 90, 23, 0.25)",
    opacity: 0.95,
    zIndex: 50,
  }}
  transition={{ type: "spring", stiffness: 300, damping: 30 }}
>
```

**Fix 3: Drop zone glow on non-dragged cards**
This requires `useDragControls` and tracking the dragged item. A simpler approach: apply a CSS transition on all non-selected cards' `margin-top` to create a "gap" where the dragged item will land. This can be done with the `layout` prop:

```tsx
<Reorder.Item layout="position" transition={{ duration: 0.2 }}>
```

This makes other cards smoothly shift position during drag.

**Fix 4: Touch Support**
Add `touch-action: none` to the grip handle via `style={{ touchAction: 'none' }}` so touch drag works on mobile without page scrolling interfering.

---

## 14. File-by-File Change Plan

### `apps/web/app/globals.css`
- **ADD:** `.page-lines`, `.data-watermark`, dark mode glow utilities, `@keyframes page-flip-forward/back`, `.field-card-lift`, `.dark .field-selected`, `.dark .glow-text-accent`, `.dark .glow-border-accent`
- **MODIFY:** `body` — add copy-page background texture lines
- **KEEP:** All `:root`, `.dark`, and `@theme` blocks unchanged

### `apps/web/app/layout.tsx`
- **ADD:** Site-wide watermark grid `<div>` (fixed, pointer-events-none, z-0) rendering the SVG grid pattern from `page.tsx`
- **KEEP:** Font imports, metadata, inline dark mode script, `GlobalProviders`

### `apps/web/app/page.tsx` (Landing)
- **ADD:** Theme Showcase section (after "How It Works"), "Collect Then Trust" section, Social Proof cards section, final CTA section
- **ADD:** 3rd paper plane animation, notebook page floating element, data particle dots
- **MODIFY:** Hero illustration — expand two-hands SVG into "creator asks → public responds" visual story
- **KEEP:** Existing structure, nav, philosophy quote, footer

### `apps/web/app/dashboard/page.tsx` (Dashboard)
- **MODIFY:** Form card layout — add always-visible action bar with labeled buttons
- **MODIFY:** Empty state — make more diary-themed
- **KEEP:** Create form input, Quick-Start Companion, data loading logic

### `apps/web/app/dashboard/layout.tsx`
- **KEEP:** Structure unchanged. Only cosmetic CSS tweaks (slightly more diary texture to the sidebar).

### `apps/web/app/dashboard/forms/[formId]/page.tsx` (Builder — MAJOR CHANGES)
- **ADD state:** `currentStep: 1|2|3`, `stepDirection: 1|-1`
- **ADD:** Bookmark tab navigation component (right edge, vertical)
- **REPLACE:** Single-screen layout with `AnimatePresence` + `pageFlipVariants` multi-step
- **STEP 1 changes:**
  - Canvas goes full-width
  - Floating FAB + expandable field palette
  - Larger field cards with page-lines texture
  - Fix DnD (dragControls, whileDrag, layout)
  - Field config panel slides in from right (AnimatePresence)
- **STEP 2:** Full-screen `FormPreview` + draggable Theme Control Panel overlay
- **STEP 3:** Form settings card (title, description, Radix Switch toggles, share link, QR, publish button)
- **REMOVE:** `showDescriptionModal`, `showSettingsModal` — replaced by step 3
- **REMOVE:** Old desktop sidebar (300px right sidebar with tabs)
- **REMOVE:** Mobile sidebar overlay (replaced by bottom sheet)
- **REMOVE:** Header "Save Changes" and "Copy Link" buttons in header (these move to step 3)
- **KEEP:** All tRPC mutations (`updateForm`, `deleteForm`), `handleSave`, `hasDraft` logic, localStorage draft, `shareUrl`, `copyShareLink`, `copySecureCode` helpers
- **UPDATE:** `theme` JSONB to new schema with `lightMode`, `darkMode`, `creatorPreviewMode`

### `apps/web/app/forms/[formId]/page.tsx` (Submission)
- **MODIFY:** Read new theme schema (with fallback)
- **MODIFY:** Resolve `backgroundId` from `backgrounds.json`
- **ADD:** `form-page-overlay` texture on top of background
- **ADD:** `useEffect` cleanup to restore dark mode on unmount
- **KEEP:** All field rendering, honeypot, auth logic, submit mutation

---

## 15. New Files to Create

### `apps/web/public/backgrounds.json`
Curated background image list. Contains 8–12 entries with `id`, `label`, `url`, `thumbnail`, `category`. Any future images are added here without code changes.

### `apps/web/components/form-preview.tsx`
Shared component used both in:
- Builder Step 2 (Theme Selection Center) — read-only preview
- Form submission page — interactive form

```ts
// Props
interface FormPreviewProps {
  fields: FormField[];
  title: string;
  description: string;
  theme: ThemeConfig; // new schema
  mode: 'light' | 'dark';
  interactive?: boolean; // true = shows inputs, false = shows static mockups
  answers?: Record<string, string>; // only used when interactive=true
  onAnswerChange?: (fieldId: string, value: string) => void;
}
```

### `apps/web/components/page-flip-transition.tsx`
Wrapper component for AnimatePresence page-flip:
```tsx
// Wraps children with the pageFlipVariants animation
// Takes `step` and `direction` props
```

### `apps/web/components/builder/field-palette.tsx`
The expandable FAB + field type grid used in builder step 1:
```tsx
// Props: onAddField: (type: string) => void, disabled: boolean
```

### `apps/web/components/builder/bookmark-tabs.tsx`
The right-edge vertical bookmark navigation:
```tsx
// Props: currentStep: 1|2|3, onNavigate: (step: 1|2|3) => void
```

### `apps/web/components/builder/theme-control-panel.tsx`
The draggable theme control panel overlay used in step 2:
```tsx
// Props: theme, setTheme, mode, setMode, backgrounds, fields (for real-time preview)
```

---

## 16. Verification Plan

After implementation, verify each concern:

### TypeScript
```bash
cd apps/web && pnpm run check-types
```
Must pass with 0 errors. The `FormBuilderPage` component's JSX must be properly closed at all times. Use incremental saves and type-checks.

### Dark Mode
1. Toggle global dark mode on landing page → verify site-wide dark mode applies correctly
2. Open builder, toggle step 2 dark mode preview → verify only the form preview is dark, not the entire browser
3. Navigate away from builder → verify dark mode restores to global `localStorage` setting

### Drag-and-Drop
1. Open builder with 3+ fields
2. Use grip handle to drag field 3 to position 1 → verify smooth animation and correct reorder
3. Try clicking field card body (NOT grip) → verify NO drag starts
4. Try on touch device / mobile viewport

### Secure Code
1. Enable secure code in step 3 → verify `secureCode` state is non-null
2. Save form → verify `secureCode` is stored in DB (not empty string)
3. Navigate to `/forms/{id}` without code → verify 401/UNAUTHORIZED tRPC error
4. Navigate to `/forms/{id}?code={code}` → verify form loads

### Background Images
1. In step 2, select a background thumbnail → verify form preview shows the image
2. Save form → navigate to `/forms/{id}` → verify same background appears
3. Try to manually edit `backgrounds.json` and add a new image → verify it appears in picker on next load

### Responsive
1. Test builder at 375px width (mobile) — step indicator horizontal, field palette via FAB, field config as bottom sheet
2. Test builder at 768px (tablet) — bookmark tabs visible, panels functional
3. Test landing page at 375px — hero cards stack, animations still run
4. Test form submission page at 375px — form renders cleanly, submit works

### Build
```bash
pnpm run build
```
Production build must succeed without errors.

---

## Summary of Breaking Changes to Watch

1. **`theme` JSONB schema change** — Old forms have `{ backgroundColor, accentColor, mode, backgroundImageUrl }`. New forms will have `{ lightMode: {...}, darkMode: {...}, creatorPreviewMode }`. Both the builder and submission pages must handle both schemas gracefully via fallback logic. **Do NOT run a DB migration** — the fallback in code is sufficient since the `theme` column is `jsonb`.

2. **`showSettingsModal` removal** — Any code that calls `setShowSettingsModal(true)` (bottom of canvas Save button, sidebar Save button) must be changed to `navigateStep(3)` or `setCurrentStep(3)` instead.

3. **`showDescriptionModal` removal** — Description is now directly editable in Step 3's form identity section. Remove the click-to-open description modal from the header.

4. **Sidebar tabs removal** — `activeSidebarTab` state (`'question' | 'settings'`) is no longer needed. The step navigation replaces this concept.
