import { useLocation } from 'react-router'
import { Box, Text, VStack } from '@chakra-ui/react'
import PageContainer from '../../Components/Container'
import { useAuth } from '../../auth/authContext'
import { colors } from '../../Theme'
import TodoApp from './TodoApp'
import { useSignInCallback } from './useSignInCallback'

const Panel = ({ children }: { children: React.ReactNode }) => (
  <Box bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="xl" p={8} maxW="560px" w="full">
    {children}
  </Box>
)

/**
 * /todo is both the to-do app and where Cognito returns after sign-in.
 * Signed out it asks for sign-in; signed in it shows the app.
 */
const TodoPage = () => {
  const { search } = useLocation()
  const { available, isSignedIn, signIn } = useAuth()
  const { finishing, error } = useSignInCallback(search)

  if (available && !finishing && isSignedIn) {
    return <PageContainer><TodoApp /></PageContainer>
  }

  return (
    <PageContainer>
      <VStack px={{ base: 4, md: 8 }} py={12} gap={6}>
        <Text as="h1" fontSize="2xl" fontWeight="800" color={colors.textPrimary}>To-do</Text>

        {!available && (
          <Panel><Text color={colors.textMuted}>Sign-in isn't set up for this build.</Text></Panel>
        )}

        {available && finishing && (
          <Panel><Text color={colors.textMuted}>Signing you in…</Text></Panel>
        )}

        {available && !finishing && (
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
      </VStack>
    </PageContainer>
  )
}

export default TodoPage
