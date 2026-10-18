import { describe, expect, it } from 'vitest'
import { formatSource } from './source'

describe('formatSource', () => {
  it('expands the book codes', () => {
    expect(formatSource('SB p.12')).toBe('Scenario Book p.12')
    expect(formatSource('LtP p.24')).toBe('Learn to Play p.24')
    expect(formatSource('Glossary p.18')).toBe('Rules Glossary p.18')
  })

  it('marks the community data and keeps card as it is', () => {
    expect(formatSource('GHS')).toBe('GHS (community data)')
    expect(formatSource('card')).toBe('card')
  })

  it('keeps comma-separated lists', () => {
    expect(formatSource('SB p.36, SB p.37, GHS')).toBe(
      'Scenario Book p.36, Scenario Book p.37, GHS (community data)'
    )
    expect(formatSource('LtP p.13, LtP p.23')).toBe('Learn to Play p.13, Learn to Play p.23')
  })

  it('leaves an unknown citation untouched', () => {
    expect(formatSource('Rulebook p.9')).toBe('Rulebook p.9')
  })
})
