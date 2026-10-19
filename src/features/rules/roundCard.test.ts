import { describe, expect, it } from 'vitest'
import { ROUND_STEPS, ROUND_TOPICS } from './roundCard'

describe('round card', () => {
  it('has the four steps of a round in order (LtP p.6)', () => {
    expect(ROUND_STEPS.map((step) => step.title)).toEqual([
      '1. Card selection',
      '2. Ordering of initiative',
      '3. Turns',
      '4. End of round',
    ])
  })

  it('cites the Learn to Play Guide or the Rules Glossary with a page on every line', () => {
    const lines = [...ROUND_STEPS, ...ROUND_TOPICS].flatMap((part) => part.lines)
    expect(lines.length).toBeGreaterThan(20)
    for (const line of lines) {
      for (const part of line.source.split(', ')) {
        expect(part).toMatch(/^(LtP|Glossary) p\.\d+$/)
      }
    }
  })

  it('covers rests, negating damage, exhaustion and elements', () => {
    expect(ROUND_TOPICS.map((topic) => topic.title)).toEqual(
      expect.arrayContaining(['Short rest', 'Long rest', 'Negating damage', 'Exhaustion', 'Elements'])
    )
  })
})
