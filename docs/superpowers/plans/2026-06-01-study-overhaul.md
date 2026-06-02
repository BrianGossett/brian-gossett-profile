# Study Page Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deck-library landing page with full CRUD for custom flashcard decks, import/export/share-link support, a responsive hamburger nav, and flashcard-mode UX improvements (shuffle, always-active rating buttons, per-mode term count).

**Architecture:** A `useDecks` hook manages custom decks in localStorage. The `/study` route becomes a two-panel deck library (sidebar + detail panel). All study-mode routes gain a `:deckId` URL param; mode components read the deck via `useDeckById`. The built-in Music Theory deck has `id = "default"` and is never written to localStorage. Session state gains `lastDeckId` and `termCounts` fields.

**Tech Stack:** React 19, TypeScript, Chakra UI v3, React Router v7, Vite 6, Vitest, @testing-library/react

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `package.json` | Modify | Add test deps |
| `vite.config.ts` | Modify | Add Vitest config block |
| `src/test/setup.ts` | Create | jsdom test setup |
| `src/hooks/useDecks.ts` | Create | Deck interface, localStorage CRUD, `useDeckById`, `filterByCategory`, `getDeckCategories` |
| `src/hooks/useStudySession.ts` | Modify | Add `lastDeckId`, `termCounts`, `setLastDeckId`, `setTermCount` |
| `src/utils/shareLink.ts` | Create | `encodeShareLink`, `decodeShareLink` |
| `src/Components/Container/index.tsx` | Modify | Hamburger menu, anchor href fix |
| `src/Pages/ProfileRouting/index.tsx` | Modify | Routes with `:deckId` param |
| `src/Pages/StudyPage/index.tsx` | Rewrite | Deck library landing page |
| `src/Pages/StudyPage/DeckModal.tsx` | Create | Create / edit deck modal |
| `src/Pages/StudyPage/FlashcardMode.tsx` | Modify | Shuffle button, remove flip guard |
| `src/Pages/StudyPage/MultipleChoiceMode.tsx` | Modify | `useDeckById`, `termCounts.quiz` |
| `src/Pages/StudyPage/TypeInMode.tsx` | Modify | `useDeckById`, `termCounts.type` |
| `src/Pages/StudyPage/MatchingMode.tsx` | Modify | `useDeckById`, `termCounts.match` |
| `src/test/useDecks.test.ts` | Create | Hook unit tests |
| `src/test/shareLink.test.ts` | Create | Encode/decode unit tests |

---

## Task 1: Add Vitest

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Install test dependencies**

```bash
npm install --save-dev vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/user-event
```

Expected: No errors. `node_modules/vitest` exists.

- [ ] **Step 2: Add test script to package.json**

In `package.json`, add `"test": "vitest"` to the `scripts` object:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest"
}
```

- [ ] **Step 3: Add Vitest config to vite.config.ts**

Read the file first, then add the `test` block. The full file should look like:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
```

- [ ] **Step 4: Create test setup file**

```ts
// src/test/setup.ts
import '@testing-library/react'
```

- [ ] **Step 5: Verify Vitest runs**

```bash
npm test -- --run
```

Expected: "No test files found" or similar success message (no errors).

- [ ] **Step 6: Commit**

```bash
git add package.json vite.config.ts src/test/setup.ts package-lock.json
git commit -m "chore: add Vitest test infrastructure"
```

---

## Task 2: Deck data model + useDecks hook

**Files:**
- Create: `src/hooks/useDecks.ts`
- Create: `src/test/useDecks.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/test/useDecks.test.ts
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useDecks, useDeckById, filterByCategory, getDeckCategories, DEFAULT_DECK } from '../hooks/useDecks'
import type { Term } from '../data/terms'

const TERM_A: Term = { id: 1, category: 'Scales', term: 'Major Scale', definition: 'A diatonic scale.' }
const TERM_B: Term = { id: 2, category: 'Chords', term: 'Triad', definition: 'Three-note chord.' }

beforeEach(() => localStorage.clear())

describe('useDecks', () => {
  it('starts with no custom decks', () => {
    const { result } = renderHook(() => useDecks())
    expect(result.current.customDecks).toEqual([])
  })

  it('createDeck adds a deck to localStorage', () => {
    const { result } = renderHook(() => useDecks())
    act(() => { result.current.createDeck('My Deck', [TERM_A]) })
    expect(result.current.customDecks).toHaveLength(1)
    expect(result.current.customDecks[0].name).toBe('My Deck')
    expect(JSON.parse(localStorage.getItem('study-custom-decks')!)).toHaveLength(1)
  })

  it('updateDeck mutates name and terms in place', () => {
    const { result } = renderHook(() => useDecks())
    let id = ''
    act(() => { id = result.current.createDeck('Old', [TERM_A]).id })
    act(() => { result.current.updateDeck(id, 'New', [TERM_A, TERM_B]) })
    expect(result.current.customDecks[0].name).toBe('New')
    expect(result.current.customDecks[0].terms).toHaveLength(2)
  })

  it('deleteDeck removes the deck', () => {
    const { result } = renderHook(() => useDecks())
    let id = ''
    act(() => { id = result.current.createDeck('Gone', [TERM_A]).id })
    act(() => { result.current.deleteDeck(id) })
    expect(result.current.customDecks).toHaveLength(0)
  })
})

describe('useDeckById', () => {
  it('returns DEFAULT_DECK for id "default"', () => {
    const { result } = renderHook(() => useDeckById('default'))
    expect(result.current.id).toBe('default')
    expect(result.current.terms.length).toBeGreaterThan(0)
  })

  it('returns DEFAULT_DECK for unknown id', () => {
    const { result } = renderHook(() => useDeckById('no-such-id'))
    expect(result.current.id).toBe('default')
  })

  it('returns matching custom deck', () => {
    localStorage.setItem('study-custom-decks', JSON.stringify([
      { id: 'abc', name: 'Spanish', terms: [TERM_A] }
    ]))
    const { result } = renderHook(() => useDeckById('abc'))
    expect(result.current.name).toBe('Spanish')
  })
})

describe('filterByCategory', () => {
  const terms = [TERM_A, TERM_B]
  it('"all" returns all terms', () => expect(filterByCategory(terms, 'all')).toHaveLength(2))
  it('filters by category', () => expect(filterByCategory(terms, 'Scales')).toEqual([TERM_A]))
  it('returns empty array for unknown category', () => expect(filterByCategory(terms, 'Nope')).toHaveLength(0))
})

describe('getDeckCategories', () => {
  it('returns unique sorted categories', () => {
    expect(getDeckCategories([TERM_A, TERM_B])).toEqual(['Chords', 'Scales'])
  })
})

describe('DEFAULT_DECK', () => {
  it('has id "default"', () => expect(DEFAULT_DECK.id).toBe('default'))
  it('has terms from ALL_TERMS', () => expect(DEFAULT_DECK.terms.length).toBeGreaterThan(0))
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- --run src/test/useDecks.test.ts
```

Expected: FAIL — `../hooks/useDecks` not found.

- [ ] **Step 3: Implement useDecks.ts**

