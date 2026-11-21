import {
  BASE_POINTS,
  STREAK_BONUS,
  canRedeem,
  currentStreak,
  dailyAwards,
  nextStreak,
  streakBonuses,
  taskAwards,
  total,
  type Streak,
} from '../src/points'

describe('base points', () => {
  it('is 1, 2, 3 for small, medium, large', () => {
    expect(BASE_POINTS).toEqual({ small: 1, medium: 2, large: 3 })
  })

  it.each([['small', 1], ['medium', 2], ['large', 3]] as const)('a %s task earns %i', (size, points) => {
    expect(taskAwards(size)).toEqual([{ reason: 'task', amount: points }])
    expect(total(taskAwards(size))).toBe(points)
  })

  it.each([['small', 1], ['medium', 2], ['large', 3]] as const)('a %s daily earns %i on an ordinary day', (size, points) => {
    const { awards } = dailyAwards(size, undefined, '2026-11-21')
    expect(awards).toEqual([{ reason: 'daily', amount: points }])
  })
})

describe('nextStreak', () => {
  it('starts at 1', () => {
    expect(nextStreak(undefined, '2026-11-21')).toEqual({ current: 1, longest: 1, lastDate: '2026-11-21' })
  })

  it('continues when the last completion was yesterday', () => {
    const prev: Streak = { current: 3, longest: 3, lastDate: '2026-11-20' }
    expect(nextStreak(prev, '2026-11-21')).toEqual({ current: 4, longest: 4, lastDate: '2026-11-21' })
  })

  it('starts over after a missed day, keeping the longest', () => {
    const prev: Streak = { current: 9, longest: 9, lastDate: '2026-11-19' }
    expect(nextStreak(prev, '2026-11-21')).toEqual({ current: 1, longest: 9, lastDate: '2026-11-21' })
  })

  it('does not change when completed twice on the same day', () => {
    const prev: Streak = { current: 4, longest: 6, lastDate: '2026-11-21' }
    expect(nextStreak(prev, '2026-11-21')).toBe(prev)
  })

  it('continues across a month and a year boundary', () => {
    expect(nextStreak({ current: 2, longest: 2, lastDate: '2026-11-30' }, '2026-12-01').current).toBe(3)
    expect(nextStreak({ current: 2, longest: 2, lastDate: '2026-12-31' }, '2027-01-01').current).toBe(3)
  })

  it('continues across the end of February in a leap year', () => {
    expect(nextStreak({ current: 5, longest: 5, lastDate: '2028-02-29' }, '2028-03-01').current).toBe(6)
    expect(nextStreak({ current: 5, longest: 5, lastDate: '2028-02-28' }, '2028-03-01').current).toBe(1)
  })
})

describe('currentStreak', () => {
  const streak: Streak = { current: 5, longest: 8, lastDate: '2026-11-20' }

  it('is 0 with no record', () => expect(currentStreak(undefined, '2026-11-21')).toBe(0))
  it('counts when last done today', () => expect(currentStreak(streak, '2026-11-20')).toBe(5))
  it('still counts when last done yesterday (today is not over)', () => expect(currentStreak(streak, '2026-11-21')).toBe(5))
  it('is 0 once a day has been missed', () => expect(currentStreak(streak, '2026-11-22')).toBe(0))
})

describe('streak bonuses', () => {
  it('is 5, 10, 15 for small, medium, large', () => {
    expect(STREAK_BONUS).toEqual({ small: 5, medium: 10, large: 15 })
  })

  it.each([1, 2, 6, 8, 13, 29, 31])('gives nothing on day %i', day => {
    expect(streakBonuses('medium', day)).toEqual([])
  })

  it.each([['small', 5], ['medium', 10], ['large', 15]] as const)('gives a %s daily %i on day 7', (size, bonus) => {
    expect(streakBonuses(size, 7)).toEqual([{ reason: 'streak-week', amount: bonus }])
  })

  it('gives the weekly bonus again every 7th day', () => {
    for (const day of [14, 21, 28, 35]) {
      expect(streakBonuses('small', day)).toEqual([{ reason: 'streak-week', amount: 5 }])
    }
  })

  it.each([['small', 5], ['medium', 10], ['large', 15]] as const)('gives a %s daily %i on day 30', (size, bonus) => {
    expect(streakBonuses(size, 30)).toEqual([{ reason: 'streak-month', amount: bonus }])
  })

  it('gives the monthly bonus again every 30th day', () => {
    expect(streakBonuses('large', 60)).toEqual([{ reason: 'streak-month', amount: 15 }])
  })

  it('gives both when a day is a 7th and a 30th (day 210)', () => {
    expect(streakBonuses('medium', 210)).toEqual([
      { reason: 'streak-week', amount: 10 },
      { reason: 'streak-month', amount: 10 },
    ])
  })

  it('gives nothing for a streak of 0', () => {
    expect(streakBonuses('large', 0)).toEqual([])
  })
})

describe('dailyAwards', () => {
  it('adds the weekly bonus to the base points on the 7th day in a row', () => {
    const prev: Streak = { current: 6, longest: 6, lastDate: '2026-11-20' }
    const { awards, streak } = dailyAwards('medium', prev, '2026-11-21')
    expect(awards).toEqual([
      { reason: 'daily', amount: 2 },
      { reason: 'streak-week', amount: 10 },
    ])
    expect(total(awards)).toBe(12)
    expect(streak.current).toBe(7)
  })

  it('gives no bonus when the streak was broken the day before the 7th', () => {
    const prev: Streak = { current: 6, longest: 6, lastDate: '2026-11-19' }
    const { awards, streak } = dailyAwards('medium', prev, '2026-11-21')
    expect(awards).toEqual([{ reason: 'daily', amount: 2 }])
    expect(streak.current).toBe(1)
  })

  it('earns 7 base completions plus one bonus over a perfect week', () => {
    let streak: Streak | undefined
    let earned = 0
    for (let day = 1; day <= 7; day++) {
      const result = dailyAwards('large', streak, `2026-11-0${day}`)
      earned += total(result.awards)
      streak = result.streak
    }
    expect(earned).toBe(7 * 3 + 15)
  })
})

describe('canRedeem', () => {
  it('allows a reward that costs exactly the balance', () => expect(canRedeem(10, 10)).toBe(true))
  it('allows a reward that costs less than the balance', () => expect(canRedeem(10, 4)).toBe(true))
  it('refuses a reward that costs more than the balance', () => expect(canRedeem(10, 11)).toBe(false))
  it('refuses with a zero balance', () => expect(canRedeem(0, 1)).toBe(false))
  it.each([0, -5, 1.5, Number.NaN])('refuses a cost of %s', cost => expect(canRedeem(100, cost)).toBe(false))
})
