# Exam Prep Section — Design Spec

**Date:** 2026-06-07
**Status:** Approved

---

## Overview

A dedicated Exam Prep section at `/study/exam` with four focused practice modes based on the Texas Tech University Doctoral Qualifying Exam in Music Theory format. Purely additive — no changes to existing study modes or routes. A link to Exam Prep is added to the Study hub page.

Score PDFs already exist at `/home/brian/Documents/RepertoireList/` and will be copied into `public/scores/` for serving.

---

## 1. Architecture & Routes

### New routes (added to `ProfileRouting/index.tsx`)

```
/study/exam                → ExamPrepHub
/study/exam/simulation     → ExamSimulation
/study/exam/drills         → AdvancedDrills
/study/exam/comprehensive  → ComprehensiveQuiz
/study/exam/scores         → ScoreAnalysis
```

### New files

```
src/Pages/ExamPrepPage/
  index.tsx               ← Hub landing page
  ExamSimulation.tsx      ← TTU-style timed exam (terms + score analysis)
  AdvancedDrills.tsx      ← Advanced mixed-format drills
  ComprehensiveQuiz.tsx   ← Full written exam + score analysis
  ScoreAnalysis.tsx       ← Score-only practice, browse any score freely
```

### New data file

```
src/data/scores.ts        ← Score excerpt data
```

### Score PDFs

Source: `/home/brian/Documents/RepertoireList/*.pdf`
Destination: `public/scores/` (copy at build/setup time)

All ~60 PDF files are copied as-is. File names are referenced directly in `scores.ts`.

### Existing files modified

- `src/Pages/ProfileRouting/index.tsx` — add five new routes
- `src/Pages/StudyPage/index.tsx` — add "Exam Prep →" CTA below the Start button

---

## 2. Exam Prep Hub (`/study/exam`)

Simple landing page matching existing dark-surface visual language (`colors` from `Theme.ts`). Four mode cards in a 2×2 grid on desktop, stacked on mobile.

```
← Back to Study

  Exam Prep
  Four harder practice modes based on the TTU Doctoral Qualifying Exam.

  ┌─────────────────────┐  ┌─────────────────────┐
  │  📝 Exam Simulation │  │  🔥 Advanced Drills  │
  │  12 terms, skip 2,  │  │  6-option quiz,      │
  │  write defs, self-  │  │  fill-in-blank,      │
  │  grade. Score anal. │  │  category ID. Mixed  │
  │  Timed optional.    │  │  session.            │
  │  [ Start → ]        │  │  [ Start → ]         │
  └─────────────────────┘  └─────────────────────┘

  ┌─────────────────────┐  ┌─────────────────────┐
  │  🏆 Full Deck Exam  │  │  🎼 Score Analysis   │
  │  All default-deck   │  │  Browse any score    │
  │  terms, written     │  │  from the repertoire │
  │  defs + up to 10    │  │  list. Answer        │
  │  score questions.   │  │  analysis questions. │
  │  [ Start → ]        │  │  [ Browse → ]        │
  └─────────────────────┘  └─────────────────────┘
```

No state on this page — purely navigation.

---

## 3. Score Data (`src/data/scores.ts`)

### Data shape

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
  pdfPath: string      // e.g. "/scores/51 Verdi La Traviata.pdf"
  startPage: number    // which PDF page to jump to (appended as #page=N to iframe src)
  measures: string     // e.g. "mm. 42–75" — displayed as a label above the viewer
  questions: AnalysisQuestion[]
}

