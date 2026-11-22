import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api/client'
import { errorMessage } from './todoLogic'

/**
 * Loads one GET route. `reload()` fetches it again and keeps showing the old
 * data until the new data arrives, so lists don't flash while refreshing.
 */
export function useLoad<T>(path: string, query?: Record<string, string>) {
  const key = query ? `${path}?${new URLSearchParams(query)}` : path
  const [state, setState] = useState<{ key: string; data?: T; error?: string } | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    const [route, search] = key.split('?')
    api<T>(route, search ? { query: Object.fromEntries(new URLSearchParams(search)) } : {}).then(
      data => { if (active) setState({ key, data }) },
      (err: unknown) => { if (active) setState(prev => ({ key, data: prev?.key === key ? prev.data : undefined, error: errorMessage(err, 'Could not load.') })) },
    )
    return () => { active = false }
  }, [key, version])

  const current = state?.key === key ? state : null
  const reload = useCallback(() => setVersion(v => v + 1), [])
  return { data: current?.data, error: current?.error, loading: !current, reload }
}

/** Runs one change at a time, tracking whether it is in flight and its error. */
export function useAction() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const run = useCallback(async (change: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await change()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }, [])
  return { busy, error, run }
}
