import { useState, useEffect, useRef } from 'react'

export function useCountdown(totalSeconds: number | null) {
  const [remaining, setRemaining] = useState<number | null>(totalSeconds)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function start() { setRunning(true) }
  function stop() {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  useEffect(() => {
    if (!running || remaining === null) return
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r === null || r <= 1) {
          clearInterval(intervalRef.current!)
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running]) // eslint-disable-line react-hooks/exhaustive-deps

  const formatted = remaining === null
    ? null
    : `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`

  const isExpired = remaining === 0
  const isLow = remaining !== null && remaining > 0 && remaining <= 300

  return { remaining, formatted, isExpired, isLow, start, stop }
}
