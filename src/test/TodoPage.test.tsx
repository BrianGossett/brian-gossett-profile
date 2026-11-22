import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ChakraProvider } from '@chakra-ui/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { system } from '../Theme'
import TodoPage from '../Pages/TodoPage'
import { createFakeTodoApi } from './fakeTodoApi'

const mocks = vi.hoisted(() => ({
  api: vi.fn(),
  auth: { available: true, isSignedIn: true, user: { sub: 'u1', name: 'Brian', email: 'b@example.com' }, signIn: vi.fn(), signOut: vi.fn(), getToken: vi.fn() },
  completeSignIn: vi.fn(),
}))

vi.mock('../api/client', async importOriginal => ({ ...(await importOriginal<object>()), api: mocks.api }))
vi.mock('../auth/authContext', () => ({ useAuth: () => mocks.auth }))
vi.mock('../auth/signIn', async importOriginal => ({ ...(await importOriginal<object>()), completeSignIn: mocks.completeSignIn }))

let fake: ReturnType<typeof createFakeTodoApi>

function renderTodo(path = '/todo') {
  return render(
    <ChakraProvider value={system}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/todo/:tab?" element={<TodoPage />} />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>,
  )
}

const balance = () => screen.getByLabelText('Points balance').textContent
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))
const type = (label: string | RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } })

beforeEach(() => {
  fake = createFakeTodoApi()
  mocks.api.mockReset().mockImplementation(fake.api)
  mocks.completeSignIn.mockReset()
  mocks.auth.available = true
  mocks.auth.isSignedIn = true
  mocks.auth.signIn.mockReset()
})

describe('/todo signed out', () => {
  it('asks for sign-in and calls no API', () => {
    mocks.auth.isSignedIn = false
    renderTodo()
    click('Sign in with Google')
    expect(mocks.auth.signIn).toHaveBeenCalledWith('/todo')
    expect(mocks.api).not.toHaveBeenCalled()
  })

  it('finishes the Cognito callback, then shows the to-do app', async () => {
    mocks.auth.isSignedIn = false
    mocks.completeSignIn.mockImplementation(async () => { mocks.auth.isSignedIn = true; return '/todo' })
    renderTodo('/todo?code=abc123&state=xyz')
    expect(screen.getByText('Signing you in…')).toBeTruthy()
    expect(await screen.findByRole('heading', { name: 'Saturday, November 21' })).toBeTruthy()
    expect(mocks.completeSignIn).toHaveBeenCalledTimes(1)
  })
})

describe('Today', () => {
  it('shows the balance, today\'s dailies with streaks, and open tasks', async () => {
    renderTodo()
    expect(await screen.findByRole('heading', { name: 'Saturday, November 21' })).toBeTruthy()
    expect(balance()).toBe('126')
    expect(screen.getByText('+1 today · 1 of 2 dailies done')).toBeTruthy()
    const dailies = within(screen.getByRole('list', { name: 'Dailies' }))
    expect(dailies.getByRole('checkbox', { name: 'Complete Stretch' }).getAttribute('aria-checked')).toBe('false')
    expect(dailies.getByRole('checkbox', { name: 'Complete Brush teeth' }).getAttribute('aria-checked')).toBe('true')
    expect(dailies.getByTitle('6-day streak')).toBeTruthy()
    const tasks = within(screen.getByRole('list', { name: 'Tasks' }))
    expect(tasks.getByText('File taxes')).toBeTruthy()
    expect(tasks.getByText('Due Nov 30')).toBeTruthy()
    expect(tasks.queryByText('Old chore')).toBeNull()
  })

  it('completing a daily shows what was earned and updates points and streak from the API', async () => {
    renderTodo()
    fake.state.nextResult = { points: 12, awards: [{ reason: 'daily', amount: 2 }, { reason: 'streak-week', amount: 10 }] }
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Complete Stretch' }))
    expect((await screen.findByRole('status')).textContent).toContain('+2 points · 7-day streak · +10 weekly streak bonus')
    expect(balance()).toBe('138')
    expect(screen.getByRole('checkbox', { name: 'Complete Stretch' }).getAttribute('aria-checked')).toBe('true')
    expect(await screen.findByTitle('7-day streak')).toBeTruthy()
    expect(await screen.findByText('+13 today · 2 of 2 dailies done')).toBeTruthy()
    expect(fake.called('POST /tasks/d_1/complete')).toHaveLength(1)
  })

  it('offers "one more" once every daily is done', async () => {
    renderTodo()
    await screen.findByRole('list', { name: 'Dailies' })
    expect(screen.queryByText('All dailies done. One more?')).toBeNull()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Complete Stretch' }))
    expect(await screen.findByText('All dailies done. One more?')).toBeTruthy()
    expect(screen.getByText('The next task you finish today counts double.')).toBeTruthy()
  })

  it('asks how a finished item felt and saves the answer', async () => {
    renderTodo()
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Complete Stretch' }))
    const group = await screen.findByRole('group', { name: 'How did that feel?' })
    fireEvent.click(within(group).getByRole('button', { name: /Drained/ }))
    await waitFor(() => expect(fake.called('POST /tasks/d_1/feel')[0]?.body).toEqual({ feel: 'drained' }))
    expect(within(group).getByRole('button', { name: /Drained/ }).getAttribute('aria-pressed')).toBe('true')
  })

  it('shows a task\'s "why" when it is opened', async () => {
    renderTodo()
    fireEvent.click(await screen.findByRole('button', { name: 'Stretch' }))
    expect(screen.getByText('Why: Loosen up the back')).toBeTruthy()
  })

  it('adds a task with a size, once or every day', async () => {
    renderTodo()
    await screen.findByRole('form', { name: 'Quick add' })
    type('Add a task', 'Call the dentist')
    fireEvent.click(screen.getByRole('radio', { name: /^medium/ }))
    click('Add')
    await waitFor(() => expect(fake.called('POST /tasks')[0]?.body).toEqual({ title: 'Call the dentist', size: 'medium', repeat: 'none' }))
    expect(await screen.findByText('Call the dentist')).toBeTruthy()
    expect((screen.getByLabelText('Add a task') as HTMLInputElement).value).toBe('')

    type('Add a task', 'Floss')
    click('↻ Once')
    click('Add')
    await waitFor(() => expect(fake.called('POST /tasks')[1]?.body).toMatchObject({ title: 'Floss', repeat: 'daily' }))
  })

  it('shows the API\'s message when a completion is refused', async () => {
    renderTodo()
    const box = await screen.findByRole('checkbox', { name: 'Complete Stretch' })
    mocks.api.mockRejectedValueOnce(new Error('Already completed today'))
    fireEvent.click(box)
    expect((await screen.findByRole('alert')).textContent).toContain('Already completed today')
    expect(balance()).toBe('126')
  })
})

