import { useState, useEffect, useMemo } from "react"
import { Box, Flex, Text, VStack } from "@chakra-ui/react"
import { useNavigate, useParams } from "react-router"
import PageContainer from "../../Components/Container"
import { colors } from "../../Theme"
import { type Term } from "../../data/terms"
import { useDeckById, filterByCategory } from "../../hooks/useDecks"
import { useStudySession } from "../../hooks/useStudySession"

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getDistractors(correct: Term, pool: Term[]): Term[] {
  const same = pool.filter(t => t.id !== correct.id && t.category === correct.category)
  const other = pool.filter(t => t.id !== correct.id && t.category !== correct.category)
  const candidates = shuffle([...same, ...other])
  return candidates.slice(0, 3)
}

const MultipleChoiceMode = () => {
  const navigate = useNavigate()
  const { session, markMastered, markMissed, setPosition, setLastMode } = useStudySession()
  const { deckId = 'default' } = useParams<{ deckId: string }>()
  const deck = useDeckById(deckId)
  const category = session.lastCategory ?? 'all'
  const filteredTerms = filterByCategory(deck.terms, category)
  const termCount = Math.max(4, Math.min(session.termCounts.quiz, filteredTerms.length))

  const questions = useMemo(() => {
    const pool = filteredTerms.length >= 4 ? filteredTerms : deck.terms
    return shuffle(filteredTerms).slice(0, termCount).map(term => ({
      term,
      options: shuffle([term, ...getDistractors(term, pool)]),
    }))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)

  useEffect(() => { setLastMode("quiz") }, [setLastMode])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const q = questions[index]
      if (!q) return
      const keys: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 }
      if (selected === null && e.key.toLowerCase() in keys) {
        const optIndex = keys[e.key.toLowerCase()]
        if (q.options[optIndex]) pick(q.options[optIndex].id)
      }
      if (e.key === "Enter" && selected !== null) advance()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [index, selected, questions])

  const q = questions[index]

  function pick(id: number) {
    if (selected !== null || !q) return
    setSelected(id)
    if (id === q.term.id) { markMastered(q.term.id); setCorrect(c => c + 1) }
    else { markMissed(q.term.id); setWrong(w => w + 1) }
  }

  function advance() {
    const next = index + 1
    setIndex(next)
    setSelected(null)
    setPosition("quiz", next)
  }

  if (!q) {
    return (
      <PageContainer>
        <Box maxW="680px" mx="auto" px={6} py={10} textAlign="center">
          <Text fontSize="3xl" mb={4}>🎯</Text>
          <Text fontSize="xl" fontWeight="800" color={colors.textPrimary} mb={2}>Quiz Complete!</Text>
          <Text fontSize="sm" color={colors.textMuted} mb={2}>{correct} / {questions.length} correct</Text>
          <Text fontSize="xs" color={colors.textMuted} mb={8}>{wrong} wrong · {Math.round(correct / questions.length * 100)}%</Text>
          <ActionBtn onClick={() => navigate("/study")}>Back to Hub</ActionBtn>
        </Box>
      </PageContainer>
    )
  }

  const progress = (index / questions.length) * 100
  const letters = ["A", "B", "C", "D"]

  return (
    <PageContainer>
      <Box maxW="680px" mx="auto" px={6} py={8}>
        <Flex align="center" gap={3} mb={7}>
          <Box as="button" onClick={() => navigate("/study")} fontSize="sm" color={colors.textMuted} background="none" border="none" cursor="pointer" _hover={{ color: colors.accent }}>← Back</Box>
          <Text fontSize="sm" fontWeight="700" color={colors.textPrimary}>🎯 Multiple Choice</Text>
          <Box ml="auto" bg={colors.accentDim} border={`1px solid ${colors.accentDim}`} borderRadius="full" px={3} py="2px" fontSize="xs" color={colors.accent}>
            {category === "all" ? "All Terms" : category}
          </Box>
        </Flex>

        <Flex align="center" gap={3} mb={6}>
          <Text fontSize="xs" color={colors.textMuted} whiteSpace="nowrap">Q {index + 1} of {questions.length}</Text>
          <Box flex={1} h="6px" bg={colors.border} borderRadius="full" overflow="hidden">
            <Box h="100%" w={`${progress}%`} bg={colors.accent} borderRadius="full" />
          </Box>
          <Text fontSize="xs" color={colors.textMuted} whiteSpace="nowrap">{correct} ✓ &nbsp; {wrong} ✕</Text>
        </Flex>

        {/* Question */}
        <Box bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="xl" p={8} mb={5}>
          <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={4}>What is this term?</Text>
          <Text fontSize="md" fontWeight="700" color={colors.textPrimary} lineHeight="1.6">{q.term.definition}</Text>
        </Box>

        {/* Options */}
        <VStack gap={3} mb={5}>
          {q.options.map((opt, i) => {
            const isSelected = selected === opt.id
            const isCorrect = opt.id === q.term.id
            const revealed = selected !== null
            let borderColor: string = colors.border
            let bg: string = colors.surface
            let textColor: string = colors.textMuted
            if (revealed && isCorrect) { borderColor = "#2cb67d"; bg = "#0d2a1e"; textColor = colors.textPrimary }
            else if (revealed && isSelected && !isCorrect) { borderColor = "#ff6b6b"; bg = "#2a0d0d"; textColor = colors.textPrimary }

            return (
              <Box
                key={opt.id}
                as="button"
                onClick={() => pick(opt.id)}
                w="100%"
                bg={bg}
                border={`1px solid ${borderColor}`}
                borderRadius="lg"
                p={4}
                display="flex"
                alignItems="flex-start"
                gap={3}
                cursor={selected !== null ? "default" : "pointer"}
                textAlign="left"
                _hover={selected === null ? { borderColor: colors.accentSoft } : {}}
              >
                <Box
                  w="26px" h="26px"
                  borderRadius="full"
                  border={`1px solid ${borderColor}`}
                  display="flex" alignItems="center" justifyContent="center"
                  fontSize="xs" fontWeight="700"
                  color={revealed && (isCorrect || isSelected) ? borderColor : colors.textMuted}
                  flexShrink={0}
                  mt="1px"
                >
                  {revealed && isCorrect ? "✓" : revealed && isSelected ? "✕" : letters[i]}
                </Box>
                <Text fontSize="sm" color={textColor}>{opt.term}</Text>
              </Box>
            )
          })}
        </VStack>

        {/* Feedback */}
        {selected !== null && (
          <Box
            bg={selected === q.term.id ? "#0d2a1e" : "#2a0d0d"}
            border={`1px solid ${selected === q.term.id ? "#2cb67d40" : "#ff6b6b40"}`}
            borderRadius="lg"
            p={4}
            mb={5}
            display="flex"
            gap={3}
          >
            <Text fontSize="lg">{selected === q.term.id ? "✅" : "❌"}</Text>
            <Text fontSize="sm" color={colors.textMuted} lineHeight="1.6">
              {selected === q.term.id
                ? <><Text as="span" color={colors.textPrimary} fontWeight="700">Correct!</Text> {q.term.definition.slice(0, 80)}…</>
                : <><Text as="span" color={colors.textPrimary} fontWeight="700">Not quite.</Text> The answer is <Text as="span" color={colors.textPrimary} fontWeight="700">{q.term.term}</Text>.</>
              }
            </Text>
          </Box>
        )}

        {selected !== null && (
          <ActionBtn onClick={advance}>
            {index + 1 < questions.length ? "Next Question →" : "See Results →"}
          </ActionBtn>
        )}

        <Text textAlign="center" fontSize="xs" color={colors.border} mt={3}>
          A B C D to select · Enter for next
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

export default MultipleChoiceMode
