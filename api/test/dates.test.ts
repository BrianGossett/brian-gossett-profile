import { addDays, isPeriod, isValidDate, isValidTimezone, localDate, periodRange } from '../src/dates'

describe('localDate', () => {
  it('uses the timezone, not UTC', () => {
    // 03:30 UTC on the 22nd is still the evening of the 21st in US Central.
    const now = new Date('2026-11-22T03:30:00Z')
    expect(localDate(now, 'America/Chicago')).toBe('2026-11-21')
    expect(localDate(now, 'UTC')).toBe('2026-11-22')
    expect(localDate(now, 'Asia/Tokyo')).toBe('2026-11-22')
  })
})

describe('addDays', () => {
  it('moves forward and back across month and year ends', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
  })

  it('is not thrown off by daylight saving changes', () => {
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09')
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02')
  })
})

describe('validation', () => {
  it('accepts real dates only', () => {
    expect(isValidDate('2026-11-21')).toBe(true)
    expect(isValidDate('2026-02-30')).toBe(false)
    expect(isValidDate('21/11/2026')).toBe(false)
    expect(isValidDate(undefined)).toBe(false)
  })

  it('accepts real timezones only', () => {
    expect(isValidTimezone('America/Chicago')).toBe(true)
    expect(isValidTimezone('Mars/Olympus')).toBe(false)
    expect(isValidTimezone('')).toBe(false)
  })

  it('accepts week, month and year as periods', () => {
    expect(['week', 'month', 'year'].every(isPeriod)).toBe(true)
    expect(isPeriod('day')).toBe(false)
    expect(isPeriod(undefined)).toBe(false)
  })
})

describe('periodRange', () => {
  it('gives Monday to Sunday for a week', () => {
    // 2026-11-21 is a Saturday
    expect(periodRange('week', '2026-11-21')).toEqual({ from: '2026-11-16', to: '2026-11-22' })
    expect(periodRange('week', '2026-11-16')).toEqual({ from: '2026-11-16', to: '2026-11-22' })
    expect(periodRange('week', '2026-11-22')).toEqual({ from: '2026-11-16', to: '2026-11-22' })
  })

  it('gives the whole calendar month', () => {
    expect(periodRange('month', '2026-11-21')).toEqual({ from: '2026-11-01', to: '2026-11-30' })
    expect(periodRange('month', '2028-02-10')).toEqual({ from: '2028-02-01', to: '2028-02-29' })
  })

  it('gives the whole calendar year', () => {
    expect(periodRange('year', '2026-11-21')).toEqual({ from: '2026-01-01', to: '2026-12-31' })
  })
})
