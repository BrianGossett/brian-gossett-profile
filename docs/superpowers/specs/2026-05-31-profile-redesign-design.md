# Profile Page Redesign

**Date:** 2026-05-31  
**Status:** Approved

## Overview

Redesign Brian Gossett's personal profile page from a bare-bones Chakra UI default into a polished, dark-themed developer portfolio with a sidebar layout and cyan accent color.

## Design Direction

- **Theme:** Bold & Dark — dark backgrounds, high contrast, vibrant cyan accents
- **Accent color:** `#00b4d8` (cyan/electric blue), glow shadow `#00b4d870`
- **Background:** `#0f0f14` (page), `#16213e` (cards/sections), `#0a0a0f` (nav/footer)
- **Text:** `#fffffe` (primary), `#94a1b2` (secondary/muted), `#00b4d8` (accent/labels)
- **Font:** Figtree (already configured in Theme.ts)

## Layout

Sidebar layout — fixed-width left sidebar, scrollable main content area to the right.

```
┌─────────────────────────────────────────────────┐
│ NAV: BG logo · Home · About · Experience · Contact│
├──────────────┬──────────────────────────────────┤
│   SIDEBAR    │  MAIN CONTENT                    │
│  260px wide  │                                  │
│              │  About Me                        │
│  Photo       │  Experience (timeline)           │
│  Name        │  Certifications                  │
│  Title       │                                  │
│  Badges      │                                  │
│              │                                  │
│  Skills      │                                  │
│              │                                  │
│  Contact     │                                  │
└──────────────┴──────────────────────────────────┘
│ FOOTER                                          │
└─────────────────────────────────────────────────┘
```

## Sections

### Navigation (Header)
- Dark bar (`#0a0a0f`), bottom border `#1e1e2e`
- Left: "BG" logo in cyan
- Nav links: Home, About, Experience, Contact — anchor-scroll to sections on the same page
- Currently only Home route exists; nav links scroll within the single page

### Sidebar
Three stacked cards (`#16213e`, rounded, subtle border):

**Card 1 — Identity**
- Profile photo (circular, 90px, uses existing `Me.jpg`)
- Name: Brian Gossett
- Title: Senior Frontend Developer (cyan, uppercase, letter-spaced)
- Badges: ✈ Air Force Veteran · 🔒 Top Secret Clearance · ☁ AWS Certified

**Card 2 — Skills**
- Section label "Tech Stack"
- Skill tags as small pills: TypeScript, React, Node.js, GraphQL, AWS, GCP, Docker, NextJS, PostgreSQL, Jest, Git, Apollo Client, MUI, Jenkins, Kubernetes, Firebase

**Card 3 — Contact**
- LinkedIn link
- GitHub link (BrianGossett)
- Email: Brian.Gossett.usa@gmail.com
- Location: Lubbock, TX

### Main Content

**About Me**
- Card with cyan section title
- Summary text from resume (Air Force veteran, TS clearance, front-end/full-stack background)

**Experience** (timeline with glowing cyan dot per role)
1. Front End Developer — Trellis Energy (July 2025–Present)
2. Senior React Developer — Acuity Inc (Aug 2022–May 2025)
3. Lead React Dev / Cloud Engineer — U.S. Air Force BESPIN/AFLCMC (Mar 2014–Apr 2021)

Each entry: role title, company (cyan), date range (muted), 2–3 bullet points.

**Certifications**
- Three cards in a row: AWS Cloud Practitioner (May 2024), Top Secret Clearance (April 2021), B.S. Computer Science — Bellevue University (2024)

### Footer
- Dark bar matching nav
- "© 2026 Brian Gossett. All rights reserved."

## Component Architecture

All changes are confined to existing files — no new routes or pages needed.

| File | Change |
|------|--------|
| `src/Components/Container/index.tsx` | Restyle Header and Footer; replace nav link colors; add "BG" logo |
| `src/Pages/HomePage/index.tsx` | Full rewrite — implement sidebar layout with all sections |
| `src/Theme.ts` | Add color tokens for the dark palette and cyan accent |

The sidebar layout will be built with Chakra UI `Flex`/`Box` primitives, keeping the existing Chakra provider setup intact. No new npm packages needed.

## Responsiveness

The sidebar collapses to a stacked layout on mobile (below 768px). Chakra's responsive props handle this — sidebar goes full-width on top, main content below.

## Out of Scope

- Projects section (no standalone projects in resume; experience bullets cover this)
- Contact form (links only)
- Multi-page routing changes (everything stays on the home page)
- Animation / scroll effects (can be added later)