```ts
// src/hooks/useDecks.ts
import { useState, useCallback, useMemo } from 'react'
import { ALL_TERMS, type Term } from '../data/terms'

const DECKS_KEY = 'study-custom-decks'

export interface Deck {
  id: string
  name: string
  terms: Term[]
}

export const DEFAULT_DECK: Deck = {
  id: 'default',
  name: 'Music Theory',
  terms: ALL_TERMS,
}

function loadCustomDecks(): Deck[] {
  try {
    const raw = localStorage.getItem(DECKS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCustomDecks(decks: Deck[]): void {
  localStorage.setItem(DECKS_KEY, JSON.stringify(decks))
}

export function filterByCategory(terms: Term[], category: string): Term[] {
  if (category === 'all') return terms
  return terms.filter(t => t.category === category)
}

export function getDeckCategories(terms: Term[]): string[] {
  return [...new Set(terms.map(t => t.category))].sort()
}

export function useDecks() {
  const [customDecks, setCustomDecks] = useState<Deck[]>(loadCustomDecks)

  const createDeck = useCallback((name: string, terms: Term[]): Deck => {
    const deck: Deck = { id: crypto.randomUUID(), name, terms }
    setCustomDecks(prev => {
      const next = [...prev, deck]
      saveCustomDecks(next)
      return next
    })
    return deck
  }, [])

  const updateDeck = useCallback((id: string, name: string, terms: Term[]): void => {
    setCustomDecks(prev => {
      const next = prev.map(d => d.id === id ? { ...d, name, terms } : d)
      saveCustomDecks(next)
      return next
    })
  }, [])

  const deleteDeck = useCallback((id: string): void => {
    setCustomDecks(prev => {
      const next = prev.filter(d => d.id !== id)
      saveCustomDecks(next)
      return next
    })
  }, [])

  return { customDecks, createDeck, updateDeck, deleteDeck }
}

export function useDeckById(deckId: string): Deck {
  return useMemo(() => {
    if (deckId === 'default') return DEFAULT_DECK
    try {
      const raw = localStorage.getItem(DECKS_KEY)
      const decks: Deck[] = raw ? JSON.parse(raw) : []
      return decks.find(d => d.id === deckId) ?? DEFAULT_DECK
    } catch {
      return DEFAULT_DECK
    }
  }, [deckId])
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- --run src/test/useDecks.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useDecks.ts src/test/useDecks.test.ts
git commit -m "feat: add useDecks hook with localStorage CRUD and helpers"
```

---

## Task 3: Share link utilities

**Files:**
- Create: `src/utils/shareLink.ts`
- Create: `src/test/shareLink.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/test/shareLink.test.ts
import { describe, it, expect } from 'vitest'
import { encodeShareLink, decodeShareLink } from '../utils/shareLink'
import type { Deck } from '../hooks/useDecks'
import type { Term } from '../data/terms'

const TERM: Term = { id: 1, category: 'Test', term: 'Ionian', definition: 'The major scale mode — résumé safe.' }
const DECK: Deck = { id: 'abc', name: 'My Deck', terms: [TERM] }

describe('encodeShareLink', () => {
  it('returns a non-empty string', () => {
    expect(encodeShareLink(DECK)).toBeTruthy()
  })
  it('round-trips through decodeShareLink', () => {
    const encoded = encodeShareLink(DECK)
    const decoded = decodeShareLink(encoded)
    expect(decoded?.name).toBe(DECK.name)
    expect(decoded?.terms[0].term).toBe(TERM.term)
    expect(decoded?.terms[0].definition).toBe(TERM.definition)
  })
  it('handles non-ASCII characters correctly', () => {
    const deck: Deck = { id: 'x', name: 'Décks', terms: [{ id: 1, category: 'C', term: '音楽', definition: 'Music 音' }] }
    const decoded = decodeShareLink(encodeShareLink(deck))
    expect(decoded?.terms[0].term).toBe('音楽')
  })
})

describe('decodeShareLink', () => {
  it('returns null for invalid input', () => {
    expect(decodeShareLink('not-valid-json')).toBeNull()
    expect(decodeShareLink('')).toBeNull()
  })
  it('returns null for JSON missing required fields', () => {
    const bad = encodeURIComponent(JSON.stringify({ foo: 'bar' }))
    expect(decodeShareLink(bad)).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- --run src/test/shareLink.test.ts
```

Expected: FAIL — `../utils/shareLink` not found.

- [ ] **Step 3: Implement shareLink.ts**

```ts
// src/utils/shareLink.ts
import type { Deck } from '../hooks/useDecks'

export function encodeShareLink(deck: Deck): string {
  return encodeURIComponent(JSON.stringify({ name: deck.name, terms: deck.terms }))
}

export function decodeShareLink(param: string): Omit<Deck, 'id'> | null {
  try {
    const obj = JSON.parse(decodeURIComponent(param))
    if (typeof obj?.name !== 'string' || !Array.isArray(obj?.terms)) return null
    if (obj.terms.length === 0) return null
    const isValid = obj.terms.every(
      (t: unknown) => typeof (t as Record<string, unknown>)?.term === 'string' &&
                     typeof (t as Record<string, unknown>)?.definition === 'string'
    )
    if (!isValid) return null
    return { name: obj.name, terms: obj.terms }
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- --run src/test/shareLink.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/shareLink.ts src/test/shareLink.test.ts
git commit -m "feat: add share link encode/decode utilities"
```

---

## Task 4: Update useStudySession

**Files:**
- Modify: `src/hooks/useStudySession.ts`

- [ ] **Step 1: Read the current file**

Open `src/hooks/useStudySession.ts` and note the current `StudySession` interface and `DEFAULT_SESSION`.

- [ ] **Step 2: Add lastDeckId and termCounts to the interface and default**

Replace the `StudySession` interface and `DEFAULT_SESSION` with:

```ts
interface StudySession {
  mastered: number[]
  missed: number[]
  missedCounts: Record<number, number>
  streak: number
  lastMode: string
  lastCategory: string
  lastDeckId: string
  termCounts: { quiz: number; type: number; match: number }
  positions: {
    flashcards: number
    quiz: number
    type: number
    match: number
  }
}

const DEFAULT_SESSION: StudySession = {
  mastered: [],
  missed: [],
  missedCounts: {},
  streak: 0,
  lastMode: 'flashcards',
  lastCategory: 'all',
  lastDeckId: 'default',
  termCounts: { quiz: 20, type: 20, match: 20 },
  positions: { flashcards: 0, quiz: 0, type: 0, match: 0 },
}
```

- [ ] **Step 3: Add setLastDeckId and setTermCount actions to the hook body**

After the existing `setLastCategory` callback, add:

```ts
const setLastDeckId = useCallback((deckId: string) => {
  update({ lastDeckId: deckId })
}, [update])

const setTermCount = useCallback((mode: 'quiz' | 'type' | 'match', count: number) => {
  setSession(prev => {
    const next = { ...prev, termCounts: { ...prev.termCounts, [mode]: count } }
    save(next)
    return next
  })
}, [])
```

- [ ] **Step 4: Add the new actions to the return object**

```ts
return {
  session,
  weakTerms,
  markMastered,
  markMissed,
  setPosition,
  setLastMode,
  setLastCategory,
  setLastDeckId,
  setTermCount,
  resetSession,
}
```

- [ ] **Step 5: Run the TypeScript compiler to verify no errors**

```bash
npm run build 2>&1 | head -30
```

