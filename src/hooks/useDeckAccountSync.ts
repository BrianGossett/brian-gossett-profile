import { useEffect } from 'react'
import { useAuth } from '../auth/authContext'
import { deckSync } from './deckSync'
import { progressSync } from './progressSync'

/** Connects sign-in state to deck and progress syncing. Mount once, near the top of the app. */
export function useDeckAccountSync(): void {
  const { available, user } = useAuth()
  const userId = user?.sub ?? null

  useEffect(() => {
    if (!available) return
    if (userId) {
      void deckSync.signedIn(userId)
      progressSync.signedIn(userId)
    } else {
      deckSync.signedOut()
      progressSync.signedOut()
    }
  }, [available, userId])

  // Changes made offline are sent as soon as the connection is back.
  useEffect(() => {
    const onOnline = () => {
      void deckSync.retry()
      void progressSync.flush()
    }
    // Leaving the page: save progress still waiting in the batch.
    const onHidden = () => { if (document.visibilityState === 'hidden') void progressSync.flush() }
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onHidden)
    return () => {
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onHidden)
    }
  }, [])
}
