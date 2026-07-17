---
name: Party Planner
description: Operational hub for hotel and venue event coordination.
colors:
  pass-green: "oklch(0.45 0.11 158)"
  pass-green-ink: "oklch(0.97 0.01 155)"
  pass-ash: "oklch(0.945 0.008 155)"
  pass-ash-ink: "oklch(0.24 0.015 160)"
  paper: "oklch(0.984 0.004 155)"
  ink: "oklch(0.19 0.015 160)"
  line: "oklch(0.9 0.008 155)"
  slate: "oklch(0.48 0.02 160)"
  signal-red: "oklch(0.577 0.245 27.325)"
  warn-amber: "oklch(0.72 0.14 78)"
  ballroom: "oklch(0.175 0.015 160)"
  ballroom-green: "oklch(0.66 0.12 158)"
  sidebar-surface: "oklch(0.972 0.005 155)"
typography:
  display:
    fontFamily: "'Archivo Variable', system-ui, sans-serif"
    fontSize: "1.5rem–1.875rem (product), clamp up to 3.75rem (landing hero)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "'Archivo Variable', system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  data:
    fontFamily: "'JetBrains Mono Variable', ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "10px"
  2xl: "10px"
  3xl: "12px"
  4xl: "12px"
components:
  button-primary:
    backgroundColor: "{colors.pass-green}"
    textColor: "{colors.pass-green-ink}"
    rounded: "{rounded.4xl}"
    padding: "0 0.75rem"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.pass-green} / 0.8"
    textColor: "{colors.pass-green-ink}"
    rounded: "{rounded.4xl}"
    padding: "0 0.75rem"
    height: "36px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.4xl}"
    padding: "0 0.75rem"
    height: "36px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.4xl}"
    padding: "1.5rem"
    size: "100%"
  input:
    backgroundColor: "oklch(0.92 0.008 155 / 0.5)"
    textColor: "{colors.ink}"
    rounded: "{rounded.3xl}"
    padding: "0 0.75rem"
    height: "36px"
  badge-default:
    backgroundColor: "{colors.pass-green}"
    textColor: "{colors.pass-green-ink}"
    rounded: "{rounded.3xl}"
    padding: "0 0.5rem"
    height: "20px"
---

# Design System: Party Planner

## 1. Overview

**Creative North Star: "The Pass"**

This system embodies the calm, clipped authority of a well-run kitchen pass: a
single ticket everyone reads from, in ink and monospace, under any light.
One grotesque carries every word; one monospace carries every number that
matters; one deep green marks the one thing that needs doing. Surfaces are
flat, radii are small and precise, and status is communicated by state, not
decoration. Density is moderate-to-high: this is a tool for professionals who
scan fast and act faster.

The system rejects generic SaaS templates (the indigo reflex), consumer-party
aesthetics (balloons, confetti brights), and bloated enterprise dashboards.
The default theme is a green-tinged paper white for bright kitchens and
daytime coordination; the dark theme ("ballroom") is a true green-black tuned
for dim service floors, not a cosmetic inversion.

**Key Characteristics:**

- Small, precise radii (4–12px); nothing pill-shaped except badges and status dots
- One accent voice: deep pass green, deployed surgically (≤10% of any screen)
- One grotesque (Archivo) for all text; one monospace (JetBrains Mono) for all times, counts, and IDs
- Flat surfaces; elevation appears only on active work surfaces (cards, popovers)
- "Service pass" ticket motif on landing and auth: dashed chit separators, mono times, unambiguous status
- Dark mode is first-class and system-aware via `next-themes`

## 2. Colors

A green-tinged neutral foundation with one deep green accent doing the heavy
lifting for primary actions, active states, and "done" status. Amber warns,
signal red demands action; nothing else shouts.

### Primary

- **Pass Green** (oklch(0.45 0.11 158)): Primary buttons, active navigation,
  links, done/live status. Used on ≤10% of any given screen.
- **Pass Green Ink** (oklch(0.97 0.01 155)): Text on primary surfaces in light mode.

### Secondary

- **Pass Ash** (oklch(0.945 0.008 155)): Secondary buttons, hover backgrounds, subtle containers.
- **Pass Ash Ink** (oklch(0.24 0.015 160)): Text on secondary surfaces.