Expected: Build succeeds (or only pre-existing warnings, no new errors).

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useStudySession.ts
git commit -m "feat: add lastDeckId and termCounts to study session"
```

---

## Task 5: Nav hamburger + anchor fix

**Files:**
- Modify: `src/Components/Container/index.tsx`

- [ ] **Step 1: Replace the Header component entirely**

The new `Header` adds `useState` for mobile menu open state, hides the nav on small screens, shows a ☰ button, and fixes all anchor `href` values to include the leading `/`.

Replace the entire `Header` export with:

```tsx
export const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = (
    <>
      <Link href="/#hero"       color={colors.textMuted} fontSize="sm" _hover={{ color: colors.accent }} textDecoration="none">Home</Link>
      <Link href="/#about"      color={colors.textMuted} fontSize="sm" _hover={{ color: colors.accent }} textDecoration="none">About</Link>
      <Link href="/#experience" color={colors.textMuted} fontSize="sm" _hover={{ color: colors.accent }} textDecoration="none">Experience</Link>
      <Link href="/#contact"    color={colors.textMuted} fontSize="sm" _hover={{ color: colors.accent }} textDecoration="none">Contact</Link>
      <NavLink
        to="/study"
        style={({ isActive }) => ({
          textDecoration: 'none',
          fontSize: '14px',
          color: isActive ? colors.accent : colors.textMuted,
        })}
      >
        Study
      </NavLink>
    </>
  )

  return (
    <Box>
      <Flex
        as="header"
        bg={colors.navBg}
        borderBottom={`1px solid ${colors.border}`}
        px={8}
        py={4}
        align="center"
        gap={8}
      >
        <Text fontWeight="800" fontSize="lg" color={colors.accent} letterSpacing="0.5px">
          BG
        </Text>

        {/* Desktop nav */}
        <Flex as="nav" gap={6} display={{ base: 'none', md: 'flex' }}>
          {navLinks}
        </Flex>

        {/* Hamburger button — mobile only */}
        <Box
          as="button"
          display={{ base: 'flex', md: 'none' }}
          ml="auto"
          onClick={() => setMenuOpen(o => !o)}
          bg="none"
          border="none"
          cursor="pointer"
          color={colors.textMuted}
          fontSize="xl"
          p={1}
          _hover={{ color: colors.accent }}
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </Box>
      </Flex>

      {/* Mobile dropdown */}
      {menuOpen && (
        <Box
          display={{ base: 'flex', md: 'none' }}
          flexDirection="column"
          bg={colors.navBg}
          borderBottom={`1px solid ${colors.border}`}
          px={8}
          py={4}
          gap={4}
          onClick={() => setMenuOpen(false)}
        >
          {navLinks}
        </Box>
      )}
    </Box>
  )
}
```

Add `useState` to the React import at the top of the file:

```tsx
import { useState } from 'react'
```

- [ ] **Step 2: Run the dev server and verify manually**

```bash
npm run dev
```

- Open http://localhost:5173 in a browser.
- Resize the window to a narrow width. Confirm the nav links disappear and ☰ appears.
- Click ☰. Confirm the vertical nav drops down with all links.
- Click a nav link. Confirm the menu closes.
- Resize back to desktop. Confirm the horizontal nav reappears.
- Navigate to /study. Click "Home" in the nav. Confirm it goes to the home page's hero section.

- [ ] **Step 3: Commit**

```bash
git add src/Components/Container/index.tsx
git commit -m "feat: hamburger nav for mobile, fix anchor hrefs for cross-route navigation"
```

---

## Task 6: Update routing to use :deckId

**Files:**
- Modify: `src/Pages/ProfileRouting/index.tsx`

- [ ] **Step 1: Replace the route definitions**

The routes for study modes gain a `:deckId` segment. The `/study` route stays the same:

```tsx
// src/Pages/ProfileRouting/index.tsx
import { Routes, Route } from 'react-router'
import HomePage from '../HomePage'
import ExamplePage from '../ExamplePage'
import StudyHub from '../StudyPage'
import FlashcardMode from '../StudyPage/FlashcardMode'
import MultipleChoiceMode from '../StudyPage/MultipleChoiceMode'
import TypeInMode from '../StudyPage/TypeInMode'
import MatchingMode from '../StudyPage/MatchingMode'

const ProfileRouting = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/examples" element={<ExamplePage />} />
      <Route path="/study" element={<StudyHub />} />
      <Route path="/study/:deckId/flashcards" element={<FlashcardMode />} />
      <Route path="/study/:deckId/quiz" element={<MultipleChoiceMode />} />
      <Route path="/study/:deckId/type" element={<TypeInMode />} />
      <Route path="/study/:deckId/match" element={<MatchingMode />} />
      <Route path="*" element={<div style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', width: '100vw', height: '100vh' }}>404 Not Found</div>} />
    </Routes>
  )
}

export default ProfileRouting
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | head -20
```

Expected: Build succeeds. (Mode components will get a TS warning about unused `deckId` param — that's fixed in the next task.)

- [ ] **Step 3: Commit**

```bash
git add src/Pages/ProfileRouting/index.tsx
git commit -m "feat: add :deckId param to study mode routes"
```

---

## Task 7: Update mode components to use deck terms

**Files:**
- Modify: `src/Pages/StudyPage/FlashcardMode.tsx`
- Modify: `src/Pages/StudyPage/MultipleChoiceMode.tsx`
- Modify: `src/Pages/StudyPage/TypeInMode.tsx`
- Modify: `src/Pages/StudyPage/MatchingMode.tsx`

Each mode component needs to: (1) read `deckId` from URL params, (2) load the deck via `useDeckById`, (3) filter terms by category using `filterByCategory`, (4) use the deck's terms as the distractor pool.

- [ ] **Step 1: Update FlashcardMode.tsx**

Replace the top of the component (the imports + term-loading lines) with the following changes:

Add to imports:
```ts
import { useParams } from 'react-router'
import { useDeckById, filterByCategory } from '../../hooks/useDecks'
```

Remove this import: `import { getTermsByCategory, type Term } from '../../data/terms'`
Add this import: `import { type Term } from '../../data/terms'`

Replace these lines inside `FlashcardMode`:
```ts
// REMOVE:
const category = (session.lastCategory ?? "all") as Parameters<typeof getTermsByCategory>[0]
const allTerms = getTermsByCategory(category)
```
```ts
// ADD:
const { deckId = 'default' } = useParams<{ deckId: string }>()
const deck = useDeckById(deckId)
const category = session.lastCategory ?? 'all'
const allTerms = filterByCategory(deck.terms, category)
```

- [ ] **Step 2: Update MultipleChoiceMode.tsx**

Add to imports:
```ts
import { useParams } from 'react-router'
import { useDeckById, filterByCategory } from '../../hooks/useDecks'
```

Remove: `import { getTermsByCategory, ALL_TERMS, type Term } from '../../data/terms'`
Add: `import { type Term } from '../../data/terms'`

Inside `MultipleChoiceMode`, replace the category/filteredTerms lines:
```ts
// REMOVE:
const category = (session.lastCategory ?? "all") as Parameters<typeof getTermsByCategory>[0]
const filteredTerms = getTermsByCategory(category)
```
```ts
// ADD:
const { deckId = 'default' } = useParams<{ deckId: string }>()
const deck = useDeckById(deckId)
const category = session.lastCategory ?? 'all'
const filteredTerms = filterByCategory(deck.terms, category)
```

Inside `useMemo` for `questions`, replace:
```ts
// REMOVE:
const pool = filteredTerms.length >= 4 ? filteredTerms : ALL_TERMS
```
```ts
// ADD:
const pool = filteredTerms.length >= 4 ? filteredTerms : deck.terms
```

- [ ] **Step 3: Update TypeInMode.tsx**

Add to imports:
```ts
import { useParams } from 'react-router'
import { useDeckById, filterByCategory } from '../../hooks/useDecks'
```

Remove: `import { getTermsByCategory, type Term } from '../../data/terms'`
Add: `import { type Term } from '../../data/terms'`

Inside `TypeInMode`, replace:
```ts
// REMOVE:
const category = (session.lastCategory ?? "all") as Parameters<typeof getTermsByCategory>[0]
const filteredTerms = getTermsByCategory(category)
```
```ts
// ADD:
const { deckId = 'default' } = useParams<{ deckId: string }>()
const deck = useDeckById(deckId)
const category = session.lastCategory ?? 'all'
const filteredTerms = filterByCategory(deck.terms, category)
```

- [ ] **Step 4: Update MatchingMode.tsx**

Add to imports:
```ts
import { useParams } from 'react-router'
import { useDeckById, filterByCategory } from '../../hooks/useDecks'
```

Remove: `import { getTermsByCategory, type Term } from '../../data/terms'`
Add: `import { type Term } from '../../data/terms'`

Inside `MatchingMode`, replace:
```ts
// REMOVE:
const category = (session.lastCategory ?? "all") as Parameters<typeof getTermsByCategory>[0]
const filteredTerms = getTermsByCategory(category)
```
```ts
// ADD:
const { deckId = 'default' } = useParams<{ deckId: string }>()
const deck = useDeckById(deckId)
const category = session.lastCategory ?? 'all'
const filteredTerms = filterByCategory(deck.terms, category)
```

- [ ] **Step 5: Verify build compiles clean**

```bash
npm run build 2>&1 | head -20
```

Expected: No TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add src/Pages/StudyPage/FlashcardMode.tsx src/Pages/StudyPage/MultipleChoiceMode.tsx src/Pages/StudyPage/TypeInMode.tsx src/Pages/StudyPage/MatchingMode.tsx
git commit -m "feat: mode components read terms from deck via deckId URL param"
```

