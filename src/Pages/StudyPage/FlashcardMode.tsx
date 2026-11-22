import { useEffect, useEffectEvent, useState } from "react"
import { Box, Flex, Text, VStack } from "@chakra-ui/react"
import { useNavigate, useParams } from "react-router"
import PageContainer from "../../Components/Container"
import { colors } from "../../Theme"
import { type Term } from "../../data/terms"
import { useDeckById, filterByCategory } from "../../hooks/useDecks"
import { useStudySession } from "../../hooks/useStudySession"
import { shuffle } from "../../utils/studyQuestions"

/** What the current pass is over. Only a pass over the whole list saves its position. */
type Pass = "all" | "starred" | "missed"

const FlashcardMode = () => {
  const navigate = useNavigate()
  const { session, markMastered, markMissed, setPosition, setLastMode, toggleStar, setFlashcardFront } = useStudySession()
  const { deckId = 'default' } = useParams<{ deckId: string }>()
  const deck = useDeckById(deckId)
  const category = session.lastCategory ?? 'all'
  const allTerms = filterByCategory(deck.terms, category)

  // Question-and-answer decks hold the question in `definition`, so their sides are named differently.
  const isQuestionDeck = deck.front === 'definition'
  const sideName = (side: 'term' | 'definition') =>
    isQuestionDeck ? (side === 'term' ? 'answer' : 'question') : side
  // The user's choice for this deck wins; otherwise the deck decides, and plain decks show the term first.
  const front: 'term' | 'definition' = session.flashcardFront ?? deck.front ?? 'term'
  const back = front === 'term' ? 'definition' : 'term'

  const [terms, setTerms] = useState(allTerms)
  const [pass, setPass] = useState<Pass>("all")
  const savedPos = session.positions.flashcards
  const [index, setIndex] = useState(savedPos < terms.length ? savedPos : 0)
  const [flipped, setFlipped] = useState(false)
  const [gotIt, setGotIt] = useState<number>(session.mastered.length)
  const [missed, setMissed] = useState<number>(session.missed.length)
  /** Cards marked "still learning" in this pass, in the order they came up. */
  const [missedThisPass, setMissedThisPass] = useState<Term[]>([])

  useEffect(() => { setLastMode("flashcards") }, [setLastMode])

  const term: Term | undefined = terms[index]
  const starredTerms = allTerms.filter(t => session.starred.includes(t.id))
  const isStarred = term ? session.starred.includes(term.id) : false

  /** Starts a pass over `list` from the first card. */
  function startPass(list: Term[], kind: Pass) {
    setTerms(list)
    setPass(kind)
    setIndex(0)
    setFlipped(false)
    setMissedThisPass([])
    if (kind === "all") setPosition("flashcards", 0)
  }

  function advance(knew: boolean) {
    if (!term) return
    if (knew) { markMastered(term.id); setGotIt(g => g + 1) }
    else { markMissed(term.id); setMissed(m => m + 1); setMissedThisPass(prev => [...prev, term]) }
    const next = index + 1
    setIndex(next)
    if (pass === "all") setPosition("flashcards", next)
    setFlipped(false)
  }

  function handleShuffle() {
    startPass(shuffle(terms), pass)
  }

  function toggleStarredOnly() {
    if (pass === "starred") startPass(allTerms, "all")
    else if (starredTerms.length > 0) startPass(starredTerms, "starred")
  }

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === " ") { e.preventDefault(); setFlipped(f => !f) }
    if (e.key === "ArrowRight") advance(true)
    if (e.key === "ArrowLeft") advance(false)
    if (e.key.toLowerCase() === "s" && term) toggleStar(term.id)
  })
  useEffect(() => {
    const handler = (e: KeyboardEvent) => onKey(e)
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const progress = terms.length > 0 ? (index / terms.length) * 100 : 0
  const remaining = terms.length - index

  if (!term) {
    return (
      <PageContainer>
        <Box maxW="680px" mx="auto" px={6} py={10} textAlign="center">
          <Text fontSize="3xl" mb={4}>🎉</Text>
          <Text fontSize="xl" fontWeight="800" color={colors.textPrimary} mb={2}>All done!</Text>
          <Text fontSize="sm" color={colors.textMuted} mb={8}>
            {gotIt} got it · {missed} missed · {terms.length} total
          </Text>
          <VStack gap={3}>
            {missedThisPass.length > 0 && (
              <ActionBtn onClick={() => startPass(missedThisPass, "missed")}>
                Study the {missedThisPass.length} {missedThisPass.length === 1 ? "card" : "cards"} you missed
              </ActionBtn>
            )}
            <ActionBtn secondary={missedThisPass.length > 0} onClick={() => { startPass(allTerms, "all"); setGotIt(0); setMissed(0) }}>
              Restart Deck
            </ActionBtn>
          </VStack>
          <Box mt={4}>
            <Box as="button" onClick={() => navigate("/study")} fontSize="sm" color={colors.textMuted} background="none" border="none" cursor="pointer" textDecoration="underline">
              Back to Hub
            </Box>
          </Box>
        </Box>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <Box maxW="680px" mx="auto" px={6} py={8}>
        {/* Top bar */}
        <Flex align="center" gap={3} mb={4}>
          <Box as="button" onClick={() => navigate("/study")} fontSize="sm" color={colors.textMuted} background="none" border="none" cursor="pointer" _hover={{ color: colors.accent }}>
            ← Back
          </Box>
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
          <Text fontSize="sm" fontWeight="700" color={colors.textPrimary}>🃏 Flashcards</Text>
          <Box ml="auto" bg={colors.accentDim} border={`1px solid ${colors.accentDim}`} borderRadius="full" px={3} py="2px" fontSize="xs" color={colors.accent}>
            {category === "all" ? "All Terms" : category}
          </Box>
        </Flex>

        {/* Options */}
        <Flex align="center" gap={2} mb={6} flexWrap="wrap">
          <OptionChip
            pressed={false}
            onClick={() => { setFlashcardFront(back); setFlipped(false) }}
            label={`Show the ${sideName(back)} first`}
          >
            Front: {sideName(front)} ⇄
          </OptionChip>
          <OptionChip
            pressed={pass === "starred"}
            disabled={pass !== "starred" && starredTerms.length === 0}
            onClick={toggleStarredOnly}
            label="Study starred cards only"
          >
            ★ Starred only{starredTerms.length > 0 ? ` (${starredTerms.length})` : ""}
          </OptionChip>
          {pass === "missed" && (
            <Text fontSize="xs" color={colors.accent}>Studying the cards you missed</Text>
          )}
        </Flex>

        {/* Progress */}
        <Flex align="center" gap={3} mb={2}>
          <Text fontSize="xs" color={colors.textMuted} whiteSpace="nowrap">Card {index + 1} of {terms.length}</Text>
          <Box flex={1} h="6px" bg={colors.border} borderRadius="full" overflow="hidden">
            <Box h="100%" w={`${progress}%`} bg={colors.accent} borderRadius="full" />
          </Box>
          {session.streak > 0 && <Text fontSize="xs" color="#ffd93d" whiteSpace="nowrap">🔥 {session.streak}</Text>}
        </Flex>

        {/* Mini stats */}
        <Flex gap={4} mb={5} justify="center">
          <Text fontSize="xs" color="#2cb67d">{gotIt} got it</Text>
          <Text fontSize="xs" color="#ff6b6b">{missed} missed</Text>
          <Text fontSize="xs" color={colors.textMuted}>{remaining} remaining</Text>
        </Flex>

        {/* Card */}
        <Box
          bg={flipped ? colors.deepBlue : colors.surface}
          border={`1px solid ${flipped ? colors.accentDim : colors.border}`}
          borderRadius="2xl"
          p={10}
          minH="240px"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          cursor="pointer"
          onClick={() => setFlipped(f => !f)}
          mb={6}
          position="relative"
          _hover={{ borderColor: colors.accentDim }}
        >
          <Box
            as="button"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); toggleStar(term.id) }}
            aria-label={isStarred ? "Remove star" : "Star this card"}
            aria-pressed={isStarred}
            position="absolute"
            top={3}
            left={4}
            fontSize="xl"
            lineHeight="1"
            color={isStarred ? "#ffd93d" : colors.border}
            background="none"
            border="none"
            cursor="pointer"
            _hover={{ color: "#ffd93d" }}
          >
            {isStarred ? "★" : "☆"}
          </Box>

          {!flipped ? (
            <>
              <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.textMuted} mb={5}>
                Click to reveal {sideName(back)}
              </Text>
              <SideText side={front} term={term} large />
              <Text fontSize="xs" color={colors.accent} textTransform="uppercase" letterSpacing="wider" mt={3}>{term.category}</Text>
            </>
          ) : (
            <>
              <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} mb={5}>{sideName(back)}</Text>
              <SideText side={back} term={term} />
            </>
          )}
          <Text position="absolute" bottom={3} right={4} fontSize="xs" color={colors.border}>
            {flipped ? "click to flip back" : "click to flip"}
          </Text>
        </Box>

        {/* Swipe buttons */}
        <Flex align="center" justify="center" gap={8} mb={6}>
          <VStack gap={2}>
            <Box
              as="button"
              onClick={() => advance(false)}
              aria-label="Still learning"
              w="64px" h="64px"
              borderRadius="full"
              border="2px solid #ff6b6b"
              color="#ff6b6b"
              fontSize="xl"
              bg="transparent"
              cursor="pointer"
              opacity={1}
              _hover={{ bg: "#ff6b6b20" }}
              display="flex" alignItems="center" justifyContent="center"
            >
              ✕
            </Box>
            <Text fontSize="xs" color={colors.textMuted} textTransform="uppercase" letterSpacing="wider">Still learning</Text>
          </VStack>

          <Text fontSize="sm" color={colors.textMuted}>Rate anytime</Text>

          <VStack gap={2}>
            <Box
              as="button"
              onClick={() => advance(true)}
              aria-label="Got it"
              w="64px" h="64px"
              borderRadius="full"
              border="2px solid #2cb67d"
              color="#2cb67d"
              fontSize="xl"
              bg="transparent"
              cursor="pointer"
              opacity={1}
              _hover={{ bg: "#2cb67d20" }}
              display="flex" alignItems="center" justifyContent="center"
            >
              ✓
            </Box>
            <Text fontSize="xs" color={colors.textMuted} textTransform="uppercase" letterSpacing="wider">Got it!</Text>
          </VStack>
        </Flex>

        <Text textAlign="center" fontSize="xs" color={colors.border}>
          Space to flip · ← still learning · → got it · S star · 🔀 shuffle
        </Text>
      </Box>
    </PageContainer>
  )
}

