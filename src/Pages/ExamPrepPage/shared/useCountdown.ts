import { useState, useEffect, useRef } from 'react'

// totalSeconds is read when start() is called, so it can change after mount
// (e.g. picked on a config screen). onExpire fires once when the timer hits 0.
export function useCountdown(totalSeconds: number | null, onExpire?: () => void) {
  const [remaining, setRemaining] = useState<number | null>(totalSeconds)
  const [running, setRunning] = useState(false)
  const remainingRef = useRef<number | null>(totalSeconds)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onExpireRef = useRef(onExpire)

  useEffect(() => { onExpireRef.current = onExpire })

  function start() {
    if (totalSeconds === null) return
    remainingRef.current = totalSeconds
    setRemaining(totalSeconds)
    setRunning(true)
  }
  function stop() {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      const next = Math.max(0, (remainingRef.current ?? 0) - 1)
      remainingRef.current = next
      setRemaining(next)
      if (next === 0) {
        clearInterval(id)
        setRunning(false)
        onExpireRef.current?.()
      }
    }, 1000)
    intervalRef.current = id
    return () => clearInterval(id)
  }, [running])

  const formatted = remaining === null
    ? null
    : `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`

  const isExpired = remaining === 0
  const isLow = remaining !== null && remaining > 0 && remaining <= 300

  return { remaining, formatted, isExpired, isLow, start, stop }
}
