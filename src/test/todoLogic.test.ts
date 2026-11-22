import { describe, expect, it } from 'vitest'
import { awardMessage, formatDay, groupByGoal, heatLevel, heatmapWeeks, rewardProgress } from '../Pages/TodoPage/todoLogic'

describe('awardMessage', () => {
  it('shows the base points alone for a plain completion', () => {
    expect(awardMessage({ awards: [{ reason: 'task', amount: 1 }], streak: null })).toBe('+1 point')
    expect(awardMessage({ awards: [{ reason: 'daily', amount: 2 }], streak: { current: 1, longest: 4 } })).toBe('+2 points')
  })

  it('adds the streak and each bonus', () => {
    expect(awardMessage({
      awards: [{ reason: 'daily', amount: 2 }, { reason: 'streak-week', amount: 10 }],
      streak: { current: 7, longest: 7 },
    })).toBe('+2 points · 7-day streak · +10 weekly streak bonus')
    expect(awardMessage({
      awards: [{ reason: 'daily', amount: 3 }, { reason: 'streak-week', amount: 15 }, { reason: 'streak-month', amount: 15 }],
      streak: { current: 210, longest: 210 },
    })).toBe('+3 points · 210-day streak · +15 weekly streak bonus · +15 monthly streak bonus')
    expect(awardMessage({ awards: [{ reason: 'task', amount: 1 }, { reason: 'one-more', amount: 2 }], streak: null })).toBe('+1 point · +2 one-more bonus')
  })
})

describe('groupByGoal', () => {
  const goals = [{ id: 'g1', name: 'Fit', why: null }, { id: 'g2', name: 'Home', why: null }]
  it('groups in goal order with unassigned and orphaned items last', () => {
    const items = [{ id: 'a', goalId: 'g2' }, { id: 'b', goalId: null }, { id: 'c', goalId: 'g1' }, { id: 'd', goalId: 'deleted' }]
    const groups = groupByGoal(items, goals)
    expect(groups.map(g => [g.goal?.name ?? null, g.items.map(i => i.id)])).toEqual([['Fit', ['c']], ['Home', ['a']], [null, ['b', 'd']]])
  })
  it('keeps a goal that has nothing in it', () => {
    expect(groupByGoal([], goals).map(g => g.items.length)).toEqual([0, 0, 0])
  })
})

describe('rewardProgress', () => {
  it('reports how far there is to go, and never past full', () => {
    expect(rewardProgress(26, 200)).toEqual({ fraction: 0.13, toGo: 174 })
    expect(rewardProgress(250, 200)).toEqual({ fraction: 1, toGo: 0 })
    expect(rewardProgress(0, 50)).toEqual({ fraction: 0, toGo: 50 })
  })
})

describe('heatmapWeeks', () => {
  it('lays days out in Monday-first weeks, padding outside the range', () => {
    // 2026-11-18 is a Wednesday, 2026-11-24 a Tuesday.
    const weeks = heatmapWeeks('2026-11-18', '2026-11-24', [{ date: '2026-11-21', completions: 3, points: 5 }])
    expect(weeks).toHaveLength(2)
    expect(weeks[0].map(c => c?.date ?? null)).toEqual([null, null, '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22'])
    expect(weeks[1].map(c => c?.date ?? null)).toEqual(['2026-11-23', '2026-11-24', null, null, null, null, null])
    expect(weeks[0][5]).toEqual({ date: '2026-11-21', completions: 3 })
    expect(weeks[0][2]?.completions).toBe(0)
  })
  it('covers a full year in 53 or 54 columns', () => {
    const weeks = heatmapWeeks('2025-11-22', '2026-11-21', [])
    expect(weeks.flat().filter(Boolean)).toHaveLength(365)
    expect(weeks.length).toBeGreaterThanOrEqual(53)
    expect(weeks.length).toBeLessThanOrEqual(54)
  })
})

it('heatLevel steps from 0 to 4', () => {
  expect([0, 1, 2, 3, 4, 5, 6, 20].map(heatLevel)).toEqual([0, 1, 2, 2, 3, 3, 4, 4])
})

it('formatDay names the day without shifting it by timezone', () => {
  expect(formatDay('2026-11-21')).toBe('Saturday, November 21')
})
