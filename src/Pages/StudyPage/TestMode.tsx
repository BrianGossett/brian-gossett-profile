import { useEffect, useState } from "react"
import { Box, Flex, Input, Text, VStack } from "@chakra-ui/react"
import { useNavigate, useParams } from "react-router"
import PageContainer from "../../Components/Container"
import { colors } from "../../Theme"
import { useDeckById, filterByCategory } from "../../hooks/useDecks"
import { useStudySession } from "../../hooks/useStudySession"
import {
  QUESTION_TYPES,
  TYPE_LABELS,
  answerOf,
  buildTest,
  formatDuration,
  grade,
  promptOf,
  questionCount,
  score,
  skippedCount,
  type Answer,
  type GradedItem,
  type Question,
  type QuestionType,
  type TestSettings,
} from "../../utils/testBuilder"

const GREEN = "#2cb67d"
const RED = "#ff6b6b"
const DEFAULT_COUNT = 20

interface Run {
  questions: Question[]
  settings: TestSettings
  startedAt: number
}

interface Results {
  items: GradedItem[]
  seconds: number
}

const TestMode = () => {
  const navigate = useNavigate()
  const { session, markMastered, markMissed, setLastMode } = useStudySession()
  const { deckId = 'default' } = useParams<{ deckId: string }>()
  const deck = useDeckById(deckId)
  const category = session.lastCategory ?? 'all'
  const terms = filterByCategory(deck.terms, category)
  const max = terms.length

  const [settings, setSettings] = useState<TestSettings>({
    count: Math.min(DEFAULT_COUNT, max),
    answerWith: 'term',
    types: ['choice'],
  })
  const [run, setRun] = useState<Run | null>(null)
  const [answers, setAnswers] = useState<Record<number, Answer | undefined>>({})
  const [confirmSkipped, setConfirmSkipped] = useState(false)
  const [results, setResults] = useState<Results | null>(null)

  useEffect(() => { setLastMode("test") }, [setLastMode])

  const setAnswer = (index: number, answer: Answer | undefined) => setAnswers(prev => ({ ...prev, [index]: answer }))

  function start() {
    if (settings.types.length === 0 || max === 0) return
    setRun({ questions: buildTest(terms, deck.terms, settings), settings, startedAt: Date.now() })
    setAnswers({})
    setResults(null)
    setConfirmSkipped(false)
    window.scrollTo({ top: 0 })
  }

  function submit(force = false) {
    if (!run) return
    if (!force && skippedCount(run.questions, answers, run.settings) > 0) {
      setConfirmSkipped(true)
      return
    }
    const items = grade(run.questions, answers, run.settings)
    // The test counts towards the deck's progress like any other mode.
    for (const item of items) (item.correct ? markMastered : markMissed)(item.term.id)
    setResults({ items, seconds: (Date.now() - run.startedAt) / 1000 })
    setConfirmSkipped(false)
    window.scrollTo({ top: 0 })
  }

  function newTest() {
    setRun(null)
    setResults(null)
    setAnswers({})
  }

  const header = (right?: React.ReactNode) => (
    <Flex align="center" gap={3} mb={7}>
      <Box as="button" onClick={() => navigate("/study")} fontSize="sm" color={colors.textMuted} background="none" border="none" cursor="pointer" _hover={{ color: colors.accent }}>← Back</Box>
      <Text fontSize="sm" fontWeight="700" color={colors.textPrimary}>📝 Test</Text>
      {right}
      <Box ml="auto" bg={colors.accentDim} border={`1px solid ${colors.accentDim}`} borderRadius="full" px={3} py="2px" fontSize="xs" color={colors.accent}>
        {category === "all" ? "All Terms" : category}
      </Box>
    </Flex>
  )

  // ─── Setup ────────────────────────────────────────────────────────────────
  if (!run) {
    const toggleType = (type: QuestionType) =>
      setSettings(s => ({ ...s, types: s.types.includes(type) ? s.types.filter(t => t !== type) : [...s.types, type] }))
    const setCount = (count: number) => setSettings(s => ({ ...s, count: Math.max(1, Math.min(max, count)) }))
    const canStart = settings.types.length > 0 && max > 0

    return (
      <PageContainer>
        <Box maxW="680px" mx="auto" px={6} py={8}>
          {header()}
          <Text fontSize="xl" fontWeight="800" color={colors.textPrimary} mb={1}>Set up your test</Text>
          <Text fontSize="sm" color={colors.textMuted} mb={6}>{deck.name}</Text>

          {max === 0 ? (
            <Text fontSize="sm" color={colors.textMuted} mb={6}>There are no terms to test here yet.</Text>
          ) : (
            <VStack gap={5} align="stretch" mb={6}>
              <Panel label="Questions" hint={`up to ${max}`}>
                <Flex align="center" gap={2}>
                  <StepBtn label="Fewer questions" onClick={() => setCount(settings.count - 1)}>−</StepBtn>
                  <Input
                    aria-label="Number of questions"
                    type="number"
                    min={1}
                    max={max}
                    value={settings.count}
                    onChange={e => { const v = parseInt(e.target.value, 10); if (!isNaN(v)) setCount(v) }}
                    w="72px"
                    textAlign="center"
                    bg={colors.pageBg}
                    borderColor={colors.border}
                    color={colors.textPrimary}
                  />
                  <StepBtn label="More questions" onClick={() => setCount(settings.count + 1)}>+</StepBtn>
                </Flex>
              </Panel>

              <Panel label="Answer with">
                <Flex gap={2} role="group" aria-label="Answer with">
                  {(['term', 'definition'] as const).map(side => (
                    <Chip key={side} selected={settings.answerWith === side} onClick={() => setSettings(s => ({ ...s, answerWith: side }))}>
                      {side === 'term' ? 'Term' : 'Definition'}
                    </Chip>
                  ))}
                </Flex>
              </Panel>

              <Panel label="Question types">
                <Flex gap={2} flexWrap="wrap" role="group" aria-label="Question types">
                  {QUESTION_TYPES.map(type => (
                    <Chip key={type} selected={settings.types.includes(type)} onClick={() => toggleType(type)}>
                      {TYPE_LABELS[type]}
                    </Chip>
                  ))}
                </Flex>
                {settings.types.length === 0 && (
                  <Text fontSize="xs" color={RED} mt={2} role="alert">Choose at least one question type.</Text>
                )}
              </Panel>
            </VStack>
          )}

          <ActionBtn onClick={start} disabled={!canStart}>Start test</ActionBtn>
        </Box>
      </PageContainer>
    )
  }

  const total = questionCount(run.questions)

  // ─── Results ──────────────────────────────────────────────────────────────
  if (results) {
    const { correct, incorrect, percent } = score(results.items)
    return (
      <PageContainer>
        <Box maxW="680px" mx="auto" px={6} py={8}>
          {header()}
          <Text fontSize="xl" fontWeight="800" color={colors.textPrimary} mb={4}>
            {percent === 100 ? "Perfect score" : percent >= 80 ? "Strong result" : percent >= 50 ? "Getting there" : "Worth another pass"}
          </Text>
          <Flex bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="xl" p={5} mb={5} gap={6} align="center" flexWrap="wrap">
            <Text fontSize="4xl" fontWeight="800" color={colors.accent} lineHeight="1">{percent}%</Text>
            <VStack gap={1} align="start">
              <Text fontSize="sm" color={GREEN}>{correct} correct</Text>
              <Text fontSize="sm" color={RED}>{incorrect} incorrect</Text>
            </VStack>
            <Text fontSize="sm" color={colors.textMuted} ml="auto">Time: {formatDuration(results.seconds)}</Text>
          </Flex>

          <Flex as="nav" aria-label="Questions" gap={2} flexWrap="wrap" mb={6}>
            {results.items.map(item => (
              <a
                key={item.number}
                href={`#q${item.number}`}
                aria-label={`Question ${item.number}, ${item.correct ? "correct" : "incorrect"}`}
                style={{
                  padding: "2px 8px",
                  borderRadius: 6,
                  border: `1px solid ${item.correct ? GREEN : RED}`,
                  color: item.correct ? GREEN : RED,
                  fontSize: 12,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                {item.correct ? "✓" : "✕"} {item.number}
              </a>
            ))}
          </Flex>

          <VStack gap={3} align="stretch" mb={6}>
            {results.items.map(item => (
              <Box key={item.number} id={`q${item.number}`} bg={colors.surface} border={`1px solid ${colors.border}`} borderLeft={`4px solid ${item.correct ? GREEN : RED}`} borderRadius="lg" p={4}>
                <Flex justify="space-between" gap={3} mb={2}>
                  <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700">{TYPE_LABELS[item.type]}</Text>
                  <Text fontSize="xs" color={colors.textMuted}>{item.number} of {total}</Text>
                </Flex>
                <Text fontSize="sm" fontWeight="700" color={colors.textPrimary} lineHeight="1.5" mb={2}>{item.prompt}</Text>
                <Text fontSize="sm" color={colors.textMuted}>
                  Your answer:{" "}
                  <Text as="span" color={item.correct ? GREEN : RED} fontWeight="700">{item.given ?? "(skipped)"}</Text>
                </Text>
                {!item.correct && (
                  <Text fontSize="sm" color={colors.textMuted}>
                    Correct answer: <Text as="span" color={colors.textPrimary} fontWeight="700">{item.expected}</Text>
                  </Text>
                )}
              </Box>
            ))}
          </VStack>

          <VStack gap={3}>
            <ActionBtn onClick={newTest}>Take a new test</ActionBtn>
            <Box as="button" onClick={() => navigate("/study")} fontSize="sm" color={colors.textMuted} background="none" border="none" cursor="pointer" textDecoration="underline" _hover={{ color: colors.accent }}>
              Back to Study
            </Box>
          </VStack>
        </Box>
      </PageContainer>
    )
  }

  // ─── The test ─────────────────────────────────────────────────────────────
  const s = run.settings
  const skipped = skippedCount(run.questions, answers, s)
  // The number of the first question in each block (a matching block spans several numbers).
  const firstNumbers = run.questions.reduce<number[]>((acc, _q, i) => {
    const previous = run.questions[i - 1]
    acc.push(i === 0 ? 1 : acc[i - 1] + (previous.type === "matching" ? previous.terms.length : 1))
    return acc
  }, [])

  return (
    <PageContainer>
      <Box maxW="680px" mx="auto" px={6} py={8}>
        {header(<Text fontSize="xs" color={colors.textMuted}>{total - skipped} of {total} answered</Text>)}

        <VStack gap={4} align="stretch" mb={6}>
          {run.questions.map((q, index) => {
            const first = firstNumbers[index]
            const last = first + (q.type === "matching" ? q.terms.length : 1) - 1
            const label = last > first ? `${first}-${last} of ${total}` : `${first} of ${total}`
            const answer = answers[index]

            return (
              <Box key={index} bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="xl" p={6}>
                <Flex justify="space-between" gap={3} mb={3}>
                  <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700">{TYPE_LABELS[q.type]}</Text>
                  <Text fontSize="xs" color={colors.textMuted}>{label}</Text>
                </Flex>

                {q.type === "trueFalse" && (
                  <>
                    <Text fontSize="sm" fontWeight="700" color={colors.textPrimary} lineHeight="1.5" mb={2}>{promptOf(q.term, s)}</Text>
                    <Text fontSize="sm" color={colors.textMuted} mb={4}>{answerOf(q.shown, s)}</Text>
                    <Flex gap={3} role="group" aria-label={`Question ${first}`}>
                      {[true, false].map(value => (
                        <Option key={String(value)} selected={answer === value} onClick={() => setAnswer(index, answer === value ? undefined : value)}>
                          {value ? "True" : "False"}
                        </Option>
                      ))}
                    </Flex>
                  </>
                )}

                {q.type === "choice" && (
                  <>
                    <Text fontSize="sm" fontWeight="700" color={colors.textPrimary} lineHeight="1.5" mb={4}>{promptOf(q.term, s)}</Text>
                    <VStack gap={2} align="stretch" role="group" aria-label={`Question ${first}`}>
                      {q.options.map(option => (
                        <Option key={option.id} selected={answer === option.id} onClick={() => setAnswer(index, answer === option.id ? undefined : option.id)}>
                          {answerOf(option, s)}
                        </Option>
                      ))}
                    </VStack>
                  </>
                )}

                {q.type === "matching" && (
                  <VStack gap={3} align="stretch">
                    <Text fontSize="xs" color={colors.textMuted}>Choose the match for each one.</Text>
                    {q.terms.map((term, i) => {
                      const picks = (answer !== null && typeof answer === "object" ? answer : {}) as Record<number, number>
                      return (
                        <Flex key={term.id} gap={3} align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }}>
                          <Text flex={1} fontSize="sm" fontWeight="700" color={colors.textPrimary} lineHeight="1.5">{promptOf(term, s)}</Text>
                          <select
                            aria-label={`Question ${first + i}`}
                            value={picks[term.id] ?? ""}
                            onChange={e => {
                              const next = { ...picks }
                              if (e.target.value === "") delete next[term.id]
                              else next[term.id] = Number(e.target.value)
                              setAnswer(index, Object.keys(next).length > 0 ? next : undefined)
                            }}
                            style={{ flex: 1, minWidth: 0, background: colors.pageBg, color: colors.textPrimary, border: `1px solid ${colors.border}`, borderRadius: 6, padding: "8px 10px", fontSize: 14 }}
                          >
                            <option value="">Select…</option>
                            {q.choices.map(choice => (
                              <option key={choice.id} value={choice.id}>{answerOf(choice, s)}</option>
                            ))}
                          </select>
                        </Flex>
                      )
                    })}
                  </VStack>
                )}

                {q.type === "written" && (
                  <>
                    <Text fontSize="sm" fontWeight="700" color={colors.textPrimary} lineHeight="1.5" mb={4}>{promptOf(q.term, s)}</Text>
                    <Input
                      aria-label={`Question ${first}`}
                      value={typeof answer === "string" ? answer : ""}
                      onChange={e => setAnswer(index, e.target.value === "" ? undefined : e.target.value)}
                      placeholder="Type the answer"
                      autoComplete="off"
                      bg={colors.pageBg}
                      borderColor={colors.border}
                      color={colors.textPrimary}
                    />
                  </>
                )}
              </Box>
            )
          })}
        </VStack>

        {confirmSkipped && (
          <Box role="alertdialog" aria-label="Skipped questions" bg={colors.surface} border={`1px solid ${colors.accentDim}`} borderRadius="xl" p={5} mb={4}>
            <Text fontSize="sm" fontWeight="700" color={colors.textPrimary} mb={1}>
              You skipped {skipped} {skipped === 1 ? "question" : "questions"}
            </Text>
            <Text fontSize="sm" color={colors.textMuted} mb={4}>Skipped questions are marked wrong. Go back to them, or submit the test as it is.</Text>
            <Flex gap={3} flexWrap="wrap">
              <Chip selected={false} onClick={() => setConfirmSkipped(false)}>Review skipped questions</Chip>
              <Chip selected onClick={() => submit(true)}>Submit anyway</Chip>
            </Flex>
          </Box>
        )}

        {!confirmSkipped && <ActionBtn onClick={() => submit()}>Submit test</ActionBtn>}
      </Box>
    </PageContainer>
  )
}

