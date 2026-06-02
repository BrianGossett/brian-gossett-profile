# Projects Page — Design Spec

**Date:** 2026-06-01  
**Status:** Approved

---

## Overview

A `/projects` route that showcases Brian's projects with a horizontally scrollable card strip at the top and a full code breakdown detail panel below. All project data is hardcoded in a TypeScript data file — no fetching required.

---

## 1. Route & Navigation

- New route: `/projects` → `ProjectsPage` component
- "Projects" `NavLink` added to the header between "Contact" and "Study"
- Same pattern as the existing Study `NavLink` — accent color when active, muted otherwise
- Appears in the hamburger dropdown on mobile (existing dropdown already renders all nav links)

---

## 2. Page Layout

```
┌──────────────────────────────────────────────────────┐
│  BG  Home · About · Experience · Contact · Projects · Study  │  ← nav
├──────────────────────────────────────────────────────┤
│  Projects · select a project to explore              │  ← page header
├──────────────────────────────────────────────────────┤
│  [📱 AkashicOnline ✓]  [🎵 Portfolio + Study]  →    │  ← scrollable cards
├──────────────────────────────────────────────────────┤
│  AkashicOnline                    [View on GitHub ↗] │
│  Description text...                                 │
│  [Kotlin] [Compose] [Room] [USDA API] ...            │
│                                                      │
│  How It's Built                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ 🗄 Data Layer — Room + DAO                   │   │
│  │ Explanation text...                           │   │
│  │ <code block>                                 │   │
│  └──────────────────────────────────────────────┘   │
│  ... (4 more sections)                              │
└──────────────────────────────────────────────────────┘
```

- Card strip: `display: flex`, `overflow-x: auto`, `flex-shrink: 0` on each card
- First project (AkashicOnline) selected by default
- Detail panel renders below the strip on all screen sizes

---

## 3. Project Cards

Each card in the strip:
- Width: ~180px, fixed, `flex-shrink: 0`
- Content: emoji icon, project name (bold), one-line tech summary, 1–2 sentence description
- **Selected:** `deepBlue` background (`#0a192f`), accent border (`colors.accent`)
- **Unselected:** `surface` background, `colors.border` border
- Click sets selected project

---

## 4. Detail Panel

When a project is selected:

| Element | Details |
|---|---|
| Header | Project name (large, bold) + "View on GitHub ↗" link (opens `target="_blank"`) |
| Description | 2–3 sentence overview paragraph |
| Tech chips | Same style as study hub category chips — `accentDim` background, accent text |
| Section label | "How It's Built" — same uppercase/accent label style used elsewhere |
| Breakdown sections | See Section 5 |

---

## 5. Code Breakdown Sections

Each breakdown section is a card with:
- **Title:** bold, with leading emoji
- **Explanation:** 1–2 sentences of plain-English description
- **Code block:** `<pre>` / `<code>` with `pageBg` background, `accent`-colored text, monospace font, horizontal scroll for long lines

### AkashicOnline — 5 sections

1. **🗄 Data Layer — Room + DAO**  
   Explanation: Each feature module has its own Room entity and DAO. Queries are Kotlin suspend functions called from ViewModels via coroutines, keeping the UI thread free.  
   Code: `FoodLogDao` with `@Query` returning `List<FoodLog>`

2. **🎨 Jetpack Compose UI**  
   Explanation: All screens are built with Jetpack Compose and follow a ViewModel → StateFlow → Composable pattern. State is collected with `collectAsState()`.  
   Code: A `@Composable` screen function collecting state from a ViewModel

3. **🌐 USDA API Integration**  
   Explanation: Food search uses Retrofit to hit the USDA FoodData Central API. Results are mapped to local entities and cached in Room to minimize network calls.  
   Code: Retrofit `@GET` interface method for food search

4. **🔒 Biometric Vault**  
   Explanation: Sensitive entries are gated behind Android's `BiometricPrompt`. The vault screen only renders after `onAuthenticationSucceeded` fires.  
   Code: `BiometricPrompt` setup with `AuthenticationCallback`

5. **📷 Barcode Scanning — ML Kit**  
   Explanation: The food logger can scan barcodes using ML Kit's `BarcodeScanner`. The scanned UPC is passed to the USDA API to auto-populate the food entry.  
   Code: `BarcodeScanning.getClient()` + `process(inputImage)` call

### Portfolio + Study — 5 sections

1. **🗂 Deck System — useDecks hook**  
   Explanation: Custom flashcard decks live in localStorage via a `useDecks` hook. The built-in Music Theory deck is always derived from a static TypeScript array — never stored.  
   Code: `useDecks` hook showing `createDeck` writing to localStorage

2. **🛣 Study Routing — deckId URL params**  
   Explanation: Each study mode route includes a `:deckId` segment. Mode components call `useParams()` to get the ID and `useDeckById()` to load the correct term set.  
   Code: React Router route definition and `useParams` usage in a mode component

3. **🔗 Share Link Encoding**  
   Explanation: Decks are shared by encoding the full term list as `encodeURIComponent(JSON.stringify(deck))` appended to the URL. This handles all Unicode (accents, CJK) safely with no backend needed.  
   Code: `encodeShareLink` and `decodeShareLink` functions

4. **🃏 Flashcard Mode — Shuffle + Rating**  
   Explanation: The term list is local state so Fisher-Yates shuffle works in-memory without re-fetching. Rating buttons (know/don't know) are always active — no flip required.  
   Code: `shuffleArray` function and the always-active `advance()` button

5. **💾 Session Persistence — sessionStorage**  
   Explanation: Study progress (mastered, missed, streak, position) persists in `sessionStorage` so refreshing the page resumes where you left off. It resets when the browser closes.  
   Code: `useStudySession` hook showing `save()` writing to sessionStorage

---

## 6. Data Structure

All data lives in `src/data/projects.ts`:

```ts
export interface ProjectSection {
  title: string        // e.g. "🗄 Data Layer — Room + DAO"
  explanation: string  // 1-2 sentences
  code: string         // raw code string, displayed in <pre>
  language: string     // e.g. "kotlin" or "typescript" (for display label only)
}

export interface Project {
  id: string
  name: string
  icon: string         // emoji
  techSummary: string  // e.g. "Android · Kotlin · Compose"
  description: string  // 2-3 sentences
  githubUrl: string
  chips: string[]      // tech chip labels
  sections: ProjectSection[]
}

export const PROJECTS: Project[] = [
  // AkashicOnline first (default selection)
  // Portfolio + Study second
]
```

---

## 7. Affected Files

| File | Action | Purpose |
|---|---|---|
| `src/data/projects.ts` | Create | All project data |
| `src/Pages/ProjectsPage/index.tsx` | Create | Page component |
| `src/Pages/ProfileRouting/index.tsx` | Modify | Add `/projects` route |
| `src/Components/Container/index.tsx` | Modify | Add "Projects" nav link |
