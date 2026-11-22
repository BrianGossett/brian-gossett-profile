import { useEffect, useEffectEvent, useRef, useState } from "react"
import { Box, Flex, Input, Text, VStack } from "@chakra-ui/react"
import { useNavigate, useParams } from "react-router"
import PageContainer from "../../Components/Container"
import { colors } from "../../Theme"
import type { Term } from "../../data/terms"
import { useDeckById, filterByCategory } from "../../hooks/useDecks"
import { useStudySession } from "../../hooks/useStudySession"
import {
  SESSION_SIZES,
  answer,
  buckets,
  createRound,
  currentQuestion,
  isComplete,
  isRoundOver,
  selectSession,
  trickiest,
  type Round,
  type SessionSize,
  type Stages,
} from "../../utils/learn"
import { isMatch, parseListAnswer } from "../../utils/studyQuestions"

/** How long the "correct" feedback shows before the next question appears. */
export const CORRECT_DELAY_MS = 700
/** With this many terms or fewer left, there is nothing to choose: the session is all of them. */
const SKIP_SETUP_AT = 10

const GREEN = "#2cb67d"
const RED = "#ff6b6b"
const AMBER = "#e0a020"

/** What the user did with the current question, once they have answered it. */
interface Result {
  correct: boolean
  /** The option picked, for multiple choice. */
  pickedId?: number
  /** What was typed, for a typed answer. */
  typed?: string
}

/** The terms one sitting covers, and the round in progress (null once every term is learned). */
interface Session {
  terms: Term[]
  round: Round | null
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

  /** Builds a session of `size` not-yet-learned terms, or null when there is nothing left to learn. */
  function buildSession(stages: Stages, size: SessionSize): Session | null {
    const sessionTerms = selectSession(terms, stages, size)
    return sessionTerms.length === 0 ? null : { terms: sessionTerms, round: createRound(sessionTerms, stages, pool) }
  }
  /** A session is started straight away when few terms are left; otherwise the user picks a size first. */
  const autoSession = (stages: Stages) =>
    selectSession(terms, stages, 'all').length <= SKIP_SETUP_AT ? buildSession(stages, 'all') : null

