import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Box, Flex, Text, VStack } from '@chakra-ui/react'
import PageContainer from '../../Components/Container'
import { colors } from '../../Theme'
import { ALL_SCORES, type ScoreExcerpt, randomScore, randomPage } from '../../data/scores'
import PdfViewer from './shared/PdfViewer'
import SelfGradeButtons from './shared/SelfGradeButtons'

type Phase = 'practice' | 'grading'

function pickRandom(): { score: ScoreExcerpt; page: number } {
  const score = randomScore(ALL_SCORES)
  return { score, page: randomPage(score) }
}

const ScoreAnalysis = () => {
  const navigate = useNavigate()
  const [{ score, page }, setScorePage] = useState(pickRandom)
  const [phase, setPhase] = useState<Phase>('practice')
  const [answers, setAnswers] = useState<string[]>(() => score.questions.map(() => ''))
  const [grades, setGrades] = useState<(1 | 2 | 3 | null)[]>(() => score.questions.map(() => null))
  const [revealed, setRevealed] = useState(false)

  function nextScore() {
    const next = pickRandom()
    setScorePage(next)
    setAnswers(next.score.questions.map(() => ''))
    setGrades(next.score.questions.map(() => null))
    setRevealed(false)
    setPhase('practice')
  }

  if (phase === 'practice') {
    return (
      <PageContainer>
        <Box px={8} py={4} borderBottom={`1px solid ${colors.border}`}>
          <Box as="button" onClick={() => navigate('/study/exam')} fontSize="sm" color={colors.textMuted} background="none" border="none" cursor="pointer" _hover={{ color: colors.accent }} mb={2}>
            ← Back to Exam Prep
          </Box>
          <Text fontSize="xl" fontWeight="800" color={colors.textPrimary}>Score Analysis</Text>
        </Box>
        <Box p={{ base: 4, md: 8 }}>
          <PdfViewer pdfPath={score.pdfPath} page={page} />
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
              {q.modelAnswer && (
                <Box bg="#0d1a0d" border="1px solid #1a3a1a" borderRadius="lg" p={3} mb={3}>
                  <Text fontSize="9px" color="#2cb67d" mb={1}>MODEL ANSWER</Text>
                  <Text fontSize="sm" color={colors.textPrimary} lineHeight="1.6">{q.modelAnswer}</Text>
                </Box>
              )}
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
            <Box as="button" onClick={nextScore} flex={1} bg="transparent" border={`1px solid ${colors.border}`} borderRadius="lg" py={3} fontSize="sm" color={colors.textMuted} cursor="pointer" _hover={{ borderColor: colors.accent }}>
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