/** One side of a card. Terms are short and shown large; definitions are prose, unless they lead. */
const SideText = ({ side, term, large }: { side: 'term' | 'definition'; term: Term; large?: boolean }) =>
  side === 'term'
    ? <Text fontSize={large ? "2xl" : "xl"} fontWeight="800" color={colors.textPrimary} lineHeight="1.4" maxW="480px">{term.term}</Text>
    : large
      ? <Text fontSize="lg" fontWeight="700" color={colors.textPrimary} lineHeight="1.5" maxW="480px">{term.definition}</Text>
      : <Text fontSize="sm" color={colors.textMuted} lineHeight="1.8" maxW="480px">{term.definition}</Text>

const OptionChip = ({ pressed, disabled, onClick, label, children }: { pressed: boolean; disabled?: boolean; onClick: () => void; label: string; children: React.ReactNode }) => (
  <Box
    as="button"
    onClick={disabled ? undefined : onClick}
    aria-label={label}
    aria-pressed={pressed}
    aria-disabled={disabled}
    bg={pressed ? colors.accentDim : "transparent"}
    border={`1px solid ${pressed ? colors.accent : colors.border}`}
    color={pressed ? colors.accent : colors.textMuted}
    borderRadius="full"
    px={3}
    py="3px"
    fontSize="xs"
    fontWeight="700"
    cursor={disabled ? "not-allowed" : "pointer"}
    opacity={disabled ? 0.45 : 1}
    textTransform="capitalize"
    _hover={disabled ? {} : { borderColor: colors.accentSoft }}
  >
    {children}
  </Box>
)

const ActionBtn = ({ onClick, secondary, children }: { onClick: () => void; secondary?: boolean; children: React.ReactNode }) => (
  <Box
    as="button"
    onClick={onClick}
    w="100%"
    bg={secondary ? "transparent" : colors.accent}
    color={secondary ? colors.accent : colors.pageBg}
    border={secondary ? `1px solid ${colors.accent}` : "none"}
    borderRadius="lg"
    py={4}
    fontSize="md"
    fontWeight="800"
    cursor="pointer"
    _hover={secondary ? { bg: colors.accentDim } : { bg: colors.accentSoft }}
  >
    {children}
  </Box>
)

export default FlashcardMode
