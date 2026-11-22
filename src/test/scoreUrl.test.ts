import { describe, expect, it } from 'vitest'
import { ALL_SCORES } from '../data/scores'
import { scoreUrl } from '../utils/scoreUrl'

const base = 'https://bucket.s3.us-east-2.amazonaws.com/scores'

describe('scoreUrl', () => {
  it('uses the site path when no storage URL is set', () => {
    expect(scoreUrl('/scores/9 Bach Orchestral Suite No 3.pdf', '')).toBe('/scores/9%20Bach%20Orchestral%20Suite%20No%203.pdf')
    expect(scoreUrl('/scores/a.pdf', undefined)).toBe('/scores/a.pdf')
  })

  it('points at storage when a URL is set, encoding the file name', () => {
    expect(scoreUrl('/scores/9 Bach Orchestral Suite No 3.pdf', base)).toBe(`${base}/9%20Bach%20Orchestral%20Suite%20No%203.pdf`)
    expect(scoreUrl('/scores/a&b #1.pdf', `${base}/`)).toBe(`${base}/a%26b%20%231.pdf`)
  })

  it('leaves a path outside /scores/ alone', () => {
    expect(scoreUrl('/other/a.pdf', base)).toBe('/other/a.pdf')
  })

  it('every score in the data lives under /scores/', () => {
    for (const score of ALL_SCORES) expect(score.pdfPath).toMatch(/^\/scores\/[^/]+\.pdf$/)
  })
})
