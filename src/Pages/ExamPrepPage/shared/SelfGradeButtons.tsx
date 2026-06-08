import { Flex, Box } from '@chakra-ui/react'
import { colors } from '../../../Theme'

const GRADES = [
  { value: 1 as const, label: '1 — Poor' },
  { value: 2 as const, label: '2 — Good' },
  { value: 3 as const, label: '3 — Ideal' },
]

interface Props {
  value: 1 | 2 | 3 | null
  onChange: (v: 1 | 2 | 3) => void
}

const SelfGradeButtons = ({ value, onChange }: Props) => (
  <Flex gap={2} flexWrap="wrap">
    {GRADES.map(g => (
      <Box
        key={g.value}
        as="button"
        onClick={() => onChange(g.value)}
        px={3} py={1}
        fontSize="xs"
        fontWeight={value === g.value ? '700' : '400'}
        borderRadius="md"
        border={`1px solid ${value === g.value ? colors.accent : colors.border}`}
        bg={value === g.value ? colors.accentDim : 'transparent'}
        color={value === g.value ? colors.accent : colors.textMuted}
        cursor="pointer"
        _hover={{ borderColor: colors.accent }}
      >
        {g.label}
      </Box>
    ))}
  </Flex>
)

export default SelfGradeButtons
