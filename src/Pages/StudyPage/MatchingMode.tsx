import { useState, useEffect, useMemo } from "react"
import { Box, Flex, Text } from "@chakra-ui/react"
import { useNavigate, useParams } from "react-router"
import PageContainer from "../../Components/Container"
import { colors } from "../../Theme"
import { type Term } from "../../data/terms"
import { useDeckById, filterByCategory } from "../../hooks/useDecks"
import { useStudySession } from "../../hooks/useStudySession"

const ROUND_SIZE = 8

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface MatchItem {
  id: number
  text: string
  type: "term" | "def"
  matched: boolean
  wrongFlash: boolean
}

const MatchingMode = () => {
  const navigate = useNavigate()
  const { session, markMastered, setPosition, setLastMode } = useStudySession()
  const { deckId = 'default' } = useParams<{ deckId: string }>()
  const deck = useDeckById(deckId)
  const category = session.lastCategory ?? 'all'
  const filteredTerms = filterByCategory(deck.terms, category)
  const termCount = Math.max(4, Math.min(session.termCounts.match, filteredTerms.length))

  const shuffledAll = useMemo(() => shuffle(filteredTerms).slice(0, termCount), []) // eslint-disable-line react-hooks/exhaustive-deps

  const [roundIndex, setRoundIndex] = useState(session.positions.match)
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null)
  const [selectedDef, setSelectedDef] = useState<number | null>(null)
  const [wrongAttempts, setWrongAttempts] = useState(0)
  const [roundComplete, setRoundComplete] = useState(false)

  useEffect(() => { setLastMode("match") }, [setLastMode])

  const roundTerms: Term[] = useMemo(() => {
    const start = roundIndex * ROUND_SIZE
    return shuffledAll.slice(start, start + ROUND_SIZE)
  }, [shuffledAll, roundIndex])

  const [items, setItems] = useState<{ terms: MatchItem[]; defs: MatchItem[] }>(() => buildRound(roundTerms))

  const isFlashing = items.terms.some(t => t.wrongFlash) || items.defs.some(d => d.wrongFlash)

  useEffect(() => {
    setItems(buildRound(roundTerms))
    setSelectedTerm(null)
    setSelectedDef(null)
    setWrongAttempts(0)
    setRoundComplete(false)
  }, [roundIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  function buildRound(terms: Term[]): { terms: MatchItem[]; defs: MatchItem[] } {
    return {
      terms: shuffle(terms.map(t => ({ id: t.id, text: t.term, type: "term" as const, matched: false, wrongFlash: false }))),
      defs:  shuffle(terms.map(t => ({ id: t.id, text: t.definition.slice(0, 120) + (t.definition.length > 120 ? "…" : ""), type: "def" as const, matched: false, wrongFlash: false }))),
    }
  }

  function selectTerm(id: number) {
    if (isFlashing || items.terms.find(t => t.id === id)?.matched) return
    setSelectedTerm(id)
    if (selectedDef !== null) attemptMatch(id, selectedDef)
  }

  function selectDef(id: number) {
    if (isFlashing || items.defs.find(d => d.id === id)?.matched) return
    setSelectedDef(id)
    if (selectedTerm !== null) attemptMatch(selectedTerm, id)
  }

  function attemptMatch(termId: number, defId: number) {
    if (termId === defId) {
      setItems(prev => {
        const nextTerms = prev.terms.map(t => t.id === termId ? { ...t, matched: true } : t)
        const nextDefs  = prev.defs.map(d => d.id === defId  ? { ...d, matched: true } : d)
        const allMatched = nextTerms.every(t => t.matched)
        if (allMatched) setTimeout(() => setRoundComplete(true), 300)
        return { terms: nextTerms, defs: nextDefs }
      })
      markMastered(termId)
      setSelectedTerm(null)
      setSelectedDef(null)
    } else {
      setWrongAttempts(w => w + 1)
      setItems(prev => ({
        terms: prev.terms.map(t => t.id === termId ? { ...t, wrongFlash: true } : t),
        defs:  prev.defs.map(d => d.id === defId   ? { ...d, wrongFlash: true } : d),
      }))
      setTimeout(() => {
        setItems(prev => ({
          terms: prev.terms.map(t => ({ ...t, wrongFlash: false })),
          defs:  prev.defs.map(d => ({ ...d, wrongFlash: false })),
        }))
        setSelectedTerm(null)
        setSelectedDef(null)
      }, 350)
    }
  }

  function nextRound() {
    const next = roundIndex + 1
    setRoundIndex(next)
    setPosition("match", next)
  }

  const matched = items.terms.filter(t => t.matched).length
  const total = roundTerms.length
  const progress = total > 0 ? (matched / total) * 100 : 0
  const totalRounds = Math.ceil(shuffledAll.length / ROUND_SIZE)
  const isLastRound = (roundIndex + 1) >= totalRounds

  if (roundTerms.length === 0) {
    return (
      <PageContainer>
        <Box maxW="900px" mx="auto" px={6} py={10} textAlign="center">
          <Text fontSize="3xl" mb={4}>🔗</Text>
          <Text fontSize="xl" fontWeight="800" color={colors.textPrimary} mb={2}>All rounds complete!</Text>
          <ActionBtn onClick={() => navigate("/study")}>Back to Hub</ActionBtn>
        </Box>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <Box maxW="900px" mx="auto" px={6} py={8}>
        <Flex align="center" gap={3} mb={7}>
          <Box as="button" onClick={() => navigate("/study")} fontSize="sm" color={colors.textMuted} background="none" border="none" cursor="pointer" _hover={{ color: colors.accent }}>← Back</Box>
          <Text fontSize="sm" fontWeight="700" color={colors.textPrimary}>🔗 Matching</Text>
          <Box ml="auto" bg={colors.accentDim} border={`1px solid ${colors.accentDim}`} borderRadius="full" px={3} py="2px" fontSize="xs" color={colors.accent}>
            {category === "all" ? "All Terms" : category} · Round {roundIndex + 1} of {totalRounds}
          </Box>
        </Flex>

        <Flex align="center" gap={3} mb={2}>
          <Text fontSize="xs" color={colors.textMuted} whiteSpace="nowrap">{matched} of {total} matched</Text>
          <Box flex={1} h="6px" bg={colors.border} borderRadius="full" overflow="hidden">
            <Box h="100%" w={`${progress}%`} bg={colors.accent} borderRadius="full" style={{ transition: "width 0.3s" }} />
          </Box>
        </Flex>

        <Text fontSize="xs" color={colors.textMuted} mb={6}>
          Click a term, then click its definition. Wrong pairs flash red.
        </Text>

        {roundComplete ? (
          <Box bg="#0d2a1e" border="1px solid #2cb67d40" borderRadius="xl" p={8} textAlign="center" mb={6}>
            <Text fontSize="2xl" fontWeight="800" color="#2cb67d" mb={2}>Round Complete! 🎉</Text>
            <Text fontSize="sm" color={colors.textMuted} mb={6}>
              {total} / {total} matched · {wrongAttempts} wrong {wrongAttempts === 1 ? "attempt" : "attempts"}
            </Text>
            {isLastRound ? (
              <ActionBtn onClick={() => navigate("/study")}>All Done — Back to Hub</ActionBtn>
            ) : (
              <ActionBtn onClick={nextRound}>Next Round →</ActionBtn>
            )}
          </Box>
        ) : (
          <>
            <Flex gap={4} mb={2}>
              <Box flex={1} textAlign="center">
                <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.textMuted} fontWeight="700">Terms</Text>
              </Box>
              <Box flex={1} textAlign="center">
                <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.textMuted} fontWeight="700">Definitions</Text>
              </Box>
            </Flex>

            <Flex gap={4} mb={6}>
              <Box flex={1} display="flex" flexDirection="column" gap={3}>
                {items.terms.map(item => (
                  <MatchCell
                    key={item.id}
                    item={item}
                    isSelected={selectedTerm === item.id}
                    onClick={() => !item.matched && selectTerm(item.id)}
                  />
                ))}
              </Box>
              <Box flex={1} display="flex" flexDirection="column" gap={3}>
                {items.defs.map(item => (
                  <MatchCell
                    key={item.id}
                    item={item}
                    isSelected={selectedDef === item.id}
                    onClick={() => !item.matched && selectDef(item.id)}
                  />
                ))}
              </Box>
            </Flex>

            <Text textAlign="center" fontSize="xs" color={colors.border}>
              {wrongAttempts} wrong {wrongAttempts === 1 ? "attempt" : "attempts"} this round
            </Text>
          </>
        )}
      </Box>
    </PageContainer>
  )
}

