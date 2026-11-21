import { useEffect } from 'react'
import { useAuth } from '../auth/authContext'
import { deckSync } from './deckSync'

/** Connects sign-in state to deck syncing. Mount once, near the top of the app. */
export function useDeckAccountSync(): void {
  const { available, user } = useAuth()
  const userId = user?.sub ?? null

  useEffect(() => {
    if (!available) return
    if (userId) void deckSync.signedIn(userId)
    else deckSync.signedOut()
  }, [available, userId])

  // Changes made offline are sent as soon as the connection is back.
  useEffect(() => {
    const onOnline = () => { void deckSync.retry() }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])
}
