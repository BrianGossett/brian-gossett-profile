import { Box, Flex, Text, Wrap, WrapItem } from "@chakra-ui/react"
import { useNavigate } from "react-router"
import PageContainer from "../../Components/Container"
import { colors } from "../../Theme"
import { getCategories, getCategoryCounts, getTermsByCategory } from "../../data/terms"
import { useStudySession } from "../../hooks/useStudySession"

const MODES = [
  { key: "flashcards", path: "/study/flashcards", icon: "🃏", name: "Flashcards",       desc: "Swipe right if you know it, left if you don't. Tracks mastered terms." },
  { key: "quiz",       path: "/study/quiz",       icon: "🎯", name: "Multiple Choice", desc: "4 options per question. Great for quick recognition." },
  { key: "type",       path: "/study/type",       icon: "🔤", name: "Type the Term",   desc: "See the definition, type the term from memory." },
  { key: "match",      path: "/study/match",      icon: "🔗", name: "Matching",        desc: "Match terms to definitions. 8 pairs per round." },
] as const

const StudyHub = () => {
  const navigate = useNavigate()
  const { session, weakTerms, resetSession, setLastMode, setLastCategory } = useStudySession()
  const counts = getCategoryCounts()
  const categories = getCategories()
  const selectedCat = session.lastCategory ?? "all"
  const selectedMode = session.lastMode ?? "flashcards"
  const filteredTerms = getTermsByCategory(selectedCat)
  const remaining = filteredTerms.filter(t => !session.mastered.includes(t.id)).length
  const modeObj = MODES.find(m => m.key === selectedMode) ?? MODES[0]
  const position = session.positions[selectedMode as keyof typeof session.positions] ?? 0

  const handleStart = () => {
    navigate(modeObj.path)
  }

  return (
    <PageContainer>
      <Box maxW="900px" mx="auto" w="100%" px={6} py={10}>
        <Text as="h1" fontSize="2xl" fontWeight="800" color={colors.textPrimary} mb={1}>
          Music Theory Study
        </Text>
        <Text fontSize="sm" color={colors.textMuted} mb={8}>
          {counts.all} terms · {categories.length} categories
        </Text>

        {/* Session banner */}
        {(session.mastered.length > 0 || session.missed.length > 0) && (
          <Flex
            bg={colors.surface}
            border={`1px solid ${colors.accentDim}`}
            borderRadius="xl"
            p={5}
            mb={8}
            align="center"
            gap={6}
            flexWrap="wrap"
          >
            <StatItem value={session.mastered.length} label="Mastered" color={colors.accent} />
            <Divider />
            <StatItem value={session.missed.length} label="Missed" color="#ff6b6b" />
            <Divider />
            <StatItem value={`${session.streak}🔥`} label="Streak" color="#ffd93d" />
            <Divider />
            <StatItem value={remaining} label="Remaining" color={colors.textMuted} />
            {weakTerms.length > 0 && (
              <Box
                ml="auto"
                bg="#2d1b1b"
                border="1px solid #ff6b6b40"
                borderRadius="full"
                px={3}
                py={1}
                fontSize="xs"
                color="#ff6b6b"
              >
                ⚠ {weakTerms.length} weak terms
              </Box>
            )}
            <Box
              as="button"
              onClick={resetSession}
              fontSize="xs"
              color={colors.textMuted}
              cursor="pointer"
              textDecoration="underline"
              background="none"
              border="none"
              _hover={{ color: colors.accent }}
            >
              Reset session
            </Box>
          </Flex>
        )}

        {/* Category filter */}
        <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={3}>
          Study Category
        </Text>
        <Wrap gap={2} mb={8}>
          <WrapItem>
            <CategoryPill
              label={`All Terms (${counts.all})`}
              active={selectedCat === "all"}
              onClick={() => setLastCategory("all")}
            />
          </WrapItem>
          {categories.map(cat => (
            <WrapItem key={cat}>
              <CategoryPill
                label={`${cat} (${counts[cat]})`}
                active={selectedCat === cat}
                onClick={() => setLastCategory(cat)}
              />
            </WrapItem>
          ))}
        </Wrap>

        {/* Mode cards */}
        <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={3}>
          Study Mode
        </Text>
        <Flex gap={4} mb={8} flexWrap="wrap">
          {MODES.map(mode => (
            <ModeCard
              key={mode.key}
              mode={mode}
              selected={selectedMode === mode.key}
              isLast={session.lastMode === mode.key}
              onClick={() => setLastMode(mode.key)}
            />
          ))}
        </Flex>

        {/* Start button */}
        <Box
          as="button"
          onClick={handleStart}
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
          mb={2}
        >
          Start {modeObj.name} — {selectedCat === "all" ? "All Terms" : selectedCat}
        </Box>
        {position > 0 && selectedMode !== "quiz" && (
          <Text textAlign="center" fontSize="xs" color={colors.textMuted}>
            Continuing from card {position + 1} of {filteredTerms.length}
          </Text>
        )}
      </Box>
    </PageContainer>
  )
}

const StatItem = ({ value, label, color }: { value: string | number; label: string; color: string }) => (
  <Box>
    <Text fontSize="xl" fontWeight="800" color={color}>{value}</Text>
    <Text fontSize="xs" textTransform="uppercase" letterSpacing="wider" color={colors.textMuted}>{label}</Text>
  </Box>
)

const Divider = () => <Box w="1px" h="36px" bg={colors.border} />

const CategoryPill = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <Box
    as="button"
    onClick={onClick}
    bg={active ? colors.accentDim : colors.surface}
    border={`1px solid ${active ? colors.accent : colors.border}`}
    borderRadius="full"
    px={3}
    py={1}
    fontSize="xs"
    color={active ? colors.accent : colors.textMuted}
    cursor="pointer"
    _hover={{ borderColor: colors.accentSoft }}
  >
    {label}
  </Box>
)

interface ModeCardProps {
  mode: typeof MODES[number]
  selected: boolean
  isLast: boolean
  onClick: () => void
}

const ModeCard = ({ mode, selected, isLast, onClick }: ModeCardProps) => (
  <Box
    flex="1"
    minW="180px"
    bg={selected ? colors.deepBlue : colors.surface}
    border={`1px solid ${selected ? colors.accent : colors.border}`}
    borderRadius="xl"
    p={5}
    cursor="pointer"
    onClick={onClick}
    position="relative"
    _hover={{ borderColor: colors.accent }}
  >
    {isLast && (
      <Box
        position="absolute"
        top={3}
        right={3}
        bg={colors.accentDim}
        border={`1px solid ${colors.accentDim}`}
        borderRadius="full"
        px={2}
        py="2px"
        fontSize="10px"
        color={colors.accent}
      >
        Last used
      </Box>
    )}
    <Text fontSize="2xl" mb={2}>{mode.icon}</Text>
    <Text fontWeight="700" fontSize="sm" color={colors.textPrimary} mb={1}>{mode.name}</Text>
    <Text fontSize="xs" color={colors.textMuted} lineHeight="1.5">{mode.desc}</Text>
  </Box>
)

export default StudyHub
