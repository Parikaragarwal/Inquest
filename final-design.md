Implementation Plan - Visual Design & Animation Improvements
This plan outlines the visual enhancements for Inquest. The goal is to make the product's design feel more premium, readable, and dynamic:

Make the paper plane background animations more noticeable.
Optimize the light theme background overlay so the background image is more visible and stunning.
Darken the notebook ruled lines and margin line for better contrast.
Tone down the component background contrast (density) in both light and dark modes to blend them more elegantly.
Enhance home page animations with subtle, premium micro-animations (e.g., continuous page floating, hover effects, staggered entrance animations).
Introduce floating background "notebook pages" and "analytical data sheets" in the background watermarks.
Provide clear documentation in this plan indicating where and how you can tweak these variables in the future.
User Review Required
NOTE

All changes are subtle visual tweaks and will not affect the core functionality of the product. The color scheme changes to the variables --color-inquest-surface and --color-inquest-depth will make container/card elements feel softer and more integrated into the parchment paper and moonlit lake backgrounds.

Proposed Changes
[Core Styling]
[MODIFY] 
globals.css
We will modify the CSS variables and backgrounds in globals.css to tone down component backgrounds, darken notebook lines, and make the background image more visible.

1. Component Background Tones (Toning Down Contrast)
We will adjust the --color-inquest-surface and --color-inquest-depth variables to make them softer and blend more gracefully with the base cream/dark background:

Light Mode:
--color-inquest-surface: Change from #FCFAF8 (stark white) to #FAF5F2 (soft warm cream).
--color-inquest-depth: Change from #EBE0D8 (dense grey-beige) to #ECE2DB (softer warm tone).
Dark Mode:
--color-inquest-surface: Change from #130D0B to #0F0A08 (closer to deep background).
--color-inquest-depth: Change from #1A130F to #150F0C (softer contrast depth).
2. Background Image Visibility & Darker Lines
We will modify the body background styles:

Ruled Lines Opacity: Change the light theme repeating linear gradient from rgba(160, 140, 120, 0.32) to rgba(160, 140, 120, 0.45).
Margin Line Opacity: Change the left red margin line from rgba(200, 80, 80, 0.18) to rgba(200, 80, 80, 0.28).
Sunlight & Parchment Overlay Opacity: Change the linear-gradient overlay from rgba(245, 239, 235, 0.88) / 0.82 / 0.90 to rgba(245, 239, 235, 0.70) / 0.58 / 0.72 respectively. This allows the background nature image to shine through much more vividly.
Dark Mode Lines: Increase amber ruled lines from rgba(224, 111, 40, 0.14) to rgba(224, 111, 40, 0.22) and red-ish margin lines from 0.10 to 0.18.
Transition Overlay Lines: Also update the transitions .paper-roll-overlay and .form-page-overlay opacities for visual consistency.
[Background Components]
[MODIFY] 
background-watermarks.tsx
We will increase the visibility of the paper plane watermarks and introduce floating pages and data sheets.

1. Paper Plane Visibility
Increase paper plane container opacity from opacity-[0.045] dark:opacity-[0.07] to opacity-[0.16] dark:opacity-[0.24].
Increase the SVG path fillOpacity from 0.6 to 0.9 for a more defined shape.
Increase overall watermarks SVG (trend lines & dots) opacity from opacity-[0.035] dark:opacity-[0.05] to opacity-[0.08] dark:opacity-[0.12].
2. Floating Notebook Pages & Analytical Data Sheets
We will introduce two new custom SVG watermark shapes:

FloatingPage: An elegant card outline with a red margin line and ruled lines.
FloatingDataSheet: An elegant card outline with ruled lines and a subtle terracotta bar chart watermark.
We will define an array of floatingSheets (2 pages, with different sizes, rotation, and paths) that continuously drift across the page on a long linear transition loop.
[Home Page]
[MODIFY] 
page.tsx
Enhance home page animations to feel dynamic yet elegant:

Continuous Floating on Hero Diary: Add a subtle, repeating floating animation to the hero section's diary container (e.g. drifting up and down by 5px every 6s with easeInOut).
Staggered Scroll Entrance on "How It Works" Cards: Instead of static loading, card animations will trigger dynamically when in view with slight delay offsets.
Visual Hover Lift on Cards: Add translation and shadow depth on hover for "How It Works" and "Features" cards to make them feel responsive:
className="hover:-translate-y-1.5 hover:shadow-md hover:border-inquest-accent/30 transition-all duration-300"
Where to Customize These Styles Later
Here is a reference guide so you can tweak these yourself later:

1. Light/Dark Theme Background & Ruled Lines
Located in 
globals.css
:

To adjust how clear/visible the Unsplash image is: edit the alpha opacity of rgba(245, 239, 235, X) inside the parchment linear gradient overlay (approx line 89). Lowering values makes the background image more visible.
To adjust the notebook line colors/contrast: edit the rgba(160, 140, 120, X) color inside repeating-linear-gradient (approx line 81). Higher values make the ruled lines darker.
To adjust the red margin line: edit the rgba(200, 80, 80, X) inside the right margin gradient (approx line 79).
2. Component Background Densities
Located in 
globals.css
:

Adjust --color-inquest-surface and --color-inquest-depth. For example, setting --color-inquest-surface to #ffffff makes it pure white, while setting it closer to #F5EFEB makes it blend into the background.
3. Floating Watermarks / Paper Planes Opacity & Size
Located in 
background-watermarks.tsx
:

Paper planes scale/opacity: edit the tailwind opacity classes (e.g., opacity-[0.16]) on line 95.
Paper planes flight path: edit the planes array coordinates (startX, startY, endX, endY, duration, delay, size, rotate) on lines 19-26.
Floating page sheets coordinates: edit the floatingSheets array (which we will introduce).
Verification Plan
Manual Verification
Light Theme Aesthetics: View the landing page and dashboard in light mode. Confirm that the background image is more visible, vibrant, and stunning. Ensure that ruled lines are clean and readable, but not overwhelming.
Component Integration: Confirm cards in both light and dark mode blend into the base page background beautifully and don't feel too "extreme" or stark.
Watermarks & Planes: Check the background watermarks. Ensure the paper planes are visible, move smoothly, and do not overlay text in a distracting manner. Check the new floating diary sheets.
Animations: Interact with the homepage. Confirm the hover effects and hero floating animation function.
Build Verification:
Run pnpm run build or pnpm run check-types in apps/web to ensure no syntax/compilation issues.
