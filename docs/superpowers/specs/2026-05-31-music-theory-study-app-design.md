# Music Theory Study App Design

**Date:** 2026-05-31  
**Status:** Approved

## Overview

Add a `/study` section to the existing React profile site that lets users drill 116 music theory terms (from a quiz terms PDF) across four study modes: Flashcards, Multiple Choice, Type-In, and Matching. Session progress is tracked via `sessionStorage` (auto-clears on tab close — no persistent data). The site already uses React 19, Chakra UI v3, React Router v7, and TypeScript.

---

## Routes

| URL | Page |
|---|---|
| `/study` | Study Hub |
| `/study/flashcards` | Flashcard mode |
| `/study/quiz` | Multiple Choice mode |
| `/study/type` | Type-In mode |
| `/study/match` | Matching mode |

The "Study" nav link is added to the existing `Header` component in `Container/index.tsx`. Each mode has a "← Back to Hub" link that returns to `/study` without resetting session state.

---

## Data

### Terms (`src/data/terms.ts`)

```ts
export interface Term {
  id: number
  term: string
  definition: string
  category: Category
}

export type Category =
  | "Modes"
  | "Scales"
  | "Scale Degrees"
  | "Harmony"
  | "Voice Leading"
  | "Fugue"
  | "Rhythm"
  | "Form"
  | "Instruments"

// Category assignment by term number:
// Modes: 1–7 | Scales: 8–13 | Scale Degrees: 14–21
// Harmony: 22–50 (secondary dominants, modulation, modal mixture,
//   6/4 chords, Neapolitan, aug 6ths, advanced chords, pitch classes,
//   key relationships, harmonic sequence)
// Voice Leading: 51–55 | Fugue: 56–63 | Rhythm: 64–75
// Form: 76–100 | Instruments: 101–116

export const ALL_TERMS: Term[] = [ /* 116 terms */ ]
```

All 116 terms from the quiz PDF are encoded here. Term IDs match their number in the PDF (1–116). The file is static — no API, no fetch.

### Categories and approximate term counts

| Category | Count | Term numbers |
|---|---|---|
| Modes | 7 | 1–7 |
| Scales | 6 | 8–13 |
| Scale Degrees | 8 | 14–21 |
| Harmony | 29 | 22–50 (secondary dominants, modulation, modal mixture, 6/4 chords, Neapolitan, aug 6ths, advanced chords, pitch classes, key relationships) |
| Voice Leading | 5 | 51–55 |
| Fugue | 8 | 56–63 |
| Rhythm | 12 | 64–75 |
| Form | 25 | 76–100 |
| Instruments | 16 | 101–116 |
| **Total** | **116** | |

---

## Session Storage

### Hook: `src/hooks/useStudySession.ts`

Reads and writes a single JSON blob to `sessionStorage` under key `"study-session"`.

```ts
interface StudySession {
  mastered: number[]      // term IDs answered correctly
  missed: number[]        // term IDs answered wrong (any mode)
  missedCounts: Record<number, number>  // how many times each term was missed
  streak: number          // consecutive correct answers across all modes
  lastMode: string        // "flashcards" | "quiz" | "type" | "match"
  lastCategory: string    // category name or "all"
  positions: {
    flashcards: number    // index into current deck
    quiz: number
    type: number
    match: number
  }
}
```

**Weak terms:** IDs where `missedCounts[id] >= 2`. Computed on read, not stored separately.

**Exposed API from hook:**
- `session` — current state
- `markMastered(id)` — moves term to mastered, increments streak
- `markMissed(id)` — increments miss count, resets streak
- `setPosition(mode, index)` — saves progress position
- `setLastMode(mode)` / `setLastCategory(cat)` — saves last-used settings
- `resetSession()` — clears sessionStorage and resets to defaults

---

## Study Hub (`src/Pages/StudyPage/index.tsx`)

### Session Banner
Shows stats from `useStudySession`:
- Mastered count (green)
- Missed count (red)
- Streak with 🔥 icon
- Remaining count (total − mastered)
- "⚠ N weak terms" badge if `weakTerms.length > 0`

### Category Filter
Row of pill buttons: "All Terms (116)" plus one per category with count. Selecting a category filters the term list passed to each mode. Selected pill is highlighted cyan. Selection persists via `lastCategory` in session.

### Mode Cards
Four cards in a 2×2 grid:
- 🃏 **Flashcards** — Swipe right if you know it, left if you don't
- 🎯 **Multiple Choice** — 4 options per question
- 🔤 **Type the Term** — See definition, type the term
- 🔗 **Matching** — Match 8 pairs per round

The last-used mode card shows a "Last used" badge. Clicking a card highlights it (selected state).

### Start Button
`Start [Mode] — [Category]`. Navigates to the mode route. If returning to a mode mid-session, shows "Continuing from card N of M" below the button.