---

## Task 8: Study Landing Page (deck library)

**Files:**
- Rewrite: `src/Pages/StudyPage/index.tsx`

This replaces the current study hub with a two-panel deck library. The left sidebar lists decks. The right detail panel shows category chips, mode cards, and a Start button for the selected deck.

- [ ] **Step 1: Write the new StudyHub**

Replace the entire contents of `src/Pages/StudyPage/index.tsx` with:

```tsx
import { useState, useEffect, useRef } from 'react'
import { Box, Flex, Text, Wrap, WrapItem, VStack } from '@chakra-ui/react'
import { useNavigate } from 'react-router'
import PageContainer from '../../Components/Container'
import { colors } from '../../Theme'
import { useDecks, useDeckById, getDeckCategories, filterByCategory, type Deck } from '../../hooks/useDecks'
import { useStudySession } from '../../hooks/useStudySession'
import { decodeShareLink } from '../../utils/shareLink'
import DeckModal from './DeckModal'

const MODES = [
  { key: 'flashcards', icon: '🃏', name: 'Flashcards',      desc: 'Flip & mark. Tracks mastered terms.' },
  { key: 'quiz',       icon: '🎯', name: 'Multiple Choice', desc: '4 options per question.' },
  { key: 'type',       icon: '🔤', name: 'Type the Term',   desc: 'See the definition, type the term.' },
  { key: 'match',      icon: '🔗', name: 'Matching',        desc: 'Match terms to definitions.' },
] as const

type ModeKey = typeof MODES[number]['key']

const StudyHub = () => {
  const navigate = useNavigate()
  const { customDecks, createDeck, updateDeck, deleteDeck } = useDecks()
  const { session, setLastMode, setLastCategory, setLastDeckId, setTermCount, resetSession } = useStudySession()

  const selectedDeckId = session.lastDeckId ?? 'default'
  const selectedDeck = useDeckById(selectedDeckId)
  const selectedMode = (session.lastMode ?? 'flashcards') as ModeKey
  const selectedCat = session.lastCategory ?? 'all'

  const deckCategories = getDeckCategories(selectedDeck.terms)
  const filteredTerms = filterByCategory(selectedDeck.terms, selectedCat)
  const termCount = session.termCounts[selectedMode as keyof typeof session.termCounts] ?? 20

  const [modalState, setModalState] = useState<{ open: boolean; deck: Deck | null }>({ open: false, deck: null })
  const [importError, setImportError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [sharePrompt, setSharePrompt] = useState<{ name: string; terms: Deck['terms'] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Detect incoming share link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const encoded = params.get('deck')
    if (encoded) {
      const decoded = decodeShareLink(encoded)
      if (decoded) setSharePrompt(decoded)
      const clean = new URL(window.location.href)
      clean.searchParams.delete('deck')
      window.history.replaceState({}, '', clean.toString())
    }
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function handleStart() {
    navigate(`/study/${selectedDeckId}/${selectedMode}`)
  }

  function handleSelectDeck(id: string) {
    setLastDeckId(id)
    setLastCategory('all')
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const obj = JSON.parse(ev.target?.result as string)
        if (typeof obj?.name !== 'string' || !Array.isArray(obj?.terms)) {
          setImportError('Invalid file: missing name or terms.')
          return
        }
        const terms = (obj.terms as Deck['terms']).map((t, i) => ({
          id: i + 1,
          category: typeof t.category === 'string' ? t.category : 'General',
          term: t.term,
          definition: t.definition,
        }))
        const deck = createDeck(obj.name, terms)
        setLastDeckId(deck.id)
        setImportError(null)
        showToast('Deck imported!')
      } catch {
        setImportError('Could not parse file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify({ name: selectedDeck.name, terms: selectedDeck.terms }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedDeck.name.replace(/\s+/g, '-').toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleShareLink() {
    const param = encodeShareLink(selectedDeck)
    const url = `${window.location.origin}${window.location.pathname}?deck=${param}`
    navigator.clipboard.writeText(url).then(() => showToast('Link copied!')).catch(() => showToast('Copy failed'))
  }

  function handleAcceptShare() {
    if (!sharePrompt) return
    const terms = sharePrompt.terms.map((t, i) => ({
      id: i + 1,
      category: typeof t.category === 'string' ? t.category : 'General',
      term: t.term,
      definition: t.definition,
    }))
    const deck = createDeck(sharePrompt.name, terms)
    setLastDeckId(deck.id)
    setSharePrompt(null)
    showToast('Deck added!')
  }

  const needsCount = selectedMode === 'quiz' || selectedMode === 'type' || selectedMode === 'match'
  const maxCount = filteredTerms.length
  const clampedCount = Math.min(Math.max(4, termCount), maxCount)

  const allDecks: Deck[] = [
    { id: 'default', name: 'Music Theory', terms: [] },
    ...customDecks,
  ]

  return (
    <PageContainer>
      {/* Share prompt banner */}
      {sharePrompt && (
        <Box bg={colors.deepBlue} border={`1px solid ${colors.accent}`} px={6} py={3} display="flex" alignItems="center" gap={4} flexWrap="wrap">
          <Text fontSize="sm" color={colors.textPrimary}>
            Someone shared <Text as="span" fontWeight="700">"{sharePrompt.name}"</Text> with you ({sharePrompt.terms.length} terms) — add to my decks?
          </Text>
          <Flex gap={2}>
            <Box as="button" onClick={handleAcceptShare} bg={colors.accent} color={colors.pageBg} border="none" borderRadius="md" px={3} py={1} fontSize="sm" fontWeight="700" cursor="pointer">Add</Box>
            <Box as="button" onClick={() => setSharePrompt(null)} bg="none" border={`1px solid ${colors.border}`} borderRadius="md" px={3} py={1} fontSize="sm" color={colors.textMuted} cursor="pointer">Dismiss</Box>
          </Flex>
        </Box>
      )}

      {/* Toast */}
      {toast && (
        <Box position="fixed" bottom={6} left="50%" transform="translateX(-50%)" bg={colors.accent} color={colors.pageBg} px={5} py={2} borderRadius="full" fontSize="sm" fontWeight="700" zIndex={1000} pointerEvents="none">
          {toast}
        </Box>
      )}

      {/* Page header */}
      <Box borderBottom={`1px solid ${colors.border}`} px={8} py={4}>
        <Text fontSize="xl" fontWeight="800" color={colors.textPrimary}>Study</Text>
        <Text fontSize="xs" color={colors.textMuted}>{allDecks.length} {allDecks.length === 1 ? 'deck' : 'decks'} · select one to start</Text>
      </Box>

      <Flex flex={1} direction={{ base: 'column', md: 'row' }} overflow="hidden">
        {/* Sidebar */}
        <Box
          w={{ base: '100%', md: '200px' }}
          borderRight={{ base: 'none', md: `1px solid ${colors.border}` }}
          borderBottom={{ base: `1px solid ${colors.border}`, md: 'none' }}
          p={4}
          flexShrink={0}
          overflowY="auto"
        >
          <Text fontSize="9px" textTransform="uppercase" letterSpacing="widest" color={colors.textMuted} mb={3} fontWeight="700">My Decks</Text>

          <VStack align="stretch" gap={2} mb={4}>
            {allDecks.map(d => (
              <Box
                key={d.id}
                as="button"
                onClick={() => handleSelectDeck(d.id)}
                bg={selectedDeckId === d.id ? colors.deepBlue : 'transparent'}
                border={`1px solid ${selectedDeckId === d.id ? colors.accent : colors.border}`}
                borderRadius="lg"
                p={3}
                textAlign="left"
                cursor="pointer"
                _hover={{ borderColor: colors.accentSoft }}
              >
                <Text fontSize="xs" fontWeight="700" color={colors.textPrimary} noOfLines={1}>
                  {d.id === 'default' ? '🎵' : '📚'} {d.id === 'default' ? 'Music Theory' : d.name}
                </Text>
                {d.id === 'default'
                  ? <Text fontSize="9px" color={colors.accent}>Default</Text>
                  : <Text fontSize="9px" color={colors.textMuted}>{customDecks.find(c => c.id === d.id)?.terms.length ?? 0} terms</Text>
                }
              </Box>
            ))}
          </VStack>

          <Box
            as="button"
            onClick={() => setModalState({ open: true, deck: null })}
            w="100%"
            border={`1px dashed ${colors.border}`}
            borderRadius="lg"
            p={3}
            mb={2}
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={2}
            cursor="pointer"
            color={colors.accent}
            bg="transparent"
            _hover={{ borderColor: colors.accent }}
          >
            <Text fontSize="lg" lineHeight={1}>+</Text>
            <Text fontSize="xs">New Deck</Text>
          </Box>

          <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />
          <Box
            as="button"
            onClick={() => { setImportError(null); fileInputRef.current?.click() }}
            w="100%"
            border={`1px solid ${colors.border}`}
            borderRadius="lg"
            p={2}
            cursor="pointer"
            color={colors.textMuted}
            bg="transparent"
            fontSize="xs"
            textAlign="center"
            _hover={{ color: colors.accent, borderColor: colors.accent }}
          >
            Import JSON
          </Box>
          {importError && <Text fontSize="9px" color="#ff6b6b" mt={1}>{importError}</Text>}
        </Box>

        {/* Detail panel */}
        <Box flex={1} p={{ base: 4, md: 8 }} overflowY="auto">
          <Flex align="center" gap={3} mb={1} flexWrap="wrap">
            <Text fontSize="lg" fontWeight="800" color={colors.textPrimary}>
              {selectedDeckId === 'default' ? '🎵 Music Theory' : `📚 ${selectedDeck.name}`}
            </Text>
            {selectedDeckId === 'default' && (
              <Box bg={colors.accentDim} border={`1px solid ${colors.accentDim}`} borderRadius="full" px={2} py="1px" fontSize="9px" color={colors.accent}>Default</Box>
            )}
            {selectedDeckId !== 'default' && (
              <Flex gap={2} ml="auto">
                <Box as="button" onClick={() => setModalState({ open: true, deck: selectedDeck })} title="Edit deck" bg="none" border={`1px solid ${colors.border}`} borderRadius="md" px={2} py={1} fontSize="sm" color={colors.textMuted} cursor="pointer" _hover={{ color: colors.accent }}>✏</Box>
                <Box as="button" onClick={handleExport} title="Download JSON" bg="none" border={`1px solid ${colors.border}`} borderRadius="md" px={2} py={1} fontSize="sm" color={colors.textMuted} cursor="pointer" _hover={{ color: colors.accent }}>↓</Box>
                <Box as="button" onClick={handleShareLink} title="Copy share link" bg="none" border={`1px solid ${colors.border}`} borderRadius="md" px={2} py={1} fontSize="sm" color={colors.textMuted} cursor="pointer" _hover={{ color: colors.accent }}>🔗</Box>
                <Box
                  as="button"
                  onClick={() => { deleteDeck(selectedDeckId); setLastDeckId('default') }}
                  title="Delete deck"
                  bg="none"
                  border={`1px solid ${colors.border}`}
                  borderRadius="md"
                  px={2}
                  py={1}
                  fontSize="sm"
                  color="#ff6b6b"
                  cursor="pointer"
                  _hover={{ bg: '#ff6b6b20' }}
                >
                  🗑
                </Box>
              </Flex>
            )}
          </Flex>
          <Text fontSize="xs" color={colors.textMuted} mb={6}>
            {selectedDeck.terms.length} terms · {deckCategories.length} {deckCategories.length === 1 ? 'category' : 'categories'}
          </Text>

          {/* Session stats */}
          {(session.mastered.length > 0 || session.missed.length > 0) && (
            <Flex bg={colors.surface} border={`1px solid ${colors.accentDim}`} borderRadius="xl" p={4} mb={6} align="center" gap={5} flexWrap="wrap">
              <StatItem value={session.mastered.length} label="Mastered" color={colors.accent} />
              <Box w="1px" h="28px" bg={colors.border} />
              <StatItem value={session.missed.length} label="Missed" color="#ff6b6b" />
              <Box w="1px" h="28px" bg={colors.border} />
              <StatItem value={`${session.streak}🔥`} label="Streak" color="#ffd93d" />
              <Box as="button" ml="auto" onClick={resetSession} fontSize="xs" color={colors.textMuted} cursor="pointer" textDecoration="underline" background="none" border="none" _hover={{ color: colors.accent }}>Reset</Box>
            </Flex>
          )}

          {/* Category filter */}
          <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={2}>Category</Text>
          <Wrap gap={2} mb={6}>
            <WrapItem>
              <CategoryPill label={`All (${selectedDeck.terms.length})`} active={selectedCat === 'all'} onClick={() => setLastCategory('all')} />
            </WrapItem>
            {deckCategories.map(cat => (
              <WrapItem key={cat}>
                <CategoryPill
                  label={`${cat} (${selectedDeck.terms.filter(t => t.category === cat).length})`}
                  active={selectedCat === cat}
                  onClick={() => setLastCategory(cat)}
                />
              </WrapItem>
            ))}
          </Wrap>

          {/* Mode cards */}
          <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={2}>Mode</Text>
          <Flex gap={3} mb={6} flexWrap="wrap">
            {MODES.map(mode => (
              <ModeCard
                key={mode.key}
                mode={mode}
                selected={selectedMode === mode.key}
                onClick={() => setLastMode(mode.key)}
              />
            ))}
          </Flex>

          {/* Term count stepper — quiz / type / match only */}
          {needsCount && maxCount >= 4 && (
            <Flex align="center" gap={3} mb={6}>
              <Text fontSize="xs" color={colors.textMuted}>How many terms?</Text>
              <Flex align="center" gap={2} bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="lg" px={3} py={1}>
                <Box
                  as="button"
                  onClick={() => setTermCount(selectedMode as 'quiz' | 'type' | 'match', Math.max(4, clampedCount - 1))}
                  bg="none" border="none" cursor="pointer" color={colors.textMuted} fontSize="lg" lineHeight={1}
                  _hover={{ color: colors.accent }}
                >−</Box>
                <Text fontSize="sm" fontWeight="700" color={colors.textPrimary} minW="28px" textAlign="center">{clampedCount}</Text>
                <Box
                  as="button"
                  onClick={() => setTermCount(selectedMode as 'quiz' | 'type' | 'match', Math.min(maxCount, clampedCount + 1))}
                  bg="none" border="none" cursor="pointer" color={colors.textMuted} fontSize="lg" lineHeight={1}
                  _hover={{ color: colors.accent }}
                >+</Box>
              </Flex>
              <Text fontSize="xs" color={colors.textMuted}>of {maxCount}</Text>
            </Flex>
          )}

          {/* Start button */}
          <Box
            as="button"
            onClick={handleStart}
            w="100%"
            bg={colors.accent}
            color={colors.pageBg}
            border="none"
            borderRadius="lg"
            py={4}
            fontSize="md"
            fontWeight="800"
            cursor="pointer"
            _hover={{ bg: colors.accentSoft }}
          >
            Start {MODES.find(m => m.key === selectedMode)?.name} — {selectedCat === 'all' ? 'All Terms' : selectedCat}
          </Box>
        </Box>
      </Flex>

      {/* Deck modal */}
      {modalState.open && (
        <DeckModal
          initialDeck={modalState.deck}
          onSave={(name, terms) => {
            if (modalState.deck) {
              updateDeck(modalState.deck.id, name, terms)
            } else {
              const deck = createDeck(name, terms)
              setLastDeckId(deck.id)
            }
            setModalState({ open: false, deck: null })
          }}
          onClose={() => setModalState({ open: false, deck: null })}
        />
      )}
    </PageContainer>
  )
}

const StatItem = ({ value, label, color }: { value: string | number; label: string; color: string }) => (
  <Box>
    <Text fontSize="lg" fontWeight="800" color={color}>{value}</Text>
    <Text fontSize="xs" textTransform="uppercase" letterSpacing="wider" color={colors.textMuted}>{label}</Text>
  </Box>
)

const CategoryPill = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <Box
    as="button"
    onClick={onClick}
    bg={active ? colors.accentDim : colors.surface}
    border={`1px solid ${active ? colors.accent : colors.border}`}
    borderRadius="full"
    px={3}
    py={1}
    fontSize="xs"
    color={active ? colors.accent : colors.textMuted}
    cursor="pointer"
    _hover={{ borderColor: colors.accentSoft }}
  >
    {label}
  </Box>
)

interface ModeCardProps {
  mode: typeof MODES[number]
  selected: boolean
  onClick: () => void
}

const ModeCard = ({ mode, selected, onClick }: ModeCardProps) => (
  <Box
    flex="1"
    minW="130px"
    bg={selected ? colors.deepBlue : colors.surface}
    border={`1px solid ${selected ? colors.accent : colors.border}`}
    borderRadius="xl"
    p={4}
    cursor="pointer"
    onClick={onClick}
    _hover={{ borderColor: colors.accent }}
  >
    <Text fontSize="xl" mb={1}>{mode.icon}</Text>
    <Text fontWeight="700" fontSize="xs" color={colors.textPrimary} mb={1}>{mode.name}</Text>
    <Text fontSize="9px" color={colors.textMuted} lineHeight="1.5">{mode.desc}</Text>
  </Box>
)

export default StudyHub
```

