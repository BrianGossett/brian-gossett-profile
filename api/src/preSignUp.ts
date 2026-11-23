import { GetParameterCommand, ParameterNotFound, SSMClient } from '@aws-sdk/client-ssm'
import type { PreSignUpTriggerEvent } from 'aws-lambda'

/**
 * Cognito runs this the first time a Google account signs in. It refuses the
 * sign-up unless the account's email is on the owner's list, which is kept in
 * Parameter Store (comma-separated) so it can change without a deploy.
 * People who already have an account never reach this check.
 */
export const REFUSED = 'Sign-in is by invitation only. Ask the site owner to add your email address.'

/** How long a loaded list is reused before it is read again. */
export const LIST_TTL_MS = 2 * 60 * 1000

export function parseAllowList(value: string | undefined): Set<string> {
  return new Set((value ?? '').split(',').map(email => email.trim().toLowerCase()).filter(Boolean))
}

export function isAllowed(email: unknown, list: Set<string>): boolean {
  return typeof email === 'string' && list.has(email.trim().toLowerCase())
}

/** The trigger, with the list loader and clock passed in so it can be tested. */
export function createPreSignUp(loadList: () => Promise<Set<string>>, now: () => number = Date.now) {
  let cached: { list: Set<string>; at: number } | undefined
  return async (event: PreSignUpTriggerEvent): Promise<PreSignUpTriggerEvent> => {
    if (!cached || now() - cached.at >= LIST_TTL_MS) cached = { list: await loadList(), at: now() }
    // An empty or missing list refuses everyone: the check fails closed.
    if (!isAllowed(event.request.userAttributes.email, cached.list)) throw new Error(REFUSED)
    return event
  }
}

async function loadFromParameterStore(): Promise<Set<string>> {
  const name = process.env.ALLOWED_EMAILS_PARAM
  if (!name) throw new Error('ALLOWED_EMAILS_PARAM is not set')
  try {
    const result = await new SSMClient({}).send(new GetParameterCommand({ Name: name }))
    return parseAllowList(result.Parameter?.Value)
  } catch (err) {
    if (err instanceof ParameterNotFound) return new Set()
    throw err
  }
}

export const handler = createPreSignUp(loadFromParameterStore)
