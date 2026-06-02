# Study Page Overhaul — Design Spec

**Date:** 2026-06-01  
**Status:** Approved

---

## Overview

A collection of improvements to the portfolio site's study section: a responsive nav, a deck-library landing page with full CRUD for custom flashcard decks, import/export/share-link support, and several flashcard-mode UX enhancements.

---

## 1. Navigation & Header

### Hamburger Menu (mobile)

- Below Chakra's `md` breakpoint the nav links are hidden and a `☰` button appears on the right of the header.
- Clicking the button toggles a vertical dropdown menu directly below the header containing all nav links.
- Above `md` the nav renders as today (horizontal links).
- Implemented in `src/Components/Container/index.tsx`.

### Anchor Link Fix

- Current links use `href="#hero"` etc., which silently no-op from `/study`.
- Change to `href="/#hero"`, `href="/#about"`, `href="/#experience"`, `href="/#contact"` so they navigate back to the home page sections from any route.
- The Study `NavLink to="/study"` is unchanged.

---

## 2. Study Landing Page

### Route

`/study` becomes a deck-library page. All child study routes (`/study/:deckId/flashcards`, etc.) remain the same but now receive a `deckId` parameter.

### Layout

```
┌─────────────────────────────────────────────┐
│  BG   Home · About · Experience · Contact · Study  │  ← full-width nav
├─────────────────────────────────────────────┤
│  Study · 2 decks · select one to start            │  ← full-width page header
├──────────────┬──────────────────────────────┤
│  My Decks    │  🎵 Music Theory  [Default]  │
│  ──────────  │  43 terms · 6 categories     │
│  🎵 Music…   │  [↓ Export] [🔗 Share Link]  │
│  📚 My Deck  │  Category: [All] [Scales]…   │
│  + New Deck  │  Mode: [Flashcards] [Quiz]…  │
│  Import      │  Count: 10 of 43 (quiz/type) │
│              │  [ Start Flashcards → ]      │
└──────────────┴──────────────────────────────┘
```

### Sidebar

- Music Theory deck is always pinned first, labeled "Default", read-only (no edit/delete).
- Custom decks appear below it in creation order.
- Below the list: "New Deck" button, "Import" button.
- Selected deck is highlighted with accent border.

### Detail Panel

- Shows the selected deck's name, term count, and categories.
- Export (↓) and Share Link (🔗) buttons in the detail panel header for custom decks.
- Category chip strip (same as current study hub).
- Mode card grid (Flashcards, Quiz, Type, Match).
- Term count selector — see Section 6.
- Start button: "Start [Mode] — [Category]".
- Edit icon (✏) in the detail panel header for custom decks — opens the editor modal.

### Routing Changes

| Old route | New route |
|---|---|
| `/study` | `/study` (deck library) |
| `/study/flashcards` | `/study/:deckId/flashcards` |
| `/study/quiz` | `/study/:deckId/quiz` |
| `/study/type` | `/study/:deckId/type` |
| `/study/match` | `/study/:deckId/match` |

The default Music Theory deck uses `deckId = "default"`.

### Data Model

```ts
interface Deck {
  id: string           // uuid for custom, "default" for built-in
  name: string
  terms: Term[]        // same Term shape as current terms.ts
  isDefault?: boolean  // true for Music Theory
}
```

Custom decks are stored in `localStorage` under the key `"study-decks"`. The default deck is always constructed from `terms.ts` at runtime and never written to localStorage.

---

## 3. Deck Creator / Editor Modal

### Trigger

- "New Deck" sidebar button → modal opens empty, title "New Deck".
- Pencil icon on a custom deck in the detail panel → modal opens pre-filled, title "Edit Deck".

### Modal Contents

1. **Deck name** — text input at top.
2. **Term rows** — scrollable list of `[Term input] [Definition input] [✕]` rows.
3. **+ Add Term** — button appended below rows; adds a blank row and scrolls to it.
4. **Footer** — Cancel (closes without saving) and Save (validates name non-empty + at least 1 term, then writes to localStorage).

### Behavior

- Create mode: generates a new uuid, appends to deck list.
- Edit mode: updates the existing deck in-place by id.
- Duplicate deck names are allowed (user may have two similarly named decks).
- The default Music Theory deck has no edit/delete controls anywhere.

---

## 4. Import / Export / Share

### Export

- "Download JSON" button in the detail panel for any custom deck.
- Triggers a browser download of `<deck-name>.json` containing the `Deck` object.

### Import

- "Import" button in the sidebar opens a `<input type="file" accept=".json">` picker.
- Parsed JSON is validated (must have `name` string and `terms` array with `term`/`definition` fields).
- On success: generates a new uuid, saves to localStorage, selects the new deck.
- On failure: shows an inline error message.

### Share Link

- "Share Link" button on a custom deck's detail panel.
- Encodes the deck as `encodeURIComponent(JSON.stringify(deck))` and appends as `?deck=<encoded>` to the current URL. (`encodeURIComponent` handles non-ASCII characters such as music symbols; `btoa` would silently corrupt them.)
- Copies the full URL to clipboard and shows a brief "Link copied!" toast.
- On page load: if `?deck=` param is present, decode it, show a banner "Someone shared a deck with you — add to my decks?" with Accept / Dismiss.
- On Accept: save to localStorage (new uuid), remove query param from URL, select the deck.

---

## 5. Flashcard Mode Improvements

### Know / Not Know Before Flip

- The ✕ and ✓ buttons are **always active** (remove `flipped &&` guard).
- Keyboard shortcuts ← and → work regardless of flip state.
- Hint text changes from "Flip first" to "Rate anytime".
- The hint below the card updates: "Space to flip · ← still learning · → got it".

### Shuffle

- A shuffle button (🔀 icon) added to the top bar of flashcard mode, next to the "← Back" button.
- On click: Fisher-Yates shuffles the in-memory term array for the session.
- Does not persist — leaving and returning to flashcard mode restores original order.
- Resets index to 0 and clears flip state after shuffle.

---

## 6. Term Count Selector

Applies to Quiz, Type, and Match modes only (not Flashcards).

- Displayed in the detail panel when one of these modes is selected.
- UI: "How many terms? [−] 10 [+]" stepper, or a numeric input.
- Minimum: 4 (enough for multiple-choice options). Maximum: full deck size.
- Default: `min(20, deckSize)`.
- Value stored in `useStudySession` alongside `lastMode` and `lastCategory` so it persists across visits.
- Passed to each mode component via router state or session hook.

---

## 7. Affected Files

| File | Change |
|---|---|
| `src/Components/Container/index.tsx` | Hamburger menu, anchor href fix |
| `src/Pages/StudyPage/index.tsx` | Replaced with deck library landing page |
| `src/Pages/StudyPage/FlashcardMode.tsx` | Shuffle button, remove flip guard |
| `src/Pages/StudyPage/MultipleChoiceMode.tsx` | Accept term count param |
| `src/Pages/StudyPage/TypeInMode.tsx` | Accept term count param |
| `src/Pages/StudyPage/MatchingMode.tsx` | Accept term count param |
| `src/Pages/StudyPage/DeckModal.tsx` | New — create/edit modal |
| `src/hooks/useStudySession.ts` | Add termCount to session state |
| `src/hooks/useDecks.ts` | New — localStorage deck CRUD |
| `src/Pages/ProfileRouting/index.tsx` | Updated routes with deckId param |
| `src/data/terms.ts` | No change (remains default deck source) |