The import at the top of the file already includes `encodeShareLink`:
```ts
import { decodeShareLink, encodeShareLink } from '../../utils/shareLink'
```
Make sure that import line matches exactly — `decodeShareLink` and `encodeShareLink` both imported.

- [ ] **Step 2: Skip build check here — build after Task 9 (DeckModal must exist first)**

DeckModal is created in Task 9. Build and commit both together after Task 9 completes.

- [ ] **Step 3: Commit (after DeckModal is created)**

Hold this commit until after Task 9.

---

## Task 9: DeckModal component

**Files:**
- Create: `src/Pages/StudyPage/DeckModal.tsx`

- [ ] **Step 1: Create DeckModal.tsx**

```tsx
// src/Pages/StudyPage/DeckModal.tsx
import { useState, useRef, useEffect } from 'react'
import { Box, Flex, Text, Input, VStack } from '@chakra-ui/react'
import { colors } from '../../Theme'
import type { Deck } from '../../hooks/useDecks'
import type { Term } from '../../data/terms'

interface TermRow {
  term: string
  definition: string
  category: string
}

interface DeckModalProps {
  initialDeck: Deck | null
  onSave: (name: string, terms: Term[]) => void
  onClose: () => void
}

const DeckModal = ({ initialDeck, onSave, onClose }: DeckModalProps) => {
  const [deckName, setDeckName] = useState(initialDeck?.name ?? '')
  const [rows, setRows] = useState<TermRow[]>(
    initialDeck?.terms.map(t => ({ term: t.term, definition: t.definition, category: t.category })) ?? [
      { term: '', definition: '', category: 'General' },
    ]
  )
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  function addRow() {
    setRows(prev => [...prev, { term: '', definition: '', category: prev[prev.length - 1]?.category ?? 'General' }])
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  function updateRow(index: number, field: keyof TermRow, value: string) {
    setRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r))
  }

  function removeRow(index: number) {
    setRows(prev => prev.filter((_, i) => i !== index))
  }

  function handleSave() {
    if (!deckName.trim()) { setError('Deck name is required.'); return }
    const valid = rows.filter(r => r.term.trim() && r.definition.trim())
    if (valid.length === 0) { setError('Add at least one term with a definition.'); return }
    const terms: Term[] = valid.map((r, i) => ({
      id: i + 1,
      term: r.term.trim(),
      definition: r.definition.trim(),
      category: r.category.trim() || 'General',
    }))
    onSave(deckName.trim(), terms)
  }

  return (
    /* Overlay */
    <Box
      position="fixed"
      inset={0}
      bg="rgba(0,0,0,0.7)"
      zIndex={500}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Modal */}
      <Box
        bg={colors.surface}
        border={`1px solid ${colors.accentDim}`}
        borderRadius="2xl"
        w="100%"
        maxW="680px"
        maxH="90vh"
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        {/* Header */}
        <Flex align="center" justify="space-between" px={6} py={4} borderBottom={`1px solid ${colors.border}`}>
          <Text fontWeight="800" fontSize="md" color={colors.textPrimary}>
            {initialDeck ? 'Edit Deck' : 'New Deck'}
          </Text>
          <Box as="button" onClick={onClose} bg="none" border="none" cursor="pointer" color={colors.textMuted} fontSize="lg" _hover={{ color: colors.accent }}>✕</Box>
        </Flex>

        {/* Body */}
        <Box flex={1} overflowY="auto" px={6} py={4}>
          {/* Deck name */}
          <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={2}>Deck Name</Text>
          <Input
            value={deckName}
            onChange={e => setDeckName(e.target.value)}
            placeholder="e.g. Spanish Vocab"
            bg={colors.pageBg}
            border={`1px solid ${colors.border}`}
            borderRadius="lg"
            color={colors.textPrimary}
            mb={6}
            _focus={{ borderColor: colors.accent }}
            _placeholder={{ color: colors.textMuted }}
          />

          {/* Term rows */}
          <Flex gap={2} mb={2}>
            <Text flex="1" fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.textMuted} fontWeight="700">Term</Text>
            <Text flex="2" fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.textMuted} fontWeight="700">Definition</Text>
            <Text w="80px" fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.textMuted} fontWeight="700">Category</Text>
            <Box w="28px" />
          </Flex>

          <VStack align="stretch" gap={2} mb={3}>
            {rows.map((row, i) => (
              <Flex key={i} gap={2} align="center">
                <Input
                  flex="1"
                  value={row.term}
                  onChange={e => updateRow(i, 'term', e.target.value)}
                  placeholder="Term"
                  bg={colors.pageBg}
                  border={`1px solid ${colors.border}`}
                  borderRadius="md"
                  color={colors.textPrimary}
                  fontSize="sm"
                  size="sm"
                  _focus={{ borderColor: colors.accent }}
                  _placeholder={{ color: colors.textMuted }}
                />
                <Input
                  flex="2"
                  value={row.definition}
                  onChange={e => updateRow(i, 'definition', e.target.value)}
                  placeholder="Definition"
                  bg={colors.pageBg}
                  border={`1px solid ${colors.border}`}
                  borderRadius="md"
                  color={colors.textPrimary}
                  fontSize="sm"
                  size="sm"
                  _focus={{ borderColor: colors.accent }}
                  _placeholder={{ color: colors.textMuted }}
                />
                <Input
                  w="80px"
                  value={row.category}
                  onChange={e => updateRow(i, 'category', e.target.value)}
                  placeholder="General"
                  bg={colors.pageBg}
                  border={`1px solid ${colors.border}`}
                  borderRadius="md"
                  color={colors.textPrimary}
                  fontSize="sm"
                  size="sm"
                  _focus={{ borderColor: colors.accent }}
                  _placeholder={{ color: colors.textMuted }}
                />
                <Box
                  as="button"
                  onClick={() => removeRow(i)}
                  w="28px"
                  color="#ff6b6b"
                  bg="none"
                  border="none"
                  cursor="pointer"
                  fontSize="sm"
                  flexShrink={0}
                  _hover={{ color: '#ff4444' }}
                >
                  ✕
                </Box>
              </Flex>
            ))}
          </VStack>

          <Box
            as="button"
            onClick={addRow}
            w="100%"
            border={`1px dashed ${colors.border}`}
            borderRadius="lg"
            py={2}
            color={colors.accent}
            bg="transparent"
            fontSize="sm"
            cursor="pointer"
            _hover={{ borderColor: colors.accent }}
          >
            + Add Term
          </Box>
          <div ref={bottomRef} />
        </Box>

        {/* Footer */}
        <Flex align="center" gap={3} px={6} py={4} borderTop={`1px solid ${colors.border}`} flexDirection="column">
          {error && <Text fontSize="xs" color="#ff6b6b" w="100%">{error}</Text>}
          <Flex gap={3} w="100%">
            <Box
              as="button"
              onClick={onClose}
              flex={1}
              bg={colors.surface}
              border={`1px solid ${colors.border}`}
              borderRadius="lg"
              py={3}
              fontSize="sm"
              color={colors.textMuted}
              cursor="pointer"
              _hover={{ borderColor: colors.accent }}
            >
              Cancel
            </Box>
            <Box
              as="button"
              onClick={handleSave}
              flex={2}
              bg={colors.accent}
              color={colors.pageBg}
              border="none"
              borderRadius="lg"
              py={3}
              fontSize="sm"
              fontWeight="800"
              cursor="pointer"
              _hover={{ bg: colors.accentSoft }}
            >
              {initialDeck ? 'Save Changes' : 'Create Deck'}
            </Box>
          </Flex>
        </Flex>
      </Box>
    </Box>
  )
}

export default DeckModal
```

