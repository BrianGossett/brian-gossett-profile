import { useCallback, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { AuthContext, type AuthState } from './authContext'
import { isAuthConfigured } from './config'
import { signIn as startSignIn, signOut as endSession } from './signIn'
import { TOKENS_KEY, tokenManager } from './tokens'

// The stored ID token is the snapshot: it changes exactly when the signed-in user does.
const getSnapshot = () => localStorage.getItem(TOKENS_KEY)

function subscribe(onChange: () => void) {
  const unsubscribe = tokenManager.subscribe(onChange)
  // Another tab signing in or out shows up as a storage event.
  const onStorage = (e: StorageEvent) => { if (e.key === TOKENS_KEY || e.key === null) onChange() }
  window.addEventListener('storage', onStorage)
  return () => {
    unsubscribe()
    window.removeEventListener('storage', onStorage)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const available = isAuthConfigured()
  const stored = useSyncExternalStore(subscribe, getSnapshot)
  const user = useMemo(() => (available && stored ? tokenManager.user() : null), [available, stored])

  // On load, renew an expired token, or sign out if the session has ended.
  useEffect(() => {
    if (available) void tokenManager.getIdToken()
  }, [available])

  const signIn = useCallback((returnTo?: string) => {
    const here = window.location.pathname + window.location.search + window.location.hash
    void startSignIn(returnTo ?? here)
  }, [])
  const signOut = useCallback(() => endSession(), [])
  const getToken = useCallback(() => tokenManager.getIdToken(), [])

  const value = useMemo<AuthState>(
    () => ({ available, isSignedIn: user !== null, user, signIn, signOut, getToken }),
    [available, user, signIn, signOut, getToken],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
