import { describe, expect, it } from 'vitest'
import {
  abilities,
  characters,
  conditions,
  elements,
  items,
  perks,
  rules,
  scenarios,
  treasures,
  type AbilityCard,
} from '@/data'

// Integrity of the game data: every entry carries its source, the sets match
// the printed game (52 item cards, Glossary p.29) and the character sheets.

const SOURCE_PATTERN =
  /^(LtP p\.\d+|Glossary p\.\d+|SB p\.\d+|card|GHS)(, (LtP p\.\d+|Glossary p\.\d+|SB p\.\d+|card|GHS))*$/

const SOURCE_TABLE: [string, () => string[]][] = [
  ['items', () => items.flatMap((item) => [item.source, ...item.unlock.map((u) => u.source)])],
  ['perks', () => perks.map((p) => p.source)],
  ['abilities', () => abilities.map((a) => a.source)],
  ['characters', () => characters.map((c) => c.source)],
  ['treasures', () => treasures.flatMap((t) => [t.source, t.scenarioSource])],
  [
    'scenarios',
    () =>
      scenarios.flatMap((s) => [
        s.source,
        s.unlocksSource,
        s.blocksSource,
        s.rewardsSource,
        s.treasuresSource,
      ]),
  ],
  ['conditions', () => conditions.map((c) => c.source)],
  ['elements', () => elements.map((e) => e.source)],
  ['rules.glossary', () => rules.glossary.map((g) => g.source)],
  ['rules.guides', () => rules.guides.map((g) => g.source)],
]

describe('source citations', () => {
  it.each(SOURCE_TABLE)('%s cites a source on every row', (_name, collect) => {
    const sources = collect()
    expect(sources.length).toBeGreaterThan(0)
    for (const source of sources) {
      expect(source).toMatch(SOURCE_PATTERN)
    }
  })
})

describe('rules glossary', () => {
  it('lists every term once', () => {
    const terms = rules.glossary.map((g) => g.term)
    expect(new Set(terms).size).toBe(terms.length)
  })

  it('files every entry under a category', () => {
    for (const entry of rules.glossary) {
      expect(entry.category.trim().length).toBeGreaterThan(0)
    }
  })

  it('has no term the game does not have', () => {
    const removed = ['Blood', 'Bone', 'Guard', 'Hide', 'Attribute', 'Revive']
    expect(rules.glossary.filter((g) => removed.includes(g.term))).toEqual([])
  })
})

describe('items', () => {
  it('has the 36 items of the box with ids 1-36 and unique names', () => {
    expect(items).toHaveLength(36)
    expect(items.map((i) => i.id).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 36 }, (_, i) => i + 1)
    )
    expect(new Set(items.map((i) => i.name)).size).toBe(36)
  })

  it('totals the 52 item cards of the box (Glossary p.29)', () => {
    expect(items.reduce((sum, item) => sum + item.copies, 0)).toBe(52)
  })

  it('has no two-handed item, so every hand item fills one hand slot', () => {
    expect(items.filter((i) => /two[- ]hand/i.test(`${i.name} ${i.effect}`))).toEqual([])
  })
})

describe('perks', () => {
  it('prints 15 perks on every character sheet', () => {
    for (const character of characters) {
      expect(perks.filter((p) => p.characterId === character.id)).toHaveLength(15)
    }
  })
})

describe('ability cards', () => {
  const count = (characterId: string, level: AbilityCard['level']): number =>
    abilities.filter((a) => a.characterId === characterId && a.level === level).length

  it('gives every character 6 A cards, 2 B cards and 3 X cards', () => {
    for (const character of characters) {
      expect(count(character.id, 'A')).toBe(6)
      expect(count(character.id, 'B')).toBe(2)
      expect(count(character.id, 'X')).toBe(3)
    }
  })

  it('has as many level 1 cards as the hand limit', () => {
    const expected: Record<string, number> = {
      demolitionist: 9,
      red_guard: 10,
      hatchet: 10,
      voidwarden: 11,
    }
    for (const character of characters) {
      expect(count(character.id, '1')).toBe(expected[character.id])
      expect(character.handLimit).toBe(expected[character.id])
    }
  })

  it('has 2, 2, 2, 1, 2, 2, 2, 2 cards on levels 2 to 9', () => {
    const expected = [2, 2, 2, 1, 2, 2, 2, 2]
    for (const character of characters) {
      expected.forEach((cards, index) => {
        expect(count(character.id, String(index + 2) as AbilityCard['level'])).toBe(cards)
      })
    }
  })

  it('repeats no card name except an A or B card over its level 1 copy', () => {
    for (const character of characters) {
      const byName = new Map<string, AbilityCard[]>()
      for (const card of abilities.filter((a) => a.characterId === character.id)) {
        byName.set(card.name, [...(byName.get(card.name) ?? []), card])
      }
      for (const [name, cards] of byName) {
        if (cards.length === 1) continue
        const hasLevel1 = cards.some((card) => card.level === '1')
        const onlyStartingOrLevel1 = cards.every((card) => card.level === 'A' || card.level === 'B' || card.level === '1')
        if (!hasLevel1 || !onlyStartingOrLevel1) {
          throw new Error(`${character.id}: unexpected duplicate card name "${name}"`)
        }
      }
    }
  })
})

describe('characters', () => {
  it('matches the hit points printed on the character mats', () => {
    const expected: Record<string, number[]> = {
      demolitionist: [8, 9, 11, 12, 14, 15, 17, 18, 20],
      red_guard: [10, 12, 14, 16, 18, 20, 22, 24, 26],
      hatchet: [8, 9, 11, 12, 14, 15, 17, 18, 20],
      voidwarden: [6, 7, 8, 9, 10, 11, 12, 13, 14],
    }
    for (const character of characters) {
      const byLevel = Array.from({ length: 9 }, (_, index) => character.hitPoints[String(index + 1)])
      expect(byLevel).toEqual(expected[character.id])
    }
  })
})

describe('treasures', () => {
  it('has the 16 treasure tiles, each in a scenario 1-25', () => {
    expect(treasures).toHaveLength(16)
    expect(treasures.map((t) => t.id).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 16 }, (_, i) => i + 1)
    )
    for (const treasure of treasures) {
      expect(treasure.scenario).toBeGreaterThanOrEqual(1)
      expect(treasure.scenario).toBeLessThanOrEqual(25)
    }
  })
})

describe('scenarios', () => {
  it('has the 25 scenarios of the campaign', () => {
    expect(scenarios).toHaveLength(25)
    expect(scenarios.map((s) => s.id).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 25 }, (_, i) => i + 1)
    )
  })

  it('closes alternatives symmetrically (Glossary p.18)', () => {
    for (const scenario of scenarios) {
      for (const blockedId of scenario.blocks) {
        const blocked = scenarios.find((s) => s.id === blockedId)
        expect(blocked?.blocks).toContain(scenario.id)
      }
    }
  })
})
