import { useState, useEffect, useRef, useMemo } from "react"
import { Box, Flex, Input, Text, VStack } from "@chakra-ui/react"
import { useNavigate, useParams } from "react-router"
import PageContainer from "../../Components/Container"
import { colors } from "../../Theme"
import { type Term } from "../../data/terms"
import { useDeckById, filterByCategory } from "../../hooks/useDecks"
import { useStudySession } from "../../hooks/useStudySession"

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "").trim()
}

function isMatch(input: string, term: Term): boolean {
  const n = normalize(input)
  const t = normalize(term.term)
  if (n === t) return true
  const core = normalize(term.term.split(" ")[0])
  if (core.length >= 5 && n.includes(core)) return true
  return false
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const TypeInMode = () => {
  const navigate = useNavigate()
  const { session, markMastered, markMissed, setPosition, setLastMode } = useStudySession()
  const { deckId = 'default' } = useParams<{ deckId: string }>()
  const deck = useDeckById(deckId)
  const category = session.lastCategory ?? 'all'
  const filteredTerms = filterByCategory(deck.terms, category)
  const termCount = Math.max(4, Math.min(session.termCounts.type, filteredTerms.length))

  const ordered = useMemo(() => {
    const weak = filteredTerms.filter(t => (session.missedCounts[t.id] ?? 0) >= 2)
    const rest = filteredTerms.filter(t => !session.mastered.includes(t.id) && !weak.find(w => w.id === t.id))
    const mastered = filteredTerms.filter(t => session.mastered.includes(t.id))
    return [...shuffle(weak), ...shuffle(rest), ...shuffle(mastered)].slice(0, termCount)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const savedPos = session.positions.type
  const [index, setIndex] = useState(savedPos < ordered.length ? savedPos : 0)
  const [value, setValue] = useState("")
  const [result, setResult] = useState<"correct" | "wrong" | null>(null)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setLastMode("type") }, [setLastMode])
  useEffect(() => { inputRef.current?.focus() }, [index])

  const term: Term | undefined = ordered[index]

  function check() {
    if (!term || result !== null) return
    const matched = isMatch(value, term)
    setResult(matched ? "correct" : "wrong")
    if (matched) { markMastered(term.id); setCorrect(c => c + 1) }
    else { markMissed(term.id); setWrong(w => w + 1) }
  }

  function giveUp() {
    if (!term || result !== null) return
    setResult("wrong")
    markMissed(term.id)
    setWrong(w => w + 1)
  }

  function advance() {
    const next = index + 1
    setIndex(next)
    setPosition("type", next)
    setValue("")
    setResult(null)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (result === null) check()
        else advance()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [result, index]) // eslint-disable-line react-hooks/exhaustive-deps

  const progress = ordered.length > 0 ? (index / ordered.length) * 100 : 0

  if (!term) {
    return (
      <PageContainer>
        <Box maxW="680px" mx="auto" px={6} py={10} textAlign="center">
          <Text fontSize="3xl" mb={4}>🔤</Text>
          <Text fontSize="xl" fontWeight="800" color={colors.textPrimary} mb={2}>All done!</Text>
          <Text fontSize="sm" color={colors.textMuted} mb={8}>{correct} correct · {wrong} wrong</Text>
          <ActionBtn onClick={() => navigate("/study")}>Back to Hub</ActionBtn>
        </Box>
      </PageContainer>
    )
  }

  const isCorrect = result === "correct"
  const isWrong = result === "wrong"

  let inputBorder: string = colors.border
  let inputBg: string = colors.surface
  if (isCorrect) { inputBorder = "#2cb67d"; inputBg = "#0d2a1e" }
  if (isWrong) { inputBorder = "#ff6b6b"; inputBg = "#2a0d0d" }

  return (
    <PageContainer>
      <Box maxW="680px" mx="auto" px={6} py={8}>
        <Flex align="center" gap={3} mb={7}>
          <Box as="button" onClick={() => navigate("/study")} fontSize="sm" color={colors.textMuted} background="none" border="none" cursor="pointer" _hover={{ color: colors.accent }}>← Back</Box>
          <Text fontSize="sm" fontWeight="700" color={colors.textPrimary}>🔤 Type the Term</Text>
          <Box ml="auto" bg={colors.accentDim} border={`1px solid ${colors.accentDim}`} borderRadius="full" px={3} py="2px" fontSize="xs" color={colors.accent}>
            {category === "all" ? "All Terms" : category}
          </Box>
        </Flex>

        <Flex align="center" gap={3} mb={6}>
          <Text fontSize="xs" color={colors.textMuted} whiteSpace="nowrap">Q {index + 1} of {ordered.length}</Text>
          <Box flex={1} h="6px" bg={colors.border} borderRadius="full" overflow="hidden">
            <Box h="100%" w={`${progress}%`} bg={colors.accent} borderRadius="full" />
          </Box>
          <Text fontSize="xs" color={colors.textMuted} whiteSpace="nowrap">{correct} ✓ &nbsp; {wrong} ✕</Text>
        </Flex>

        {/* Definition */}
        <Box bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="xl" p={8} mb={5}>
          <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={4}>Name this term</Text>
          <Text fontSize="md" color={colors.textMuted} lineHeight="1.7">{term.definition}</Text>
        </Box>

        {/* Input */}
        <VStack align="stretch" gap={2} mb={5}>
          <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.textMuted} fontWeight="700">Your Answer</Text>
          <Flex gap={3}>
            <Input
              ref={inputRef}
              value={value}
              onChange={e => result === null && setValue(e.target.value)}
              placeholder="Type the term…"
              bg={inputBg}
              border={`1px solid ${inputBorder}`}
              borderRadius="lg"
              color={colors.textPrimary}
              fontSize="md"
              p={4}
              h="auto"
              _focus={{ borderColor: colors.accent }}
              _placeholder={{ color: colors.textMuted }}
              readOnly={result !== null}
            />
            <Box
              as="button"
              onClick={result === null ? check : advance}
              bg={colors.accent}
              color={colors.pageBg}
              border="none"
              borderRadius="lg"
              px={5}
              fontSize="sm"
              fontWeight="800"
              cursor="pointer"
              whiteSpace="nowrap"
              _hover={{ bg: colors.accentSoft }}
            >
              {result === null ? "Check" : "Next →"}
            </Box>
          </Flex>
          {result === null && (
            <Text fontSize="xs" color={colors.textMuted}>
              Spelling doesn&apos;t have to be perfect. &nbsp;
              <Box as="button" onClick={giveUp} fontSize="xs" color={colors.accent} background="none" border="none" cursor="pointer" textDecoration="underline">
                Give up &amp; show answer
              </Box>
            </Text>
          )}
        </VStack>

        {/* Feedback */}
        {result !== null && (
          <Box
            bg={isCorrect ? "#0d2a1e" : "#2a0d0d"}
            border={`1px solid ${isCorrect ? "#2cb67d40" : "#ff6b6b40"}`}
            borderRadius="lg"
            p={4}
            display="flex"
            gap={3}
          >
            <Text fontSize="lg">{isCorrect ? "✅" : "❌"}</Text>
            <Box>
              <Text fontSize="sm" fontWeight="700" color={colors.textPrimary} mb={1}>
                {isCorrect ? `✓ ${term.term}` : `Answer: ${term.term}${value ? ` (you typed: "${value}")` : ""}`}
              </Text>
              <Text fontSize="xs" color={colors.textMuted} lineHeight="1.5">
                {isCorrect ? `${term.category} · ${term.definition.slice(0, 80)}…` : term.definition.slice(0, 120) + "…"}
              </Text>
            </Box>
          </Box>
        )}

        <Text textAlign="center" fontSize="xs" color={colors.border} mt={4}>
          Enter to check · Enter again for next
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

export default TypeInMode
