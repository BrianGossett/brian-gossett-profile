import { useNavigate } from 'react-router'
import { Box, SimpleGrid, Text } from '@chakra-ui/react'
import PageContainer from '../../Components/Container'
import { colors } from '../../Theme'

const MODES = [
  {
    path: 'simulation',
    icon: '📝',
    name: 'Exam Simulation',
    desc: '12 terms, skip 2, write definitions, self-grade 1–3. Score analysis included. Timed optional.',
    cta: 'Start →',
  },
  {
    path: 'drills',
    icon: '🔥',
    name: 'Advanced Drills',
    desc: '6-option quiz, fill-in-blank, and category identification interleaved in one session.',
    cta: 'Start →',
  },
  {
    path: 'comprehensive',
    icon: '🏆',
    name: 'Full Deck Exam',
    desc: 'Write definitions for every term in the default deck, plus up to 10 score analysis questions.',
    cta: 'Start →',
  },
  {
    path: 'scores',
    icon: '🎼',
    name: 'Score Analysis',
    desc: 'Browse any score from the repertoire list and answer analysis questions at your own pace.',
    cta: 'Browse →',
  },
] as const

const ExamPrepHub = () => {
  const navigate = useNavigate()

  return (
    <PageContainer>
      <Box px={8} py={4} borderBottom={`1px solid ${colors.border}`}>
        <Box
          as="button"
          onClick={() => navigate('/study')}
          fontSize="sm" color={colors.textMuted}
          background="none" border="none" cursor="pointer"
          _hover={{ color: colors.accent }}
          mb={2}
        >
          ← Back to Study
        </Box>
        <Text fontSize="xl" fontWeight="800" color={colors.textPrimary}>Exam Prep</Text>
        <Text fontSize="xs" color={colors.textMuted}>
          Four harder practice modes based on the TTU Doctoral Qualifying Exam format.
        </Text>
      </Box>

      <Box p={{ base: 4, md: 8 }}>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          {MODES.map(mode => (
            <Box
              key={mode.path}
              bg={colors.surface}
              border={`1px solid ${colors.border}`}
              borderRadius="xl"
              p={6}
              cursor="pointer"
              onClick={() => navigate(`/study/exam/${mode.path}`)}
              _hover={{ borderColor: colors.accent }}
              display="flex"
              flexDirection="column"
            >
              <Text fontSize="2xl" mb={2}>{mode.icon}</Text>
              <Text fontWeight="800" color={colors.textPrimary} mb={2}>{mode.name}</Text>
              <Text fontSize="sm" color={colors.textMuted} mb={4} lineHeight="1.6" flex={1}>
                {mode.desc}
              </Text>
              <Box
                as="button"
                bg={colors.accent}
                color={colors.pageBg}
                border="none"
                borderRadius="lg"
                px={4} py={2}
                fontSize="sm"
                fontWeight="700"
                cursor="pointer"
                alignSelf="flex-start"
                _hover={{ bg: colors.accentSoft }}
              >
                {mode.cta}
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      </Box>
    </PageContainer>
  )
}

export default ExamPrepHub
