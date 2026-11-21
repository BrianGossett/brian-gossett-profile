import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCountdown } from '../Pages/ExamPrepPage/shared/useCountdown'

describe('useCountdown', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('uses a duration chosen after mount', () => {
    const { result, rerender } = renderHook(({ secs }) => useCountdown(secs), {
      initialProps: { secs: null as number | null },
    })
    rerender({ secs: 120 })
    act(() => { result.current.start() })
    expect(result.current.formatted).toBe('02:00')
    act(() => { vi.advanceTimersByTime(1000) })
    expect(result.current.formatted).toBe('01:59')
  })

  it('calls onExpire once when it reaches zero', () => {
    const onExpire = vi.fn()
    const { result } = renderHook(() => useCountdown(2, onExpire))
    act(() => { result.current.start() })
    act(() => { vi.advanceTimersByTime(5000) })
    expect(result.current.isExpired).toBe(true)
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('does nothing when started with no duration', () => {
    const { result } = renderHook(() => useCountdown(null))
    act(() => { result.current.start() })
    expect(result.current.formatted).toBeNull()
  })
})
