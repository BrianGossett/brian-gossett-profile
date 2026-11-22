import { createApp } from '../app'

describe('GET /summary', () => {
  it.each(['week', 'month', 'year'])('accepts period=%s', async period => {
    const { user } = createApp()
    const res = await user.get('/summary', { period })
    expect(res.status).toBe(200)
    expect(res.data.period).toBe(period)
  })

  it.each([undefined, { period: 'day' }, { period: '' }, { period: 'WEEK' }])('returns 400 for %j', async query => {
    const { user } = createApp()
    expect((await user.get('/summary', query)).status).toBe(400)
  })

  it('adds up earned, bonus and spent points for the calendar week', async () => {
    const { user, setDate } = createApp()
    const { data: goal } = await user.post('/goals', { name: 'Health' })
    const { data: daily } = await user.post('/tasks', { title: 'x', size: 'small', repeat: 'daily', goalId: goal.id })
    // Nov 10-16 is a full streak week ending on a Monday; only the 16th falls in the week of the 21st.
    for (let d = 10; d <= 16; d++) { setDate(`2026-11-${d}`); await user.post(`/tasks/${daily.id}/complete`) }
    setDate('2026-11-21')
    const { data: task } = await user.post('/tasks', { title: 'y', size: 'large' })
    await user.post(`/tasks/${task.id}/complete`)
    const { data: reward } = await user.post('/rewards', { name: 'r', cost: 4 })
    await user.post(`/rewards/${reward.id}/redeem`)

    const week = (await user.get('/summary', { period: 'week' })).data
    expect(week).toMatchObject({ from: '2026-11-16', to: '2026-11-22', completions: 2, redemptions: 1, spent: 4 })
    expect(week.earned).toBe(1 + 5 + 3) // daily on the 16th + its weekly bonus + the large task
    expect(week.streakBonuses).toBe(5)
    expect(week.byGoal).toEqual(expect.arrayContaining([
      { goalId: goal.id, completions: 1, points: 6 },
      { goalId: null, completions: 1, points: 3 },
    ]))

    const month = (await user.get('/summary', { period: 'month' })).data
    expect(month).toMatchObject({ from: '2026-11-01', to: '2026-11-30', completions: 8 })
    expect(month.earned).toBe(7 * 1 + 5 + 3)
  })

  it('only counts the caller\'s own activity', async () => {
    const { as } = createApp()
    const { data: task } = await as('alice').post('/tasks', { title: 'x', size: 'large' })
    await as('alice').post(`/tasks/${task.id}/complete`)
    expect((await as('mallory').get('/summary', { period: 'year' })).data).toMatchObject({ earned: 0, completions: 0 })
  })
})

describe('GET /heatmap', () => {
  it('counts completions per day over the last year', async () => {
    const { user, setDate } = createApp()
    const { data: daily } = await user.post('/tasks', { title: 'x', size: 'medium', repeat: 'daily' })
    setDate('2026-11-19'); await user.post(`/tasks/${daily.id}/complete`)
    setDate('2026-11-21')
    const { data: task } = await user.post('/tasks', { title: 'y', size: 'small' })
    await user.post(`/tasks/${task.id}/complete`)
    await user.post(`/tasks/${daily.id}/complete`)

    const { data } = await user.get('/heatmap')
    expect(data).toMatchObject({ from: '2025-11-22', to: '2026-11-21' })
    expect(data.days).toEqual([
      { date: '2026-11-19', completions: 1, points: 2 },
      { date: '2026-11-21', completions: 2, points: 3 },
    ])
  })

  it('leaves out activity older than a year', async () => {
    const { user, setDate } = createApp()
    const { data: daily } = await user.post('/tasks', { title: 'x', size: 'small', repeat: 'daily' })
    setDate('2025-01-05'); await user.post(`/tasks/${daily.id}/complete`)
    setDate('2026-11-21')
    expect((await user.get('/heatmap')).data.days).toEqual([])
  })
})
