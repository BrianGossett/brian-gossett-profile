import { ApiError } from '../api/client'
import type { CompleteResult, Goal, Reward, Routine, Task, TodayDaily, TodayTask } from '../Pages/TodoPage/types'

const task = (id: string, title: string, extra: Partial<TodayTask> = {}): TodayTask => ({
  id, kind: 'task', title, size: 'small', why: null, goalId: null, dueDate: null, status: 'open', completedDate: null, feel: null, ...extra,
})
const daily = (id: string, title: string, extra: Partial<TodayDaily> = {}): TodayDaily => ({
  ...task(id, title), kind: 'daily', doneToday: false, streak: { current: 0, longest: 0 }, ...extra,
})

/** A small in-memory stand-in for the to-do routes, close enough to drive the screens. */
export function createFakeTodoApi() {
  const state = {
    balance: 126,
    timezone: 'America/Chicago',
    goals: [{ id: 'g1', name: 'Get fit', why: 'Keep up with the kids' }] as Goal[],
    dailies: [
      daily('d_1', 'Stretch', { size: 'medium', streak: { current: 6, longest: 9 }, goalId: 'g1', why: 'Loosen up the back' }),
      daily('d_2', 'Brush teeth', { doneToday: true, streak: { current: 3, longest: 3 } }),
    ],
    tasks: [task('t_1', 'File taxes', { size: 'large', dueDate: '2026-11-30' }), task('t_0', 'Old chore', { status: 'done', completedDate: '2026-11-01' })],
    rewards: [{ id: 'r1', name: 'Movie night', cost: 50 }, { id: 'r2', name: 'New game', cost: 300 }] as Reward[],
    schedules: [] as Routine[],
    templates: [{ id: 'morning', name: 'Morning routine', items: [{ title: 'Make the bed', size: 'small' }, { title: 'Stretch for 10 minutes', size: 'medium' }] }] as Routine[],
    earnedToday: 1,
    oneMoreUsed: false,
    /** What the next completion returns, to exercise bonuses. */
    nextResult: null as Partial<CompleteResult> | null,
  }
  const calls: { call: string; body?: unknown; query?: Record<string, string> }[] = []
  let n = 0
  const base = { small: 1, medium: 2, large: 3 }
  const find = (id: string) => [...state.dailies, ...state.tasks].find(t => t.id === id)

  async function api<T = unknown>(path: string, options: { method?: string; body?: unknown; query?: Record<string, string> } = {}): Promise<T> {
    const call = `${options.method ?? 'GET'} ${path}`
    calls.push({ call, body: options.body, query: options.query })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- a test fake: bodies are whatever the screens send
    const body = (options.body ?? {}) as any
    const [, root, id, verb] = path.split('/')
    const reply = (value: unknown) => structuredClone(value) as T

    if (call === 'GET /me') return reply({ name: 'Brian', email: 'b@example.com', points: state.balance, timezone: state.timezone })
    if (call === 'PATCH /me') { state.timezone = body.timezone; return reply({}) }
    if (call === 'GET /today') {
      const allDone = state.dailies.length > 0 && state.dailies.every(d => d.doneToday)
      return reply({
        date: '2026-11-21', timezone: state.timezone, balance: state.balance, earnedToday: state.earnedToday,
        dailies: state.dailies,
        tasks: state.tasks.filter(t => t.status !== 'done' || t.completedDate === '2026-11-21'),
        oneMore: { available: allDone && !state.oneMoreUsed },
      })
    }
    if (call === 'GET /tasks') return reply({ dailies: state.dailies, tasks: state.tasks })
    if (call === 'POST /tasks') {
      const { repeat, ...fields } = body as Record<string, unknown>
      if (repeat === 'daily') state.dailies.push(daily(`d_n${++n}`, '', fields as Partial<TodayDaily>))
      else state.tasks.push(task(`t_n${++n}`, '', fields as Partial<TodayTask>))
      return reply({})
    }
    if (root === 'tasks' && verb === 'complete') {
      const item = find(id)
      if (!item) throw new ApiError(404, 'Task not found')
      const points = state.nextResult?.points ?? base[item.size]
      let streak = null
      if (item.kind === 'daily') {
        const d = item as TodayDaily
        d.doneToday = true
        d.streak = { current: d.streak.current + 1, longest: Math.max(d.streak.longest, d.streak.current + 1) }
        streak = d.streak
      } else {
        item.status = 'done'
        item.completedDate = '2026-11-21'
      }
      state.balance += points
      state.earnedToday += points
      const result = { id, points, awards: [{ reason: item.kind, amount: base[item.size] }], streak, balance: state.balance, ...state.nextResult }
      state.nextResult = null
      return reply(result)
    }
    if (root === 'tasks' && verb === 'feel') { find(id)!.feel = body.feel; return reply({ id, feel: body.feel }) }
    if (root === 'tasks' && options.method === 'PATCH') { Object.assign(find(id) as Task, body); return reply(find(id)) }
    if (root === 'tasks' && options.method === 'DELETE') {
      state.dailies = state.dailies.filter(t => t.id !== id)
      state.tasks = state.tasks.filter(t => t.id !== id)
      return undefined as T
    }
    if (call === 'GET /goals') return reply({ goals: state.goals })
    if (call === 'POST /goals') { state.goals.push({ id: `g_n${++n}`, ...(body as Omit<Goal, 'id'>) }); return reply({}) }
    if (root === 'goals' && options.method === 'PATCH') { Object.assign(state.goals.find(g => g.id === id)!, body); return reply({}) }
    if (root === 'goals' && options.method === 'DELETE') { state.goals = state.goals.filter(g => g.id !== id); return undefined as T }
    if (call === 'GET /rewards') return reply({ rewards: state.rewards })
    if (call === 'POST /rewards') { state.rewards.push({ id: `r_n${++n}`, ...(body as Omit<Reward, 'id'>) }); return reply({}) }
    if (root === 'rewards' && verb === 'redeem') {
      const reward = state.rewards.find(r => r.id === id)!
      if (state.balance < reward.cost) throw new ApiError(409, `Not enough points: this costs ${reward.cost} and you have ${state.balance}`)
      state.balance -= reward.cost
      return reply({ balance: state.balance })
    }
    if (root === 'rewards' && options.method === 'DELETE') { state.rewards = state.rewards.filter(r => r.id !== id); return undefined as T }
    if (call === 'GET /summary') {
      return reply({
        period: options.query?.period, from: '2026-11-16', to: '2026-11-22', earned: 84, streakBonuses: 20, spent: 50, completions: 31,
        byGoal: [{ goalId: 'g1', completions: 20, points: 60 }, { goalId: null, completions: 11, points: 24 }],
        feelings: { energized: 5, neutral: 2, drained: 3 },
        draining: [{ itemId: 't_9', title: 'Clear the inbox', count: 3 }],
      })
    }
    if (call === 'GET /heatmap') return reply({ from: '2025-11-22', to: '2026-11-21', days: [{ date: '2026-11-20', completions: 4, points: 7 }] })
    if (call === 'GET /schedules') return reply({ schedules: state.schedules, templates: state.templates })
    if (call === 'POST /schedules') {
      const template = state.templates.find(t => t.id === body.templateId)
      state.schedules.push(template ? { ...template, id: `s_n${++n}` } : { id: `s_n${++n}`, ...(body as Omit<Routine, 'id'>) })
      return reply({})
    }
    if (root === 'schedules' && verb === 'apply') {
      for (const item of state.schedules.find(s => s.id === id)!.items) state.dailies.push(daily(`d_n${++n}`, item.title, { size: item.size }))
      return reply({})
    }
    throw new ApiError(404, `No fake route for ${call}`)
  }

  return { api, state, calls, called: (call: string) => calls.filter(c => c.call === call) }
}
