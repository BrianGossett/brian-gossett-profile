import { Box, Text, VStack } from '@chakra-ui/react'
import { colors } from '../../../Theme'
import { type Term } from '../../../data/terms'

interface Props {
  terms: Term[]
  currentIndex: number
  onSelect: (index: number) => void
  answeredIds: Set<number>
  skippedIds?: Set<number>
  maxSkips?: number
  onToggleSkip?: (id: number) => void
}

const TermSidebar = ({
  terms, currentIndex, onSelect,
  answeredIds, skippedIds = new Set(),
  maxSkips, onToggleSkip,
}: Props) => (
  <Box
    w={{ base: '100%', md: '180px' }}
    borderRight={{ base: 'none', md: `1px solid ${colors.border}` }}
    borderBottom={{ base: `1px solid ${colors.border}`, md: 'none' }}
    p={3}
    flexShrink={0}
    overflowY="auto"
  >
    <Text fontSize="9px" textTransform="uppercase" letterSpacing="widest" color={colors.textMuted} mb={2} fontWeight="700">
      Terms
    </Text>
    <VStack align="stretch" gap={1}>
      {terms.map((t, i) => {
        const isActive = i === currentIndex
        const isSkipped = skippedIds.has(t.id)
        const isAnswered = answeredIds.has(t.id)
        const canSkip = !!onToggleSkip && (maxSkips === undefined || skippedIds.size < maxSkips || isSkipped)

        return (
          <Box key={t.id}>
            <Box
              as="button"
              onClick={() => onSelect(i)}
              bg={isActive ? colors.deepBlue : 'transparent'}
              border={`1px solid ${isActive ? colors.accent : 'transparent'}`}
              borderRadius="md"
              p={2}
              textAlign="left"
              cursor="pointer"
              w="100%"
              opacity={isSkipped ? 0.4 : 1}
              _hover={{ borderColor: colors.border }}
            >
              <Text
                fontSize="9px"
                color={isAnswered ? colors.accent : colors.textMuted}
                fontWeight={isAnswered ? '700' : '400'}
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
              >
                {isAnswered ? '● ' : '○ '}{t.term}
              </Text>
            </Box>
            {canSkip && (
              <Text
                as="button"
                fontSize="9px"
                color={isSkipped ? '#ff6b6b' : colors.border}
                onClick={() => onToggleSkip!(t.id)}
                cursor="pointer"
                background="none"
                border="none"
                px={2}
                _hover={{ color: '#ff6b6b' }}
              >
                {isSkipped ? 'unskip' : 'skip'}
              </Text>
            )}
          </Box>
        )
      })}
    </VStack>
  </Box>
)

export default TermSidebar