### Neutral

- **Paper** (oklch(0.984 0.004 155)): Page background. Off-white tinted toward
  the brand's hue, never toward warmth-by-default.
- **Ink** (oklch(0.19 0.015 160)): Primary text. Green-black, never `#000`.
- **Line** (oklch(0.9 0.008 155)): Borders, dividers, input backgrounds.
- **Slate** (oklch(0.48 0.02 160)): Muted text and placeholders. ≥4.5:1 on Paper.

### Status

- **Signal Red** (oklch(0.577 0.245 27.325)): Errors, destructive actions, "action needed".
- **Warn Amber** (oklch(0.72 0.14 78)): "At risk" warnings; always paired with dark text or used as a dot.
- **Done/Live**: Pass Green. Success and brand are one voice.

### Dark ("Ballroom")

- **Ballroom** (oklch(0.175 0.015 160)): Page background in dark mode. Green-black.
- **Ballroom Green** (oklch(0.66 0.12 158)): Accent in dark mode, lifted for
  contrast; takes dark ink text on buttons.

### Named Rules

**The One Voice Rule.** Pass green appears on ≤10% of any given screen. Its
rarity is the point: when you see it, it means action, active, or done.

**The No-Pure-Neutrals Rule.** Neither `#000` nor `#fff` appears. Every
extreme is tinted toward the brand's green, never toward generic warmth.

## 3. Typography

**Text Font:** Archivo Variable (system-ui fallback)
**Data Font:** JetBrains Mono Variable (ui-monospace fallback)

**Character:** One grotesque for every word, weight doing the hierarchy work
(400 body, 500–600 labels and titles, 600 display). One monospace for every
number the floor runs on: times, guest counts, event IDs. The pairing reads
as an instrument, not a brochure.

### Hierarchy

- **Display** (600 weight, −0.02em tracking, line-height ~1.1): Page titles
  (24–30px in product), landing hero (clamp to 60px max). Archivo.
- **Headline** (600 weight, 18px, line-height 1.3): Card titles, panel headers. Archivo.
- **Title** (500 weight, 14px, line-height 1.4): List items, form labels. Archivo.
- **Body** (400 weight, 14px, line-height 1.5): Paragraphs, descriptions. Archivo. Max line length 65–75ch.
- **Data** (500 weight, 11–12px): Times, counts, IDs, timestamps. JetBrains
  Mono with tabular numerals. Never used for prose.

### Named Rules

**The One-Family Rule.** Archivo is the only text face. Hierarchy comes from
weight and size, never from a second text family.

**The Mono-Is-Data Rule.** JetBrains Mono appears only for data: times,
counts, IDs, system messages. If it is a sentence, it is Archivo.

**The No-Shouting Rule.** Uppercase is forbidden outside of single-word
status badges. Sentence case everywhere else.

## 4. Elevation

Flat by default; elevation belongs to work in flight. Cards and popovers sit
on a diffuse shadow with a hairline ring. Navigation, headers, and static
information never cast shadows.

### Shadow Vocabulary

- **Card / Popover** (diffuse shadow + `ring-1 ring-foreground/5`): Surfaces
  holding editable or actionable content, and floating layers (menus, sheets).
- **Focus Ring** (`ring-3 ring-ring/30` with a `border-ring` edge): Brand-green
  focus indication on every interactive element, visible in both themes.

### Named Rules

**The Active-Work-Only Rule.** If a surface holds no interactive work, it
stays flat. Depth is functional, not ornamental.

## 5. Shape

Radii are small and precise: 4px (sm) through 12px (3xl/4xl). Buttons,
inputs, and cards share the 12px ceiling; nothing approaches a pill except
badges, avatars, and status dots, which are fully round by nature. Sharp
corners read as decisive; the single-digit radii keep it from feeling cold.

## 6. Components

### Buttons

- **Shape:** 12px radius. 36px default height; 40px for `lg` and primary page
  actions; 44px minimum on mobile touch targets.
- **Primary:** Pass green background, pass-green-ink text (light); ballroom
  green with dark ink text (dark). Hover: 80% opacity. Active: 1px press.
