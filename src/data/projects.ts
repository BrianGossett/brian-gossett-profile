export interface ProjectSection {
  title: string
  explanation: string
  code: string
  language?: string
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
          'Sensitive password entries are gated behind Android BiometricPrompt. The vault screen only renders after onAuthenticationSucceeded fires — the data never loads otherwise.',
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
