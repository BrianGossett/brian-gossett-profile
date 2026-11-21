import { createContext, useContext } from 'react'
import type { AuthUser } from './tokens'

export interface AuthState {
  /** False when the build has no sign-in settings. Sign-in controls should hide. */
  available: boolean
  isSignedIn: boolean
  user: AuthUser | null
  /** Starts Google sign-in, returning to `returnTo` (default: the current page). */
  signIn: (returnTo?: string) => void
  signOut: () => void
  /** A valid ID token for the API, or null when signed out. */
  getToken: () => Promise<string | null>
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
