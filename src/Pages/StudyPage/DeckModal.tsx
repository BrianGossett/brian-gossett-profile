// src/Pages/StudyPage/DeckModal.tsx
import { useState, useRef, useEffect } from 'react'
import { Box, Flex, Text, Input, VStack } from '@chakra-ui/react'
import { colors } from '../../Theme'
import type { Deck } from '../../hooks/useDecks'
import type { Term } from '../../data/terms'

interface TermRow {
  term: string
  definition: string
  category: string
}

interface DeckModalProps {
  initialDeck: Deck | null
  onSave: (name: string, terms: Term[]) => void
  onClose: () => void
}

const DeckModal = ({ initialDeck, onSave, onClose }: DeckModalProps) => {
  const [deckName, setDeckName] = useState(initialDeck?.name ?? '')
  const [rows, setRows] = useState<TermRow[]>(
    initialDeck?.terms.map(t => ({ term: t.term, definition: t.definition, category: t.category })) ?? [
      { term: '', definition: '', category: 'General' },
    ]
  )
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  function addRow() {
    setRows(prev => [...prev, { term: '', definition: '', category: prev[prev.length - 1]?.category ?? 'General' }])
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  function updateRow(index: number, field: keyof TermRow, value: string) {
    setRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r))
  }

  function removeRow(index: number) {
    setRows(prev => prev.filter((_, i) => i !== index))
  }

  function handleSave() {
    if (!deckName.trim()) { setError('Deck name is required.'); return }
    const valid = rows.filter(r => r.term.trim() && r.definition.trim())
    if (valid.length === 0) { setError('Add at least one term with a definition.'); return }
    const terms: Term[] = valid.map((r, i) => ({
      id: i + 1,
      term: r.term.trim(),
      definition: r.definition.trim(),
      category: r.category.trim() || 'General',
    }))
    onSave(deckName.trim(), terms)
  }

  return (
    /* Overlay */
    <Box
      position="fixed"
      inset={0}
      bg="rgba(0,0,0,0.7)"
      zIndex={500}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Modal */}
      <Box
        bg={colors.surface}
        border={`1px solid ${colors.accentDim}`}
        borderRadius="2xl"
        w="100%"
        maxW="680px"
        maxH="90vh"
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        {/* Header */}
        <Flex align="center" justify="space-between" px={6} py={4} borderBottom={`1px solid ${colors.border}`}>
          <Text fontWeight="800" fontSize="md" color={colors.textPrimary}>
            {initialDeck ? 'Edit Deck' : 'New Deck'}
          </Text>
          <Box as="button" onClick={onClose} bg="none" border="none" cursor="pointer" color={colors.textMuted} fontSize="lg" _hover={{ color: colors.accent }}>✕</Box>
        </Flex>

        {/* Body */}
        <Box flex={1} overflowY="auto" px={6} py={4}>
          {/* Deck name */}
          <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.accent} fontWeight="700" mb={2}>Deck Name</Text>
          <Input
            value={deckName}
            onChange={e => setDeckName(e.target.value)}
            placeholder="e.g. Spanish Vocab"
            bg={colors.pageBg}
            border={`1px solid ${colors.border}`}
            borderRadius="lg"
            color={colors.textPrimary}
            mb={6}
            _focus={{ borderColor: colors.accent }}
            _placeholder={{ color: colors.textMuted }}
          />

          {/* Term rows */}
          <Flex gap={2} mb={2}>
            <Text flex="1" fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.textMuted} fontWeight="700">Term</Text>
            <Text flex="2" fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.textMuted} fontWeight="700">Definition</Text>
            <Text w="80px" fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={colors.textMuted} fontWeight="700">Category</Text>
            <Box w="28px" />
          </Flex>

          <VStack align="stretch" gap={2} mb={3}>
            {rows.map((row, i) => (
              <Flex key={i} gap={2} align="center">
                <Input
                  flex="1"
                  value={row.term}
                  onChange={e => updateRow(i, 'term', e.target.value)}
                  placeholder="Term"
                  bg={colors.pageBg}
                  border={`1px solid ${colors.border}`}
                  borderRadius="md"
                  color={colors.textPrimary}
                  fontSize="sm"
                  size="sm"
                  _focus={{ borderColor: colors.accent }}
                  _placeholder={{ color: colors.textMuted }}
                />
                <Input
                  flex="2"
                  value={row.definition}
                  onChange={e => updateRow(i, 'definition', e.target.value)}
                  placeholder="Definition"
                  bg={colors.pageBg}
                  border={`1px solid ${colors.border}`}
                  borderRadius="md"
                  color={colors.textPrimary}
                  fontSize="sm"
                  size="sm"
                  _focus={{ borderColor: colors.accent }}
                  _placeholder={{ color: colors.textMuted }}
                />
                <Input
                  w="80px"
                  value={row.category}
                  onChange={e => updateRow(i, 'category', e.target.value)}
                  placeholder="General"
                  bg={colors.pageBg}
                  border={`1px solid ${colors.border}`}
                  borderRadius="md"
                  color={colors.textPrimary}
                  fontSize="sm"
                  size="sm"
                  _focus={{ borderColor: colors.accent }}
                  _placeholder={{ color: colors.textMuted }}
                />
                <Box
                  as="button"
                  onClick={() => removeRow(i)}
                  w="28px"
                  color="#ff6b6b"
                  bg="none"
                  border="none"
                  cursor="pointer"
                  fontSize="sm"
                  flexShrink={0}
                  _hover={{ color: '#ff4444' }}
                >
                  ✕
                </Box>
              </Flex>
            ))}
          </VStack>

          <Box
            as="button"
            onClick={addRow}
            w="100%"
            border={`1px dashed ${colors.border}`}
            borderRadius="lg"
            py={2}
            color={colors.accent}
            bg="transparent"
            fontSize="sm"
            cursor="pointer"
            _hover={{ borderColor: colors.accent }}
          >
            + Add Term
          </Box>
          <div ref={bottomRef} />
        </Box>

        {/* Footer */}
        <Flex align="center" gap={3} px={6} py={4} borderTop={`1px solid ${colors.border}`} flexDirection="column">
          {error && <Text fontSize="xs" color="#ff6b6b" w="100%">{error}</Text>}
          <Flex gap={3} w="100%">
            <Box
              as="button"
              onClick={onClose}
              flex={1}
              bg={colors.surface}
              border={`1px solid ${colors.border}`}
              borderRadius="lg"
              py={3}
              fontSize="sm"
              color={colors.textMuted}
              cursor="pointer"
              _hover={{ borderColor: colors.accent }}
            >
              Cancel
            </Box>
            <Box
              as="button"
              onClick={handleSave}
              flex={2}
              bg={colors.accent}
              color={colors.pageBg}
              border="none"
              borderRadius="lg"
              py={3}
              fontSize="sm"
              fontWeight="800"
              cursor="pointer"
              _hover={{ bg: colors.accentSoft }}
            >
              {initialDeck ? 'Save Changes' : 'Create Deck'}
            </Box>
          </Flex>
        </Flex>
      </Box>
    </Box>
  )
}

export default DeckModal
