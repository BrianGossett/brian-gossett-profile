import { Box, Flex, Input, Text } from '@chakra-ui/react'
import { useState, type ComponentProps, type ReactNode } from 'react'
import { colors } from '../../Theme'
import { SIZES, SIZE_LETTER, SIZE_POINTS } from './todoLogic'
import type { Size } from './types'

export const danger = '#ff6b6b'
export const success = '#4ade80'
export const flame = '#ffb454'

export const Card = ({ children, ...rest }: ComponentProps<typeof Box>) => (
  <Box bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="xl" p={4} {...rest}>
    {children}
  </Box>
)

export const SectionTitle = ({ children }: { children: ReactNode }) => (
  <Text as="h2" fontSize="xs" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" color={colors.textMuted} mt={2}>
    {children}
  </Text>
)

type ButtonProps = Omit<ComponentProps<'button'>, 'color'> & { variant?: 'solid' | 'outline' | 'ghost' | 'danger' }

export const Button = ({ variant = 'outline', children, disabled, ...rest }: ButtonProps) => {
  const look = {
    solid: { bg: colors.accent, color: colors.pageBg, border: `1px solid ${colors.accent}` },
    outline: { bg: 'transparent', color: colors.textPrimary, border: `1px solid ${colors.accent}` },
    ghost: { bg: 'transparent', color: colors.textMuted, border: '1px solid transparent' },
    danger: { bg: 'transparent', color: danger, border: `1px solid ${danger}` },
  }[variant]
  return (
    <Box
      as="button"
      {...look}
      fontWeight="700"
      fontSize="sm"
      px={3}
      minH="40px"
      borderRadius="md"
      cursor={disabled ? 'not-allowed' : 'pointer'}
      opacity={disabled ? 0.5 : 1}
      flexShrink={0}
      _hover={disabled ? undefined : { opacity: 0.85 }}
      {...({ type: 'button', disabled, ...rest } as object)}
    >
      {children}
    </Box>
  )
}

export const TextField = ({ label, ...rest }: { label: string } & ComponentProps<typeof Input>) => (
  <Input
    aria-label={label}
    placeholder={label}
    bg={colors.pageBg}
    border={`1px solid ${colors.border}`}
    color={colors.textPrimary}
    borderRadius="md"
    px={3}
    minH="40px"
    fontSize="16px" // Smaller text makes phones zoom in on focus.
    _placeholder={{ color: colors.textMuted }}
    {...rest}
  />
)

/** Pick small, medium or large. Each button shows the points that size is worth. */
export const SizePicker = ({ value, onChange }: { value: Size; onChange: (size: Size) => void }) => (
  <Flex role="radiogroup" aria-label="Size" gap={1}>
    {SIZES.map(size => {
      const on = size === value
      return (
        <Box
          as="button"
          key={size}
          role="radio"
          aria-checked={on}
          aria-label={`${size}, ${SIZE_POINTS[size]} ${SIZE_POINTS[size] === 1 ? 'point' : 'points'}`}
          title={`${size} · ${SIZE_POINTS[size]} pt`}
          onClick={() => onChange(size)}
          minW="40px"
          minH="40px"
          borderRadius="md"
          border={`1px solid ${on ? colors.accent : colors.border}`}
          bg={on ? colors.accentDim : 'transparent'}
          color={on ? colors.accent : colors.textMuted}
          fontWeight="700"
          fontSize="sm"
          cursor="pointer"
          {...({ type: 'button' } as object)}
        >
          {SIZE_LETTER[size]}
        </Box>
      )
    })}
  </Flex>
)

export const SizeChip = ({ size }: { size: Size }) => (
  <Text
    as="span"
    title={`${size} · ${SIZE_POINTS[size]} pt`}
    fontSize="xs"
    fontWeight="700"
    color={colors.textMuted}
    border={`1px solid ${colors.border}`}
    borderRadius="sm"
    px={1.5}
    flexShrink={0}
  >
    {SIZE_LETTER[size]}
  </Text>
)

export const ErrorNote = ({ children }: { children: ReactNode }) =>
  children ? <Text role="alert" color={danger} fontSize="sm">{children}</Text> : null

export const Muted = ({ children, ...rest }: ComponentProps<typeof Text>) => (
  <Text color={colors.textMuted} fontSize="sm" {...rest}>{children}</Text>
)

/** Loading and error states shared by every tab. Renders children once there is data. */
export const Loaded = ({ loading, error, hasData, children }: { loading: boolean; error?: string; hasData: boolean; children: ReactNode }) => {
  if (!hasData) return error ? <ErrorNote>{error}</ErrorNote> : loading ? <Muted>Loading…</Muted> : null
  return <>{error && <ErrorNote>{error}</ErrorNote>}{children}</>
}

/** A button that asks once more before doing something that can't be undone. */
export const ConfirmButton = ({ label, confirm, onConfirm, disabled }: { label: string; confirm: string; onConfirm: () => void; disabled?: boolean }) => {
  const [asking, setAsking] = useState(false)
  if (!asking) return <Button variant="ghost" onClick={() => setAsking(true)} disabled={disabled}>{label}</Button>
  return (
    <Flex gap={2} align="center">
      <Button variant="danger" onClick={() => { setAsking(false); onConfirm() }} disabled={disabled}>{confirm}</Button>
      <Button variant="ghost" onClick={() => setAsking(false)}>Cancel</Button>
    </Flex>
  )
}