---

## Flashcard Mode (`src/Pages/StudyPage/FlashcardMode.tsx`)

**Props:** `terms: Term[]` (filtered by category)

**Behavior:**
- Deck starts at `session.positions.flashcards` (resume from last position)
- Card shows **term** on front, **definition** on back
- Click card (or press `Space`) to flip
- ✕ button / `←` key → `markMissed(id)`, advance
- ✓ button / `→` key → `markMastered(id)`, advance
- Swipe buttons are shown after flip (can't swipe without seeing definition first — enforced by disabling buttons until card is flipped)
- Progress bar: position / total
- Mini stats: got it / missed / remaining
- Streak shown with 🔥 if > 0
- Saves position to `session.positions.flashcards` on every advance

**End of deck:** "You've gone through all N cards" screen with stats and options to restart or go back to hub.

---

## Multiple Choice (`src/Pages/StudyPage/MultipleChoiceMode.tsx`)

**Props:** `terms: Term[]`

**Behavior:**
- Each question shows a **definition**, user picks the **term** from 4 options
- 3 distractors chosen randomly from the same category when possible, otherwise from all terms
- Selecting an option immediately locks in the answer (no confirm step)
- Correct: option turns green, feedback panel shows "Correct!" + brief note
- Wrong: chosen option turns red, correct option revealed green, feedback shows "Not quite. Answer: X"
- "Next Question →" button appears after answering (or `Enter` key)
- Up to 40 questions per session (or all terms in the filtered category if fewer than 40), shuffled
- Score shown as "N ✓  M ✕" in top right
- Saves position to `session.positions.quiz`

**End of quiz:** Score summary screen (X/40), breakdown by category, option to retry or go to hub.

---

## Type-In Mode (`src/Pages/StudyPage/TypeInMode.tsx`)

**Props:** `terms: Term[]`

**Behavior:**
- Shows **definition**, user types the **term**
- Fuzzy match: strips punctuation, lowercases, trims whitespace before comparing. Partial match accepted if the typed string contains the core word (e.g. "neapolitan" matches "Neapolitan Sixth")
- Submit on `Enter` or "Check" button
- Correct: input border turns green, feedback shows correct term + brief note
- Wrong: input border turns red, feedback shows correct answer + what was typed
- "Give up & show answer" link skips to wrong state without penalizing streak
- "Next Question →" on `Enter`/`Tab` after answering
- Questions ordered: weak terms first, then remaining, then mastered (for review)
- Saves position to `session.positions.type`

**End:** Same summary screen pattern as Multiple Choice.

---

## Matching Mode (`src/Pages/StudyPage/MatchingMode.tsx`)

**Props:** `terms: Term[]`

**Behavior:**
- 8 pairs per round (or fewer if filtered category has < 8 terms)
- Two columns: **Terms** (left) | **Definitions** (right), both shuffled independently
- Click a term to select it (cyan highlight), then click a definition to attempt a match
- Correct match: both items lock green, can't be clicked again
- Wrong match: both flash red for 300ms, deselect, no penalty beyond resetting selection
- Round complete when all 8 pairs matched → celebration banner with time taken + wrong attempts
- "Next Round →" loads the next 8 terms from the filtered list
- Saves position (round index) to `session.positions.match`

---

## File Map

| File | Action |
|---|---|
| `src/data/terms.ts` | **Create** — 116 terms as typed constants |
| `src/hooks/useStudySession.ts` | **Create** — sessionStorage hook |
| `src/Pages/StudyPage/index.tsx` | **Create** — Study Hub |
| `src/Pages/StudyPage/FlashcardMode.tsx` | **Create** |
| `src/Pages/StudyPage/MultipleChoiceMode.tsx` | **Create** |
| `src/Pages/StudyPage/TypeInMode.tsx` | **Create** |
| `src/Pages/StudyPage/MatchingMode.tsx` | **Create** |
| `src/Pages/ProfileRouting/index.tsx` | **Modify** — add 5 routes |
| `src/Components/Container/index.tsx` | **Modify** — add Study nav link |

---

## Styling

Follows the existing dark theme (`colors` from `src/Theme.ts`):
- Cards: `colors.surface` background, `colors.border` border, `xl` border radius
- Accent: `colors.accent` (#00b4d8) for selected states, progress bars, labels
- Correct feedback: `#2cb67d` (green)
- Wrong feedback: `#ff6b6b` (red)
- All new components import `colors` from `../../Theme` (or `../../../Theme` depending on depth)

---

## Out of Scope

- Spaced repetition algorithm (session tracking only, no long-term scheduling)
- User accounts or persistent storage across sessions
- Sharing/exporting results
- Audio pronunciation
- Adding/editing terms in the UI (terms are hardcoded in `terms.ts`)
- Mobile swipe gestures on flashcards (buttons + keyboard only for now)
