import { describe, expect, it } from 'vitest'
import { parseTab, tabSearch } from './tabs'

const TABS = ['party', 'scenarios', 'treasures'] as const

describe('parseTab', () => {
  it('accepts a known tab', () => {
    expect(parseTab('scenarios', TABS, 'party')).toBe('scenarios')
  })

  it('falls back for a missing, unknown or differently cased value', () => {
    expect(parseTab(null, TABS, 'party')).toBe('party')
    expect(parseTab('spoilers', TABS, 'party')).toBe('party')
    expect(parseTab('Scenarios', TABS, 'party')).toBe('party')
    expect(parseTab('', TABS, 'party')).toBe('party')
  })
})

describe('tabSearch', () => {
  it('writes the tab parameter', () => {
    expect(tabSearch(new URLSearchParams(), 'treasures', 'party')).toBe('?tab=treasures')
  })

  it('leaves no parameter for the default tab', () => {
    expect(tabSearch(new URLSearchParams('tab=treasures'), 'party', 'party')).toBe('')
  })

  it('keeps other parameters and does not change its input', () => {
    const current = new URLSearchParams('a=1&tab=party')
    expect(tabSearch(current, 'scenarios', 'party')).toBe('?a=1&tab=scenarios')
    expect(current.toString()).toBe('a=1&tab=party')
  })
})
