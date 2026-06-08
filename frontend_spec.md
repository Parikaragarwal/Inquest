# Inquest Frontend Specification

This document details the frontend architecture, design aesthetic, and feature set of the **Inquest** web application. It encapsulates all details necessary to recreate or extend the frontend from scratch.

## 1. Design System & Aesthetics

Inquest aims for an exceptionally warm, human-centered, non-technical feel. It deliberately eschews standard SaaS aesthetics in favor of a "letter writing" and deeply personal motif.

### Color Palette
The application is built on Tailwind CSS v4 using a **Caramel Sand & Terracotta Mid-Tone Theme**:
- **Backgrounds**: 
  - `inquest-base` (#EADFC8): Warm desert sand base background.
  - `inquest-surface` (#F2E9D8): Slightly lighter off-white for cards and elevated panels.
  - `inquest-depth` (#DFD3BB): A slightly darker shade for hover states or inset areas.
- **Borders & Rules**: 
  - `inquest-rule` (#D1C3A9): Subtle separator lines.
- **Typography/Ink**:
  - `inquest-ink` (#3E2723): Deep espresso brown for primary headings and text.
  - `inquest-ink-mid` (#5D4037): Softer brown for body copy.
  - `inquest-ink-soft` (#8D6E63): Subdued brown for labels and metadata.
  - `inquest-ink-ghost` (#BCAAA4): Lightest brown for placeholders.
- **Accents**:
  - `inquest-accent` (#D87040): Terracotta orange used for primary buttons, focus states, and calls to action.
  - `inquest-accent-soft` (#E08A63) & `inquest-accent-pale` (#FBE6DC).
- **Secondary Accents**:
  - `inquest-sage` (#E5A93C): Sunburst yellow for secondary highlights.
  - `inquest-caution` (#C62828): Red for destructive actions or validation errors.

### Typography
- **Serif Font**: Used heavily for headers, quotes, and philosophical text to evoke a printed, analog feel.
- **Sans-Serif Font**: Used for utility UI, small labels, and input fields for high legibility.

### Visual Effects (CSS Utilities)
- **Rounded Corners**: Generous radii (`rounded-2xl`, `rounded-3xl`) and custom `.fluid-border` (`2rem`) and `.fluid-border-lg` (`3rem`) for organic shapes.
- **Shadows**: Custom `.warm-shadow` containing hints of the espresso ink color rather than stark black shadows, and `.terracotta-glow` for primary buttons.
- **Micro-Animations**: Framer Motion is utilized extensively for fade-ins (`.animate-fade-in-up`), layout staggering, and button spring-taps. The `.card-lift` utility smoothly elevates cards on hover.

---

## 2. Core Features & Pages

### A. Landing Page (`/`)
- **Navigation**: Clean header with the brand name, a "Sign In" link (`/login`), and a primary "Get Started" button (`/sign-up`).
- **Hero Section**: Focuses heavily on the philosophical value proposition ("Ask questions that reach the people who know.").
- **Interactive Demo Container**: An embedded, interactive form segment that allows unauthenticated users to physically type a response into a textarea and hit "Share Answer."
- **Animations**: Ambient, slow-moving blurred blobs in the background using `framer-motion` (`mix-blend-multiply`), providing a dynamic, living backdrop.

### B. Authentication (`/login`, `/sign-up`)
- **Custom Auth**: Completely custom authentication UI bypassing third-party providers. 
- **Forms**: Clean email, password, and full name inputs using the `inquest-surface` card styling centered on the screen.
- **Integration**: Leverages tRPC mutations (`auth.signInUserWithEmailAndPassword` and `auth.createUserWithEmailAndPassword`) with secure, HTTP-only cookie-based session management.

### C. Dashboard (`/dashboard`)
- **Layout**: Two-column layout with a fixed left sidebar and scrolling right feed.
- **Sidebar**:
  - Logo and Workspace Owner identification (displays the user's name).
  - Navigation links: "Dashboard" and "Philosophy".
- **Companion Guide**: A dismissible "Quick-Start Companion" row of cards that instructs users on how to use the app in 4 easy steps.
- **Inline Form Creator**: A unified, horizontal input allowing users to quickly type a question/title and click "Create Enquiry". This automatically generates a new Form in the database and refetches the feed.
- **Active Enquiries Feed**: A list of `FormFeedRow` cards. Each card displays:
  - Form Title.
  - Number of responses received (live count via tRPC).
  - Status Badge ("public" or "private").
  - "Copy Link" and "Public Page" quick action buttons.

### D. Philosophy Page (`/dashboard/philosophy`)
- A static page emphasizing the ethos of the application. Designed to feel like an editorial or manifesto, heavily utilizing serif fonts, blockquotes, and generous line heights.

### E. Form Builder / Editor (`/dashboard/forms/[formId]`)
- **Header**: Allows editing of the Form's Title and optional Description. Includes a "Save Changes" / "Publish" button.
- **Privacy Settings**: A toggle to switch between a Public form and a Private form. Switching to Private automatically generates a 6-character alphanumeric `secureCode`.
- **Canvas (Left Column)**: A visual representation of the form fields.
  - Users can delete or re-order fields.
  - Clicking a field selects it for detailed editing.
- **Field Adder (Right Column - Default State)**: Buttons to append new fields to the form. Supported types:
  - Text (Short Answer)
  - Textarea (Long Answer)
  - Number
  - Boolean (Yes/No)
  - Date
  - Single Select (Radio buttons)
  - Multi Select (Checkboxes)
  - Email & Phone
- **Field Configuration (Right Column - Selected State)**: 
  - Edit Field Label and Placeholder.
  - Toggle "Required" status.
  - Add specific validation rules depending on type (e.g., Min/Max length for text, Min/Max value for numbers, specific choice options for Select fields).

### F. Public Form Submission (`/forms/[formId]`)
- **Access Control**:
  - If the form is private (`secureCode` exists in the DB), the URL must include `?code=[secureCode]`. If missing or incorrect, it displays a beautiful "Private Enquiry" gate asking for the code.
  - If the user is unauthenticated, they are presented with a warm warning: "Session Required. You must be logged in to submit a response..." along with sign-in/up buttons that include a `redirect_url` to return them to the form.
- **Dynamic Renderer**: Maps through the `form.fields` JSON array and renders the appropriate custom UI components.
  - Inputs feature floating labels, subtle focus rings (`focus:border-inquest-accent`), and real-time client-side validation hints (e.g., "Min: 10 chars").
  - Booleans use large, tappable "Yes/No" cards rather than tiny radio buttons.
- **Submission**: On submit, the payload is validated client-side, sent via tRPC (`submission.submitForm`), and the UI transitions to a peaceful "Response Submitted" success view featuring a green checkmark and a thank you message.

---

## 3. Tech Stack & Integration

- **Framework**: Next.js (App Router).
- **Styling**: Tailwind CSS v4, utilizing native CSS variables via `@theme` in `globals.css`.
- **Icons**: `lucide-react` for minimalist, consistent SVG iconography.
- **Animations**: `framer-motion` for complex layout transitions, orchestrations, and spring animations.
- **Data Fetching**: `@trpc/react-query` via a custom `~/trpc/client`.
- **Auth Hook**: `useGetuser()` from `~/hooks/api/auth`, wrapping a tRPC query to provide `user`, `isLoading`, and `isSignedIn` states universally.

## 4. Engineering Principles
- **No Third-Party Auth**: Built specifically to rely solely on the first-party Postgres database (via Drizzle) and JWTs set as secure cookies by the backend.
- **Data Driven UI**: The Form Builder serializes structural rules and validations into a JSON array stored in the DB, which the Public Form Submission page dynamically interprets to construct the DOM.
