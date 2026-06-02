import { useState, useEffect, useRef } from 'react'
import { Box, Flex, Text, Wrap, WrapItem, VStack } from '@chakra-ui/react'
import { useNavigate } from 'react-router'
import PageContainer from '../../Components/Container'
import { colors } from '../../Theme'
import { useDecks, useDeckById, getDeckCategories, filterByCategory, type Deck } from '../../hooks/useDecks'
import { useStudySession } from '../../hooks/useStudySession'
import { decodeShareLink, encodeShareLink } from '../../utils/shareLink'
import DeckModal from './DeckModal'

const MODES = [
  { key: 'flashcards', icon: '🃏', name: 'Flashcards',      desc: 'Flip & mark. Tracks mastered terms.' },
  { key: 'quiz',       icon: '🎯', name: 'Multiple Choice', desc: '4 options per question.' },
  { key: 'type',       icon: '🔤', name: 'Type the Term',   desc: 'See the definition, type the term.' },
  { key: 'match',      icon: '🔗', name: 'Matching',        desc: 'Match terms to definitions.' },
] as const

type ModeKey = typeof MODES[number]['key']

const StudyHub = () => {
  const navigate = useNavigate()
  const { customDecks, createDeck, updateDeck, deleteDeck } = useDecks()
  const { session, setLastMode, setLastCategory, setLastDeckId, setTermCount, resetSession } = useStudySession()

  const selectedDeckId = session.lastDeckId ?? 'default'
  const selectedDeck = useDeckById(selectedDeckId)
  const selectedMode = (session.lastMode ?? 'flashcards') as ModeKey
  const selectedCat = session.lastCategory ?? 'all'

  const deckCategories = getDeckCategories(selectedDeck.terms)
  const filteredTerms = filterByCategory(selectedDeck.terms, selectedCat)
  const termCount = session.termCounts[selectedMode as keyof typeof session.termCounts] ?? 20

  const [modalState, setModalState] = useState<{ open: boolean; deck: Deck | null }>({ open: false, deck: null })
  const [importError, setImportError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [sharePrompt, setSharePrompt] = useState<{ name: string; terms: Deck['terms'] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Detect incoming share link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const encoded = params.get('deck')
    if (encoded) {
      const decoded = decodeShareLink(encoded)
      if (decoded) setSharePrompt(decoded)
      const clean = new URL(window.location.href)
      clean.searchParams.delete('deck')
      window.history.replaceState({}, '', clean.toString())
    }
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function handleStart() {
    navigate(`/study/${selectedDeckId}/${selectedMode}`)
  }

  function handleSelectDeck(id: string) {
    setLastDeckId(id)
    setLastCategory('all')
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const obj = JSON.parse(ev.target?.result as string)
        if (typeof obj?.name !== 'string' || !Array.isArray(obj?.terms)) {
          setImportError('Invalid file: missing name or terms.')
          return
        }
        const terms = (obj.terms as Deck['terms']).map((t, i) => ({
          id: i + 1,
          category: typeof t.category === 'string' ? t.category : 'General',
          term: t.term,
          definition: t.definition,
        }))
        const deck = createDeck(obj.name, terms)
        setLastDeckId(deck.id)
        setImportError(null)
        showToast('Deck imported!')
      } catch {
        setImportError('Could not parse file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify({ name: selectedDeck.name, terms: selectedDeck.terms }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedDeck.name.replace(/\s+/g, '-').toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleShareLink() {
    const param = encodeShareLink(selectedDeck)
    const url = `${window.location.origin}${window.location.pathname}?deck=${param}`
    navigator.clipboard.writeText(url).then(() => showToast('Link copied!')).catch(() => showToast('Copy failed'))
  }

  function handleAcceptShare() {
    if (!sharePrompt) return
    const terms = sharePrompt.terms.map((t, i) => ({
      id: i + 1,
      category: typeof t.category === 'string' ? t.category : 'General',
      term: t.term,
      definition: t.definition,
    }))
    const deck = createDeck(sharePrompt.name, terms)
    setLastDeckId(deck.id)
    setSharePrompt(null)
    showToast('Deck added!')
  }

  const needsCount = selectedMode === 'quiz' || selectedMode === 'type' || selectedMode === 'match'
  const maxCount = filteredTerms.length
  const clampedCount = Math.min(Math.max(4, termCount), Math.max(4, maxCount))

  const allDecks: Array<{ id: string; name: string; termCount: number }> = [
    { id: 'default', name: 'Music Theory', termCount: selectedDeckId === 'default' ? selectedDeck.terms.length : 0 },
    ...customDecks.map(d => ({ id: d.id, name: d.name, termCount: d.terms.length })),
  ]

  return (
    <PageContainer>
      {/* Share prompt banner */}
      {sharePrompt && (
        <Box bg={colors.deepBlue} border={`1px solid ${colors.accent}`} px={6} py={3} display="flex" alignItems="center" gap={4} flexWrap="wrap">
          <Text fontSize="sm" color={colors.textPrimary}>
            Someone shared <Text as="span" fontWeight="700">"{sharePrompt.name}"</Text> with you ({sharePrompt.terms.length} terms) — add to my decks?
          </Text>
          <Flex gap={2}>
            <Box as="button" onClick={handleAcceptShare} bg={colors.accent} color={colors.pageBg} border="none" borderRadius="md" px={3} py={1} fontSize="sm" fontWeight="700" cursor="pointer">Add</Box>
            <Box as="button" onClick={() => setSharePrompt(null)} bg="none" border={`1px solid ${colors.border}`} borderRadius="md" px={3} py={1} fontSize="sm" color={colors.textMuted} cursor="pointer">Dismiss</Box>
          </Flex>
        </Box>
      )}

      {/* Toast */}
      {toast && (
        <Box position="fixed" bottom={6} left="50%" transform="translateX(-50%)" bg={colors.accent} color={colors.pageBg} px={5} py={2} borderRadius="full" fontSize="sm" fontWeight="700" zIndex={1000} pointerEvents="none">
          {toast}
        </Box>
      )}

      {/* Page header */}
      <Box borderBottom={`1px solid ${colors.border}`} px={8} py={4}>
        <Text fontSize="xl" fontWeight="800" color={colors.textPrimary}>Study</Text>
        <Text fontSize="xs" color={colors.textMuted}>{allDecks.length} {allDecks.length === 1 ? 'deck' : 'decks'} · select one to start</Text>
      </Box>

      <Flex flex={1} direction={{ base: 'column', md: 'row' }} overflow="hidden">
        {/* Sidebar */}
        <Box
          w={{ base: '100%', md: '200px' }}
          borderRight={{ base: 'none', md: `1px solid ${colors.border}` }}
          borderBottom={{ base: `1px solid ${colors.border}`, md: 'none' }}
          p={4}
          flexShrink={0}
          overflowY="auto"
        >
          <Text fontSize="9px" textTransform="uppercase" letterSpacing="widest" color={colors.textMuted} mb={3} fontWeight="700">My Decks</Text>

          <VStack align="stretch" gap={2} mb={4}>
            {allDecks.map(d => (
              <Box
                key={d.id}
                as="button"
                onClick={() => handleSelectDeck(d.id)}
                bg={selectedDeckId === d.id ? colors.deepBlue : 'transparent'}
                border={`1px solid ${selectedDeckId === d.id ? colors.accent : colors.border}`}
                borderRadius="lg"
                p={3}
                textAlign="left"
                cursor="pointer"
                _hover={{ borderColor: colors.accentSoft }}
              >
                <Text fontSize="xs" fontWeight="700" color={colors.textPrimary}>
                  {d.id === 'default' ? '🎵' : '📚'} {d.name}
                </Text>
                {d.id === 'default'
                  ? <Text fontSize="9px" color={colors.accent}>Default</Text>
                  : <Text fontSize="9px" color={colors.textMuted}>{d.termCount} terms</Text>
                }
              </Box>
            ))}
          </VStack>

          <Box
            as="button"
            onClick={() => setModalState({ open: true, deck: null })}
            w="100%"
            border={`1px dashed ${colors.border}`}
            borderRadius="lg"
            p={3}
            mb={2}
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={2}
            cursor="pointer"
            color={colors.accent}
            bg="transparent"
            _hover={{ borderColor: colors.accent }}
          >
            <Text fontSize="lg" lineHeight={1}>+</Text>
            <Text fontSize="xs">New Deck</Text>
          </Box>

          <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />
          <Box
            as="button"
            onClick={() => { setImportError(null); fileInputRef.current?.click() }}
            w="100%"
            border={`1px solid ${colors.border}`}
            borderRadius="lg"
            p={2}
            cursor="pointer"
            color={colors.textMuted}
            bg="transparent"
            fontSize="xs"
            textAlign="center"
            _hover={{ color: colors.accent, borderColor: colors.accent }}
          >
            Import JSON
          </Box>
          {importError && <Text fontSize="9px" color="#ff6b6b" mt={1}>{importError}</Text>}
        </Box>

        {/* Detail panel */}
        <Box flex={1} p={{ base: 4, md: 8 }} overflowY="auto">
          <Flex align="center" gap={3} mb={1} flexWrap="wrap">
            <Text fontSize="lg" fontWeight="800" color={colors.textPrimary}>
              {selectedDeckId === 'default' ? '🎵 Music Theory' : `📚 ${selectedDeck.name}`}
            </Text>
            {selectedDeckId === 'default' && (
              <Box bg={colors.accentDim} border={`1px solid ${colors.accentDim}`} borderRadius="full" px={2} py="1px" fontSize="9px" color={colors.accent}>Default</Box>
            )}
            {selectedDeckId !== 'default' && (
              <Flex gap={2} ml="auto">
                <Box as="button" onClick={() => setModalState({ open: true, deck: selectedDeck })} title="Edit deck" bg="none" border={`1px solid ${colors.border}`} borderRadius="md" px={2} py={1} fontSize="sm" color={colors.textMuted} cursor="pointer" _hover={{ color: colors.accent }}>✏</Box>
                <Box as="button" onClick={handleExport} title="Download JSON" bg="none" border={`1px solid ${colors.border}`} borderRadius="md" px={2} py={1} fontSize="sm" color={colors.textMuted} cursor="pointer" _hover={{ color: colors.accent }}>↓</Box>
                <Box as="button" onClick={handleShareLink} title="Copy share link" bg="none" border={`1px solid ${colors.border}`} borderRadius="md" px={2} py={1} fontSize="sm" color={colors.textMuted} cursor="pointer" _hover={{ color: colors.accent }}>🔗</Box>
                <Box
                  as="button"
                  onClick={() => { deleteDeck(selectedDeckId); setLastDeckId('default') }}
                  title="Delete deck"
                  bg="none"
                  border={`1px solid ${colors.border}`}
                  borderRadius="md"
                  px={2}
                  py={1}
                  fontSize="sm"
                  color="#ff6b6b"
                  cursor="pointer"
                  _hover={{ bg: '#ff6b6b20' }}
                >
                  🗑
                </Box>
              </Flex>
            )}
          </Flex>
          <Text fontSize="xs" color={colors.textMuted} mb={6}>
            {selectedDeck.terms.length} terms · {deckCategories.length} {deckCategories.length === 1 ? 'category' : 'categories'}
          </Text>

          {/* Session stats */}
          {(session.mastered.length > 0 || session.missed.length > 0) && (
            <Flex bg={colors.surface} border={`1px solid ${colors.accentDim}`} borderRadius="xl" p={4} mb={6} align="center" gap={5} flexWrap="wrap">
              <StatItem value={session.mastered.length} label="Mastered" color={colors.accent} />
              <Box w="1px" h="28px" bg={colors.border} />
              <StatItem value={session.missed.length} label="Missed" color="#ff6b6b" />
              <Box w="1px" h="28px" bg={colors.border} />
              <StatItem value={`${session.streak}🔥`} label="Streak" color="#ffd93d" />
              <Box as="button" ml="auto" onClick={resetSession} fontSize="xs" color={colors.textMuted} cursor="pointer" textDecoration="underline" background="none" border="none" _hover={{ color: colors.accent }}>Reset</Box>
            </Flex>
          )}

          {/* Category filter */}
          <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={2}>Category</Text>
          <Wrap gap={2} mb={6}>
            <WrapItem>
              <CategoryPill label={`All (${selectedDeck.terms.length})`} active={selectedCat === 'all'} onClick={() => setLastCategory('all')} />
            </WrapItem>
            {deckCategories.map(cat => (
              <WrapItem key={cat}>
                <CategoryPill
                  label={`${cat} (${selectedDeck.terms.filter(t => t.category === cat).length})`}
                  active={selectedCat === cat}
                  onClick={() => setLastCategory(cat)}
                />
              </WrapItem>
            ))}
          </Wrap>

          {/* Mode cards */}
          <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={2}>Mode</Text>
          <Flex gap={3} mb={6} flexWrap="wrap">
            {MODES.map(mode => (
              <ModeCard
                key={mode.key}
                mode={mode}
                selected={selectedMode === mode.key}
                onClick={() => setLastMode(mode.key)}
              />
            ))}
          </Flex>

          {/* Term count stepper — quiz / type / match only */}
          {needsCount && maxCount >= 4 && (
            <Flex align="center" gap={3} mb={6}>
              <Text fontSize="xs" color={colors.textMuted}>How many terms?</Text>
              <Flex align="center" gap={2} bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="lg" px={3} py={1}>
                <Box
                  as="button"
                  onClick={() => setTermCount(selectedMode as 'quiz' | 'type' | 'match', Math.max(4, clampedCount - 1))}
                  bg="none" border="none" cursor="pointer" color={colors.textMuted} fontSize="lg" lineHeight={1}
                  _hover={{ color: colors.accent }}
                >−</Box>
                <Text fontSize="sm" fontWeight="700" color={colors.textPrimary} minW="28px" textAlign="center">{clampedCount}</Text>
                <Box
                  as="button"
                  onClick={() => setTermCount(selectedMode as 'quiz' | 'type' | 'match', Math.min(maxCount, clampedCount + 1))}
                  bg="none" border="none" cursor="pointer" color={colors.textMuted} fontSize="lg" lineHeight={1}
                  _hover={{ color: colors.accent }}
                >+</Box>
              </Flex>
              <Text fontSize="xs" color={colors.textMuted}>of {maxCount}</Text>
            </Flex>
          )}

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
          >
            Start {MODES.find(m => m.key === selectedMode)?.name} — {selectedCat === 'all' ? 'All Terms' : selectedCat}
          </Box>
        </Box>
      </Flex>

      {/* Deck modal */}
      {modalState.open && (
        <DeckModal
          initialDeck={modalState.deck}
          onSave={(name, terms) => {
            if (modalState.deck) {
              updateDeck(modalState.deck.id, name, terms)
            } else {
              const deck = createDeck(name, terms)
              setLastDeckId(deck.id)
            }
            setModalState({ open: false, deck: null })
          }}
          onClose={() => setModalState({ open: false, deck: null })}
        />
      )}
    </PageContainer>
  )
}

const StatItem = ({ value, label, color }: { value: string | number; label: string; color: string }) => (
  <Box>
    <Text fontSize="lg" fontWeight="800" color={color}>{value}</Text>
    <Text fontSize="xs" textTransform="uppercase" letterSpacing="wider" color={colors.textMuted}>{label}</Text>
  </Box>
)

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
  onClick: () => void
}

const ModeCard = ({ mode, selected, onClick }: ModeCardProps) => (
  <Box
    flex="1"
    minW="130px"
    bg={selected ? colors.deepBlue : colors.surface}
    border={`1px solid ${selected ? colors.accent : colors.border}`}
    borderRadius="xl"
    p={4}
    cursor="pointer"
    onClick={onClick}
    _hover={{ borderColor: colors.accent }}
  >
    <Text fontSize="xl" mb={1}>{mode.icon}</Text>
    <Text fontWeight="700" fontSize="xs" color={colors.textPrimary} mb={1}>{mode.name}</Text>
    <Text fontSize="9px" color={colors.textMuted} lineHeight="1.5">{mode.desc}</Text>
  </Box>
)

export default StudyHub
