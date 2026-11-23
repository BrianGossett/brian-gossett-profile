import type { PreSignUpTriggerEvent } from 'aws-lambda'
import { LIST_TTL_MS, REFUSED, createPreSignUp, isAllowed, parseAllowList } from '../src/preSignUp'

const event = (email?: string) =>
  ({ triggerSource: 'PreSignUp_ExternalProvider', request: { userAttributes: email === undefined ? {} : { email } }, response: {} }) as unknown as PreSignUpTriggerEvent

describe('parseAllowList', () => {
  it('reads a comma-separated list, ignoring case, spaces and blanks', () => {
    expect([...parseAllowList(' Me@Example.com, you@example.com ,,')]).toEqual(['me@example.com', 'you@example.com'])
    expect(parseAllowList(undefined).size).toBe(0)
    expect(parseAllowList('').size).toBe(0)
  })
})

describe('isAllowed', () => {
  const list = parseAllowList('me@example.com')
  it('matches in any letter case', () => {
    expect(isAllowed('ME@example.com', list)).toBe(true)
    expect(isAllowed(' me@example.com ', list)).toBe(true)
  })
  it('refuses other addresses, near misses and missing emails', () => {
    expect(isAllowed('you@example.com', list)).toBe(false)
    expect(isAllowed('me@example.com.evil.test', list)).toBe(false)
    expect(isAllowed(undefined, list)).toBe(false)
  })
})

describe('pre-sign-up trigger', () => {
  it('lets a listed email through unchanged', async () => {
    const trigger = createPreSignUp(async () => parseAllowList('me@example.com'))
    const e = event('Me@Example.com')
    expect(await trigger(e)).toBe(e)
  })

  it('refuses an unlisted email with a clear message', async () => {
    const trigger = createPreSignUp(async () => parseAllowList('me@example.com'))
    await expect(trigger(event('stranger@example.com'))).rejects.toThrow(REFUSED)
    await expect(trigger(event())).rejects.toThrow(REFUSED)
  })

  it('refuses everyone when the list is empty or missing', async () => {
    const trigger = createPreSignUp(async () => new Set())
    await expect(trigger(event('me@example.com'))).rejects.toThrow(REFUSED)
  })

  it('picks up a changed list after a couple of minutes, without reloading on every call', async () => {
    let value = 'me@example.com'
    let time = 0
    const load = vi.fn(async () => parseAllowList(value))
    const trigger = createPreSignUp(load, () => time)
    await trigger(event('me@example.com'))
    value = 'me@example.com,new@example.com'
    await expect(trigger(event('new@example.com'))).rejects.toThrow(REFUSED)
    expect(load).toHaveBeenCalledTimes(1)
    time = LIST_TTL_MS
    await trigger(event('new@example.com'))
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('does not let anyone in when the list cannot be read', async () => {
    const trigger = createPreSignUp(async () => { throw new Error('Parameter Store is down') })
    await expect(trigger(event('me@example.com'))).rejects.toThrow('Parameter Store is down')
  })
})