interface MatchCellProps {
  item: MatchItem
  isSelected: boolean
  onClick: () => void
}

const MatchCell = ({ item, isSelected, onClick }: MatchCellProps) => {
  let borderColor: string = colors.border
  let bg: string = colors.surface
  let textColor: string = colors.textMuted

  if (item.matched) { borderColor = "#2cb67d"; bg = "#0d2a1e"; textColor = "#2cb67d" }
  else if (item.wrongFlash) { borderColor = "#ff6b6b"; bg = "#2a0d0d"; textColor = colors.textPrimary }
  else if (isSelected) { borderColor = colors.accent; bg = colors.deepBlue }

  return (
    <Box
      onClick={item.matched ? undefined : onClick}
      bg={bg}
      border={`1px solid ${borderColor}`}
      borderRadius="lg"
      p={3}
      fontSize="xs"
      color={item.matched ? textColor : isSelected ? colors.textPrimary : colors.textMuted}
      cursor={item.matched ? "default" : "pointer"}
      minH="52px"
      display="flex"
      alignItems="center"
      lineHeight="1.4"
      style={{ transition: "all 0.12s", fontWeight: item.type === "term" ? 700 : 400 }}
      _hover={!item.matched ? { borderColor: colors.accentSoft } : {}}
    >
      {item.text}
    </Box>
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

export default MatchingMode
