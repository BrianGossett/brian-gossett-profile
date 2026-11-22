import { createApp } from '../app'

const day = (n: number) => `2026-11-${String(n).padStart(2, '0')}`

describe('tasks', () => {
  it('creates a one-off task and a daily, told apart by ID prefix', async () => {
    const { user } = createApp()
    const task = await user.post('/tasks', { title: 'File taxes', size: 'large' })
    const daily = await user.post('/tasks', { title: 'Brush teeth', size: 'small', repeat: 'daily' })
    expect(task.status).toBe(201)
    expect(task.data).toMatchObject({ kind: 'task', title: 'File taxes', size: 'large', status: 'open' })
    expect(task.data.id).toMatch(/^t_/)
    expect(daily.data).toMatchObject({ kind: 'daily' })
    expect(daily.data.id).toMatch(/^d_/)

    const list = await user.get('/tasks')
    expect(list.data.tasks).toHaveLength(1)
    expect(list.data.dailies).toHaveLength(1)
  })

  it.each([
    [{ size: 'small' }, 'title'],
    [{ title: '   ', size: 'small' }, 'title'],
    [{ title: 'x' }, 'size'],
    [{ title: 'x', size: 'huge' }, 'size'],
    [{ title: 'x', size: 'small', repeat: 'weekly' }, 'repeat'],
    [{ title: 'x', size: 'small', dueDate: '2026-02-30' }, 'dueDate'],
    [{ title: 'x', size: 'small', goalId: 'not-mine' }, 'goalId'],
  ])('rejects %j', async (input, field) => {
    const { user } = createApp()
    const res = await user.post('/tasks', input)
    expect(res.status).toBe(400)
    expect(res.data.message).toContain(field)
  })

  it('edits and deletes a task', async () => {
    const { user } = createApp()
    const { data: task } = await user.post('/tasks', { title: 'Old', size: 'small' })
    const edited = await user.patch(`/tasks/${task.id}`, { title: 'New', size: 'medium' })
    expect(edited.data).toMatchObject({ title: 'New', size: 'medium' })
    expect((await user.del(`/tasks/${task.id}`)).status).toBe(204)
    expect((await user.get('/tasks')).data.tasks).toEqual([])
  })

  it('links a task to one of the user\'s goals', async () => {
    const { user } = createApp()
    const { data: goal } = await user.post('/goals', { name: 'Get fit' })
    const { data: task } = await user.post('/tasks', { title: 'Run', size: 'medium', goalId: goal.id })
    expect(task.goalId).toBe(goal.id)
  })
})

describe('completing a one-off task', () => {
  it.each([['small', 1], ['medium', 2], ['large', 3]] as const)('awards %s = %i points', async (size, points) => {
    const { user } = createApp()
    const { data: task } = await user.post('/tasks', { title: 'x', size })
    const res = await user.post(`/tasks/${task.id}/complete`)
    expect(res.status).toBe(200)
    expect(res.data).toMatchObject({ points, balance: points, streak: null, awards: [{ reason: 'task', amount: points }] })
    expect((await user.get('/me')).data.points).toBe(points)
  })

  it('cannot be completed twice, the same day or later', async () => {
    const { user, setDate } = createApp()
    const { data: task } = await user.post('/tasks', { title: 'x', size: 'large' })
    await user.post(`/tasks/${task.id}/complete`)
    expect((await user.post(`/tasks/${task.id}/complete`)).status).toBe(409)
    setDate(day(25))
    expect((await user.post(`/tasks/${task.id}/complete`)).status).toBe(409)
    expect((await user.get('/me')).data.points).toBe(3)
  })

  it('returns 404 for a task that does not exist', async () => {
    const { user } = createApp()
    expect((await user.post('/tasks/t_missing/complete')).status).toBe(404)
    expect((await user.post('/tasks/garbage/complete')).status).toBe(404)
  })
})

