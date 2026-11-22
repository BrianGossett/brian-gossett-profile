import { createApp } from '../app'

async function withPoints(points: number) {
  const app = createApp()
  for (let i = 0; i < points / 3; i++) {
    const { data } = await app.user.post('/tasks', { title: `t${i}`, size: 'large' })
    await app.user.post(`/tasks/${data.id}/complete`)
  }
  return app
}

describe('rewards', () => {
  it('lets the user set the name and cost', async () => {
    const { user } = createApp()
    const created = await user.post('/rewards', { name: 'Movie night', cost: 25 })
    expect(created.status).toBe(201)
    expect(created.data).toMatchObject({ name: 'Movie night', cost: 25 })
    const edited = await user.patch(`/rewards/${created.data.id}`, { cost: 30 })
    expect(edited.data).toMatchObject({ name: 'Movie night', cost: 30 })
    expect((await user.get('/rewards')).data.rewards).toHaveLength(1)
  })

  it.each([0, -1, 2.5, '10', null])('rejects a cost of %j', async cost => {
    const { user } = createApp()
    expect((await user.post('/rewards', { name: 'x', cost })).status).toBe(400)
  })

  it('redeems a reward and takes its cost off the balance', async () => {
    const { user } = await withPoints(9)
    const { data: reward } = await user.post('/rewards', { name: 'Coffee', cost: 5 })
    const res = await user.post(`/rewards/${reward.id}/redeem`)
    expect(res.status).toBe(200)
    expect(res.data).toMatchObject({ cost: 5, balance: 4 })
    expect((await user.get('/me')).data.points).toBe(4)
  })

  it('redeems a reward that costs exactly the balance', async () => {
    const { user } = await withPoints(9)
    const { data: reward } = await user.post('/rewards', { name: 'x', cost: 9 })
    expect((await user.post(`/rewards/${reward.id}/redeem`)).data.balance).toBe(0)
  })

  it('refuses to redeem more points than the balance, and changes nothing', async () => {
    const { user, db } = await withPoints(9)
    const { data: reward } = await user.post('/rewards', { name: 'Holiday', cost: 10 })
    const res = await user.post(`/rewards/${reward.id}/redeem`)
    expect(res.status).toBe(409)
    expect(res.data.message).toContain('Not enough points')
    expect((await user.get('/me')).data.points).toBe(9)
    expect([...db.items.keys()].filter(k => k.includes('REDEEM#'))).toEqual([])
  })

  it('cannot overspend when two redemptions race', async () => {
    const { user } = await withPoints(9)
    const { data: reward } = await user.post('/rewards', { name: 'x', cost: 6 })
    const results = await Promise.all([user.post(`/rewards/${reward.id}/redeem`), user.post(`/rewards/${reward.id}/redeem`)])
    expect(results.map(r => r.status).sort()).toEqual([200, 409])
    expect((await user.get('/me')).data.points).toBe(3)
  })

  it('cannot redeem another user\'s reward', async () => {
    const { as } = createApp()
    const { data: reward } = await as('alice').post('/rewards', { name: 'x', cost: 1 })
    expect((await as('mallory').post(`/rewards/${reward.id}/redeem`)).status).toBe(404)
    expect((await as('mallory').get('/rewards')).data.rewards).toEqual([])
  })
})