export const ALL_SCORES: ScoreExcerpt[] = [
  // entries added manually — one object per excerpt with questions written inline
]
```

### PDF display

Score PDFs are displayed via a native `<iframe src="{pdfPath}#page={startPage}" />` in a tall container (~70vh). Desktop browsers render PDFs natively. On mobile, a "Open PDF in new tab" fallback link is shown alongside the iframe in case the browser does not embed it.

Adding a new score requires:
1. The PDF already exists in `public/scores/` (copied from `RepertoireList/`)
2. Append one `ScoreExcerpt` object to `ALL_SCORES` in `scores.ts`
3. No UI changes needed

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
- Rating buttons: `1 — Poor` / `2 — Good` / `3 — Ideal` (rubric from the TTU study guide)
- Running subtotal displayed; max score = 30 (10 terms × 3)

### Part II — Score Analysis

- 4 scores presented: first 2 required, scores 3 & 4 have a "Skip" flag (choose 1 of the 2)
- If fewer than 4 scores exist in `scores.ts`, show however many are available; hide the Skip mechanic when ≤ 2 scores exist
- Each score:
  - PDF viewer (iframe) with measure range label above
  - "Open in new tab" fallback link
  - 4–5 analysis questions below, each with a `textarea`
  - Final question always: "Identify the composer, era, and approximate date — cite specific evidence from the score"
- "Submit Score →" advances to next score

**Self-grading (Part II):**
- Same 1–3 rubric per question
- Composer/title/era revealed only after user self-grades the analysis questions

### Results screen

- Part I subtotal (e.g. "24 / 30")
- Part II subtotal (max calculated dynamically from actual question counts)
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

Show the full definition with all occurrences of the term name replaced by `_____`. User types the term. Graded with case-insensitive, trimmed exact match. If the term name does not appear in its own definition, this question type is skipped for that term and replaced with a type-1 question.

### Question type 3 — Category Identification

Show the term name only (no definition). User selects its category from the full list of categories. Tests conceptual organization.

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
- Sidebar list showing all terms; navigate freely; answered terms marked with a dot
- No skip limit — answer as many or as few as desired
- "Submit Part I →" advances to self-grading for all answered terms

**Self-grading (Part I):**
- Same 1–3 rubric as the simulation
- Category breakdown in results: each category `X / Y` with colored progress bar
  - Green ≥ 80%, Yellow 60–79%, Red < 60%
- Weakest category called out: e.g. "Focus area: Fugue (18 / 24)"

### Part II — Score Analysis (up to 10 questions)

- Up to 10 analysis questions randomly sampled across all available scores in `scores.ts`
- If fewer than 10 questions exist in the data, all available questions are used
- Each question: PDF viewer above the prompt, `textarea` below
- Self-graded 1–3

### Results screen

- Part I: category breakdown table with colored bars, weakest category flagged
- Part II: subtotal (e.g. "22 / 30")
- Grand total
- "Try Again" / "Back to Exam Prep"

**No persistence** — results are session-only.

---

## 7. Score Analysis (`/study/exam/scores`)

A standalone, pressure-free mode for practicing composer/era identification and harmonic analysis on any score in the repertoire list.

### Landing view

- Grid of all scores available in `scores.ts`, each shown as a card:
  - Composer name
  - Title
  - Era badge (Baroque / Classical / Romantic / 20th Century)
  - Question count (e.g. "5 questions")
- If no scores exist yet, show a placeholder: "No scores added yet — populate `src/data/scores.ts` to get started"

### Score practice view

1. PDF viewer fills the upper portion of the screen (~60vh), starting at `startPage`
2. "Open in new tab" link beside the viewer
3. Measure range label
4. Questions listed below the viewer; each has a `textarea`
5. "Submit & Grade →" reveals model answers and 1–3 self-grade buttons per question
6. Composer / title / era / year range revealed after all questions are graded
7. "Practice another score →" returns to the landing grid

### No timer, no scoring totals

This mode is for open-ended exploration — no score is tracked, no pressure. The self-grade buttons are for self-awareness only.

---

## 8. Shared UI Patterns

- All new pages use `PageContainer` from `src/Components/Container/index.tsx`
- `textarea` styling: dark background matching `colors.surface`, `colors.border` border, `colors.textPrimary` text, monospace font, min-height ~120px, resize vertical
- Self-grade buttons: three side-by-side outlined buttons (`1 — Poor`, `2 — Good`, `3 — Ideal`); clicking one highlights it and advances to the next unanswered item
- PDF viewer: `<iframe>` at ~70vh height, `width: 100%`, `border: none`; "Open in new tab" `<a>` link always visible beside it as a fallback
- Timer (simulation only): displayed as `MM:SS` in the header; turns red in the final 5 minutes; reaching 0:00 auto-submits

---

## 9. Out of Scope

- Audio playback of score excerpts
- AI-assisted grading of written answers
- Persistence of exam results across sessions
- Custom deck support in Exam Prep (default Music Theory deck only)
- Automatic extraction of score excerpts from PDFs (page selection is manual via `startPage`)
