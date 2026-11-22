import { handler } from '../src/handler'
import { makeEvent } from './helpers'

describe('handler', () => {
  it('fails clearly when TABLE_NAME is missing', async () => {
    delete process.env.TABLE_NAME
    await expect(handler(makeEvent('GET', '/me'))).rejects.toThrow('TABLE_NAME')
  })
})
