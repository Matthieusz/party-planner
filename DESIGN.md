---
name: Party Planner
description: Operational hub for hotel and venue event coordination.
colors:
  vivid-indigo: "oklch(0.457 0.24 277.023)"
  indigo-ink: "oklch(0.962 0.018 272.314)"
  warm-ash: "oklch(0.967 0.001 286.375)"
  warm-ink: "oklch(0.21 0.006 285.885)"
  fog: "oklch(0.922 0 0)"
  graphite: "oklch(0.556 0 0)"
  signal-red: "oklch(0.577 0.245 27.325)"
  near-white: "oklch(1 0 0)"
  ink: "oklch(0.145 0 0)"
  sidebar-surface: "oklch(0.985 0 0)"
  sidebar-accent: "oklch(0.511 0.262 276.966)"
typography:
  display:
    fontFamily: "'Noto Serif Variable', Georgia, serif"
    fontSize: "clamp(1.75rem, 4vw, 2.5rem)"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "normal"
  body:
    fontFamily: "'Nunito Sans Variable', system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "'Nunito Sans Variable', system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "10px"
  4xl: "45px"
components:
  button-primary:
    backgroundColor: "{colors.vivid-indigo}"
    textColor: "{colors.indigo-ink}"
    rounded: "{rounded.4xl}"
    padding: "0 0.75rem"
    height: "36px"
  button-primary-hover:
    backgroundColor: "oklch(0.457 0.24 277.023 / 0.8)"
    textColor: "{colors.indigo-ink}"
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
    backgroundColor: "{colors.near-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.4xl}"
    padding: "1.5rem"
    size: "100%"
  input:
    backgroundColor: "oklch(0.922 0 0 / 0.5)"
    textColor: "{colors.ink}"
    rounded: "{rounded.4xl}"
    padding: "0 0.75rem"
    height: "36px"
  badge-default:
    backgroundColor: "{colors.vivid-indigo}"
    textColor: "{colors.indigo-ink}"
    rounded: "{rounded.4xl}"
    padding: "0 0.5rem"
    height: "20px"
---

# Design System: Party Planner

## 1. Overview

**Creative North Star: "The Service Pass"**

This system embodies the quiet authority of a perfectly organized kitchen pass. Every surface is clean, every zone has a purpose, and nothing is frantic. The visual language is composed under pressure: surfaces stay flat and readable, accent color is deployed with surgical precision, and typography pairs the warmth of a serif heading with the legibility of a humanist sans. The overall density is moderate-to-high — this is a tool for professionals who need to scan fast and act faster.

The system rejects generic SaaS templates, consumer-party aesthetics (balloons, confetti brights), and bloated enterprise dashboards. It also rejects dark-mode-by-default fatigue: the default theme is near-white, with a dark mode available for low-light environments (ballrooms, back-of-house at night). Every decision prioritizes scannability and trust over decoration.

**Key Characteristics:**

- Pill-shaped everything — no sharp corners, but nothing playful either
- One accent voice: vivid indigo used sparingly, its rarity is the point
- Serif headings for warmth and authority; sans body for speed and clarity
- Surfaces are flat at rest; shadows appear only to elevate active work cards
- Touch-friendly sizing with no compact variants below 36px height
- Dark mode is functional, not cosmetic — tuned for dim ambient light

## 2. Colors

A near-monochrome foundation with one vivid indigo accent that does the heavy lifting for primary actions, active states, and status emphasis. Neutrals are deliberately warm-tinted, not cold gray.

### Primary

- **Vivid Indigo** (oklch(0.457 0.24 277.023)): Primary buttons, active navigation, badges, links. Used on ≤10% of any given screen.
- **Indigo Ink** (oklch(0.962 0.018 272.314)): Text on primary surfaces. Extremely light with a faint blue cast.

### Secondary

- **Warm Ash** (oklch(0.967 0.001 286.375)): Secondary buttons, hover backgrounds, subtle containers. Nearly white with a whisper of warmth.
- **Warm Ink** (oklch(0.21 0.006 285.885)): Text on secondary surfaces. Near-black with slight warmth.

### Neutral

