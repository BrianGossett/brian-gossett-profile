import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { Box, Text, VStack } from '@chakra-ui/react'
import PageContainer from '../../Components/Container'
import { api } from '../../api/client'
import { useAuth } from '../../auth/authContext'
import { colors } from '../../Theme'
import { useSignInCallback } from './useSignInCallback'

interface Profile {
  userId: string
  email: string | null
  name: string | null
  points: number
  timezone: string
}

/** The signed-in user's profile from the API, keyed by user so it resets on sign-out. */
function useProfile(userId: string | null) {
  const [result, setResult] = useState<{ userId: string; profile?: Profile; error?: string } | null>(null)

  useEffect(() => {
    if (!userId) return
    let active = true
    api<Profile>('/me').then(
      profile => { if (active) setResult({ userId, profile }) },
      (err: unknown) => { if (active) setResult({ userId, error: err instanceof Error ? err.message : 'Could not load your profile.' }) },
    )
    return () => { active = false }
  }, [userId])

  return result?.userId === userId ? result : null
}

const Panel = ({ children }: { children: React.ReactNode }) => (
  <Box bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="xl" p={8} maxW="560px" w="full">
    {children}
  </Box>
)

// The to-do screens themselves are built in a later ticket. This page handles
// sign-in and shows that the signed-in user can reach the API.
const TodoPage = () => {
  const { search } = useLocation()
  const { available, isSignedIn, user, signIn } = useAuth()
  const { finishing, error } = useSignInCallback(search)
  const result = useProfile(isSignedIn ? user?.sub ?? null : null)

  return (
    <PageContainer>
      <VStack px={{ base: 4, md: 8 }} py={12} gap={6}>
        <Text fontSize="2xl" fontWeight="800" color={colors.textPrimary}>To-do</Text>

        {!available && (
          <Panel><Text color={colors.textMuted}>Sign-in isn't set up for this build.</Text></Panel>
        )}

        {available && finishing && (
          <Panel><Text color={colors.textMuted}>Signing you in…</Text></Panel>
        )}

        {available && !finishing && !isSignedIn && (
          <Panel>
            <VStack gap={4} align="start">
              {error && <Text color="#ff6b6b" fontSize="sm" role="alert">{error}</Text>}
              <Text color={colors.textMuted}>Sign in to track tasks, streaks and rewards, and to keep your flashcard decks on every device.</Text>
              <Box
                as="button"
                onClick={() => signIn('/todo')}
                bg={colors.accent}
                color={colors.pageBg}
                fontWeight="700"
                px={5}
                py={2}
                borderRadius="md"
                border="none"
                cursor="pointer"
                _hover={{ opacity: 0.9 }}
              >
                Sign in with Google
              </Box>
            </VStack>
          </Panel>
        )}

        {available && !finishing && isSignedIn && (
          <Panel>
            <VStack gap={3} align="start">
              <Text color={colors.textPrimary} fontWeight="700">
                Signed in as {user?.name ?? user?.email ?? 'you'}
              </Text>
              {!result && <Text color={colors.textMuted} fontSize="sm">Loading your profile…</Text>}
              {result?.error && <Text color="#ff6b6b" fontSize="sm" role="alert">{result.error}</Text>}
              {result?.profile && (
                <Text color={colors.textMuted} fontSize="sm">
                  {result.profile.points} points · day boundary in {result.profile.timezone}
                </Text>
              )}
              <Text color={colors.textMuted} fontSize="sm">Your tasks, streaks and rewards will appear here.</Text>
            </VStack>
          </Panel>
        )}
      </VStack>
    </PageContainer>
  )
}

export default TodoPage