describe('Tasks', () => {
  it('groups tasks and dailies by goal, with the goal\'s why', async () => {
    renderTodo('/todo/tasks')
    const fit = within(await screen.findByRole('region', { name: 'Get fit' }))
    expect(fit.getByText('Why: Keep up with the kids')).toBeTruthy()
    expect(fit.getByText('Stretch')).toBeTruthy()
    const none = within(screen.getByRole('region', { name: 'No goal' }))
    expect(none.getByText('File taxes')).toBeTruthy()
    expect(none.queryByText('Old chore')).toBeNull()
    click('Show finished tasks (1)')
    expect(screen.getByText('Old chore')).toBeTruthy()
  })

  it('creates a goal and a task with a why under it', async () => {
    renderTodo('/todo/tasks')
    await screen.findByRole('region', { name: 'Get fit' })
    click('+ Goal')
    type('Goal name', 'Home')
    type('Why it matters (optional)', 'A calmer house')
    click('Add goal')
    await screen.findByRole('region', { name: 'Home' })
    expect(fake.called('POST /goals')[0].body).toEqual({ name: 'Home', why: 'A calmer house' })

    click('+ Task')
    type('Title', 'Fix the gate')
    fireEvent.change(screen.getByLabelText('Goal'), { target: { value: fake.state.goals[1].id } })
    type('Why it matters (optional)', 'It sticks')
    click('Add task')
    expect(await within(screen.getByRole('region', { name: 'Home' })).findByText('Fix the gate')).toBeTruthy()
    expect(fake.called('POST /tasks')[0].body).toEqual({ title: 'Fix the gate', size: 'small', goalId: fake.state.goals[1].id, why: 'It sticks', dueDate: null, repeat: 'none' })
  })

  it('edits and deletes a task, asking before deleting', async () => {
    renderTodo('/todo/tasks')
    await screen.findByRole('region', { name: 'No goal' })
    click('Edit File taxes')
    type('Title', 'File the taxes')
    click('Save')
    expect(await screen.findByText('File the taxes')).toBeTruthy()
    expect(fake.called('PATCH /tasks/t_1')[0].body).toMatchObject({ title: 'File the taxes', size: 'large', dueDate: '2026-11-30' })

    click('Edit File the taxes')
    click('Delete')
    expect(fake.called('DELETE /tasks/t_1')).toHaveLength(0)
    click('Delete task')
    await waitFor(() => expect(screen.queryByText('File the taxes')).toBeNull())
  })
})

