import { createApp } from '../app'

describe('goals', () => {
  it('creates, renames, lists and deletes', async () => {
    const { user } = createApp()
    const { data: goal } = await user.post('/goals', { name: 'Get fit' })
    expect((await user.patch(`/goals/${goal.id}`, { name: 'Stay fit' })).data.name).toBe('Stay fit')
    expect((await user.get('/goals')).data.goals).toEqual([expect.objectContaining({ id: goal.id, name: 'Stay fit' })])
    expect((await user.del(`/goals/${goal.id}`)).status).toBe(204)
    expect((await user.get('/goals')).data.goals).toEqual([])
  })

  it('requires a name', async () => {
    const { user } = createApp()
    expect((await user.post('/goals', {})).status).toBe(400)
  })

  it('keeps each user\'s goals private', async () => {
    const { as } = createApp()
    const { data: goal } = await as('alice').post('/goals', { name: 'Private' })
    expect((await as('mallory').get('/goals')).data.goals).toEqual([])
    expect((await as('mallory').patch(`/goals/${goal.id}`, { name: 'Hacked' })).status).toBe(404)
  })
})

describe('schedules', () => {
  it('offers example schedules to choose from', async () => {
    const { user } = createApp()
    const { data } = await user.get('/schedules')
    expect(data.schedules).toEqual([])
    expect(data.templates.length).toBeGreaterThanOrEqual(3)
    for (const t of data.templates) {
      expect(t.items.length).toBeGreaterThan(0)
      for (const item of t.items) expect(['small', 'medium', 'large']).toContain(item.size)
    }
  })

  it('creates a schedule from an example', async () => {
    const { user } = createApp()
    const res = await user.post('/schedules', { templateId: 'morning' })
    expect(res.status).toBe(201)
    expect(res.data).toMatchObject({ name: 'Morning routine' })
    expect(res.data.items.length).toBeGreaterThan(0)
  })

  it('creates, edits and deletes a custom schedule', async () => {
    const { user } = createApp()
    const { data: schedule } = await user.post('/schedules', { name: 'Mine', items: [{ title: 'Read', size: 'medium' }] })
    const edited = await user.put(`/schedules/${schedule.id}`, { items: [{ title: 'Read', size: 'large' }, { title: 'Write', size: 'small' }] })
    expect(edited.data.items).toHaveLength(2)
    expect((await user.del(`/schedules/${schedule.id}`)).status).toBe(204)
    expect((await user.get('/schedules')).data.schedules).toEqual([])
  })

  it.each([
    [{ name: 'x' }],
    [{ name: 'x', items: [] }],
    [{ name: 'x', items: [{ title: 'a', size: 'giant' }] }],
    [{ name: 'x', items: [{ size: 'small' }] }],
    [{ templateId: 'nope' }],
  ])('rejects %j', async input => {
    const { user } = createApp()
    expect((await user.post('/schedules', input)).status).toBe(400)
  })

  it('applying a schedule creates its dailies, which then earn points', async () => {
    const { user } = createApp()
    const { data: schedule } = await user.post('/schedules', { name: 'Mine', items: [{ title: 'Read', size: 'medium' }, { title: 'Walk', size: 'small' }] })
    const applied = await user.post(`/schedules/${schedule.id}/apply`)
    expect(applied.status).toBe(201)
    expect(applied.data.dailies).toEqual([
      expect.objectContaining({ kind: 'daily', title: 'Read', size: 'medium', scheduleId: schedule.id }),
      expect.objectContaining({ kind: 'daily', title: 'Walk', size: 'small', scheduleId: schedule.id }),
    ])
    expect((await user.get('/today')).data.dailies).toHaveLength(2)
    expect((await user.post(`/tasks/${applied.data.dailies[0].id}/complete`)).data.points).toBe(2)
  })

  it('keeps each user\'s schedules to their own household', async () => {
    const { as } = createApp()
    const { data: schedule } = await as('alice').post('/schedules', { name: 'Private', items: [{ title: 'a', size: 'small' }] })
    const mallory = as('mallory')
    expect((await mallory.get('/schedules')).data.schedules).toEqual([])
    expect((await mallory.put(`/schedules/${schedule.id}`, { name: 'Hacked' })).status).toBe(404)
    expect((await mallory.post(`/schedules/${schedule.id}/apply`)).status).toBe(404)
    await mallory.del(`/schedules/${schedule.id}`)
    expect((await as('alice').get('/schedules')).data.schedules).toHaveLength(1)
  })

  it('refuses a household the user is not a member of', async () => {
    const { as, db } = createApp()
    await as('alice').post('/schedules', { name: 'Private', items: [{ title: 'a', size: 'small' }] })
    await as('mallory').get('/me')
    // Even if a profile somehow pointed at another household, membership is still checked.
    const profile = db.items.get('USER#mallory|PROFILE')!
    db.items.set('USER#mallory|PROFILE', { ...profile, householdId: 'alice' })
    expect((await as('mallory').get('/schedules')).status).toBe(403)
    expect((await as('mallory').post('/schedules', { templateId: 'morning' })).status).toBe(403)
  })
})
