import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { completeSignIn, isCallback } from '../../auth/signIn'

// A sign-in code can be exchanged only once, but React may run an effect twice
// in development. Keep one exchange per code.
const exchanges = new Map<string, Promise<string>>()

/**
 * /todo is where Cognito returns after sign-in. When the URL carries a sign-in
 * response, this finishes the sign-in and goes back to the page it started from.
 */
export function useSignInCallback(search: string) {
  const navigate = useNavigate()
  const pending = isCallback(search)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!pending) return
    let exchange = exchanges.get(search)
    if (!exchange) {
      exchange = completeSignIn(search)
      exchanges.set(search, exchange)
    }
    let active = true
    exchange.then(
      returnTo => { if (active) navigate(returnTo, { replace: true }) },
      (err: unknown) => {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Sign-in failed.')
        // Drop the used code from the address bar so a reload doesn't retry it.
        navigate('/todo', { replace: true })
      },
    )
    return () => { active = false }
  }, [pending, search, navigate])

  return { finishing: pending && !error, error }
}