describe('completing a daily', () => {
  it('does not award points twice on the same day', async () => {
    const { user } = createApp()
    const { data: daily } = await user.post('/tasks', { title: 'Brush teeth', size: 'medium', repeat: 'daily' })
    expect((await user.post(`/tasks/${daily.id}/complete`)).data.points).toBe(2)
    const again = await user.post(`/tasks/${daily.id}/complete`)
    expect(again.status).toBe(409)
    expect((await user.get('/me')).data.points).toBe(2)
  })

  it('does not double-award when two completions race', async () => {
    const { user } = createApp()
    const { data: daily } = await user.post('/tasks', { title: 'x', size: 'large', repeat: 'daily' })
    const results = await Promise.all([user.post(`/tasks/${daily.id}/complete`), user.post(`/tasks/${daily.id}/complete`)])
    expect(results.map(r => r.status).sort()).toEqual([200, 409])
    expect((await user.get('/me')).data.points).toBe(3)
  })

  it('can be completed again the next day, growing the streak', async () => {
    const { user, setDate } = createApp()
    const { data: daily } = await user.post('/tasks', { title: 'x', size: 'small', repeat: 'daily' })
    setDate(day(1))
    expect((await user.post(`/tasks/${daily.id}/complete`)).data.streak).toEqual({ current: 1, longest: 1 })
    setDate(day(2))
    expect((await user.post(`/tasks/${daily.id}/complete`)).data.streak).toEqual({ current: 2, longest: 2 })
  })

  it('starts the streak over after a missed day', async () => {
    const { user, setDate } = createApp()
    const { data: daily } = await user.post('/tasks', { title: 'x', size: 'small', repeat: 'daily' })
    for (const d of [1, 2, 3]) { setDate(day(d)); await user.post(`/tasks/${daily.id}/complete`) }
    setDate(day(5))
    expect((await user.post(`/tasks/${daily.id}/complete`)).data.streak).toEqual({ current: 1, longest: 3 })
  })

  it.each([['small', 5], ['medium', 10], ['large', 15]] as const)(
    'adds the weekly bonus for a %s daily (+%i) on the 7th day in a row',
    async (size, bonus) => {
      const { user, setDate } = createApp()
      const base = { small: 1, medium: 2, large: 3 }[size]
      const { data: daily } = await user.post('/tasks', { title: 'x', size, repeat: 'daily' })
      let last
      for (let d = 1; d <= 7; d++) { setDate(day(d)); last = await user.post(`/tasks/${daily.id}/complete`) }
      expect(last!.data.awards).toEqual([{ reason: 'daily', amount: base }, { reason: 'streak-week', amount: bonus }])
      expect(last!.data.points).toBe(base + bonus)
      expect((await user.get('/me')).data.points).toBe(7 * base + bonus)
    },
  )

  it('adds the monthly bonus on the 30th day in a row', async () => {
    const { user, setDate } = createApp()
    const { data: daily } = await user.post('/tasks', { title: 'x', size: 'medium', repeat: 'daily' })
    let last
    for (let d = 1; d <= 30; d++) { setDate(day(d)); last = await user.post(`/tasks/${daily.id}/complete`) }
    expect(last!.data.awards).toEqual([{ reason: 'daily', amount: 2 }, { reason: 'streak-month', amount: 10 }])
    // 30 completions, 4 weekly bonuses (days 7, 14, 21, 28), 1 monthly bonus
    expect((await user.get('/me')).data.points).toBe(30 * 2 + 4 * 10 + 10)
  })

  it('keeps each daily\'s streak separate', async () => {
    const { user, setDate } = createApp()
    const { data: a } = await user.post('/tasks', { title: 'a', size: 'small', repeat: 'daily' })
    const { data: b } = await user.post('/tasks', { title: 'b', size: 'small', repeat: 'daily' })
    setDate(day(1)); await user.post(`/tasks/${a.id}/complete`)
    setDate(day(2)); await user.post(`/tasks/${a.id}/complete`)
    expect((await user.post(`/tasks/${b.id}/complete`)).data.streak.current).toBe(1)
  })

  it('counts the day in the user\'s timezone, not UTC', async () => {
    const { user, setTime } = createApp()
    const { data: daily } = await user.post('/tasks', { title: 'x', size: 'small', repeat: 'daily' })
    setTime('2026-11-22T03:00:00Z') // 9pm on the 21st in US Central
    expect((await user.post(`/tasks/${daily.id}/complete`)).data.date).toBe('2026-11-21')
    setTime('2026-11-22T05:30:00Z') // 11:30pm, still the 21st
    expect((await user.post(`/tasks/${daily.id}/complete`)).status).toBe(409)
    setTime('2026-11-22T06:30:00Z') // 12:30am on the 22nd
    expect((await user.post(`/tasks/${daily.id}/complete`)).data).toMatchObject({ date: '2026-11-22', streak: { current: 2 } })
  })
})

