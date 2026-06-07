# Exam Prep Section — Design Spec

**Date:** 2026-06-07
**Status:** Approved

---

## Overview

A dedicated Exam Prep section at `/study/exam` with three focused practice modes based on the Texas Tech University Doctoral Qualifying Exam in Music Theory format. Purely additive — no changes to existing study modes or routes. A link to Exam Prep is added to the Study hub page.

---

## 1. Architecture & Routes

### New routes (added to `ProfileRouting/index.tsx`)

```
/study/exam                → ExamPrepHub
/study/exam/simulation     → ExamSimulation
/study/exam/drills         → AdvancedDrills
/study/exam/comprehensive  → ComprehensiveQuiz
```

### New files

```
src/Pages/ExamPrepPage/
  index.tsx               ← Hub landing page
  ExamSimulation.tsx      ← TTU-style timed exam
  AdvancedDrills.tsx      ← Advanced mixed-format drills
  ComprehensiveQuiz.tsx   ← Full written exam + score analysis
```

### New data file

```
src/data/scores.ts        ← Score excerpt data (populate over time)
```

### Existing files modified

- `src/Pages/ProfileRouting/index.tsx` — add four new routes
- `src/Pages/StudyPage/index.tsx` — add "Exam Prep →" CTA below the Start button

---

## 2. Exam Prep Hub (`/study/exam`)

Simple landing page matching existing dark-surface visual language (`colors` from `Theme.ts`).

**Layout:**
```
← Back to Study

  Exam Prep
  Three harder practice modes based on the TTU Doctoral Qualifying Exam format.

  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
  │  📝 Exam Sim       │  │  🔥 Advanced Drills │  │  🏆 Full Deck      │
  │  12 terms, skip 2, │  │  6-option quiz,    │  │  All default-deck  │
  │  write definitions,│  │  fill-in-blank,    │  │  written defs +    │
  │  self-grade 1–3.   │  │  category ID.      │  │  10 score analysis │
  │  Score analysis.   │  │  Mixed session.    │  │  questions.        │
  │  Timed optional.   │  │                    │  │                    │
  │  [ Start → ]       │  │  [ Start → ]       │  │  [ Start → ]       │
  └────────────────────┘  └────────────────────┘  └────────────────────┘
```

No state on this page — purely navigation.

---

## 3. Score Data (`src/data/scores.ts`)

Data structure supporting future population with real IMSLP excerpts. Ships with 2–3 placeholder entries demonstrating the shape.

```ts
export interface AnalysisQuestion {
  prompt: string       // e.g. "Describe the harmonic rhythm from mm. 42–50."
  modelAnswer: string  // full model answer for self-grading
}

export interface ScoreExcerpt {
  id: number
  title: string        // e.g. "Rigoletto, Act I Scene 1"
  composer: string     // e.g. "Giuseppe Verdi"
  era: string          // e.g. "Romantic"
  yearRange: string    // e.g. "1840–1860"
  imageUrl: string     // e.g. "/scores/rigoletto.png" (relative to public/)
  measures: string     // e.g. "mm. 42–75" — displayed as label
  questions: AnalysisQuestion[]
}

export const ALL_SCORES: ScoreExcerpt[] = [
  // placeholder entries — replace with real IMSLP excerpts
]
```

Score images live in `public/scores/`. Adding a new score requires only appending to `ALL_SCORES` and dropping the image in `public/scores/` — no UI changes.

---

## 4. Exam Simulation (`/study/exam/simulation`)

Mirrors the real TTU exam structure: Part I (term definitions) followed by Part II (score analysis).

### Config screen

- Optional countdown timer: Off / 30 min / 60 min / Custom (number input in minutes)
- "Start Exam →" button

### Part I — Term Definitions

- 12 terms randomly selected, distributed across at least 6 categories
- Sidebar list of all 12 terms; user navigates freely between them
- Each term: large `textarea`, prompt "Define in 2–4 sentences"
- User can flag any 2 terms as "Skip" (matching "10 of 12" exam format)
- Timer (if enabled) visible in header
- "Submit Part I →" advances to self-grading

**Self-grading (Part I):**
- Each answered term: user's text on left, model answer on right
- Rating buttons: `1 — Poor` / `2 — Good` / `3 — Ideal` (rubric from the PDF)
- Running subtotal displayed; max score = 30 (10 terms × 3)