  const [learning, setLearning] = useState<Session | null>(() => autoSession(session.learn))
  const [result, setResult] = useState<Result | null>(null)
  const [input, setInput] = useState("")
  const [retype, setRetype] = useState("")
  const [retypeWrong, setRetypeWrong] = useState(false)
  /** Wrong answers per term since this session began. */
  const [misses, setMisses] = useState<Record<number, number>>({})
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const retypeRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setLastMode("learn") }, [setLastMode])
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const round = learning?.round ?? null
  const question = round ? currentQuestion(round) : null
  const roundOver = round !== null && isRoundOver(round)
  const remaining = selectSession(terms, session.learn, 'all').length
  // After a wrong typed answer the user must type the right one before moving on.
  const mustRetype = result !== null && !result.correct && question?.kind === "typed"

  useEffect(() => {
    if (mustRetype) retypeRef.current?.focus()
    else if (question?.kind === "typed" && result === null) inputRef.current?.focus()
  }, [question, result, mustRetype])

  function startSession(size: SessionSize, stages: Stages = session.learn) {
    setLearning(buildSession(stages, size))
    setMisses({})
    setResult(null)
    setInput("")
  }

  /** Moves on from the current question once its answer has been recorded. */
  function advance(wasCorrect: boolean) {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    setLearning(prev => (prev?.round ? { ...prev, round: answer(prev.round, session.learn, wasCorrect, pool).round } : prev))
    setResult(null)
    setInput("")
    setRetype("")
    setRetypeWrong(false)
  }

  function submit(next: Result) {
    if (!question || result !== null) return
    setResult(next)
    recordLearnAnswer(question.term.id, next.correct, question.kind === "typed")
    if (!next.correct) setMisses(prev => ({ ...prev, [question.term.id]: (prev[question.term.id] ?? 0) + 1 }))
    // A correct answer moves on by itself; a wrong one waits so the answer can be read.
    if (next.correct) timer.current = setTimeout(() => advance(true), CORRECT_DELAY_MS)
  }

  function submitRetype() {
    if (!question) return
    if (isMatch(retype, question.term)) advance(false)
    else setRetypeWrong(true)
  }

  function nextRound() {
    setLearning(prev => (prev ? { ...prev, round: createRound(prev.terms, session.learn, pool) } : prev))
  }

  /** From a finished session: carry on with what's left, choosing a size again if there is plenty. */
  function keepLearning() {
    setLearning(autoSession(session.learn))
    setMisses({})
  }

  function startOver() {
    resetLearn()
    setLearning(autoSession({}))
    setMisses({})
  }

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (roundOver) {
      if (e.key === "Enter") nextRound()
      return
    }
    if (!question) return
    if (result !== null) {
      // A wrong typed answer is left through the retype box, not a key press.
      if (!result.correct && !mustRetype && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); advance(false) }
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

  // The buckets cover the session in progress, or the whole list when no session is running.
  const scope = learning?.terms ?? terms
  const count = buckets(scope, session.learn)
  const share = (n: number) => `${scope.length > 0 ? (n / scope.length) * 100 : 0}%`

  const header = (
    <>
      <Flex align="center" gap={3} mb={7}>
        <Box as="button" onClick={() => navigate("/study")} fontSize="sm" color={colors.textMuted} background="none" border="none" cursor="pointer" _hover={{ color: colors.accent }}>← Back</Box>
        <Text fontSize="sm" fontWeight="700" color={colors.textPrimary}>🧠 Learn</Text>
        <Box ml="auto" bg={colors.accentDim} border={`1px solid ${colors.accentDim}`} borderRadius="full" px={3} py="2px" fontSize="xs" color={colors.accent}>
          {category === "all" ? "All Terms" : category}
        </Box>
      </Flex>
      <Box mb={6} role="group" aria-label={`Unstarted ${count.unstarted}, Familiar ${count.familiar}, Mastered ${count.mastered}`}>
        <Flex h="8px" bg={colors.border} borderRadius="full" overflow="hidden" mb={2}>
          <Box h="100%" w={share(count.mastered)} bg={GREEN} style={{ transition: "width 0.3s" }} />
          <Box h="100%" w={share(count.familiar)} bg={AMBER} style={{ transition: "width 0.3s" }} />
        </Flex>
        <Flex gap={5} fontSize="xs" color={colors.textMuted} flexWrap="wrap">
          <Bucket color={colors.border} label="Unstarted" value={count.unstarted} />
          <Bucket color={AMBER} label="Familiar" value={count.familiar} />
          <Bucket color={GREEN} label="Mastered" value={count.mastered} />
        </Flex>
      </Box>
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

  // ─── Session finished, or nothing left ────────────────────────────────────
  const sessionDone = learning !== null && round === null
  if (sessionDone || (learning === null && remaining === 0)) {
    const allLearned = isComplete(terms, session.learn)
    const studied = learning?.terms ?? []
    const tough = trickiest(studied, misses)
    const totalMisses = Object.values(misses).reduce((sum, n) => sum + n, 0)
    return (
      <PageContainer>
        <Box maxW="680px" mx="auto" px={6} py={10}>
          <Box textAlign="center" mb={8}>
            <Text fontSize="3xl" mb={4}>🧠</Text>
            <Text fontSize="xl" fontWeight="800" color={colors.textPrimary} mb={2}>
              {allLearned ? "You've learned every term" : "Session complete"}
            </Text>
            <Text fontSize="sm" color={colors.textMuted}>
              {studied.length > 0
                ? <>{studied.length} {studied.length === 1 ? "term" : "terms"} mastered this session. {totalMisses === 0 ? "Not a single miss." : `${totalMisses} ${totalMisses === 1 ? "miss" : "misses"} along the way.`}</>
                : <>{terms.length} {terms.length === 1 ? "term" : "terms"}, each answered correctly twice.</>}
              {!allLearned && <> {remaining} still to learn.</>}
            </Text>
          </Box>

          {tough.length > 0 && (
            <Box mb={8}>
              <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={3}>Trickiest cards</Text>
              <VStack gap={2} align="stretch">
                {tough.map(({ term, misses: n }) => (
                  <Flex key={term.id} bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="lg" p={3} gap={4} align="flex-start">
                    <Box flex={1} minW={0}>
                      <Text fontSize="sm" fontWeight="700" color={colors.textPrimary}>{term.term}</Text>
                      <Text fontSize="xs" color={colors.textMuted} lineHeight="1.5">{term.definition}</Text>
                    </Box>
                    <Text fontSize="xs" fontWeight="700" color={RED} whiteSpace="nowrap">{n} {n === 1 ? "miss" : "misses"}</Text>
                  </Flex>
                ))}
              </VStack>
            </Box>
          )}

          <VStack gap={3}>
            {!allLearned && <ActionBtn onClick={keepLearning}>Keep learning</ActionBtn>}
            <ActionBtn secondary={!allLearned} onClick={() => navigate("/study")}>Back to Study</ActionBtn>
            {allLearned && (
              <Box as="button" onClick={startOver} fontSize="sm" color={colors.textMuted} background="none" border="none" cursor="pointer" textDecoration="underline" _hover={{ color: colors.accent }}>
                Start over
              </Box>
            )}
          </VStack>
        </Box>
      </PageContainer>
    )
  }

  // ─── Choose a session size ────────────────────────────────────────────────
  if (learning === null) {
    const sizes: SessionSize[] = [...SESSION_SIZES.filter(n => n < remaining), 'all']
    return (
      <PageContainer>
        <Box maxW="680px" mx="auto" px={6} py={8}>
          {header}
          <Text fontSize="xl" fontWeight="800" color={colors.textPrimary} mb={1}>How many terms this session?</Text>
          <Text fontSize="sm" color={colors.textMuted} mb={6} lineHeight="1.6">
            {remaining} {remaining === 1 ? "term is" : "terms are"} still to learn. They come in rounds of 7. Each one starts as multiple choice,
            then comes back as a typed answer. Miss the typed answer and it goes back to multiple choice.
          </Text>
          <VStack gap={3} align="stretch">
            {sizes.map(size => (
              <ActionBtn key={String(size)} secondary={size !== sizes[0]} onClick={() => startSession(size)}>
                {size === 'all' ? `All ${remaining}` : `${size} terms`}
              </ActionBtn>
            ))}
          </VStack>
        </Box>
      </PageContainer>
    )
  }

  // ─── Round recap ──────────────────────────────────────────────────────────
  if (roundOver) {
    const finished = learning.terms.every(t => (session.learn[t.id] ?? 0) >= 2)
    return (
      <PageContainer>
        <Box maxW="680px" mx="auto" px={6} py={8}>
          {header}
          <Text fontSize="lg" fontWeight="800" color={colors.textPrimary} mb={1}>
            {finished ? "That was the last round" : "Round complete"}
          </Text>
          <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={3} mt={5}>Terms in this round</Text>
          <VStack gap={2} mb={6} align="stretch">
            {round.terms.map(t => {
              const n = round.misses[t.id] ?? 0
              return (
                <Flex key={t.id} bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="lg" p={3} gap={4} align="flex-start">
                  <Text fontSize="sm" fontWeight="700" color={colors.textPrimary} w="30%" flexShrink={0}>{t.term}</Text>
                  <Text flex={1} fontSize="sm" color={colors.textMuted} lineHeight="1.5">{t.definition}</Text>
                  <Text fontSize="xs" fontWeight="700" color={n > 0 ? RED : GREEN} whiteSpace="nowrap">
                    {n > 0 ? `${n} ${n === 1 ? "miss" : "misses"}` : "clean ✓"}
                  </Text>
                </Flex>
              )
            })}
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
  // For list answers, show what has been recognised so far as the user types.
  const preview = q.kind === "typed" && !answered ? parseListAnswer(input, q.term.term) : null

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
          <Box mb={5}>
            <Box as="form" onSubmit={(e: React.FormEvent) => { e.preventDefault(); if (input.trim()) submit({ correct: isMatch(input, q.term), typed: input.trim() }) }}>
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
            {preview && (preview.hits.length > 0 || preview.extras.length > 0) && (
              <Flex gap={2} mt={3} flexWrap="wrap" aria-label="Recognised so far" role="group">
                {preview.hits.map(item => (
                  <Box key={item} bg="#0d2a1e" border={`1px solid ${GREEN}60`} color={GREEN} borderRadius="md" px={2} py="1px" fontSize="xs" fontWeight="700">{item}</Box>
                ))}
                {preview.extras.map((word, i) => (
                  <Box key={`${word}-${i}`} border={`1px dashed ${RED}`} color={RED} borderRadius="md" px={2} py="1px" fontSize="xs" fontWeight="700">{word}?</Box>
                ))}
              </Flex>
            )}
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
          >
            <Flex gap={3}>
              <Text fontSize="lg">{result.correct ? "✅" : "❌"}</Text>
              <Text fontSize="sm" color={colors.textMuted} lineHeight="1.6">
                {result.correct
                  ? <Text as="span" color={colors.textPrimary} fontWeight="700">{q.kind === "typed" ? "Mastered!" : "Correct!"}</Text>
                  : <>
                      <Text as="span" color={colors.textPrimary} fontWeight="700">Not yet.</Text> The answer is{" "}
                      <Text as="span" color={colors.textPrimary} fontWeight="700">{q.term.term}</Text>.{" "}
                      {q.kind === "typed"
                        ? "This one goes back to multiple choice."
                        : "You'll see this one again before the round ends."}
                    </>
                }
              </Text>
            </Flex>

            {mustRetype && (
              <Box as="form" mt={4} onSubmit={(e: React.FormEvent) => { e.preventDefault(); submitRetype() }}>
                <Flex gap={3}>
                  <Input
                    ref={retypeRef}
                    value={retype}
                    onChange={e => { setRetype(e.target.value); setRetypeWrong(false) }}
                    placeholder="Type the correct answer to continue"
                    aria-label="Retype the correct answer"
                    bg={colors.pageBg}
                    borderColor={retypeWrong ? RED : colors.border}
                    color={colors.textPrimary}
                    autoComplete="off"
                  />
                  <Box as="button" bg={colors.accent} color={colors.pageBg} border="none" borderRadius="md" px={5} fontSize="sm" fontWeight="800" cursor="pointer">
                    Continue
                  </Box>
                </Flex>
                {retypeWrong && (
                  <Text fontSize="xs" color={RED} mt={2} role="alert">That doesn't match yet. Type the answer shown above.</Text>
                )}
              </Box>
            )}
          </Box>
        )}

        {result && !result.correct && !mustRetype && <ActionBtn onClick={() => advance(false)}>Continue →</ActionBtn>}

        {!answered && (
          <Flex justify="flex-end">
            <Box as="button" onClick={() => submit({ correct: false })} fontSize="sm" color={colors.textMuted} background="none" border="none" cursor="pointer" textDecoration="underline" _hover={{ color: colors.accent }}>
              Don't know
            </Box>
          </Flex>
        )}

        <Text textAlign="center" fontSize="xs" color={colors.border} mt={3}>
          {q.kind === "choice" ? "1 2 3 4 to select · Enter to continue" : "Enter to check"}
        </Text>
      </Box>
    </PageContainer>
  )
}

const Bucket = ({ color, label, value }: { color: string; label: string; value: number }) => (
  <Flex align="center" gap="6px">
    <Box w="10px" h="10px" borderRadius="3px" bg={color} />
    <Text as="span">{label}</Text>
    <Text as="span" fontWeight="800" color={colors.textPrimary} fontFamily="mono">{value}</Text>
  </Flex>
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

export default LearnMode
