import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import PageContainer from '../../Components/Container'
import { colors } from '../../Theme'
import { ALL_SCORES, type ScoreExcerpt } from '../../data/scores'
import PdfViewer from './shared/PdfViewer'
import SelfGradeButtons from './shared/SelfGradeButtons'

type Phase = 'browse' | 'practice' | 'grading'

const ERA_COLOR: Record<string, string> = {
  Baroque: '#7c5cbf',
  Classical: '#2cb67d',
  Romantic: '#e07b39',
  '20th Century': '#ff6b6b',
}

const ScoreAnalysis = () => {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('browse')
  const [score, setScore] = useState<ScoreExcerpt | null>(null)
  const [answers, setAnswers] = useState<string[]>([])
  const [grades, setGrades] = useState<(1 | 2 | 3 | null)[]>([])
  const [revealed, setRevealed] = useState(false)

  function startPractice(s: ScoreExcerpt) {
    setScore(s)
    setAnswers(s.questions.map(() => ''))
    setGrades(s.questions.map(() => null))
    setRevealed(false)
    setPhase('practice')
  }

  function reset() {
    setScore(null)
    setPhase('browse')
  }

  if (phase === 'browse') {
    return (
      <PageContainer>
        <Box px={8} py={4} borderBottom={`1px solid ${colors.border}`}>
          <Box as="button" onClick={() => navigate('/study/exam')} fontSize="sm" color={colors.textMuted} background="none" border="none" cursor="pointer" _hover={{ color: colors.accent }} mb={2}>
            ← Back to Exam Prep
          </Box>
          <Text fontSize="xl" fontWeight="800" color={colors.textPrimary}>🎼 Score Analysis</Text>
          <Text fontSize="xs" color={colors.textMuted}>Browse any score and answer analysis questions at your own pace.</Text>
        </Box>
        <Box p={{ base: 4, md: 8 }}>
          {ALL_SCORES.length === 0 ? (
            <Box bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="xl" p={8} textAlign="center">
              <Text color={colors.textMuted} fontSize="sm">
                No scores added yet — populate{' '}
                <Text as="code" fontFamily="mono" fontSize="xs">src/data/scores.ts</Text>
                {' '}to get started.
              </Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={4}>
              {ALL_SCORES.map(s => (
                <Box
                  key={s.id}
                  bg={colors.surface}
                  border={`1px solid ${colors.border}`}
                  borderRadius="xl"
                  p={4}
                  cursor="pointer"
                  onClick={() => startPractice(s)}
                  _hover={{ borderColor: colors.accent }}
                >
                  <Box
                    display="inline-block"
                    bg={ERA_COLOR[s.era] ?? colors.accentDim}
                    color="#fff"
                    fontSize="9px"
                    fontWeight="700"
                    px={2} py="2px"
                    borderRadius="full"
                    mb={2}
                  >
                    {s.era}
                  </Box>
                  <Text fontWeight="700" fontSize="sm" color={colors.textPrimary} mb={1}>{s.composer}</Text>
                  <Text fontSize="xs" color={colors.textMuted} mb={2}>{s.title}</Text>
                  <Text fontSize="9px" color={colors.border}>{s.questions.length} question{s.questions.length !== 1 ? 's' : ''}</Text>
                </Box>
              ))}
            </SimpleGrid>
          )}
        </Box>
      </PageContainer>
    )
  }

  if (!score) return null

  if (phase === 'practice') {
    return (
      <PageContainer>
        <Box px={8} py={4} borderBottom={`1px solid ${colors.border}`}>
          <Box as="button" onClick={reset} fontSize="sm" color={colors.textMuted} background="none" border="none" cursor="pointer" _hover={{ color: colors.accent }} mb={2}>
            ← Back to scores
          </Box>
          <Text fontSize="xl" fontWeight="800" color={colors.textPrimary}>{score.composer}</Text>
          <Text fontSize="xs" color={colors.textMuted}>{score.title}</Text>
        </Box>
        <Box p={{ base: 4, md: 8 }}>
          <PdfViewer pdfPath={score.pdfPath} startPage={score.startPage} measures={score.measures} />
          <VStack gap={6} align="stretch" mt={4}>
            {score.questions.map((q, i) => (
              <Box key={i}>
                <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={2}>
                  Question {i + 1}
                </Text>
                <Text fontSize="sm" color={colors.textPrimary} mb={2}>{q.prompt}</Text>
                <textarea
                  value={answers[i]}
                  onChange={e => setAnswers(prev => prev.map((a, idx) => idx === i ? e.target.value : a))}
                  placeholder="Write your analysis here…"
                  style={{
                    width: '100%', minHeight: '120px',
                    background: colors.surface, border: `1px solid ${colors.border}`,
                    borderRadius: '8px', color: colors.textPrimary,
                    fontFamily: 'monospace', fontSize: '13px',
                    padding: '12px', resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </Box>
            ))}
          </VStack>
          <Box as="button" onClick={() => setPhase('grading')} w="100%" mt={6} bg={colors.accent} color={colors.pageBg} border="none" borderRadius="lg" py={4} fontSize="md" fontWeight="800" cursor="pointer" _hover={{ bg: colors.accentSoft }}>
            Submit &amp; Grade →
          </Box>
        </Box>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <Box px={8} py={4} borderBottom={`1px solid ${colors.border}`}>
        <Text fontSize="xl" fontWeight="800" color={colors.textPrimary}>Self-Grade</Text>
        <Text fontSize="xs" color={colors.textMuted}>{score.composer} — {score.title}</Text>
      </Box>
      <Box p={{ base: 4, md: 8 }}>
        <VStack gap={6} align="stretch">
          {score.questions.map((q, i) => (
            <Box key={i} bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="xl" p={5}>
              <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={2}>
                Question {i + 1}
              </Text>
              <Text fontSize="sm" color={colors.textPrimary} mb={3}>{q.prompt}</Text>
              <Box bg={colors.pageBg} border={`1px solid ${colors.border}`} borderRadius="lg" p={3} mb={3}>
                <Text fontSize="9px" color={colors.textMuted} mb={1}>YOUR ANSWER</Text>
                <Text fontSize="sm" color={colors.textPrimary} whiteSpace="pre-wrap">{answers[i] || '(no answer)'}</Text>
              </Box>
              <Box bg="#0d1a0d" border="1px solid #1a3a1a" borderRadius="lg" p={3} mb={3}>
                <Text fontSize="9px" color="#2cb67d" mb={1}>MODEL ANSWER</Text>
                <Text fontSize="sm" color={colors.textPrimary} lineHeight="1.6">{q.modelAnswer}</Text>
              </Box>
              <SelfGradeButtons
                value={grades[i]}
                onChange={v => setGrades(prev => prev.map((g, idx) => idx === i ? v : g))}
              />
            </Box>
          ))}

          <Box bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="xl" p={5}>
            {!revealed ? (
              <Box as="button" onClick={() => setRevealed(true)} w="100%" bg={colors.accentDim} border={`1px solid ${colors.accent}`} borderRadius="lg" py={3} fontSize="sm" fontWeight="700" color={colors.accent} cursor="pointer" _hover={{ bg: colors.accentGlow }}>
                Reveal Composer &amp; Era →
              </Box>
            ) : (
              <Box>
                <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={3}>Attribution</Text>
                <Text fontWeight="800" color={colors.textPrimary} fontSize="lg">{score.composer}</Text>
                <Text fontSize="sm" color={colors.textMuted}>{score.title}</Text>
                <Text fontSize="sm" color={colors.textMuted}>{score.era} · {score.yearRange}</Text>
              </Box>
            )}
          </Box>

          <Flex gap={3}>
            <Box as="button" onClick={reset} flex={1} bg="transparent" border={`1px solid ${colors.border}`} borderRadius="lg" py={3} fontSize="sm" color={colors.textMuted} cursor="pointer" _hover={{ borderColor: colors.accent }}>
              Practice another score
            </Box>
            <Box as="button" onClick={() => navigate('/study/exam')} flex={1} bg={colors.accent} color={colors.pageBg} border="none" borderRadius="lg" py={3} fontSize="sm" fontWeight="700" cursor="pointer" _hover={{ bg: colors.accentSoft }}>
              Back to Exam Prep
            </Box>
          </Flex>
        </VStack>
      </Box>
    </PageContainer>
  )
}

export default ScoreAnalysis
