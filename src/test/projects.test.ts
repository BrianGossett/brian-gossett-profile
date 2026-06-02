import { describe, it, expect } from 'vitest'
import { PROJECTS } from '../data/projects'

describe('PROJECTS data', () => {
  it('has at least 2 projects', () => {
    expect(PROJECTS.length).toBeGreaterThanOrEqual(2)
  })

  it('each project has all required fields', () => {
    PROJECTS.forEach(p => {
      expect(typeof p.id).toBe('string')
      expect(typeof p.name).toBe('string')
      expect(typeof p.icon).toBe('string')
      expect(typeof p.techSummary).toBe('string')
      expect(typeof p.description).toBe('string')
      expect(typeof p.githubUrl).toBe('string')
      expect(p.chips.length).toBeGreaterThan(0)
      expect(p.sections.length).toBeGreaterThan(0)
    })
  })

  it('each section has title, explanation, and code', () => {
    PROJECTS.forEach(p => {
      p.sections.forEach(s => {
        expect(typeof s.title).toBe('string')
        expect(s.title.length).toBeGreaterThan(0)
        expect(typeof s.explanation).toBe('string')
        expect(s.explanation.length).toBeGreaterThan(0)
        expect(typeof s.code).toBe('string')
        expect(s.code.length).toBeGreaterThan(0)
      })
    })
  })

  it('first project is AkashicOnline', () => {
    expect(PROJECTS[0].id).toBe('akashic')
  })
})
