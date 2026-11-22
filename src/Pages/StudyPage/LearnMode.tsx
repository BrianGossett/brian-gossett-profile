import { useEffect, useEffectEvent, useRef, useState } from "react"
import { Box, Flex, Input, Text, VStack } from "@chakra-ui/react"
import { useNavigate, useParams } from "react-router"
import PageContainer from "../../Components/Container"
import { colors } from "../../Theme"
import { useDeckById, filterByCategory } from "../../hooks/useDecks"
import { useStudySession } from "../../hooks/useStudySession"
import { answer, createRound, currentQuestion, isRoundOver, learnProgress, type Round } from "../../utils/learn"
import { isMatch } from "../../utils/studyQuestions"

/** How long the "correct" feedback shows before the next question appears. */
export const CORRECT_DELAY_MS = 700

const GREEN = "#2cb67d"
const RED = "#ff6b6b"

/** What the user did with the current question, once they have answered it. */
interface Result {
  correct: boolean
  /** The option picked, for multiple choice. */
  pickedId?: number
  /** What was typed, for a typed answer. */
  typed?: string
}

const LearnMode = () => {
  const navigate = useNavigate()
  const { session, recordLearnAnswer, resetLearn, setLastMode } = useStudySession()
  const { deckId = 'default' } = useParams<{ deckId: string }>()
  const deck = useDeckById(deckId)
  // Question-and-answer decks hold the question in `definition`, so the wording changes.
  const questionFirst = deck.front === 'definition'
  const category = session.lastCategory ?? 'all'
  const terms = filterByCategory(deck.terms, category)
  // Wrong options come from the whole deck, so a small category still gets plausible choices.
  const pool = deck.terms

  const [round, setRound] = useState<Round | null>(() => createRound(terms, session.learn, pool))
  const [result, setResult] = useState<Result | null>(null)
  const [input, setInput] = useState("")
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setLastMode("learn") }, [setLastMode])
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const question = round ? currentQuestion(round) : null
  const roundOver = round !== null && isRoundOver(round)
  const { correct: correctSoFar, total } = learnProgress(terms, session.learn)

  useEffect(() => {
    if (question?.kind === "typed" && result === null) inputRef.current?.focus()
  }, [question, result])

  /** Moves on from the current question once its answer has been recorded. */
  function advance(wasCorrect: boolean) {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    setRound(prev => (prev ? answer(prev, session.learn, wasCorrect, pool).round : prev))
    setResult(null)
    setInput("")
  }

  function submit(next: Result) {
    if (!question || result !== null) return
    setResult(next)
    recordLearnAnswer(question.term.id, next.correct)
    // A correct answer moves on by itself; a wrong one waits so the answer can be read.
    if (next.correct) timer.current = setTimeout(() => advance(true), CORRECT_DELAY_MS)
  }

  function nextRound() {
    setRound(createRound(terms, session.learn, pool))
  }

  function startOver() {
    resetLearn()
    setRound(createRound(terms, {}, pool))
  }

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (roundOver) {
      if (e.key === "Enter") nextRound()
      return
    }
    if (!question) return
    if (result !== null) {
      if (!result.correct && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); advance(false) }
      return
    }
    if (question.kind === "choice") {
      const option = question.options[Number(e.key) - 1]
      if (option) submit({ correct: option.id === question.term.id, pickedId: option.id })
    }
  })
  useEffect(() => {
    const handler = (e: KeyboardEvent) => onKey(e)
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const header = (
    <>
      <Flex align="center" gap={3} mb={7}>
        <Box as="button" onClick={() => navigate("/study")} fontSize="sm" color={colors.textMuted} background="none" border="none" cursor="pointer" _hover={{ color: colors.accent }}>← Back</Box>
        <Text fontSize="sm" fontWeight="700" color={colors.textPrimary}>🧠 Learn</Text>
        <Box ml="auto" bg={colors.accentDim} border={`1px solid ${colors.accentDim}`} borderRadius="full" px={3} py="2px" fontSize="xs" color={colors.accent}>
          {category === "all" ? "All Terms" : category}
        </Box>
      </Flex>
      <Flex align="center" gap={3} mb={6}>
        <Box flex={1} h="6px" bg={colors.border} borderRadius="full" overflow="hidden" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={correctSoFar} aria-label="Learn progress">
          <Box h="100%" w={`${total > 0 ? (correctSoFar / total) * 100 : 0}%`} bg={colors.accent} borderRadius="full" />
        </Box>
        <Text fontSize="xs" color={colors.textMuted} whiteSpace="nowrap">{correctSoFar} of {total} correct</Text>
      </Flex>
    </>
  )

  // ─── Nothing to learn ─────────────────────────────────────────────────────
  if (terms.length === 0) {
    return (
      <PageContainer>
        <Box maxW="680px" mx="auto" px={6} py={10} textAlign="center">
          <Text fontSize="sm" color={colors.textMuted} mb={8}>There are no terms to learn here yet.</Text>
          <ActionBtn onClick={() => navigate("/study")}>Back to Study</ActionBtn>
        </Box>
      </PageContainer>
    )
  }

  // ─── Deck learned ─────────────────────────────────────────────────────────
  if (!round) {
    return (
      <PageContainer>
        <Box maxW="680px" mx="auto" px={6} py={10} textAlign="center">
          <Text fontSize="3xl" mb={4}>🧠</Text>
          <Text fontSize="xl" fontWeight="800" color={colors.textPrimary} mb={2}>You've learned every term</Text>
          <Text fontSize="sm" color={colors.textMuted} mb={8}>
            {terms.length} {terms.length === 1 ? "term" : "terms"}, each answered correctly twice.
          </Text>
          <VStack gap={3}>
            <ActionBtn onClick={() => navigate("/study")}>Back to Study</ActionBtn>
            <Box as="button" onClick={startOver} fontSize="sm" color={colors.textMuted} background="none" border="none" cursor="pointer" textDecoration="underline" _hover={{ color: colors.accent }}>
              Start over
            </Box>
          </VStack>
        </Box>
      </PageContainer>
    )
  }

  // ─── Round recap ──────────────────────────────────────────────────────────
  if (roundOver) {
    const finished = correctSoFar >= total
    return (
      <PageContainer>
        <Box maxW="680px" mx="auto" px={6} py={8}>
          {header}
          <Text fontSize="lg" fontWeight="800" color={colors.textPrimary} mb={1}>
            {finished ? "That was the last round" : "Round complete"}
          </Text>
          <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={3} mt={5}>Terms in this round</Text>
          <VStack gap={2} mb={6} align="stretch">
            {round.terms.map(t => (
              <Flex key={t.id} bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="lg" p={3} gap={4} align="flex-start">
                <Text fontSize="sm" fontWeight="700" color={colors.textPrimary} w="32%" flexShrink={0}>{t.term}</Text>
                <Text fontSize="sm" color={colors.textMuted} lineHeight="1.5">{t.definition}</Text>
              </Flex>
            ))}
          </VStack>
          <ActionBtn onClick={nextRound}>{finished ? "Finish →" : "Next round →"}</ActionBtn>
          <Text textAlign="center" fontSize="xs" color={colors.border} mt={3}>Enter to continue</Text>
        </Box>
      </PageContainer>
    )
  }

  // ─── Question ─────────────────────────────────────────────────────────────
  const q = question!
  const answered = result !== null

  return (
    <PageContainer>
      <Box maxW="680px" mx="auto" px={6} py={8}>
        {header}

        <Box bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="xl" p={8} mb={5}>
          <Flex align="center" gap={3} mb={4}>
            <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700">
              {questionFirst
                ? (q.kind === "choice" ? "Choose the answer" : "Type the answer")
                : (q.kind === "choice" ? "Which term is this?" : "Type the term")}
            </Text>
            {q.retry && (
              <Box bg={colors.accentDim} borderRadius="full" px={2} py="1px" fontSize="xs" color={colors.accent}>Try again</Box>
            )}
          </Flex>
          <Text fontSize="md" fontWeight="700" color={colors.textPrimary} lineHeight="1.6">{q.term.definition}</Text>
        </Box>

        {q.kind === "choice" ? (
          <VStack gap={3} mb={5}>
            {q.options.map((opt, i) => {
              const isCorrect = opt.id === q.term.id
              const isPicked = result?.pickedId === opt.id
              let borderColor: string = colors.border
              let bg: string = colors.surface
              let textColor: string = colors.textMuted
              if (answered && isCorrect) { borderColor = GREEN; bg = "#0d2a1e"; textColor = colors.textPrimary }
              else if (answered && isPicked) { borderColor = RED; bg = "#2a0d0d"; textColor = colors.textPrimary }
              return (
                <Box
                  key={opt.id}
                  as="button"
                  onClick={() => submit({ correct: isCorrect, pickedId: opt.id })}
                  w="100%"
                  bg={bg}
                  border={`1px solid ${borderColor}`}
                  borderRadius="lg"
                  p={4}
                  display="flex"
                  alignItems="flex-start"
                  gap={3}
                  cursor={answered ? "default" : "pointer"}
                  textAlign="left"
                  _hover={answered ? {} : { borderColor: colors.accentSoft }}
                >
                  <Box
                    w="26px" h="26px"
                    borderRadius="full"
                    border={`1px solid ${borderColor}`}
                    display="flex" alignItems="center" justifyContent="center"
                    fontSize="xs" fontWeight="700"
                    color={answered && (isCorrect || isPicked) ? borderColor : colors.textMuted}
                    flexShrink={0}
                    mt="1px"
                  >
                    {answered && isCorrect ? "✓" : answered && isPicked ? "✕" : i + 1}
                  </Box>
                  <Text fontSize="sm" color={textColor}>{opt.term}</Text>
                </Box>
              )
            })}
          </VStack>
        ) : (
          <Box as="form" mb={5} onSubmit={(e: React.FormEvent) => { e.preventDefault(); if (input.trim()) submit({ correct: isMatch(input, q.term), typed: input.trim() }) }}>
            <Flex gap={3}>
              <Input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={answered}
                placeholder={questionFirst ? "Type the answer" : "Type the term"}
                aria-label="Your answer"
                bg={colors.surface}
                borderColor={answered ? (result.correct ? GREEN : RED) : colors.border}
                color={colors.textPrimary}
                autoComplete="off"
              />
              <Box
                as="button"
                bg={colors.accent}
                color={colors.pageBg}
                border="none"
                borderRadius="md"
                px={5}
                fontSize="sm"
                fontWeight="800"
                cursor={answered || !input.trim() ? "default" : "pointer"}
                opacity={answered || !input.trim() ? 0.5 : 1}
              >
                Check
              </Box>
            </Flex>
          </Box>
        )}

        {/* Feedback */}
        {result && (
          <Box
            role="status"
            bg={result.correct ? "#0d2a1e" : "#2a0d0d"}
            border={`1px solid ${result.correct ? `${GREEN}40` : `${RED}40`}`}
            borderRadius="lg"
            p={4}
            mb={5}
            display="flex"
            gap={3}
          >
            <Text fontSize="lg">{result.correct ? "✅" : "❌"}</Text>
            <Text fontSize="sm" color={colors.textMuted} lineHeight="1.6">
              {result.correct
                ? <Text as="span" color={colors.textPrimary} fontWeight="700">Correct!</Text>
                : <>
                    <Text as="span" color={colors.textPrimary} fontWeight="700">Not yet.</Text> The answer is{" "}
                    <Text as="span" color={colors.textPrimary} fontWeight="700">{q.term.term}</Text>. You'll see this one again before the round ends.
                  </>
              }
            </Text>
          </Box>
        )}

        {result && !result.correct && <ActionBtn onClick={() => advance(false)}>Continue →</ActionBtn>}

        {!answered && (
          <Flex justify="flex-end">
            <Box as="button" onClick={() => submit({ correct: false })} fontSize="sm" color={colors.textMuted} background="none" border="none" cursor="pointer" textDecoration="underline" _hover={{ color: colors.accent }}>
              Don't know
            </Box>
          </Flex>
        )}

        <Text textAlign="center" fontSize="xs" color={colors.border} mt={3}>
          {q.kind === "choice" ? "1 2 3 4 to select · Enter to continue" : "Enter to check · Enter to continue"}
        </Text>
      </Box>
    </PageContainer>
  )
}

const ActionBtn = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <Box
    as="button"
    onClick={onClick}
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
    {children}
  </Box>
)

export default LearnMode