- **Secondary:** Pass ash background, pass-ash-ink text.
- **Ghost:** Transparent; hover pass ash. Navigation and low-priority actions.
- **Outline:** Transparent with a 1px line border.
- **Focus:** Brand-green ring at 30% opacity, always visible.

### Cards / Containers

- **Corner Style:** 12px radius.
- **Background:** Paper in light mode, lifted green-black in dark mode.
- **Shadow Strategy:** Diffuse shadow + hairline ring, reserved for active work.

### Inputs / Fields

- **Style:** 12px radius, line-at-50% background, 36px height. Border appears on focus.
- **Error:** Signal-red border + 20% red ring; errors announced via
  `aria-invalid` + `aria-describedby` wired to a `role="alert"` message.
- **Placeholder:** Slate.

### Badges & Status

- **Badges:** Pill, 20px height. Default pass green; destructive is red-tint
  background with red text.
- **Status dots:** 6–10px circles. Done: solid pass green. Live/in-progress:
  pass green with pulse (motion-safe only). Upcoming: hollow ring. Action
  needed: signal red. Status always pairs the dot with text; color is never
  the only carrier.

### Navigation

- **Header:** Sticky top bar, blurred paper background, hairline bottom border.
  Wordmark: green rounded square with concierge bell + "Party Planner".
- **Links:** Slate text; hover ash background + ink text. Active route: pass
  green text with `aria-current="page"`.
- **Mobile:** Sheet from the right; every row ≥44px tall.

### Data Presentation

- Times, counts, and IDs render in JetBrains Mono with tabular numerals.
- Timelines and run-of-show use the ticket motif: dashed separators, mono
  times, status dots paired with words.

## 7. Theming

Light (Paper) is the default; dark (Ballroom) follows the user's system
preference via `next-themes` (`class` attribute, `enableSystem`), with an
explicit toggle in the header. The toggle is hydrated client-side with a
neutral placeholder so the icon never flashes the wrong state. Theme changes
never animate (`disableTransitionOnChange`).

## 8. Motion

- 150–250ms transitions on state changes only: hover, focus, press, open/close.
- The only ambient motion is the "live" pulse dot, and only under
  `motion-safe`. `prefers-reduced-motion` removes it everywhere.
- Landing entrance: single fade+rise per hero element, staggered, motion-safe only.
- Never animate layout properties; transform and opacity only.

## 9. Accessibility

- WCAG 2.1 AA. Body text ≥4.5:1 in both themes; muted text is Slate (5.5:1 on Paper).
- Skip-to-content link, `<main>` landmark, labelled navs (primary, mobile, footer).
- Every form error is programmatic: `aria-invalid`, `aria-describedby`, `role="alert"`.
- Touch targets ≥44px on mobile navigation and primary actions.
- Loading states are skeletons or labelled spinners (`sr-only` text), never bare spinners.
- Theme toggle exposes its action in the label ("Switch to dark mode").

## 10. Do's and Don'ts

### Do:

- **Do** reserve pass green for primary actions, active states, and done/live status.
- **Do** render times, counts, and IDs in JetBrains Mono with tabular numerals.
- **Do** pair every status color with a word. Color is reinforcement, never the message.
- **Do** keep shadows on active-work surfaces only.
- **Do** design for both themes at once; ballroom dark is a first-class surface.
- **Do** keep touch targets ≥44px in hurried environments (kitchens, service floors).

### Don't:

- **Don't** use consumer-party aesthetics: no balloons, confetti, neon brights, playful illustrations.
- **Don't** build dashboards overloaded with metrics nobody reads. Every number earns its place.
- **Don't** use `#000` or `#fff`; extremes tint toward the brand green.
- **Don't** use gradient text, glassmorphism, or decorative blur.
- **Don't** use side-stripe borders; use full borders, background tints, or nothing.
- **Don't** use identical icon-card grids; present content by function (rows, tickets, lists).
- **Don't** reach for a modal first; exhaust inline and progressive alternatives.
- **Don't** use em dashes in copy. Use commas, colons, semicolons, or periods.
- **Don't** animate layout properties. Transform and opacity only.
- **Don't** introduce a second text typeface; hierarchy comes from weight.