### Part II — Score Analysis

- 4 scores presented: first 2 required, scores 3 & 4 have a "Skip" flag (choose 1 of the 2). If fewer than 4 scores exist in `scores.ts`, the simulation shows however many are available; the "Skip" mechanic is hidden when ≤ 2 scores exist.
- Each score:
  - Full-width image (scrollable/zoomable on mobile)
  - Measure range labeled above image
  - 4–5 analysis questions below, each with a `textarea`
- Final question for every score: "Identify the composer, era, and approximate date — cite specific evidence from the score"
- "Submit Score →" advances to the next score

**Self-grading (Part II):**
- Same 1–3 rubric per question
- Composer/title/era revealed only after the user self-grades the analysis questions

### Results screen

- Part I subtotal (e.g. "24 / 30")
- Part II subtotal (e.g. "31 / 45" — 3 scores × avg 5 questions × 3)
- Per-term and per-score breakdown
- "Try Again" / "Back to Exam Prep"

---

## 5. Advanced Drills (`/study/exam/drills`)

Three question types randomly interleaved in a single configurable session.

### Config screen

- How many questions? 10 / 20 / 30 / All
- Category filter: All (default) or multi-select from available categories
- "Start Drills →"

### Question type 1 — Extended Pool (6 options)

Show definition, pick correct term from 6 options. Distractors are pulled deliberately from *other* categories to force cross-domain discrimination.

### Question type 2 — Fill in the Blank

Show the full definition with all occurrences of the term name replaced by `_____`. User types the term. Graded with case-insensitive, trimmed exact match.

### Question type 3 — Category Identification

Show the term name only (no definition). User selects its category from the full list of 12 categories. Tests conceptual organization.

### Session flow

- Progress bar + question counter
- Immediate feedback after each answer: correct/wrong + one-sentence explanation
- Results: overall score, breakdown by question type, weakest category flagged

---

## 6. Comprehensive Quiz (`/study/exam/comprehensive`)

A full written exam covering every term in the default deck plus score analysis. No config screen — always runs the full set.

### Part I — All Default-Deck Terms, Written

- All terms in the default deck, shuffled, one per screen
- Same `textarea` + self-grade 1–3 flow as the simulation
- Sidebar list showing all terms; navigate freely, answered terms marked with a dot
- No skip limit — answer as many or as few as desired
- "Submit Part I →" advances to self-grading for all answered terms

**Self-grading (Part I):**
- Same 1–3 rubric as simulation
- Category breakdown shown in results: each category `X / Y correct` with colored progress bar
  - Green ≥ 80%, Yellow 60–79%, Red < 60%
- Weakest category called out: e.g. "Focus area: Fugue (18 / 24)"

### Part II — Score Analysis (10 questions)

- Up to 10 analysis questions randomly sampled across all available scores in `scores.ts`; if fewer than 10 questions exist in the data, all available questions are used
- Each question: score image above prompt, `textarea` below
- Self-graded 1–3

### Results screen

- Part I: category breakdown table with colored bars, weakest category flagged
- Part II: subtotal (e.g. "22 / 30")
- Grand total
- "Try Again" / "Back to Exam Prep"

**No persistence** — results are session-only. Mastery tracking for the standard deck remains in the existing `useStudySession` hook on the main hub.

---

## 7. Shared UI Patterns

- All new pages use `PageContainer` from `src/Components/Container/index.tsx`
- `textarea` styling: dark background matching `colors.surface`, `colors.border` border, `colors.textPrimary` text, monospace font, min-height ~120px, resize vertical
- Self-grade buttons: three side-by-side outlined buttons (`1 — Poor`, `2 — Good`, `3 — Ideal`); clicking one highlights it and advances focus to the next unanswered term
- Score image: `max-width: 100%`, `cursor: zoom-in` opens a full-screen overlay on click
- Timer: displayed as `MM:SS` in the header; turns red in the final 5 minutes; reaching 0:00 auto-submits

---

## 8. Out of Scope

- Audio playback of score excerpts
- AI-assisted grading of written answers
- Persistence of exam results across sessions
- Custom deck support in Exam Prep (default Music Theory deck only)
