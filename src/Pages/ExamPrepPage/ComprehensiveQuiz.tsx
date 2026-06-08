import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Box, Flex, Text, VStack } from '@chakra-ui/react'
import PageContainer from '../../Components/Container'
import { colors } from '../../Theme'
import { ALL_TERMS } from '../../data/terms'
import { ALL_SCORES, sampleScoreQuestions, randomPage } from '../../data/scores'
import SelfGradeButtons from './shared/SelfGradeButtons'
import PdfViewer from './shared/PdfViewer'
import TermSidebar from './shared/TermSidebar'

type CQPhase = 'part1-writing' | 'part1-grading' | 'part2-writing' | 'part2-grading' | 'results'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const BAR_COLOR = (pct: number) =>
  pct >= 0.8 ? '#2cb67d' : pct >= 0.6 ? '#ffd93d' : '#ff6b6b'

const ComprehensiveQuiz = () => {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<CQPhase>('part1-writing')

  const shuffledTerms = useMemo(() => shuffle([...ALL_TERMS]), [])
  const scoreQs = useMemo(() => sampleScoreQuestions(ALL_SCORES, 10), [])
  const scorePages = useMemo(() => scoreQs.map(sq => randomPage(sq.score)), [scoreQs])

  const [currentTermIdx, setCurrentTermIdx] = useState(0)
  const [termAnswers, setTermAnswers] = useState<Record<number, string>>({})
  const [termGrades, setTermGrades] = useState<Record<number, 1 | 2 | 3 | null>>({})
  const [gradeTermIdx, setGradeTermIdx] = useState(0)

  const [scoreAnswers, setScoreAnswers] = useState<string[]>(scoreQs.map(() => ''))
  const [scoreGrades, setScoreGrades] = useState<(1 | 2 | 3 | null)[]>(scoreQs.map(() => null))
  const [scoreWritingIdx, setScoreWritingIdx] = useState(0)
  const [scoreGradingIdx, setScoreGradingIdx] = useState(0)

  const answeredTermIds = useMemo(
    () => new Set(Object.keys(termAnswers).map(Number).filter(id => termAnswers[id]?.trim())),
    [termAnswers]
  )

  const gradingTerms = useMemo(
    () => shuffledTerms.filter(t => answeredTermIds.has(t.id)),
    [shuffledTerms, answeredTermIds]
  )

  function beginPart1Grading() {
    setGradeTermIdx(0)
    setTermGrades({})
    setPhase('part1-grading')
  }

  function advancePart1Grade() {
    const next = gradeTermIdx + 1
    if (next >= gradingTerms.length) {
      setScoreWritingIdx(0)
      setPhase(scoreQs.length > 0 ? 'part2-writing' : 'results')
    } else {
      setGradeTermIdx(next)
    }
  }

  function advanceScoreWriting() {
    const next = scoreWritingIdx + 1
    if (next >= scoreQs.length) {
      setScoreGradingIdx(0)
      setPhase('part2-grading')
    } else {
      setScoreWritingIdx(next)
    }
  }

  function advanceScoreGrading() {
    const next = scoreGradingIdx + 1
    if (next >= scoreQs.length) {
      setPhase('results')
    } else {
      setScoreGradingIdx(next)
    }
  }

  // ── Part I Writing ────────────────────────────────────────────────────────
  if (phase === 'part1-writing') {
    const term = shuffledTerms[currentTermIdx]
    return (
      <PageContainer>
        <Flex borderBottom={`1px solid ${colors.border}`} px={8} py={3} align="center" justify="space-between" flexWrap="wrap" gap={2}>
          <Text fontSize="sm" fontWeight="700" color={colors.textPrimary}>🏆 Full Deck Exam — Part I</Text>
          <Text fontSize="xs" color={colors.textMuted}>{answeredTermIds.size} answered · {currentTermIdx + 1}/{shuffledTerms.length}</Text>
        </Flex>
        <Flex flex={1} overflow="hidden" direction={{ base: 'column', md: 'row' }}>
          <TermSidebar
            terms={shuffledTerms}
            currentIndex={currentTermIdx}
            onSelect={setCurrentTermIdx}
            answeredIds={answeredTermIds}
          />
          <Box flex={1} p={{ base: 4, md: 8 }} overflowY="auto">
            <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={1}>{term.category}</Text>
            <Text fontSize="2xl" fontWeight="800" color={colors.textPrimary} mb={6}>{term.term}</Text>
            <textarea
              value={termAnswers[term.id] ?? ''}
              onChange={e => setTermAnswers(prev => ({ ...prev, [term.id]: e.target.value }))}
              placeholder="Define in 2–4 sentences…"
              style={{
                width: '100%', minHeight: '180px',
                background: colors.surface, border: `1px solid ${colors.border}`,
                borderRadius: '8px', color: colors.textPrimary,
                fontFamily: 'monospace', fontSize: '14px',
                padding: '14px', resize: 'vertical', outline: 'none', boxSizing: 'border-box',
              }}
            />
            <Box as="button" onClick={beginPart1Grading} w="100%" mt={6} bg={colors.accent} color={colors.pageBg} border="none" borderRadius="lg" py={4} fontSize="md" fontWeight="800" cursor="pointer" _hover={{ bg: colors.accentSoft }}>
              Submit Part I ({answeredTermIds.size} answered) →
            </Box>
          </Box>
        </Flex>
      </PageContainer>
    )
  }

  // ── Part I Grading ────────────────────────────────────────────────────────
  if (phase === 'part1-grading') {
    if (gradingTerms.length === 0) {
      setPhase(scoreQs.length > 0 ? 'part2-writing' : 'results')
      return null
    }
    const term = gradingTerms[gradeTermIdx]
    if (!term) {
      setPhase(scoreQs.length > 0 ? 'part2-writing' : 'results')
      return null
    }
    const gradeTotal = Object.values(termGrades).reduce((s, v) => s + (v ?? 0), 0)
    return (
      <PageContainer>
        <Flex borderBottom={`1px solid ${colors.border}`} px={8} py={3} align="center">
          <Text fontSize="sm" fontWeight="700" color={colors.textPrimary}>🏆 Part I — Self-Grade</Text>
          <Text ml="auto" fontSize="xs" color={colors.textMuted}>{gradeTermIdx + 1}/{gradingTerms.length} · {gradeTotal} pts</Text>
        </Flex>
        <Box maxW="800px" mx="auto" p={{ base: 4, md: 8 }}>
          <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={1}>{term.category}</Text>
          <Text fontSize="xl" fontWeight="800" color={colors.textPrimary} mb={5}>{term.term}</Text>
          <Flex gap={4} mb={4} direction={{ base: 'column', md: 'row' }}>
            <Box flex={1} bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="xl" p={4}>
              <Text fontSize="9px" color={colors.textMuted} mb={2}>YOUR ANSWER</Text>
              <Text fontSize="sm" color={colors.textPrimary} lineHeight="1.6" whiteSpace="pre-wrap">{termAnswers[term.id]}</Text>
            </Box>
            <Box flex={1} bg="#0d1a0d" border="1px solid #1a3a1a" borderRadius="xl" p={4}>
              <Text fontSize="9px" color="#2cb67d" mb={2}>MODEL ANSWER</Text>
              <Text fontSize="sm" color={colors.textPrimary} lineHeight="1.6">{term.definition}</Text>
            </Box>
          </Flex>
          <SelfGradeButtons value={termGrades[term.id] ?? null} onChange={v => setTermGrades(prev => ({ ...prev, [term.id]: v }))} />
          <Box
            as="button"
            onClick={advancePart1Grade}
            w="100%" mt={6}
            bg={termGrades[term.id] ? colors.accent : colors.border}
            color={colors.pageBg} border="none" borderRadius="lg" py={4}
            fontSize="md" fontWeight="800"
            cursor={termGrades[term.id] ? 'pointer' : 'not-allowed'}
            _hover={termGrades[term.id] ? { bg: colors.accentSoft } : {}}
          >
            {gradeTermIdx + 1 < gradingTerms.length ? 'Next Term →' : scoreQs.length > 0 ? 'Start Part II →' : 'See Results →'}
          </Box>
        </Box>
      </PageContainer>
    )
  }

  // ── Part II Writing ───────────────────────────────────────────────────────
  if (phase === 'part2-writing') {
    const { score, question } = scoreQs[scoreWritingIdx]
    return (
      <PageContainer>
        <Flex borderBottom={`1px solid ${colors.border}`} px={8} py={3} align="center">
          <Text fontSize="sm" fontWeight="700" color={colors.textPrimary}>🏆 Part II — Score Analysis {scoreWritingIdx + 1}/{scoreQs.length}</Text>
        </Flex>
        <Box p={{ base: 4, md: 6 }} overflowY="auto">
          <PdfViewer pdfPath={score.pdfPath} page={scorePages[scoreWritingIdx]} />
          <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={2} mt={4}>Analysis Question</Text>
          <Text fontSize="sm" color={colors.textPrimary} mb={3}>{question.prompt}</Text>
          <textarea
            value={scoreAnswers[scoreWritingIdx]}
            onChange={e => setScoreAnswers(prev => prev.map((a, i) => i === scoreWritingIdx ? e.target.value : a))}
            placeholder="Write your analysis…"
            style={{
              width: '100%', minHeight: '130px',
              background: colors.surface, border: `1px solid ${colors.border}`,
              borderRadius: '8px', color: colors.textPrimary,
              fontFamily: 'monospace', fontSize: '13px',
              padding: '12px', resize: 'vertical', outline: 'none', boxSizing: 'border-box',
            }}
          />
          <Box as="button" onClick={advanceScoreWriting} w="100%" mt={5} bg={colors.accent} color={colors.pageBg} border="none" borderRadius="lg" py={4} fontSize="md" fontWeight="800" cursor="pointer" _hover={{ bg: colors.accentSoft }}>
            {scoreWritingIdx + 1 < scoreQs.length ? 'Next Question →' : 'Grade Part II →'}
          </Box>
        </Box>
      </PageContainer>
    )
  }

  // ── Part II Grading ───────────────────────────────────────────────────────
  if (phase === 'part2-grading') {
    const { score, question } = scoreQs[scoreGradingIdx]
    return (
      <PageContainer>
        <Flex borderBottom={`1px solid ${colors.border}`} px={8} py={3} align="center">
          <Text fontSize="sm" fontWeight="700" color={colors.textPrimary}>🏆 Part II — Grade {scoreGradingIdx + 1}/{scoreQs.length}</Text>
        </Flex>
        <Box maxW="800px" mx="auto" p={{ base: 4, md: 8 }}>
          <Text fontSize="sm" color={colors.textPrimary} mb={4} fontWeight="700">{question.prompt}</Text>
          <Flex gap={4} mb={4} direction={{ base: 'column', md: 'row' }}>
            <Box flex={1} bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="xl" p={4}>
              <Text fontSize="9px" color={colors.textMuted} mb={1}>YOUR ANSWER</Text>
              <Text fontSize="sm" color={colors.textPrimary} whiteSpace="pre-wrap">{scoreAnswers[scoreGradingIdx] || '(no answer)'}</Text>
            </Box>
            <Box flex={1} bg="#0d1a0d" border="1px solid #1a3a1a" borderRadius="xl" p={4}>
              <Text fontSize="9px" color="#2cb67d" mb={1}>MODEL ANSWER</Text>
              <Text fontSize="sm" color={colors.textPrimary} lineHeight="1.6">{question.modelAnswer}</Text>
            </Box>
          </Flex>
          <Text fontSize="9px" color={colors.textMuted} mb={2}>Score: {score.composer} — {score.title}</Text>
          <SelfGradeButtons
            value={scoreGrades[scoreGradingIdx]}
            onChange={v => setScoreGrades(prev => prev.map((g, i) => i === scoreGradingIdx ? v : g))}
          />
          <Box
            as="button"
            onClick={advanceScoreGrading}
            w="100%" mt={6}
            bg={scoreGrades[scoreGradingIdx] ? colors.accent : colors.border}
            color={colors.pageBg} border="none" borderRadius="lg" py={4}
            fontSize="md" fontWeight="800"
            cursor={scoreGrades[scoreGradingIdx] ? 'pointer' : 'not-allowed'}
            _hover={scoreGrades[scoreGradingIdx] ? { bg: colors.accentSoft } : {}}
          >
            {scoreGradingIdx + 1 < scoreQs.length ? 'Next Question →' : 'See Results →'}
          </Box>
        </Box>
      </PageContainer>
    )
  }

  // ── Results ───────────────────────────────────────────────────────────────
  const p1Total = gradingTerms.reduce((s, t) => s + (termGrades[t.id] ?? 0), 0)
  const p1Max = gradingTerms.length * 3
  const p2Total = scoreGrades.reduce((s, g) => s + (g ?? 0), 0)
  const p2Max = scoreQs.length * 3

  const catStats: Record<string, { correct: number; max: number }> = {}
  for (const t of gradingTerms) {
    catStats[t.category] = catStats[t.category] ?? { correct: 0, max: 0 }
    catStats[t.category].correct += termGrades[t.id] ?? 0
    catStats[t.category].max += 3
  }
  const sortedCats = Object.entries(catStats).sort(
    (a, b) => (a[1].correct / a[1].max) - (b[1].correct / b[1].max)
  )
  const weakest = sortedCats[0]

  return (
    <PageContainer>
      <Box maxW="640px" mx="auto" px={6} py={10}>
        <Text fontSize="3xl" textAlign="center" mb={4}>🏆</Text>
        <Text fontSize="xl" fontWeight="800" color={colors.textPrimary} textAlign="center" mb={6}>Full Deck Complete</Text>

        <Flex gap={4} mb={6}>
          <Box bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="xl" p={5} flex={1} textAlign="center">
            <Text fontSize="2xl" fontWeight="800" color={colors.accent}>{p1Total}/{p1Max}</Text>
            <Text fontSize="xs" color={colors.textMuted} mt={1}>Part I — Terms</Text>
          </Box>
          {scoreQs.length > 0 && (
            <Box bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="xl" p={5} flex={1} textAlign="center">
              <Text fontSize="2xl" fontWeight="800" color={colors.accent}>{p2Total}/{p2Max}</Text>
              <Text fontSize="xs" color={colors.textMuted} mt={1}>Part II — Scores</Text>
            </Box>
          )}
        </Flex>

        {sortedCats.length > 0 && (
          <Box bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="xl" p={5} mb={4}>
            <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={3}>By Category</Text>
            <VStack gap={3} align="stretch">
              {sortedCats.map(([cat, s]) => {
                const pct = s.max === 0 ? 0 : s.correct / s.max
                return (
                  <Box key={cat}>
                    <Flex justify="space-between" mb={1}>
                      <Text fontSize="xs" color={colors.textMuted}>{cat}</Text>
                      <Text fontSize="xs" color={colors.textPrimary} fontWeight="700">{s.correct}/{s.max}</Text>
                    </Flex>
                    <Box h="4px" bg={colors.border} borderRadius="full" overflow="hidden">
                      <Box h="100%" w={`${pct * 100}%`} bg={BAR_COLOR(pct)} borderRadius="full" />
                    </Box>
                  </Box>
                )
              })}
            </VStack>
          </Box>
        )}

        {weakest && (
          <Box bg={colors.surface} border="1px solid #ff6b6b40" borderRadius="xl" p={4} mb={6}>
            <Text fontSize="xs" color="#ff6b6b" fontWeight="700">
              Focus area: {weakest[0]} ({weakest[1].correct}/{weakest[1].max})
            </Text>
          </Box>
        )}

        <Flex gap={3}>
          <Box as="button" onClick={() => navigate(0)} flex={1} bg="transparent" border={`1px solid ${colors.border}`} borderRadius="lg" py={3} fontSize="sm" color={colors.textMuted} cursor="pointer">Try Again</Box>
          <Box as="button" onClick={() => navigate('/study/exam')} flex={1} bg={colors.accent} color={colors.pageBg} border="none" borderRadius="lg" py={3} fontSize="sm" fontWeight="700" cursor="pointer">Back to Exam Prep</Box>
        </Flex>
      </Box>
    </PageContainer>
  )
}

export default ComprehensiveQuiz
