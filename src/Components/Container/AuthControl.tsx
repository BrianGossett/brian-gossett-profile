import { Box, Flex, Text } from '@chakra-ui/react'
import { useAuth } from '../../auth/authContext'
import { colors } from '../../Theme'

/** Sign in / sign out, shown in the header. Renders nothing when sign-in isn't set up. */
const AuthControl = () => {
  const { available, isSignedIn, user, signIn, signOut } = useAuth()
  if (!available) return null

  const button = {
    as: 'button' as const,
    bg: 'none',
    border: `1px solid ${colors.border}`,
    borderRadius: 'md',
    px: 3,
    py: 1,
    fontSize: 'sm',
    cursor: 'pointer',
    color: colors.textMuted,
    _hover: { color: colors.accent, borderColor: colors.accent },
  }

  if (!isSignedIn) {
    return <Box {...button} onClick={() => signIn()}>Sign in</Box>
  }
  return (
    <Flex align="center" gap={3}>
      <Text fontSize="sm" color={colors.textMuted} maxW="180px" truncate title={user?.email ?? undefined}>
        {user?.name ?? user?.email ?? 'Signed in'}
      </Text>
      <Box {...button} onClick={signOut}>Sign out</Box>
    </Flex>
  )
}

export default AuthControl
