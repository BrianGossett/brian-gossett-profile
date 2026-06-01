import { useEffect, useState, useCallback } from "react"
import { Box, Flex, Text, VStack } from "@chakra-ui/react"
import { useNavigate } from "react-router"
import PageContainer from "../../Components/Container"
import { colors } from "../../Theme"
import { getTermsByCategory, type Term } from "../../data/terms"
import { useStudySession } from "../../hooks/useStudySession"

const FlashcardMode = () => {
  const navigate = useNavigate()
  const { session, markMastered, markMissed, setPosition, setLastMode } = useStudySession()
  const category = (session.lastCategory ?? "all") as Parameters<typeof getTermsByCategory>[0]
  const allTerms = getTermsByCategory(category)
  const savedPos = session.positions.flashcards
  const [index, setIndex] = useState(savedPos < allTerms.length ? savedPos : 0)
  const [flipped, setFlipped] = useState(false)
  const [gotIt, setGotIt] = useState<number>(session.mastered.length)
  const [missed, setMissed] = useState<number>(session.missed.length)

  useEffect(() => { setLastMode("flashcards") }, [setLastMode])

  const term: Term | undefined = allTerms[index]

  const advance = useCallback((knew: boolean) => {
    if (!term) return
    if (knew) { markMastered(term.id); setGotIt(g => g + 1) }
    else { markMissed(term.id); setMissed(m => m + 1) }
    const next = index + 1
    setIndex(next)
    setPosition("flashcards", next)
    setFlipped(false)
  }, [term, index, markMastered, markMissed, setPosition])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " ") { e.preventDefault(); setFlipped(f => !f) }
      if (e.key === "ArrowRight" && flipped) advance(true)
      if (e.key === "ArrowLeft"  && flipped) advance(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [flipped, advance])

  const progress = allTerms.length > 0 ? (index / allTerms.length) * 100 : 0
  const remaining = allTerms.length - index

  if (!term) {
    return (
      <PageContainer>
        <Box maxW="680px" mx="auto" px={6} py={10} textAlign="center">
          <Text fontSize="3xl" mb={4}>🎉</Text>
          <Text fontSize="xl" fontWeight="800" color={colors.textPrimary} mb={2}>All done!</Text>
          <Text fontSize="sm" color={colors.textMuted} mb={8}>
            {gotIt} got it · {missed} missed · {allTerms.length} total
          </Text>
          <ActionBtn onClick={() => { setIndex(0); setPosition("flashcards", 0); setFlipped(false); setGotIt(0); setMissed(0) }}>
            Restart Deck
          </ActionBtn>
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
        <Flex align="center" gap={3} mb={7}>
          <Box as="button" onClick={() => navigate("/study")} fontSize="sm" color={colors.textMuted} background="none" border="none" cursor="pointer" _hover={{ color: colors.accent }}>
            ← Back
          </Box>
          <Text fontSize="sm" fontWeight="700" color={colors.textPrimary}>🃏 Flashcards</Text>
          <Box ml="auto" bg={colors.accentDim} border={`1px solid ${colors.accentDim}`} borderRadius="full" px={3} py="2px" fontSize="xs" color={colors.accent}>
            {category === "all" ? "All Terms" : category}
          </Box>
        </Flex>

        {/* Progress */}
        <Flex align="center" gap={3} mb={2}>
          <Text fontSize="xs" color={colors.textMuted} whiteSpace="nowrap">Card {index + 1} of {allTerms.length}</Text>
          <Box flex={1} h="6px" bg={colors.border} borderRadius="full" overflow="hidden">
            <Box h="100%" w={`${progress}%`} bg={colors.accent} borderRadius="full" />
          </Box>
          {session.streak > 0 && <Text fontSize="xs" color="#ffd93d" whiteSpace="nowrap">🔥 {session.streak}</Text>}
        </Flex>

        {/* Mini stats */}
        <Flex gap={4} mb={6}>
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
          {!flipped ? (
            <>
              <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.textMuted} mb={5}>
                Click to reveal definition
              </Text>
              <Text fontSize="2xl" fontWeight="800" color={colors.textPrimary}>{term.term}</Text>
              <Text fontSize="xs" color={colors.accent} textTransform="uppercase" letterSpacing="wider" mt={3}>{term.category}</Text>
            </>
          ) : (
            <>
              <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} mb={5}>Definition</Text>
              <Text fontSize="sm" color={colors.textMuted} lineHeight="1.8" maxW="480px">{term.definition}</Text>
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
              onClick={() => flipped && advance(false)}
              w="64px" h="64px"
              borderRadius="full"
              border="2px solid #ff6b6b"
              color="#ff6b6b"
              fontSize="xl"
              bg="transparent"
              cursor={flipped ? "pointer" : "not-allowed"}
              opacity={flipped ? 1 : 0.3}
              _hover={flipped ? { bg: "#ff6b6b20" } : {}}
              display="flex" alignItems="center" justifyContent="center"
            >
              ✕
            </Box>
            <Text fontSize="xs" color={colors.textMuted} textTransform="uppercase" letterSpacing="wider">Still learning</Text>
          </VStack>

          <Text fontSize="sm" color={colors.textMuted}>{flipped ? "Know it?" : "Flip first"}</Text>

          <VStack gap={2}>
            <Box
              as="button"
              onClick={() => flipped && advance(true)}
              w="64px" h="64px"
              borderRadius="full"
              border="2px solid #2cb67d"
              color="#2cb67d"
              fontSize="xl"
              bg="transparent"
              cursor={flipped ? "pointer" : "not-allowed"}
              opacity={flipped ? 1 : 0.3}
              _hover={flipped ? { bg: "#2cb67d20" } : {}}
              display="flex" alignItems="center" justifyContent="center"
            >
              ✓
            </Box>
            <Text fontSize="xs" color={colors.textMuted} textTransform="uppercase" letterSpacing="wider">Got it!</Text>
          </VStack>
        </Flex>

        <Text textAlign="center" fontSize="xs" color={colors.border}>
          Space to flip · ← still learning · → got it
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

export default FlashcardMode
