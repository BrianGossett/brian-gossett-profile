import type { Term } from './terms'

/**
 * Pokémon type matchups, all 18 types, Gen 6 onward. For each attacking type:
 * the types it is super effective against (s), the types that resist it (n),
 * and the types immune to it (i). Everything else is neutral.
 */
export const TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground',
  'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
] as const

export type PokemonType = (typeof TYPES)[number]

export const TYPE_CHART: Record<PokemonType, { s: PokemonType[]; n: PokemonType[]; i: PokemonType[] }> = {
  Normal:   { s: [], n: ['Rock', 'Steel'], i: ['Ghost'] },
  Fire:     { s: ['Grass', 'Ice', 'Bug', 'Steel'], n: ['Fire', 'Water', 'Rock', 'Dragon'], i: [] },
  Water:    { s: ['Fire', 'Ground', 'Rock'], n: ['Water', 'Grass', 'Dragon'], i: [] },
  Electric: { s: ['Water', 'Flying'], n: ['Electric', 'Grass', 'Dragon'], i: ['Ground'] },
  Grass:    { s: ['Water', 'Ground', 'Rock'], n: ['Fire', 'Grass', 'Poison', 'Flying', 'Bug', 'Dragon', 'Steel'], i: [] },
  Ice:      { s: ['Grass', 'Ground', 'Flying', 'Dragon'], n: ['Fire', 'Water', 'Ice', 'Steel'], i: [] },
  Fighting: { s: ['Normal', 'Ice', 'Rock', 'Dark', 'Steel'], n: ['Poison', 'Flying', 'Psychic', 'Bug', 'Fairy'], i: ['Ghost'] },
  Poison:   { s: ['Grass', 'Fairy'], n: ['Poison', 'Ground', 'Rock', 'Ghost'], i: ['Steel'] },
  Ground:   { s: ['Fire', 'Electric', 'Poison', 'Rock', 'Steel'], n: ['Grass', 'Bug'], i: ['Flying'] },
  Flying:   { s: ['Grass', 'Fighting', 'Bug'], n: ['Electric', 'Rock', 'Steel'], i: [] },
  Psychic:  { s: ['Fighting', 'Poison'], n: ['Psychic', 'Steel'], i: ['Dark'] },
  Bug:      { s: ['Grass', 'Psychic', 'Dark'], n: ['Fire', 'Fighting', 'Poison', 'Flying', 'Ghost', 'Steel', 'Fairy'], i: [] },
  Rock:     { s: ['Fire', 'Ice', 'Flying', 'Bug'], n: ['Fighting', 'Ground', 'Steel'], i: [] },
  Ghost:    { s: ['Psychic', 'Ghost'], n: ['Dark'], i: ['Normal'] },
  Dragon:   { s: ['Dragon'], n: ['Steel'], i: ['Fairy'] },
  Dark:     { s: ['Psychic', 'Ghost'], n: ['Fighting', 'Dark', 'Fairy'], i: [] },
  Steel:    { s: ['Ice', 'Rock', 'Fairy'], n: ['Fire', 'Water', 'Electric', 'Steel'], i: [] },
  Fairy:    { s: ['Fighting', 'Dragon', 'Dark'], n: ['Fire', 'Poison', 'Steel'], i: [] },
}

/** The damage multiplier when `attacker` hits `defender`: 2, 1, 0.5 or 0. */
export function effectiveness(attacker: PokemonType, defender: PokemonType): number {
  const row = TYPE_CHART[attacker]
  if (row.s.includes(defender)) return 2
  if (row.n.includes(defender)) return 0.5
  if (row.i.includes(defender)) return 0
  return 1
}

/** The types that deal `multiplier` damage to `defender`, in chart order. */
const attackersDealing = (defender: PokemonType, multiplier: number) =>
  TYPES.filter(attacker => effectiveness(attacker, defender) === multiplier)

/** The five questions asked about each type. `slot` gives each a fixed card ID. */
const QUESTIONS: { slot: number; category: string; prompt: (t: PokemonType) => string; answer: (t: PokemonType) => PokemonType[] }[] = [
  { slot: 1, category: 'Super effective against', prompt: t => `What is ${t} super effective against?`, answer: t => TYPE_CHART[t].s },
  { slot: 2, category: 'Resisted by',             prompt: t => `Which types resist ${t} attacks?`,      answer: t => TYPE_CHART[t].n },
  { slot: 3, category: 'Weak to',                 prompt: t => `What is ${t} weak to?`,                 answer: t => attackersDealing(t, 2) },
  { slot: 4, category: 'Resists',                 prompt: t => `What does ${t} resist?`,                answer: t => attackersDealing(t, 0.5) },
  { slot: 5, category: 'Immune to',               prompt: t => `What is ${t} immune to?`,               answer: t => attackersDealing(t, 0) },
]

/**
 * One card per type per question, skipping questions with no answer (for
 * example, Normal is super effective against nothing). The question is the
 * definition, which the study modes show; the list of types is the term, which
 * the user answers.
 *
 * IDs are fixed (type position × 10 + question slot), so saved progress stays
 * on the right card.
 */
export const POKEMON_TYPE_TERMS: Term[] = TYPES.flatMap((type, index) =>
  QUESTIONS.flatMap(q => {
    const answer = q.answer(type)
    if (answer.length === 0) return []
    return [{ id: (index + 1) * 10 + q.slot, category: q.category, term: answer.join(', '), definition: q.prompt(type) }]
  }),
)
