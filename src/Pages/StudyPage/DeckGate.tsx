import { useEffect, type ReactNode } from 'react'
import { useParams } from 'react-router'
import { Text, VStack } from '@chakra-ui/react'
import PageContainer from '../../Components/Container'
import { useAuth } from '../../auth/authContext'
import { useDecks, useDeckSyncStatus } from '../../hooks/useDecks'
import { progressSync } from '../../hooks/progressSync'
import { useProgressStatus } from '../../hooks/useStudySession'
import { colors } from '../../Theme'

/**
 * Study modes read their deck and its saved progress once when they open. For a
 * signed-in user, wait until both have loaded from the account, so the mode
 * doesn't start with the wrong deck or from the wrong place.
 */
const DeckGate = ({ children }: { children: ReactNode }) => {
  const { deckId } = useParams<{ deckId: string }>()
  const { isSignedIn } = useAuth()
  const { customDecks } = useDecks()
  const status = useDeckSyncStatus()

  const progressStatus = useProgressStatus(deckId ?? 'default')

  const known = !deckId || deckId === 'default' || customDecks.some(d => d.id === deckId)
  const decksLoading = isSignedIn && (status === 'idle' || status === 'loading')
  // Modes also read saved progress (position, mastered terms) once when they open.
  const progressLoading = isSignedIn && (progressStatus === 'idle' || progressStatus === 'loading')

  // Ask for this deck's saved progress here, since the mode that would ask isn't shown yet.
  useEffect(() => {
    if (!deckId) return
    progressSync.open(deckId)
    return () => progressSync.close(deckId)
  }, [deckId])

  if ((!known && decksLoading) || progressLoading) {
    return (
      <PageContainer>
        <VStack py={16}>
          <Text color={colors.textMuted}>Loading your progress…</Text>
        </VStack>
      </PageContainer>
    )
  }
  return <>{children}</>
}

export default DeckGate
