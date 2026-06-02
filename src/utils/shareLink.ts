import type { Deck } from '../hooks/useDecks'

export function encodeShareLink(deck: Deck): string {
  return encodeURIComponent(JSON.stringify({ name: deck.name, terms: deck.terms }))
}

export function decodeShareLink(param: string): Omit<Deck, 'id'> | null {
  try {
    const obj = JSON.parse(decodeURIComponent(param))
    if (typeof obj?.name !== 'string' || !Array.isArray(obj?.terms)) return null
    if (obj.terms.length === 0) return null
    const isValid = obj.terms.every(
      (t: unknown) => typeof (t as Record<string, unknown>)?.term === 'string' &&
                     typeof (t as Record<string, unknown>)?.definition === 'string'
    )
    if (!isValid) return null
    return { name: obj.name, terms: obj.terms }
  } catch {
    return null
  }
}