- **Near-White** (oklch(1 0 0)): Page background, card backgrounds in light mode. Not `#fff` — it has a barely perceptible warmth.
- **Ink** (oklch(0.145 0 0)): Primary text, headings, borders in dark mode. Near-black, not `#000`.
- **Fog** (oklch(0.922 0 0)): Borders, input backgrounds, dividers. The workhorse edge color.
- **Graphite** (oklch(0.556 0 0)): Muted text, placeholders, disabled states, secondary labels.

### Destructive

- **Signal Red** (oklch(0.577 0.245 27.325)): Errors, destructive actions, deletion confirmations. Warm, not clinical.

### Sidebar & Named Surfaces

- **Sidebar Surface** (oklch(0.985 0 0)): Navigation panel background. Slightly warmer than the page.
- **Sidebar Accent** (oklch(0.511 0.262 276.966)): Active nav item, selected state in sidebar. Deeper indigo than the primary.

### Named Rules

**The One Voice Rule.** The vivid indigo accent appears on ≤10% of any given screen. Its rarity is the point — when you see it, you know it means action or importance.

**The No-Pure-Neutrals Rule.** Neither `#000` nor `#fff` appear in the palette. Every extreme is tinted: white toward warm ash, black toward ink with subtle warmth.

## 3. Typography

**Display Font:** Noto Serif Variable (with Georgia, serif fallback)
**Body Font:** Nunito Sans Variable (with system-ui, sans-serif fallback)

**Character:** The pairing is warm authority meets operational clarity. Serif headings slow the eye just enough to establish hierarchy; the humanist sans keeps body text fast and friendly under pressure.

### Hierarchy

- **Display** (500 weight, clamp(1.75rem, 4vw, 2.5rem), line-height 1.1): Page titles, section headers, hero headlines. Noto Serif Variable. Used sparingly — one per major view.
- **Headline** (500 weight, 1.25rem, line-height 1.3): Card titles, modal headers, sub-section labels. Noto Serif Variable.
- **Title** (500 weight, 1rem, line-height 1.4): List item labels, form section headers. Nunito Sans Variable, medium weight.
- **Body** (400 weight, 0.875rem, line-height 1.5): Paragraphs, descriptions, form labels, table cells. Nunito Sans Variable. Max line length: 65–75ch.
- **Label** (500 weight, 0.75rem, line-height 1.4, letter-spacing 0.02em): Badges, timestamps, status indicators, micro-copy. Nunito Sans Variable. Uppercase only for status badges, never for body labels.

### Named Rules

**The Serif-Only-For-Display Rule.** Noto Serif Variable appears exclusively in Display and Headline roles. Never in body text, buttons, navigation, or form inputs. The contrast between serif headings and sans body is intentional — flattening it weakens hierarchy.

**The No-Shouting Rule.** Uppercase is forbidden outside of status badges and single-word action labels. Sentence case everywhere else.

## 4. Elevation

The system uses a hybrid approach: flat by default, lifted for active work. Most surfaces sit directly on the background with no shadow. Cards that contain active tasks, forms, or editable content receive a diffuse ambient shadow to separate them from the page plane. No shadows on navigation, headers, or decorative containers — depth is functional, not ornamental.

### Shadow Vocabulary

- **Ambient Card** (`box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 0 0 1px oklch(0.145 0 0 / 0.05)`): Cards containing active work — forms, todo lists, editable content. The ring adds a hairline edge without a full border.
- **Focus Ring** (`box-shadow: 0 0 0 3px oklch(0.708 0 0 / 0.3)`): Focus-visible states on buttons, inputs, and interactive elements. Neutral gray, not primary-colored.

### Named Rules

**The Active-Work-Only Rule.** Shadows appear exclusively on surfaces that hold actionable or editable content. Static information, navigation, and decorative containers remain flat. If a card has no interactive elements inside, it does not get a shadow.

## 5. Components

Components are pill-shaped, softly rounded, and restrained in ornament. The base-luma shadcn style gives everything a contemporary warmth without sliding into consumer playfulness.

### Buttons