- [ ] **Step 2: Verify build compiles**

```bash
npm run build 2>&1 | head -30
```

Expected: No TypeScript errors.

- [ ] **Step 3: Commit Tasks 8 + 9 together**

```bash
git add src/Pages/StudyPage/index.tsx src/Pages/StudyPage/DeckModal.tsx
git commit -m "feat: deck library landing page and deck creator/editor modal"
```

---

## Task 10: Flashcard mode improvements

**Files:**
- Modify: `src/Pages/StudyPage/FlashcardMode.tsx`

Two changes: (1) shuffle button that Fisher-Yates randomizes the term list and resets position, (2) remove the `flipped &&` guard from advance buttons and keyboard handler.

- [ ] **Step 1: Add shuffle state to FlashcardMode**

Add `useState` for a shuffled terms array. Currently `allTerms` is derived directly from `filterByCategory`. Replace it with a local state so we can shuffle without re-fetching.

At the top of `FlashcardMode`, after the existing state declarations, add:

```ts
const [terms, setTerms] = useState(() => filterByCategory(deck.terms, category))
```

Replace every reference to `allTerms` in the component with `terms`. (There are references in `index`, `advance`, progress calculation, the card render, the "All done" screen — update all of them.)

- [ ] **Step 2: Add shuffle function and button**

