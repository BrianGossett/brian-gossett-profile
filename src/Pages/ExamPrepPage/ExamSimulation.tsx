import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Box, Flex, Text, VStack } from '@chakra-ui/react'
import PageContainer from '../../Components/Container'
import { colors } from '../../Theme'
import { ALL_TERMS, type Term } from '../../data/terms'
import { ALL_SCORES, type ScoreExcerpt } from '../../data/scores'
import { selectTermsForExam } from './examUtils'
import SelfGradeButtons from './shared/SelfGradeButtons'
import PdfViewer from './shared/PdfViewer'
import TermSidebar from './shared/TermSidebar'
import { useCountdown } from './shared/useCountdown'

type SimPhase =
  | 'config'
  | 'part1-writing'
  | 'part1-grading'
  | 'part2-writing'
  | 'part2-grading'
  | 'results'

const TIMER_OPTIONS: { label: string; minutes: number | null }[] = [
  { label: 'No Timer', minutes: null },
  { label: '30 min', minutes: 30 },
  { label: '60 min', minutes: 60 },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const ExamSimulation = () => {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<SimPhase>('config')
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null)

  const [terms] = useState<Term[]>(() => selectTermsForExam(ALL_TERMS, 12, 6))
  const [skippedTermIds, setSkippedTermIds] = useState<Set<number>>(new Set())
  const [termAnswers, setTermAnswers] = useState<Record<number, string>>({})
  const [termGrades, setTermGrades] = useState<Record<number, 1 | 2 | 3 | null>>({})
  const [currentTermIdx, setCurrentTermIdx] = useState(0)
  const [gradeTermIdx, setGradeTermIdx] = useState(0)

  const [scores] = useState<ScoreExcerpt[]>(() => shuffle(ALL_SCORES).slice(0, 4))
  const [skippedScoreId, setSkippedScoreId] = useState<number | null>(null)
  const [scoreAnswers, setScoreAnswers] = useState<Record<number, string[]>>({})
  const [scoreGrades, setScoreGrades] = useState<Record<number, (1 | 2 | 3 | null)[]>>({})
  const [scoreWritingIdx, setScoreWritingIdx] = useState(0)
  const [scoreGradingIdx, setScoreGradingIdx] = useState(0)
  const [scoreRevealed, setScoreRevealed] = useState(false)

  const { formatted: timerDisplay, isExpired, isLow, start: startTimer } = useCountdown(
    timerMinutes !== null ? timerMinutes * 60 : null
  )

  const answeredTermIds = useMemo(
    () => new Set(Object.keys(termAnswers).map(Number).filter(id => termAnswers[id]?.trim())),
    [termAnswers]
  )

  const activeScores = useMemo(
    () => scores.filter(s => s.id !== skippedScoreId),
    [scores, skippedScoreId]
  )

  function toggleTermSkip(id: number) {
    setSkippedTermIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < 2) next.add(id)
      return next
    })
  }

  function beginPart1Grading() {
    setGradeTermIdx(0)
    setTermGrades({})
    setPhase('part1-grading')
  }

  const gradingTerms = useMemo(
    () => terms.filter(t => !skippedTermIds.has(t.id) && termAnswers[t.id]?.trim()),
    [terms, skippedTermIds, termAnswers]
  )

  function advancePart1Grade() {
    const next = gradeTermIdx + 1
    if (next >= gradingTerms.length) {
      initPart2Writing()
    } else {
      setGradeTermIdx(next)
    }
  }

  function initPart2Writing() {
    const init: Record<number, string[]> = {}
    for (const s of scores) init[s.id] = s.questions.map(() => '')
    setScoreAnswers(init)
    setSkippedScoreId(null)
    setScoreWritingIdx(0)
    setPhase(scores.length > 0 ? 'part2-writing' : 'results')
  }

  function advanceScoreWriting() {
    const next = scoreWritingIdx + 1
    if (next >= scores.length) {
      endPart2Writing()
    } else {
      setScoreWritingIdx(next)
    }
  }

  function endPart2Writing() {
    const init: Record<number, (1 | 2 | 3 | null)[]> = {}
    for (const s of activeScores) init[s.id] = s.questions.map(() => null)
    setScoreGrades(init)
    setScoreGradingIdx(0)
    setScoreRevealed(false)
    setPhase(activeScores.length > 0 ? 'part2-grading' : 'results')
  }

  function advanceScoreGrading() {
    const next = scoreGradingIdx + 1
    if (next >= activeScores.length) {
      setPhase('results')
    } else {
      setScoreGradingIdx(next)
      setScoreRevealed(false)
    }
  }

  useEffect(() => {
    if (isExpired) {
      if (phase === 'part1-writing') beginPart1Grading()
      else if (phase === 'part2-writing') endPart2Writing()
    }
  }, [isExpired]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Config ───────────────────────────────────────────────────────────────
  if (phase === 'config') {
    return (
      <PageContainer>
        <Box px={8} py={4} borderBottom={`1px solid ${colors.border}`}>
          <Box as="button" onClick={() => navigate('/study/exam')} fontSize="sm" color={colors.textMuted} background="none" border="none" cursor="pointer" _hover={{ color: colors.accent }} mb={2}>
            ← Back to Exam Prep
          </Box>
          <Text fontSize="xl" fontWeight="800" color={colors.textPrimary}>📝 Exam Simulation</Text>
          <Text fontSize="xs" color={colors.textMuted}>Part I: 12 terms, skip 2, write definitions. Part II: score analysis.</Text>
        </Box>
        <Box maxW="500px" mx="auto" p={{ base: 4, md: 8 }}>
          <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={3}>Timer</Text>
          <Flex gap={2} mb={8} flexWrap="wrap">
            {TIMER_OPTIONS.map(opt => (
              <Box
                key={opt.label}
                as="button"
                onClick={() => setTimerMinutes(opt.minutes)}
                px={4} py={2} fontSize="sm"
                fontWeight={timerMinutes === opt.minutes ? '700' : '400'}
                border={`1px solid ${timerMinutes === opt.minutes ? colors.accent : colors.border}`}
                bg={timerMinutes === opt.minutes ? colors.accentDim : 'transparent'}
                color={timerMinutes === opt.minutes ? colors.accent : colors.textMuted}
                borderRadius="lg" cursor="pointer"
              >
                {opt.label}
              </Box>
            ))}
          </Flex>
          <Box
            as="button"
            onClick={() => { if (timerMinutes !== null) startTimer(); setPhase('part1-writing') }}
            w="100%" bg={colors.accent} color={colors.pageBg} border="none" borderRadius="lg" py={4}
            fontSize="md" fontWeight="800" cursor="pointer" _hover={{ bg: colors.accentSoft }}
          >
            Start Exam →
          </Box>
        </Box>
      </PageContainer>
    )
  }

  // ─── Part I Writing ───────────────────────────────────────────────────────
  if (phase === 'part1-writing') {
    const currentTerm = terms[currentTermIdx]
    return (
      <PageContainer>
        <Flex borderBottom={`1px solid ${colors.border}`} px={8} py={3} align="center" gap={4}>
          <Text fontSize="sm" fontWeight="700" color={colors.textPrimary}>📝 Part I — Term Definitions</Text>
          {timerDisplay && (
            <Text ml="auto" fontSize="sm" fontWeight="800" color={isLow ? '#ff6b6b' : colors.textMuted} fontFamily="mono">
              {timerDisplay}
            </Text>
          )}
        </Flex>
        <Flex flex={1} overflow="hidden" direction={{ base: 'column', md: 'row' }}>
          <TermSidebar
            terms={terms}
            currentIndex={currentTermIdx}
            onSelect={setCurrentTermIdx}
            answeredIds={answeredTermIds}
            skippedIds={skippedTermIds}
            maxSkips={2}
            onToggleSkip={toggleTermSkip}
          />
          <Box flex={1} p={{ base: 4, md: 8 }} overflowY="auto">
            <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={1}>{currentTerm.category}</Text>
            <Text fontSize="2xl" fontWeight="800" color={colors.textPrimary} mb={6}>{currentTerm.term}</Text>
            {skippedTermIds.has(currentTerm.id) ? (
              <Box bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="xl" p={6} textAlign="center">
                <Text color={colors.textMuted} fontSize="sm">This term is marked as skip.</Text>
                <Box as="button" onClick={() => toggleTermSkip(currentTerm.id)} mt={3} fontSize="xs" color={colors.accent} background="none" border="none" cursor="pointer">Remove skip</Box>
              </Box>
            ) : (
              <textarea
                value={termAnswers[currentTerm.id] ?? ''}
                onChange={e => setTermAnswers(prev => ({ ...prev, [currentTerm.id]: e.target.value }))}
                placeholder="Define in 2–4 sentences…"
                style={{
                  width: '100%', minHeight: '180px',
                  background: colors.surface, border: `1px solid ${colors.border}`,
                  borderRadius: '8px', color: colors.textPrimary,
                  fontFamily: 'monospace', fontSize: '14px',
                  padding: '14px', resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                }}
              />
            )}
            <Box as="button" onClick={beginPart1Grading} w="100%" mt={6} bg={colors.accent} color={colors.pageBg} border="none" borderRadius="lg" py={4} fontSize="md" fontWeight="800" cursor="pointer" _hover={{ bg: colors.accentSoft }}>
              Submit Part I →
            </Box>
          </Box>
        </Flex>
      </PageContainer>
    )
  }

  // ─── Part I Grading ───────────────────────────────────────────────────────
  if (phase === 'part1-grading') {
    const term = gradingTerms[gradeTermIdx]
    if (!term) { initPart2Writing(); return null }
    const gradeTotal = Object.values(termGrades).reduce((s, v) => s + (v ?? 0), 0)
    return (
      <PageContainer>
        <Flex borderBottom={`1px solid ${colors.border}`} px={8} py={3} align="center" gap={4}>
          <Text fontSize="sm" fontWeight="700" color={colors.textPrimary}>📝 Part I — Self-Grade</Text>
          <Text ml="auto" fontSize="xs" color={colors.textMuted}>{gradeTermIdx + 1} / {gradingTerms.length} · Running total: {gradeTotal} / {gradingTerms.length * 3}</Text>
        </Flex>
        <Box maxW="800px" mx="auto" p={{ base: 4, md: 8 }}>
          <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={1}>{term.category}</Text>
          <Text fontSize="xl" fontWeight="800" color={colors.textPrimary} mb={5}>{term.term}</Text>
          <Flex gap={4} mb={6} direction={{ base: 'column', md: 'row' }}>
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
            w="100%" mt={6} bg={termGrades[term.id] ? colors.accent : colors.border}
            color={colors.pageBg} border="none" borderRadius="lg" py={4}
            fontSize="md" fontWeight="800"
            cursor={termGrades[term.id] ? 'pointer' : 'not-allowed'}
            _hover={termGrades[term.id] ? { bg: colors.accentSoft } : {}}
          >
            {gradeTermIdx + 1 < gradingTerms.length ? 'Next Term →' : 'Start Part II →'}
          </Box>
        </Box>
      </PageContainer>
    )
  }

  // ─── Part II Writing ──────────────────────────────────────────────────────
  if (phase === 'part2-writing') {
    const score = scores[scoreWritingIdx]
    if (!score) { endPart2Writing(); return null }
    const isOptional = scoreWritingIdx >= 2
    const isSkipped = score.id === skippedScoreId
    return (
      <PageContainer>
        <Flex borderBottom={`1px solid ${colors.border}`} px={8} py={3} align="center" gap={4} flexWrap="wrap">
          <Text fontSize="sm" fontWeight="700" color={colors.textPrimary}>🎼 Part II — Score {scoreWritingIdx + 1} of {scores.length}</Text>
          {isOptional && (
            <Box
              as="button"
              onClick={() => setSkippedScoreId(isSkipped ? null : score.id)}
              ml="auto"
              fontSize="xs"
              color={isSkipped ? '#ff6b6b' : colors.textMuted}
              background="none" border="none" cursor="pointer"
            >
              {isSkipped ? '+ Unskip' : '× Skip this score'}
            </Box>
          )}
          {timerDisplay && (
            <Text fontSize="sm" fontWeight="800" color={isLow ? '#ff6b6b' : colors.textMuted} fontFamily="mono">
              {timerDisplay}
            </Text>
          )}
        </Flex>
        <Box p={{ base: 4, md: 6 }} overflowY="auto">
          {isSkipped ? (
            <Box bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="xl" p={8} textAlign="center">
              <Text color={colors.textMuted} fontSize="sm">This score is skipped.</Text>
            </Box>
          ) : (
            <>
              <PdfViewer pdfPath={score.pdfPath} startPage={score.startPage} measures={score.measures} />
              <VStack gap={5} align="stretch" mt={4}>
                {score.questions.map((q, i) => (
                  <Box key={i}>
                    <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={2}>Question {i + 1}</Text>
                    <Text fontSize="sm" color={colors.textPrimary} mb={2}>{q.prompt}</Text>
                    <textarea
                      value={(scoreAnswers[score.id] ?? [])[i] ?? ''}
                      onChange={e => {
                        const arr = [...(scoreAnswers[score.id] ?? score.questions.map(() => ''))]
                        arr[i] = e.target.value
                        setScoreAnswers(prev => ({ ...prev, [score.id]: arr }))
                      }}
                      placeholder="Write your analysis…"
                      style={{
                        width: '100%', minHeight: '110px',
                        background: colors.surface, border: `1px solid ${colors.border}`,
                        borderRadius: '8px', color: colors.textPrimary,
                        fontFamily: 'monospace', fontSize: '13px',
                        padding: '12px', resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                  </Box>
                ))}
              </VStack>
            </>
          )}
          <Box as="button" onClick={advanceScoreWriting} w="100%" mt={6} bg={colors.accent} color={colors.pageBg} border="none" borderRadius="lg" py={4} fontSize="md" fontWeight="800" cursor="pointer" _hover={{ bg: colors.accentSoft }}>
            {scoreWritingIdx + 1 < scores.length ? 'Next Score →' : 'Submit Part II →'}
          </Box>
        </Box>
      </PageContainer>
    )
  }

  // ─── Part II Grading ──────────────────────────────────────────────────────
  if (phase === 'part2-grading') {
    const score = activeScores[scoreGradingIdx]
    if (!score) { setPhase('results'); return null }
    const grades = scoreGrades[score.id] ?? score.questions.map(() => null)
    const answers = scoreAnswers[score.id] ?? score.questions.map(() => '')
    return (
      <PageContainer>
        <Flex borderBottom={`1px solid ${colors.border}`} px={8} py={3} align="center">
          <Text fontSize="sm" fontWeight="700" color={colors.textPrimary}>🎼 Part II Grade — Score {scoreGradingIdx + 1} of {activeScores.length}</Text>
        </Flex>
        <Box maxW="800px" mx="auto" p={{ base: 4, md: 8 }}>
          <VStack gap={6} align="stretch">
            {score.questions.map((q, i) => (
              <Box key={i} bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="xl" p={5}>
                <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={2}>Question {i + 1}</Text>
                <Text fontSize="sm" color={colors.textPrimary} mb={3}>{q.prompt}</Text>
                <Flex gap={4} mb={3} direction={{ base: 'column', md: 'row' }}>
                  <Box flex={1} bg={colors.pageBg} border={`1px solid ${colors.border}`} borderRadius="lg" p={3}>
                    <Text fontSize="9px" color={colors.textMuted} mb={1}>YOUR ANSWER</Text>
                    <Text fontSize="sm" color={colors.textPrimary} whiteSpace="pre-wrap">{answers[i] || '(no answer)'}</Text>
                  </Box>
                  <Box flex={1} bg="#0d1a0d" border="1px solid #1a3a1a" borderRadius="lg" p={3}>
                    <Text fontSize="9px" color="#2cb67d" mb={1}>MODEL ANSWER</Text>
                    <Text fontSize="sm" color={colors.textPrimary} lineHeight="1.6">{q.modelAnswer}</Text>
                  </Box>
                </Flex>
                <SelfGradeButtons
                  value={grades[i]}
                  onChange={v => {
                    const next = [...grades] as (1 | 2 | 3 | null)[]
                    next[i] = v
                    setScoreGrades(prev => ({ ...prev, [score.id]: next }))
                  }}
                />
              </Box>
            ))}

            <Box bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="xl" p={5}>
              {!scoreRevealed ? (
                <Box as="button" onClick={() => setScoreRevealed(true)} w="100%" bg={colors.accentDim} border={`1px solid ${colors.accent}`} borderRadius="lg" py={3} fontSize="sm" fontWeight="700" color={colors.accent} cursor="pointer">
                  Reveal Composer &amp; Era →
                </Box>
              ) : (
                <Box>
                  <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={2}>Attribution</Text>
                  <Text fontWeight="800" color={colors.textPrimary} fontSize="lg">{score.composer}</Text>
                  <Text fontSize="sm" color={colors.textMuted}>{score.title}</Text>
                  <Text fontSize="sm" color={colors.textMuted}>{score.era} · {score.yearRange}</Text>
                </Box>
              )}
            </Box>

            <Box as="button" onClick={advanceScoreGrading} w="100%" bg={colors.accent} color={colors.pageBg} border="none" borderRadius="lg" py={4} fontSize="md" fontWeight="800" cursor="pointer" _hover={{ bg: colors.accentSoft }}>
              {scoreGradingIdx + 1 < activeScores.length ? 'Next Score →' : 'See Results →'}
            </Box>
          </VStack>
        </Box>
      </PageContainer>
    )
  }

  // ─── Results ──────────────────────────────────────────────────────────────
  const p1Total = gradingTerms.reduce((s, t) => s + (termGrades[t.id] ?? 0), 0)
  const p1Max = gradingTerms.length * 3
  const p2Total = activeScores.reduce((s, sc) => {
    const g = scoreGrades[sc.id] ?? []
    return s + g.reduce((ss, v) => ss + (v ?? 0), 0)
  }, 0)
  const p2Max = activeScores.reduce((s, sc) => s + sc.questions.length * 3, 0)

  return (
    <PageContainer>
      <Box maxW="600px" mx="auto" px={6} py={10} textAlign="center">
        <Text fontSize="3xl" mb={4}>📝</Text>
        <Text fontSize="xl" fontWeight="800" color={colors.textPrimary} mb={6}>Exam Complete</Text>

        <Flex gap={4} mb={6} justify="center">
          <Box bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="xl" p={5} flex={1}>
            <Text fontSize="2xl" fontWeight="800" color={colors.accent}>{p1Total}/{p1Max}</Text>
            <Text fontSize="xs" color={colors.textMuted} mt={1}>Part I — Terms</Text>
          </Box>
          <Box bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="xl" p={5} flex={1}>
            <Text fontSize="2xl" fontWeight="800" color={colors.accent}>{p2Total}/{p2Max}</Text>
            <Text fontSize="xs" color={colors.textMuted} mt={1}>Part II — Scores</Text>
          </Box>
        </Flex>

        {gradingTerms.length > 0 && (
          <Box bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="xl" p={5} mb={6} textAlign="left">
            <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={3}>Per Term</Text>
            {gradingTerms.map(t => (
              <Flex key={t.id} justify="space-between" mb={1}>
                <Text fontSize="xs" color={colors.textMuted}>{t.term}</Text>
                <Text fontSize="xs" color={colors.textPrimary} fontWeight="700">{termGrades[t.id] ?? 0}/3</Text>
              </Flex>
            ))}
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

export default ExamSimulation