const Panel = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <Box bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="xl" p={5}>
    <Flex align="baseline" gap={2} mb={3}>
      <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700">{label}</Text>
      {hint && <Text fontSize="xs" color={colors.textMuted}>{hint}</Text>}
    </Flex>
    {children}
  </Box>
)

const Chip = ({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) => (
  <Box
    as="button"
    onClick={onClick}
    aria-pressed={selected}
    bg={selected ? colors.accentDim : "transparent"}
    border={`1px solid ${selected ? colors.accent : colors.border}`}
    color={selected ? colors.accent : colors.textMuted}
    borderRadius="md"
    px={3}
    py={2}
    fontSize="sm"
    fontWeight="700"
    cursor="pointer"
    _hover={{ borderColor: colors.accentSoft }}
  >
    {children}
  </Box>
)

const Option = ({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) => (
  <Box
    as="button"
    onClick={onClick}
    aria-pressed={selected}
    flex={1}
    bg={selected ? colors.accentDim : colors.pageBg}
    border={`1px solid ${selected ? colors.accent : colors.border}`}
    color={selected ? colors.textPrimary : colors.textMuted}
    borderRadius="lg"
    p={3}
    fontSize="sm"
    textAlign="left"
    cursor="pointer"
    _hover={{ borderColor: colors.accentSoft }}
  >
    {children}
  </Box>
)

const StepBtn = ({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) => (
  <Box as="button" aria-label={label} onClick={onClick} w="36px" h="36px" bg="none" border={`1px solid ${colors.border}`} borderRadius="md" color={colors.textMuted} fontSize="lg" cursor="pointer" _hover={{ color: colors.accent, borderColor: colors.accent }}>
    {children}
  </Box>
)

const ActionBtn = ({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) => (
  <Box
    as="button"
    onClick={onClick}
    aria-disabled={disabled}
    w="100%"
    bg={colors.accent}
    color={colors.pageBg}
    border="none"
    borderRadius="lg"
    py={4}
    fontSize="md"
    fontWeight="800"
    cursor={disabled ? "not-allowed" : "pointer"}
    opacity={disabled ? 0.5 : 1}
    _hover={disabled ? {} : { bg: colors.accentSoft }}
  >
    {children}
  </Box>
)

export default TestMode
