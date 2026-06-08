import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Box, Flex, Text, VStack, Wrap, WrapItem } from '@chakra-ui/react'
import PageContainer from '../../Components/Container'
import { colors } from '../../Theme'
import { ALL_TERMS, getCategories } from '../../data/terms'
import { buildDrillQuestions, gradeFillBlank, type DrillQuestion } from './examUtils'

type DrillPhase = 'config' | 'drilling' | 'results'

interface DrillResult {
  question: DrillQuestion
  userAnswer: string
  correct: boolean
}

const COUNT_OPTIONS = [10, 20, 30, ALL_TERMS.length] as const

const AdvancedDrills = () => {
  const navigate = useNavigate()
  const allCategories = useMemo(() => getCategories(), [])

  const [phase, setPhase] = useState<DrillPhase>('config')
  const [count, setCount] = useState<number>(20)
  const [selectedCats, setSelectedCats] = useState<string[]>(allCategories)
  const [questions, setQuestions] = useState<DrillQuestion[]>([])
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<DrillResult[]>([])
  const [userInput, setUserInput] = useState('')
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)

  function start() {
    const pool = selectedCats.length === allCategories.length
      ? ALL_TERMS
      : ALL_TERMS.filter(t => selectedCats.includes(t.category))
    const qs = buildDrillQuestions(pool, count, allCategories)
    setQuestions(qs)
    setIndex(0)
    setResults([])
    setAnswered(false)
    setUserInput('')
    setSelectedOptionId(null)
    setSelectedCategory(null)
    setPhase('drilling')
  }

  function toggleCat(cat: string) {
    setSelectedCats(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  const q = questions[index]

  function submitAnswer(answer: string, id?: number, cat?: string) {
    if (answered || !q) return
    let correct = false
    if (q.type === 'extended-pool' && id !== undefined) {
      correct = id === q.term.id
      setSelectedOptionId(id)
    } else if (q.type === 'fill-blank') {
      correct = gradeFillBlank(answer, q.term)
    } else if (q.type === 'category-id' && cat !== undefined) {
      correct = cat === q.term.category
      setSelectedCategory(cat)
    }
    setResults(prev => [...prev, { question: q, userAnswer: answer, correct }])
    setAnswered(true)
  }

  function advance() {
    const next = index + 1
    if (next >= questions.length) {
      setPhase('results')
    } else {
      setIndex(next)
      setAnswered(false)
      setUserInput('')
      setSelectedOptionId(null)
      setSelectedCategory(null)
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (phase !== 'drilling' || !q) return
      if (answered && e.key === 'Enter') { advance(); return }
      if (!answered && q.type === 'fill-blank' && e.key === 'Enter') {
        submitAnswer(userInput)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, q, answered, userInput]) // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === 'config') {
    return (
      <PageContainer>
        <Box px={8} py={4} borderBottom={`1px solid ${colors.border}`}>
          <Box as="button" onClick={() => navigate('/study/exam')} fontSize="sm" color={colors.textMuted} background="none" border="none" cursor="pointer" _hover={{ color: colors.accent }} mb={2}>
            ← Back to Exam Prep
          </Box>
          <Text fontSize="xl" fontWeight="800" color={colors.textPrimary}>🔥 Advanced Drills</Text>
          <Text fontSize="xs" color={colors.textMuted}>6-option quiz · fill-in-blank · category identification</Text>
        </Box>
        <Box maxW="600px" mx="auto" p={{ base: 4, md: 8 }}>
          <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={3}>How many questions?</Text>
          <Flex gap={2} mb={6} flexWrap="wrap">
            {COUNT_OPTIONS.map(c => (
              <Box
                key={c}
                as="button"
                onClick={() => setCount(c)}
                px={4} py={2}
                fontSize="sm"
                fontWeight={count === c ? '700' : '400'}
                border={`1px solid ${count === c ? colors.accent : colors.border}`}
                bg={count === c ? colors.accentDim : 'transparent'}
                color={count === c ? colors.accent : colors.textMuted}
                borderRadius="lg"
                cursor="pointer"
              >
                {c === ALL_TERMS.length ? 'All' : c}
              </Box>
            ))}
          </Flex>

          <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={3}>Categories</Text>
          <Wrap gap={2} mb={8}>
            <WrapItem>
              <Box
                as="button"
                onClick={() => setSelectedCats(selectedCats.length === allCategories.length ? [] : allCategories)}
                px={3} py={1} fontSize="xs" borderRadius="full"
                border={`1px solid ${selectedCats.length === allCategories.length ? colors.accent : colors.border}`}
                bg={selectedCats.length === allCategories.length ? colors.accentDim : 'transparent'}
                color={selectedCats.length === allCategories.length ? colors.accent : colors.textMuted}
                cursor="pointer"
              >
                All
              </Box>
            </WrapItem>
            {allCategories.map(cat => (
              <WrapItem key={cat}>
                <Box
                  as="button"
                  onClick={() => toggleCat(cat)}
                  px={3} py={1} fontSize="xs" borderRadius="full"
                  border={`1px solid ${selectedCats.includes(cat) ? colors.accent : colors.border}`}
                  bg={selectedCats.includes(cat) ? colors.accentDim : 'transparent'}
                  color={selectedCats.includes(cat) ? colors.accent : colors.textMuted}
                  cursor="pointer"
                >
                  {cat}
                </Box>
              </WrapItem>
            ))}
          </Wrap>

          <Box
            as="button"
            onClick={start}
            w="100%"
            bg={selectedCats.length === 0 ? colors.border : colors.accent}
            color={colors.pageBg}
            border="none"
            borderRadius="lg"
            py={4}
            fontSize="md"
            fontWeight="800"
            cursor={selectedCats.length === 0 ? 'not-allowed' : 'pointer'}
            _hover={selectedCats.length > 0 ? { bg: colors.accentSoft } : {}}
          >
            Start Drills →
          </Box>
        </Box>
      </PageContainer>
    )
  }

  if (phase === 'results') {
    const correct = results.filter(r => r.correct).length
    const byType: Record<string, { correct: number; total: number }> = {}
    const byCat: Record<string, { correct: number; total: number }> = {}
    for (const r of results) {
      const type = r.question.type
      byType[type] = byType[type] ?? { correct: 0, total: 0 }
      byType[type].total++
      if (r.correct) byType[type].correct++
      const cat = r.question.term.category
      byCat[cat] = byCat[cat] ?? { correct: 0, total: 0 }
      byCat[cat].total++
      if (r.correct) byCat[cat].correct++
    }
    const weakest = Object.entries(byCat).sort(
      (a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total)
    )[0]
    const typeLabels: Record<string, string> = {
      'extended-pool': '6-Option Quiz',
      'fill-blank': 'Fill in the Blank',
      'category-id': 'Category ID',
    }

    return (
      <PageContainer>
        <Box maxW="600px" mx="auto" px={6} py={10} textAlign="center">
          <Text fontSize="3xl" mb={4}>🔥</Text>
          <Text fontSize="xl" fontWeight="800" color={colors.textPrimary} mb={2}>Drills Complete!</Text>
          <Text fontSize="sm" color={colors.textMuted} mb={1}>{correct} / {results.length} correct</Text>
          <Text fontSize="xs" color={colors.textMuted} mb={8}>{Math.round(correct / results.length * 100)}%</Text>

          <Box bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="xl" p={5} mb={4} textAlign="left">
            <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={3}>By Question Type</Text>
            {Object.entries(byType).map(([type, s]) => (
              <Flex key={type} justify="space-between" mb={1}>
                <Text fontSize="xs" color={colors.textMuted}>{typeLabels[type] ?? type}</Text>
                <Text fontSize="xs" color={colors.textPrimary} fontWeight="700">{s.correct}/{s.total}</Text>
              </Flex>
            ))}
          </Box>

          {weakest && (
            <Box bg={colors.surface} border="1px solid #ff6b6b40" borderRadius="xl" p={4} mb={6} textAlign="left">
              <Text fontSize="xs" color="#ff6b6b" fontWeight="700">
                Focus area: {weakest[0]} ({weakest[1].correct}/{weakest[1].total})
              </Text>
            </Box>
          )}

          <Flex gap={3}>
            <Box as="button" onClick={() => setPhase('config')} flex={1} bg="transparent" border={`1px solid ${colors.border}`} borderRadius="lg" py={3} fontSize="sm" color={colors.textMuted} cursor="pointer">Try Again</Box>
            <Box as="button" onClick={() => navigate('/study/exam')} flex={1} bg={colors.accent} color={colors.pageBg} border="none" borderRadius="lg" py={3} fontSize="sm" fontWeight="700" cursor="pointer">Back to Exam Prep</Box>
          </Flex>
        </Box>
      </PageContainer>
    )
  }

  if (!q) return null
  const progress = (index / questions.length) * 100
  const letters = ['A', 'B', 'C', 'D', 'E', 'F']
  const lastResult = results[results.length - 1]

  return (
    <PageContainer>
      <Box maxW="680px" mx="auto" px={6} py={8}>
        <Flex align="center" gap={3} mb={6}>
          <Box as="button" onClick={() => navigate('/study/exam')} fontSize="sm" color={colors.textMuted} background="none" border="none" cursor="pointer" _hover={{ color: colors.accent }}>← Back</Box>
          <Text fontSize="sm" fontWeight="700" color={colors.textPrimary}>🔥 Advanced Drills</Text>
          <Box ml="auto" fontSize="xs" color={colors.textMuted}>{index + 1} / {questions.length}</Box>
        </Flex>

        <Box h="6px" bg={colors.border} borderRadius="full" overflow="hidden" mb={4}>
          <Box h="100%" w={`${progress}%`} bg={colors.accent} borderRadius="full" />
        </Box>

        <Box
          display="inline-block"
          bg={colors.accentDim}
          borderRadius="full" px={3} py="2px"
          fontSize="9px" color={colors.accent} mb={4}
        >
          {q.type === 'extended-pool' ? '6-Option Quiz' : q.type === 'fill-blank' ? 'Fill in the Blank' : 'Category ID'}
        </Box>

        {/* Extended pool */}
        {q.type === 'extended-pool' && (
          <>
            <Box bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="xl" p={6} mb={4}>
              <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={3}>What is this term?</Text>
              <Text fontSize="md" color={colors.textPrimary} lineHeight="1.6">{q.term.definition}</Text>
            </Box>
            <VStack gap={2} mb={4}>
              {q.options!.map((opt, i) => {
                const isSelected = selectedOptionId === opt.id
                const isCorrect = opt.id === q.term.id
                let borderColor: string = colors.border, bg: string = colors.surface, textColor: string = colors.textMuted
                if (answered && isCorrect) { borderColor = '#2cb67d'; bg = '#0d2a1e'; textColor = colors.textPrimary }
                else if (answered && isSelected && !isCorrect) { borderColor = '#ff6b6b'; bg = '#2a0d0d'; textColor = colors.textPrimary }
                return (
                  <Box
                    key={opt.id}
                    as="button"
                    onClick={() => !answered && submitAnswer('', opt.id)}
                    w="100%"
                    bg={bg}
                    border={`1px solid ${borderColor}`}
                    borderRadius="lg"
                    p={3}
                    display="flex"
                    alignItems="center"
                    gap={3}
                    cursor={answered ? 'default' : 'pointer'}
                    textAlign="left"
                    _hover={!answered ? { borderColor: colors.accentSoft } : {}}
                  >
                    <Box
                      w="24px" h="24px" borderRadius="full"
                      border={`1px solid ${borderColor}`}
                      display="flex" alignItems="center" justifyContent="center"
                      fontSize="xs" fontWeight="700"
                      color={answered && (isCorrect || isSelected) ? borderColor : colors.textMuted}
                      flexShrink={0}
                    >
                      {answered && isCorrect ? '✓' : answered && isSelected ? '✕' : letters[i]}
                    </Box>
                    <Text fontSize="sm" color={textColor}>{opt.term}</Text>
                  </Box>
                )
              })}
            </VStack>
          </>
        )}

        {/* Fill in blank */}
        {q.type === 'fill-blank' && (
          <>
            <Box bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="xl" p={6} mb={4}>
              <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={3}>Fill in the blank</Text>
              <Text fontSize="md" color={colors.textPrimary} lineHeight="1.6">{q.blankedDef}</Text>
            </Box>
            <input
              type="text"
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              disabled={answered}
              placeholder="Type the term…"
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '8px',
                background: colors.surface,
                border: `1px solid ${answered ? (gradeFillBlank(userInput, q.term) ? '#2cb67d' : '#ff6b6b') : colors.border}`,
                color: colors.textPrimary, fontSize: '16px', outline: 'none',
                marginBottom: '16px', boxSizing: 'border-box',
              }}
            />
            {!answered && (
              <Box as="button" onClick={() => submitAnswer(userInput)} w="100%" bg={colors.accent} color={colors.pageBg} border="none" borderRadius="lg" py={3} fontSize="sm" fontWeight="700" cursor="pointer" mb={4}>
                Submit
              </Box>
            )}
          </>
        )}

        {/* Category ID */}
        {q.type === 'category-id' && (
          <>
            <Box bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="xl" p={6} mb={4}>
              <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={3}>Which category?</Text>
              <Text fontSize="2xl" fontWeight="800" color={colors.textPrimary}>{q.term.term}</Text>
            </Box>
            <Wrap gap={2} mb={4}>
              {q.allCategories!.map(cat => {
                const isSelected = selectedCategory === cat
                const isCorrect = cat === q.term.category
                let borderColor: string = colors.border, bg: string = 'transparent', textColor: string = colors.textMuted
                if (answered && isCorrect) { borderColor = '#2cb67d'; bg = '#0d2a1e'; textColor = colors.textPrimary }
                else if (answered && isSelected && !isCorrect) { borderColor = '#ff6b6b'; bg = '#2a0d0d'; textColor = colors.textPrimary }
                return (
                  <WrapItem key={cat}>
                    <Box
                      as="button"
                      onClick={() => !answered && submitAnswer(cat, undefined, cat)}
                      px={3} py={2} fontSize="xs" borderRadius="lg"
                      border={`1px solid ${borderColor}`}
                      bg={bg} color={textColor}
                      cursor={answered ? 'default' : 'pointer'}
                      _hover={!answered ? { borderColor: colors.accentSoft } : {}}
                    >
                      {cat}
                    </Box>
                  </WrapItem>
                )
              })}
            </Wrap>
          </>
        )}

        {/* Feedback */}
        {answered && lastResult && (
          <>
            <Box
              bg={lastResult.correct ? '#0d2a1e' : '#2a0d0d'}
              border={`1px solid ${lastResult.correct ? '#2cb67d40' : '#ff6b6b40'}`}
              borderRadius="lg" p={4} mb={4}
            >
              <Text fontSize="sm" color={colors.textMuted}>
                {lastResult.correct
                  ? <><Text as="span" color={colors.textPrimary} fontWeight="700">Correct!</Text>{' '}{q.term.definition.slice(0, 100)}…</>
                  : <><Text as="span" color={colors.textPrimary} fontWeight="700">Not quite.</Text>{' '}The answer is <Text as="span" color={colors.textPrimary} fontWeight="700">{q.term.term}</Text> ({q.term.category}).</>
                }
              </Text>
            </Box>
            <Box as="button" onClick={advance} w="100%" bg={colors.accent} color={colors.pageBg} border="none" borderRadius="lg" py={4} fontSize="md" fontWeight="800" cursor="pointer" _hover={{ bg: colors.accentSoft }}>
              {index + 1 < questions.length ? 'Next Question →' : 'See Results →'}
            </Box>
          </>
        )}

        <Text textAlign="center" fontSize="xs" color={colors.border} mt={3}>
          {q.type === 'fill-blank' ? 'Enter to submit · Enter to advance' : 'Enter to advance'}
        </Text>
      </Box>
    </PageContainer>
  )
}

export default AdvancedDrills
