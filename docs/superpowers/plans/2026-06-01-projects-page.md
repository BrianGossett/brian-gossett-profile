# Projects Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/projects` route that showcases AkashicOnline and the Portfolio+Study app with horizontally scrollable project cards and a detailed "How It's Built" code breakdown panel.

**Architecture:** All project data lives in a typed `src/data/projects.ts` array — no fetching. The `ProjectsPage` component selects a project via local state and renders the card strip + detail panel. Route and nav link are wired into existing files.

**Tech Stack:** React 19, TypeScript, Chakra UI v3, React Router v7

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/data/projects.ts` | Create | All project data and TypeScript interfaces |
| `src/Pages/ProjectsPage/index.tsx` | Create | Full page component |
| `src/Pages/ProfileRouting/index.tsx` | Modify | Add `/projects` route |
| `src/Components/Container/index.tsx` | Modify | Add "Projects" nav link |
| `src/test/projects.test.ts` | Create | Data shape validation tests |

---

## Task 1: Project data file + tests

**Files:**
- Create: `src/data/projects.ts`
- Create: `src/test/projects.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/test/projects.test.ts
import { describe, it, expect } from 'vitest'
import { PROJECTS } from '../data/projects'

describe('PROJECTS data', () => {
  it('has at least 2 projects', () => {
    expect(PROJECTS.length).toBeGreaterThanOrEqual(2)
  })

  it('each project has all required fields', () => {
    PROJECTS.forEach(p => {
      expect(typeof p.id).toBe('string')
      expect(typeof p.name).toBe('string')
      expect(typeof p.icon).toBe('string')
      expect(typeof p.techSummary).toBe('string')
      expect(typeof p.description).toBe('string')
      expect(typeof p.githubUrl).toBe('string')
      expect(p.chips.length).toBeGreaterThan(0)
      expect(p.sections.length).toBeGreaterThan(0)
    })
  })

  it('each section has title, explanation, and code', () => {
    PROJECTS.forEach(p => {
      p.sections.forEach(s => {
        expect(typeof s.title).toBe('string')
        expect(s.title.length).toBeGreaterThan(0)
        expect(typeof s.explanation).toBe('string')
        expect(s.explanation.length).toBeGreaterThan(0)
        expect(typeof s.code).toBe('string')
        expect(s.code.length).toBeGreaterThan(0)
      })
    })
  })

  it('first project is AkashicOnline', () => {
    expect(PROJECTS[0].id).toBe('akashic')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- --run src/test/projects.test.ts
```

Expected: FAIL — `../data/projects` not found.

- [ ] **Step 3: Create src/data/projects.ts**

```ts
// src/data/projects.ts

export interface ProjectSection {
  title: string
  explanation: string
  code: string
  language: string
}

export interface Project {
  id: string
  name: string
  icon: string
  techSummary: string
  description: string
  githubUrl: string
  chips: string[]
  sections: ProjectSection[]
}

export const PROJECTS: Project[] = [
  {
    id: 'akashic',
    name: 'AkashicOnline',
    icon: '📱',
    techSummary: 'Android · Kotlin · Jetpack Compose',
    description:
      'A full personal life management Android app — nutrition tracking via the USDA food database, workout logging with round/step timers, diary, calendar, notes, task management, and a biometric-secured password vault. Built entirely in Kotlin with Jetpack Compose and Room for local persistence.',
    githubUrl: 'https://github.com/BrianGossett/AkashicOnline',
    chips: ['Kotlin', 'Jetpack Compose', 'Room DB', 'Retrofit', 'USDA API', 'ML Kit', 'Biometric Auth', 'Material 3'],
    sections: [
      {
        title: '🗄 Data Layer — Room + DAO',
        language: 'kotlin',
        explanation:
          'Each feature module has its own Room entity and DAO. Queries are Kotlin suspend functions, so all database work stays off the main thread without manually managing threads.',
        code: `@Dao
interface FoodLogDao {
    @Query("SELECT * FROM food_log WHERE date = :date")
    suspend fun getLogForDate(date: String): List<FoodLog>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLog(log: FoodLog)

    @Delete
    suspend fun deleteLog(log: FoodLog)
}`,
      },
      {
        title: '🎨 Jetpack Compose UI',
        language: 'kotlin',
        explanation:
          'All screens follow a ViewModel → StateFlow → Composable pattern. State is collected with collectAsState() so the UI recomposes automatically when data changes.',
        code: `@Composable
fun FoodLogScreen(
    viewModel: FoodLogViewModel = hiltViewModel()
) {
    val logs by viewModel.logs.collectAsState()
    val totalCalories by viewModel.totalCalories.collectAsState()

    LazyColumn {
        item { CalorieSummary(total = totalCalories) }
        items(logs, key = { it.id }) { log ->
            FoodLogItem(log, onDelete = { viewModel.delete(log) })
        }
    }
}`,
      },
      {
        title: '🌐 USDA API Integration',
        language: 'kotlin',
        explanation:
          'Food search hits the USDA FoodData Central API via Retrofit. Results are mapped to local entities and saved to Room, minimising repeat network calls.',
        code: `interface FoodApiService {
    @GET("foods/search")
    suspend fun searchFoods(
        @Query("query") query: String,
        @Query("pageSize") pageSize: Int = 20,
        @Query("api_key") apiKey: String = BuildConfig.USDA_API_KEY
    ): FoodSearchResponse
}

// In ViewModel:
val results = foodApiService.searchFoods(query)
foodLogDao.insertAll(results.foods.map { it.toEntity() })`,
      },
      {
        title: '🔒 Biometric Vault',
        language: 'kotlin',
        explanation:
          'Sensitive password entries are gated behind Android BiometricPrompt. The vault Composable only renders after onAuthenticationSucceeded fires — the data never loads otherwise.',
        code: `val promptInfo = BiometricPrompt.PromptInfo.Builder()
    .setTitle("Unlock Vault")
    .setSubtitle("Verify your identity to access passwords")
    .setNegativeButtonText("Cancel")
    .build()

BiometricPrompt(activity, executor,
    object : BiometricPrompt.AuthenticationCallback() {
        override fun onAuthenticationSucceeded(
            result: BiometricPrompt.AuthenticationResult
        ) { viewModel.unlockVault() }

        override fun onAuthenticationFailed() {
            showError("Authentication failed")
        }
    }
).authenticate(promptInfo)`,
      },
      {
        title: '📷 Barcode Scanning — ML Kit',
        language: 'kotlin',
        explanation:
          'The food logger can scan barcodes with the camera using ML Kit. The scanned UPC is passed directly to the USDA API to auto-populate the food entry — no manual searching needed.',
        code: `val scanner = BarcodeScanning.getClient()
val image = InputImage.fromBitmap(bitmap, rotation = 0)

scanner.process(image)
    .addOnSuccessListener { barcodes ->
        barcodes.firstOrNull()?.rawValue?.let { upc ->
            viewModel.searchByBarcode(upc)
        }
    }
    .addOnFailureListener { e ->
        Log.e("Scanner", "Barcode scan failed", e)
    }`,
      },
    ],
  },
  {
    id: 'portfolio',
    name: 'Portfolio + Study App',
    icon: '🎵',
    techSummary: 'React · TypeScript · Vite',
    description:
      'This portfolio site doubles as a fully-featured flashcard study system for music theory. Custom decks can be created, edited, imported from JSON, and shared via URL-encoded links. Study modes include flashcards with shuffle, multiple choice, type-in, and matching — each supporting a configurable term count.',
    githubUrl: 'https://github.com/BrianGossett/brian-gossett-profile',
    chips: ['React 19', 'TypeScript', 'Chakra UI v3', 'React Router v7', 'Vite', 'Vitest', 'AWS Amplify'],
    sections: [
      {
        title: '🗂 Deck System — useDecks hook',
        language: 'typescript',
        explanation:
          'Custom flashcard decks live in localStorage via a useDecks hook. The built-in Music Theory deck is always derived from a static TypeScript array — never stored — so it can never be accidentally deleted.',
        code: `export function useDecks() {
  const [customDecks, setCustomDecks] = useState<Deck[]>(
    () => {
      const raw = localStorage.getItem('study-custom-decks')
      return raw ? JSON.parse(raw) : []
    }
  )

  const createDeck = useCallback((name: string, terms: Term[]): Deck => {
    const deck: Deck = { id: crypto.randomUUID(), name, terms }
    setCustomDecks(prev => {
      const next = [...prev, deck]
      localStorage.setItem('study-custom-decks', JSON.stringify(next))
      return next
    })
    return deck
  }, [])

  return { customDecks, createDeck, updateDeck, deleteDeck }
}`,
      },
      {
        title: '🛣 Study Routing — deckId URL params',
        language: 'typescript',
        explanation:
          'Each study mode route includes a :deckId segment. Mode components read it with useParams() and load the correct deck via useDeckById() — so bookmarked URLs always open the right deck.',
        code: `// Router definition
<Route path="/study/:deckId/flashcards" element={<FlashcardMode />} />
<Route path="/study/:deckId/quiz"       element={<MultipleChoiceMode />} />

// Inside any mode component
const { deckId = 'default' } = useParams<{ deckId: string }>()
const deck = useDeckById(deckId)           // falls back to Music Theory
const terms = filterByCategory(deck.terms, category)`,
      },
      {
        title: '🔗 Share Link Encoding',
        language: 'typescript',
        explanation:
          'Decks are shared by encoding the full term list as encodeURIComponent(JSON.stringify(deck)) appended to the URL. Using encodeURIComponent (not btoa) means accented characters and non-Latin scripts survive the round-trip correctly.',
        code: `export function encodeShareLink(deck: Deck): string {
  return encodeURIComponent(
    JSON.stringify({ name: deck.name, terms: deck.terms })
  )
}

export function decodeShareLink(param: string): Omit<Deck, 'id'> | null {
  try {
    const obj = JSON.parse(decodeURIComponent(param))
    if (typeof obj?.name !== 'string' || !Array.isArray(obj?.terms))
      return null
    return { name: obj.name, terms: obj.terms }
  } catch { return null }
}`,
      },
      {
        title: '🃏 Flashcard Mode — Shuffle + Rating',
        language: 'typescript',
        explanation:
          'The term list is stored in local state so Fisher-Yates shuffle works in-memory without re-fetching. Rating buttons are always active — you can mark a card before or after flipping it.',
        code: `function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// State is terms, not a derived value — so shuffle works
const [terms, setTerms] = useState(() => filterByCategory(deck.terms, category))

function handleShuffle() {
  setTerms(shuffleArray(terms))
  setIndex(0)
  setFlipped(false)
}`,
      },
      {
        title: '💾 Session Persistence — sessionStorage',
        language: 'typescript',
        explanation:
          'Study progress (mastered terms, missed terms, streak, card position) persists in sessionStorage. A page refresh resumes exactly where you left off; closing the browser resets for a fresh start.',
        code: `const SESSION_KEY = 'music-theory-study-session'

function save(session: StudySession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

function load(): StudySession {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? { ...DEFAULT_SESSION, ...JSON.parse(raw) } : { ...DEFAULT_SESSION }
  } catch {
    return { ...DEFAULT_SESSION }
  }
}

export function useStudySession() {
  const [session, setSession] = useState<StudySession>(load)
  // every mutation calls save() to keep storage in sync
}`,
      },
    ],
  },
]
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- --run src/test/projects.test.ts
```

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/projects.ts src/test/projects.test.ts
git commit -m "feat: add projects data with sections and tests"
```

---

## Task 2: ProjectsPage component

**Files:**
- Create: `src/Pages/ProjectsPage/index.tsx`

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p /home/brian/Public/Programming/Github/brian-gossett-profile/src/Pages/ProjectsPage
```

- [ ] **Step 2: Write the full component**

```tsx
// src/Pages/ProjectsPage/index.tsx
import { useState } from 'react'
import { Box, Flex, Text, Wrap, WrapItem, Link } from '@chakra-ui/react'
import PageContainer from '../../Components/Container'
import { colors } from '../../Theme'
import { PROJECTS, type Project } from '../../data/projects'

const ProjectsPage = () => {
  const [selectedId, setSelectedId] = useState(PROJECTS[0].id)
  const project = PROJECTS.find(p => p.id === selectedId) ?? PROJECTS[0]

  return (
    <PageContainer>
      {/* Page header */}
      <Box borderBottom={`1px solid ${colors.border}`} px={8} py={4}>
        <Text fontSize="xl" fontWeight="800" color={colors.textPrimary}>Projects</Text>
        <Text fontSize="xs" color={colors.textMuted}>Select a project to explore the breakdown</Text>
      </Box>

      {/* Scrollable project card strip */}
      <Box
        borderBottom={`1px solid ${colors.border}`}
        px={6}
        py={4}
        overflowX="auto"
      >
        <Flex gap={4} w="max-content">
          {PROJECTS.map(p => (
            <ProjectCard
              key={p.id}
              project={p}
              selected={p.id === selectedId}
              onClick={() => setSelectedId(p.id)}
            />
          ))}
        </Flex>
      </Box>

      {/* Detail panel */}
      <Box maxW="900px" mx="auto" w="100%" px={6} py={8}>
        <ProjectDetail project={project} />
      </Box>
    </PageContainer>
  )
}

interface ProjectCardProps {
  project: Project
  selected: boolean
  onClick: () => void
}

const ProjectCard = ({ project, selected, onClick }: ProjectCardProps) => (
  <Box
    onClick={onClick}
    w="180px"
    flexShrink={0}
    bg={selected ? colors.deepBlue : colors.surface}
    border={`1px solid ${selected ? colors.accent : colors.border}`}
    borderRadius="xl"
    p={4}
    cursor="pointer"
    _hover={{ borderColor: colors.accentSoft }}
  >
    <Text fontSize="2xl" mb={2}>{project.icon}</Text>
    <Text fontSize="sm" fontWeight="700" color={colors.textPrimary} mb={1}>{project.name}</Text>
    <Text fontSize="xs" color={selected ? colors.accent : colors.textMuted} mb={3}>{project.techSummary}</Text>
    <Text fontSize="xs" color={colors.textMuted} lineHeight="1.5">{project.description.slice(0, 80)}…</Text>
  </Box>
)

const ProjectDetail = ({ project }: { project: Project }) => (
  <Box>
    {/* Header */}
    <Flex align="center" gap={4} mb={2} flexWrap="wrap">
      <Text fontSize="2xl" fontWeight="800" color={colors.textPrimary}>{project.icon} {project.name}</Text>
      <Link
        href={project.githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        fontSize="xs"
        color={colors.textMuted}
        border={`1px solid ${colors.border}`}
        borderRadius="md"
        px={3}
        py={1}
        textDecoration="none"
        _hover={{ color: colors.accent, borderColor: colors.accent }}
      >
        View on GitHub ↗
      </Link>
    </Flex>

    <Text fontSize="sm" color={colors.textMuted} lineHeight="1.8" mb={6} maxW="680px">
      {project.description}
    </Text>

    {/* Tech chips */}
    <Wrap gap={2} mb={8}>
      {project.chips.map(chip => (
        <WrapItem key={chip}>
          <Box
            bg={colors.accentDim}
            border={`1px solid ${colors.accentDim}`}
            borderRadius="full"
            px={3}
            py={1}
            fontSize="xs"
            color={colors.accent}
          >
            {chip}
          </Box>
        </WrapItem>
      ))}
    </Wrap>

    {/* Breakdown sections */}
    <Text
      fontSize="xs"
      textTransform="uppercase"
      letterSpacing="widest"
      color={colors.accent}
      fontWeight="700"
      mb={4}
    >
      How It's Built
    </Text>

    <Flex direction="column" gap={4}>
      {project.sections.map(section => (
        <Box
          key={section.title}
          bg={colors.surface}
          border={`1px solid ${colors.border}`}
          borderRadius="xl"
          p={6}
        >
          <Text fontSize="sm" fontWeight="700" color={colors.textPrimary} mb={2}>
            {section.title}
          </Text>
          <Text fontSize="sm" color={colors.textMuted} lineHeight="1.7" mb={4}>
            {section.explanation}
          </Text>
          <Box
            as="pre"
            bg={colors.pageBg}
            border={`1px solid ${colors.border}`}
            borderRadius="lg"
            p={4}
            overflowX="auto"
            fontSize="xs"
            color={colors.accent}
            lineHeight="1.7"
            fontFamily="monospace"
          >
            <Box as="code">{section.code}</Box>
          </Box>
        </Box>
      ))}
    </Flex>
  </Box>
)

export default ProjectsPage
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/Pages/ProjectsPage/index.tsx
git commit -m "feat: add ProjectsPage component with card strip and code breakdown"
```

---

## Task 3: Wire up routing and nav link

**Files:**
- Modify: `src/Pages/ProfileRouting/index.tsx`
- Modify: `src/Components/Container/index.tsx`

- [ ] **Step 1: Add the /projects route to ProfileRouting**

Open `src/Pages/ProfileRouting/index.tsx`. Add the import after the existing page imports:

```tsx
import ProjectsPage from '../ProjectsPage'
```

Add the route inside `<Routes>`, between the `/examples` and `/study` routes:

```tsx
<Route path="/projects" element={<ProjectsPage />} />
```

The full file after changes:

```tsx
import { Routes, Route } from 'react-router'
import HomePage from '../HomePage'
import ExamplePage from '../ExamplePage'
import ProjectsPage from '../ProjectsPage'
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
      <Route path="/projects" element={<ProjectsPage />} />
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

- [ ] **Step 2: Add the Projects NavLink to the header**

Open `src/Components/Container/index.tsx`. In the `navLinks` JSX fragment, add the Projects `NavLink` between the Contact `Link` and the Study `NavLink`:

```tsx
const navLinks = (
  <>
    <Link href="/#hero"       color={colors.textMuted} fontSize="sm" _hover={{ color: colors.accent }} textDecoration="none">Home</Link>
    <Link href="/#about"      color={colors.textMuted} fontSize="sm" _hover={{ color: colors.accent }} textDecoration="none">About</Link>
    <Link href="/#experience" color={colors.textMuted} fontSize="sm" _hover={{ color: colors.accent }} textDecoration="none">Experience</Link>
    <Link href="/#contact"    color={colors.textMuted} fontSize="sm" _hover={{ color: colors.accent }} textDecoration="none">Contact</Link>
    <NavLink
      to="/projects"
      style={({ isActive }) => ({
        textDecoration: 'none',
        fontSize: '14px',
        color: isActive ? colors.accent : colors.textMuted,
      })}
    >
      Projects
    </NavLink>
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
```

- [ ] **Step 3: Run full build**

```bash
npm run build 2>&1 | head -20
```

Expected: No TypeScript errors.

- [ ] **Step 4: Run all tests**

```bash
npm test -- --run
```

Expected: All tests pass (22 total — 18 existing + 4 new projects tests).

- [ ] **Step 5: Commit**

```bash
git add src/Pages/ProfileRouting/index.tsx src/Components/Container/index.tsx
git commit -m "feat: wire /projects route and Projects nav link"
```
