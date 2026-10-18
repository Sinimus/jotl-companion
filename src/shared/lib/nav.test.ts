import { describe, expect, it } from 'vitest'
import { isInSection } from './nav'

const campaigns = { path: '/', sections: ['/campaign'] }
const rules = { path: '/rules', sections: ['/rules'] }

describe('isInSection', () => {
  it('marks Campaigns on the list and on every campaign screen, and nothing else', () => {
    expect(isInSection('/', campaigns)).toBe(true)
    expect(isInSection('/campaign/abc', campaigns)).toBe(true)
    expect(isInSection('/campaign/abc/character/def', campaigns)).toBe(true)
    expect(isInSection('/rules', campaigns)).toBe(false)
    expect(isInSection('/settings', campaigns)).toBe(false)
  })

  it('does not mistake a longer first segment for the section', () => {
    expect(isInSection('/rules-of-thumb', rules)).toBe(false)
    expect(isInSection('/rules/glossary', rules)).toBe(true)
  })
})