- **Shape:** Fully rounded pill (45px border-radius, effectively circular caps on the short axis).
- **Primary:** Vivid indigo background, indigo-ink text, 36px height, 0.75rem horizontal padding. `font-weight: 500`, `font-size: 0.875rem`. Hover: background at 80% opacity. Active: translateY(1px) press effect.
- **Secondary:** Warm ash background, warm-ink text. Same shape and sizing as primary.
- **Ghost:** Transparent background, ink text. Hover: warm ash background. Used for navigation, filtering, and low-priority actions.
- **Outline:** Transparent background, ink text, 1px fog border. Hover: warm ash background. Used for secondary actions and sign-in links.
- **Focus:** 1px ring border + 3px focus ring at 30% opacity. Error state: signal-red border + 3px signal-red ring at 20% opacity.

### Cards / Containers

- **Corner Style:** 45px border-radius (fully rounded, matching buttons).
- **Background:** Near-white in light mode, ink in dark mode.
- **Shadow Strategy:** Ambient Card shadow only when the card contains active work (forms, editable lists, configuration). Flat when displaying static information.
- **Border:** No explicit border by default. The ring shadow provides a hairline edge. For cards that need stronger separation, use 1px fog border.
- **Internal Padding:** 1.5rem default, 1rem for `size="sm"`.

### Inputs / Fields

- **Style:** 45px border-radius (pill), fog-at-50% background, ink text. 36px height, 0.75rem horizontal padding. No border at rest; border appears on focus.
- **Focus:** 1px ring border + 3px focus ring at 30% opacity. Background shifts to full fog.
- **Placeholder:** Graphite text.
- **Error:** Signal-red border + 3px signal-red ring at 20% opacity.
- **Disabled:** Pointer-events none, 50% opacity.

### Badges

- **Shape:** Pill, 20px height, 0.5rem horizontal padding. `font-size: 0.75rem`, `font-weight: 500`.
- **Default:** Vivid indigo background, indigo-ink text.
- **Secondary:** Warm ash background, warm-ink text.
- **Outline:** Transparent background, ink text, 1px fog border.
- **Destructive:** Signal-red at 10% background, signal-red text.

### Navigation

- **Style:** Text links in ghost buttons or plain anchor tags. No background by default.
- **Typography:** Nunito Sans Variable, 0.875rem, 500 weight.
- **Default:** Ink text.
- **Hover:** Warm ash background, ink text.
- **Active:** Vivid indigo text (no background shift — the color alone carries the state).
- **Mobile:** Collapses to a bottom sheet or hamburger menu; touch targets minimum 44px.

## 6. Do's and Don'ts

### Do:

- **Do** use vivid indigo exclusively for primary actions, active states, and status badges. Its scarcity is what makes it meaningful.
- **Do** keep card shadows reserved for surfaces containing active or editable work. Static info stays flat.
- **Do** use Noto Serif Variable for page titles and card headers; Nunito Sans Variable for everything else.
- **Do** ensure touch targets are at least 44px in hurried environments (kitchens, service floors).
- **Do** respect reduced motion — all transitions should be instant or use minimal fade when `prefers-reduced-motion` is active.
- **Do** use sentence case for all labels, headings, and body copy. Uppercase is for single-word status badges only.

### Don't:

- **Don't** use consumer-party aesthetics — no balloons, confetti, neon brights, or playful illustrations. This is a professional operations tool.
- **Don't** build dashboards overloaded with metrics nobody reads. Every number on screen must earn its place.
- **Don't** use `#000` or `#fff`. Every extreme neutral in the palette is intentionally tinted.
- **Don't** use gradient text, glassmorphism, or decorative blur effects. The system is flat and purposeful.
- **Don't** use side-stripe borders (colored left/right borders >1px on cards, alerts, or list items). Use full borders, background tints, or nothing.
- **Don't** use identical card grids with icon + heading + text repeated endlessly. Vary content presentation by function.
- **Don't** reach for a modal as the first interaction pattern. Exhaust inline and progressive alternatives first.
- **Don't** use em dashes. Use commas, colons, semicolons, periods, or parentheses.
- **Don't** animate layout properties (width, height, top, left). Use transform and opacity only.