Add the shuffle utility inside the component (or import from an existing mode file — each mode already defines one locally; add it at the top of FlashcardMode):

```ts
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
```

Add a shuffle handler:

```ts
function handleShuffle() {
  setTerms(shuffleArray(terms))
  setIndex(0)
  setPosition('flashcards', 0)
  setFlipped(false)
}
```

In the top bar `<Flex>`, add a shuffle button after the "← Back" button:

```tsx
<Box
  as="button"
  onClick={handleShuffle}
  fontSize="sm"
  color={colors.textMuted}
  background="none"
  border="none"
  cursor="pointer"
  title="Shuffle deck"
  _hover={{ color: colors.accent }}
>
  🔀
</Box>
```

- [ ] **Step 3: Remove flipped guard from advance buttons and keyboard handler**

In the two circular buttons (✕ and ✓), change:

```tsx
// REMOVE the flipped && guard on onClick:
onClick={() => flipped && advance(false)}
// BECOMES:
onClick={() => advance(false)}

onClick={() => flipped && advance(true)}
// BECOMES:
onClick={() => advance(true)}

// REMOVE the cursor/opacity conditions:
cursor={flipped ? "pointer" : "not-allowed"}
opacity={flipped ? 1 : 0.3}
_hover={flipped ? { bg: "#ff6b6b20" } : {}}
// BECOMES:
cursor="pointer"
opacity={1}
_hover={{ bg: "#ff6b6b20" }}
```