describe('GET /today', () => {
  it('shows dailies with streaks, open tasks, and points', async () => {
    const { user, setDate } = createApp()
    const { data: daily } = await user.post('/tasks', { title: 'Brush teeth', size: 'small', repeat: 'daily' })
    const { data: open } = await user.post('/tasks', { title: 'Open', size: 'medium' })
    const { data: old } = await user.post('/tasks', { title: 'Done earlier', size: 'small' })
    setDate(day(20))
    await user.post(`/tasks/${daily.id}/complete`)
    await user.post(`/tasks/${old.id}/complete`)
    setDate(day(21))
    await user.post(`/tasks/${daily.id}/complete`)

    const { data } = await user.get('/today')
    expect(data).toMatchObject({ date: day(21), timezone: 'America/Chicago', balance: 3, earnedToday: 1 })
    expect(data.dailies).toEqual([expect.objectContaining({ id: daily.id, doneToday: true, streak: { current: 2, longest: 2 } })])
    // The task finished on an earlier day is no longer listed.
    expect(data.tasks.map((t: { id: string }) => t.id)).toEqual([open.id])
  })

  it('shows a streak as 0 once a day has been missed', async () => {
    const { user, setDate } = createApp()
    const { data: daily } = await user.post('/tasks', { title: 'x', size: 'small', repeat: 'daily' })
    setDate(day(1)); await user.post(`/tasks/${daily.id}/complete`)
    setDate(day(2))
    expect((await user.get('/today')).data.dailies[0]).toMatchObject({ doneToday: false, streak: { current: 1 } })
    setDate(day(3))
    expect((await user.get('/today')).data.dailies[0]).toMatchObject({ doneToday: false, streak: { current: 0, longest: 1 } })
  })
})

describe('keeping users apart', () => {
  it('does not show, edit, complete or delete another user\'s task', async () => {
    const { as } = createApp()
    const alice = as('alice')
    const mallory = as('mallory')
    const { data: task } = await alice.post('/tasks', { title: 'Private', size: 'large' })

    expect((await mallory.get('/tasks')).data).toEqual({ tasks: [], dailies: [] })
    expect((await mallory.patch(`/tasks/${task.id}`, { title: 'Hacked' })).status).toBe(404)
    expect((await mallory.post(`/tasks/${task.id}/complete`)).status).toBe(404)
    await mallory.del(`/tasks/${task.id}`)

    expect((await alice.get('/tasks')).data.tasks).toEqual([expect.objectContaining({ title: 'Private', status: 'open' })])
    expect((await mallory.get('/me')).data.points).toBe(0)
  })

  it('does not let a task use another user\'s goal', async () => {
    const { as } = createApp()
    const { data: goal } = await as('alice').post('/goals', { name: 'Alice goal' })
    expect((await as('mallory').post('/tasks', { title: 'x', size: 'small', goalId: goal.id })).status).toBe(400)
  })
})