describe('Rewards', () => {
  it('redeems an affordable reward after a second tap and updates the balance', async () => {
    renderTodo('/todo/rewards')
    const card = within(await screen.findByRole('article', { name: 'Movie night' }))
    fireEvent.click(card.getByRole('button', { name: 'Redeem' }))
    expect(fake.called('POST /rewards/r1/redeem')).toHaveLength(0)
    fireEvent.click(card.getByRole('button', { name: 'Spend 50 pts' }))
    expect((await screen.findByRole('status')).textContent).toContain('Redeemed "Movie night" for 50 points')
    expect(balance()).toBe('76')
  })

  it('shows how far away a reward is when the balance is short', async () => {
    renderTodo('/todo/rewards')
    const card = within(await screen.findByRole('article', { name: 'New game' }))
    expect(card.getByText('174 pts to go')).toBeTruthy()
    expect(card.queryByRole('button', { name: 'Redeem' })).toBeNull()
    expect(card.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('126')
  })

  it('adds a reward with a whole-number cost', async () => {
    renderTodo('/todo/rewards')
    await screen.findByRole('article', { name: 'Movie night' })
    type('Reward', 'Day off')
    type('Cost in points', '2.5')
    expect((screen.getByRole('button', { name: 'Add' }) as HTMLButtonElement).disabled).toBe(true)
    type('Cost in points', '80')
    click('Add')
    expect(await screen.findByRole('article', { name: 'Day off' })).toBeTruthy()
    expect(fake.called('POST /rewards')[0].body).toEqual({ name: 'Day off', cost: 80 })
  })
})

describe('Stats', () => {
  it('shows the summary, per-goal split, feelings and heatmap, and switches period', async () => {
    renderTodo('/todo/stats')
    expect(await screen.findByText('84')).toBeTruthy()
    expect(screen.getByText('Nov 16 to Nov 22')).toBeTruthy()
    expect(screen.getByText('60 pts · 20 done')).toBeTruthy()
    expect(await screen.findByText('Get fit')).toBeTruthy()
    expect(screen.getByText('Clear the inbox')).toBeTruthy()
    expect(await screen.findByRole('img', { name: /something done on 1 days/ })).toBeTruthy()
    expect(fake.called('GET /summary')[0].query).toEqual({ period: 'week' })
    fireEvent.click(screen.getByRole('tab', { name: 'Month' }))
    await waitFor(() => expect(fake.called('GET /summary')[1]?.query).toEqual({ period: 'month' }))
  })
})

describe('Routines', () => {
  it('saves an example routine, then adds its dailies', async () => {
    renderTodo('/todo/routines')
    fireEvent.click(await screen.findByRole('button', { name: 'Save Morning routine to my routines' }))
    const mine = within(await screen.findByRole('article', { name: 'Morning routine' }))
    expect(fake.called('POST /schedules')[0].body).toEqual({ templateId: 'morning' })
    fireEvent.click(mine.getByRole('button', { name: 'Add the dailies from Morning routine' }))
    expect(await screen.findByText('Added 2 dailies from "Morning routine" to Today.')).toBeTruthy()
    expect(fake.state.dailies.map(d => d.title)).toContain('Make the bed')
  })

  it('creates a routine from scratch, dropping blank rows', async () => {
    renderTodo('/todo/routines')
    fireEvent.click(await screen.findByRole('button', { name: '+ New routine' }))
    type('Routine name', 'Gym days')
    type('Daily 1', 'Pack the bag')
    click('+ Add a daily')
    click('Save routine')
    expect(await screen.findByRole('article', { name: 'Gym days' })).toBeTruthy()
    expect(fake.called('POST /schedules')[0].body).toEqual({ name: 'Gym days', items: [{ title: 'Pack the bag', size: 'small' }] })
  })
})

describe('tabs and settings', () => {
  it('moves between the five tabs', async () => {
    renderTodo()
    const nav = within(screen.getByRole('navigation', { name: 'To-do sections' }))
    expect(nav.getAllByRole('link').map(a => a.textContent)).toEqual(['☀Today', '☰Tasks', '★Rewards', '▦Stats', '↻Routines'])
    fireEvent.click(nav.getByRole('link', { name: /Rewards/ }))
    expect(await screen.findByRole('article', { name: 'Movie night' })).toBeTruthy()
    expect(nav.getByRole('link', { name: /Rewards/ }).getAttribute('aria-current')).toBe('page')
  })

  it('changes the timezone from settings', async () => {
    renderTodo()
    await screen.findByRole('heading', { name: 'Saturday, November 21' })
    click('Settings')
    fireEvent.change(await screen.findByLabelText(/Timezone/), { target: { value: 'America/Denver' } })
    click('Save')
    await waitFor(() => expect(fake.called('PATCH /me')[0]?.body).toEqual({ timezone: 'America/Denver' }))
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Settings' })).toBeNull())
    expect(fake.called('GET /today').length).toBeGreaterThanOrEqual(2)
  })
})