(Apply the same to the ✓ button with its green color.)

In the keyboard handler, remove the `&& flipped` conditions:

```ts
// REMOVE:
if (e.key === "ArrowRight" && flipped) advance(true)
if (e.key === "ArrowLeft"  && flipped) advance(false)
// BECOMES:
if (e.key === "ArrowRight") advance(true)
if (e.key === "ArrowLeft")  advance(false)
```

- [ ] **Step 4: Update hint text**

Change the center text between the buttons from:
```tsx
<Text fontSize="sm" color={colors.textMuted}>{flipped ? "Know it?" : "Flip first"}</Text>
```
to:
```tsx
<Text fontSize="sm" color={colors.textMuted}>Rate anytime</Text>
```

Change the bottom keyboard hint from:
```tsx
<Text textAlign="center" fontSize="xs" color={colors.border}>
  Space to flip · ← still learning · → got it
</Text>
```
to:
```tsx
<Text textAlign="center" fontSize="xs" color={colors.border}>
  Space to flip · ← still learning · → got it · 🔀 shuffle
</Text>
```

- [ ] **Step 5: Verify build and manually test**

```bash
npm run build 2>&1 | head -20
npm run dev
```

Navigate to `/study/default/flashcards`. Verify:
- ✕ and ✓ buttons are active before flipping
- ← and → keyboard keys work before flipping
- 🔀 button shuffles the card order and resets to card 1

- [ ] **Step 6: Commit**

```bash
git add src/Pages/StudyPage/FlashcardMode.tsx
git commit -m "feat: flashcard shuffle button and always-active rating buttons"
```

---

## Task 11: Term count in Quiz, Type, and Match modes

**Files:**
- Modify: `src/Pages/StudyPage/MultipleChoiceMode.tsx`
- Modify: `src/Pages/StudyPage/TypeInMode.tsx`
- Modify: `src/Pages/StudyPage/MatchingMode.tsx`

Each mode reads `session.termCounts.<mode>` and slices its term list to that count before building questions/rounds.

- [ ] **Step 1: Update MultipleChoiceMode.tsx**

Inside `MultipleChoiceMode`, replace the hard-coded `QUIZ_SIZE = 40` constant and its usage in `useMemo`:

```ts
// REMOVE at top of file:
const QUIZ_SIZE = 40

// INSIDE the component, after filteredTerms is defined:
const termCount = Math.max(4, Math.min(session.termCounts.quiz, filteredTerms.length))

// IN useMemo for questions, replace:
return shuffle(filteredTerms).slice(0, Math.min(QUIZ_SIZE, filteredTerms.length)).map(...)
// WITH:
return shuffle(filteredTerms).slice(0, termCount).map(...)
```

- [ ] **Step 2: Update TypeInMode.tsx**

Inside `TypeInMode`, after `filteredTerms` is derived, add:

```ts
const termCount = Math.max(4, Math.min(session.termCounts.type, filteredTerms.length))
```

In the `useMemo` for `ordered`, wrap the result in a slice:

```ts
const ordered = useMemo(() => {
  const weak = filteredTerms.filter(t => (session.missedCounts[t.id] ?? 0) >= 2)
  const rest = filteredTerms.filter(t => !session.mastered.includes(t.id) && !weak.find(w => w.id === t.id))
  const mastered = filteredTerms.filter(t => session.mastered.includes(t.id))
  return [...shuffle(weak), ...shuffle(rest), ...shuffle(mastered)].slice(0, termCount)
}, []) // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 3: Update MatchingMode.tsx**

Inside `MatchingMode`, after `filteredTerms` is derived, add:

```ts
const termCount = Math.max(4, Math.min(session.termCounts.match, filteredTerms.length))
```

Replace the `shuffledAll` memo to slice to `termCount`:

```ts
const shuffledAll = useMemo(() => shuffle(filteredTerms).slice(0, termCount), []) // eslint-disable-line react-hooks/exhaustive-deps
```

Update `totalRounds` to use `shuffledAll.length` (it already does via `filteredTerms.length` — change it):

```ts
// REMOVE:
const totalRounds = Math.ceil(filteredTerms.length / ROUND_SIZE)
// ADD:
const totalRounds = Math.ceil(shuffledAll.length / ROUND_SIZE)
```

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | head -20
```

Expected: No TypeScript errors.

- [ ] **Step 5: Manual test**

```bash
npm run dev
```

- Go to `/study`. Select "Multiple Choice". Set the count stepper to 5. Click Start. Verify only 5 questions are asked.
- Go back. Select "Type the Term". Set count to 4. Verify only 4 terms appear.
- Go back. Select "Matching". Set count to 8. Verify terms are limited to 8 (one round).

- [ ] **Step 6: Commit**

```bash
git add src/Pages/StudyPage/MultipleChoiceMode.tsx src/Pages/StudyPage/TypeInMode.tsx src/Pages/StudyPage/MatchingMode.tsx
git commit -m "feat: per-mode term count selector applied to quiz, type, and matching modes"
```

---

## Task 12: Run all tests and final smoke test

- [ ] **Step 1: Run the full test suite**

```bash
npm test -- --run
```

Expected: All tests pass.

- [ ] **Step 2: Build for production**

```bash
npm run build
```

Expected: No errors. `dist/` is generated.

- [ ] **Step 3: Smoke test the built output**

```bash
npm run preview
```

Open http://localhost:4173 and verify:
1. Nav hamburger appears on narrow screens, links work from /study back to home page sections.
2. `/study` shows the deck library. Music Theory is pre-selected.
3. "New Deck" opens the modal. Create a deck with 2 terms. Deck appears in sidebar.
4. Edit the deck (pencil icon). Verify pre-filled. Save changes.
5. Export the deck (↓ icon). Verify file downloads.
6. Import the file back (Import JSON). Verify deck appears.
7. Copy share link (🔗). Open the link in a new tab. Verify the "add deck?" banner appears.
8. Select Flashcards → Start. Verify 🔀 shuffle works, ✕/✓ work before flipping.
9. Back to study. Select Quiz. Set count to 5. Start. Verify 5 questions.
10. Back to study. Select Matching. Set count to 8. Start. Verify 1 round of 8.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "chore: final build verification — study overhaul complete"
```
