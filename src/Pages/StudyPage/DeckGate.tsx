import { type ReactNode } from 'react'
import { useParams } from 'react-router'
import { Text, VStack } from '@chakra-ui/react'
import PageContainer from '../../Components/Container'
import { useAuth } from '../../auth/authContext'
import { useDecks, useDeckSyncStatus } from '../../hooks/useDecks'
import { colors } from '../../Theme'

/**
 * Study modes read their deck once when they open. On a device that hasn't seen
 * a deck yet, wait for the signed-in user's decks to load before opening it, so
 * the mode doesn't start with the wrong deck.
 */
const DeckGate = ({ children }: { children: ReactNode }) => {
  const { deckId } = useParams<{ deckId: string }>()
  const { isSignedIn } = useAuth()
  const { customDecks } = useDecks()
  const status = useDeckSyncStatus()

  const known = !deckId || deckId === 'default' || customDecks.some(d => d.id === deckId)
  const stillLoading = isSignedIn && (status === 'idle' || status === 'loading')

  if (!known && stillLoading) {
    return (
      <PageContainer>
        <VStack py={16}>
          <Text color={colors.textMuted}>Loading your decks…</Text>
        </VStack>
      </PageContainer>
    )
  }
  return <>{children}</>
}

export default DeckGate
