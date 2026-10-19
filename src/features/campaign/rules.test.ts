import { describe, expect, it } from 'vitest'
import { items } from '@/data'
import {
  abilityCardsFor,
  closingConfirmText,
  computeLevelFromXp,
  computeScenarioLevel,
  handLimitFor,
  itemAvailability,
  partyCopiesOwned,
  perkPoints,
  scenarioLevelRow,
  scenariosClosedByCompleting,
} from './rules'

// Level thresholds are printed under the levels on the character sheet and
// repeated in the Learn to Play Guide (p. 29): 0, 45, 95, 150, 210, 275, 345, 420, 500.
describe('computeLevelFromXp', () => {
  it('starts at level 1 with no experience', () => {
    expect(computeLevelFromXp(0)).toBe(1)
  })

  it('stays at level 1 one point below the level 2 threshold', () => {
    expect(computeLevelFromXp(44)).toBe(1)
  })

  it('reaches level 2 at exactly 45 experience', () => {
    expect(computeLevelFromXp(45)).toBe(2)
  })

  it('reaches level 9 at exactly 500 experience', () => {
    expect(computeLevelFromXp(500)).toBe(9)
  })

  it('does not go above level 9', () => {
    expect(computeLevelFromXp(10_000)).toBe(9)
  })

  it.each([
    [94, 2],
    [95, 3],
    [149, 3],
    [150, 4],
    [209, 4],
    [210, 5],
    [274, 5],
    [275, 6],
    [344, 6],
    [345, 7],
    [419, 7],
    [420, 8],
    [499, 8],
  ])('maps %i experience to level %i', (experience, level) => {
    expect(computeLevelFromXp(experience)).toBe(level)
  })
})

// Scenario level: average party level divided by two and rounded up, changed
// by the difficulty, clamped to 0-7 (Learn to Play Guide p. 29).
describe('computeScenarioLevel', () => {
  it('rounds the average party level up and applies the difficulty', () => {
    expect(computeScenarioLevel([2, 2, 2, 2], 'normal')).toBe(1)
    expect(computeScenarioLevel([3, 2, 2, 2], 'normal')).toBe(2)
    expect(computeScenarioLevel([1], 'easy')).toBe(0)
    expect(computeScenarioLevel([9, 9, 9, 9], 'very_hard')).toBe(7)
    expect(computeScenarioLevel([], 'normal')).toBe(1)
    expect(computeScenarioLevel([1, 1], 'very_hard')).toBe(3)
  })
})

// The chart on p. 29 of the Learn to Play Guide.
describe('scenarioLevelRow', () => {
  it('returns the eight rows of the scenario level chart exactly', () => {
    const rows = Array.from({ length: 8 }, (_, level) => scenarioLevelRow(level))
    expect(rows.map((row) => row.trapDamage)).toEqual([2, 3, 4, 5, 6, 7, 8, 9])
    expect(rows.map((row) => row.goldConversion)).toEqual([2, 2, 3, 3, 4, 4, 5, 6])
    expect(rows.map((row) => row.bonusXp)).toEqual([4, 6, 8, 10, 12, 14, 16, 18])
  })

  it('throws for a level outside 0-7', () => {
    expect(() => scenarioLevelRow(-1)).toThrow()
    expect(() => scenarioLevelRow(8)).toThrow()
  })
})

// One perk per level gained (LtP p.29), one per three checkmarks (LtP p.25)
// and the bonus perks of scenario rewards (LtP p.24).
describe('perkPoints', () => {
  it('starts with no perks at level 1', () => {
    expect(perkPoints({ experience: 0, checkmarks: 0, bonusPerks: 0, perkIds: [] })).toEqual({
      earned: 0,
      spent: 0,
      available: 0,
    })
  })

  it('adds level, checkmark and bonus perks', () => {
    expect(perkPoints({ experience: 45, checkmarks: 3, bonusPerks: 1, perkIds: [] })).toEqual({
      earned: 3,
      spent: 0,
      available: 3,
    })
  })

  it('gives six perks for the maximum of 18 checkmarks', () => {
    const points = perkPoints({ experience: 0, checkmarks: 18, bonusPerks: 0, perkIds: [] })
    expect(points.earned).toBe(6)
  })

  it('counts taken perks as spent', () => {
    expect(
      perkPoints({ experience: 0, checkmarks: 3, bonusPerks: 0, perkIds: ['demolitionist_1'] })
    ).toEqual({ earned: 1, spent: 1, available: 0 })
  })
})

// Shop stock and rewards: items 01-13 enter the shop after scenario 2
// (LtP p.19), rewards come from scenarios and looted treasures.
describe('itemAvailability', () => {
  const item = (id: number) => {
    const found = items.find((i) => i.id === id)
    if (!found) throw new Error(`Missing item #${id}`)
    return found
  }
  const campaign = (
    scenarioStatus: Record<number, 'locked' | 'unlocked' | 'completed'>,
    lootedTreasureIds: number[] = []
  ) => ({ scenarioStatus, lootedTreasureIds })

  it('keeps item 1 out of the shop until scenario 2 is completed (LtP p.19)', () => {
    expect(itemAvailability(item(1), campaign({ 2: 'locked' }))).toBe('locked')
    expect(itemAvailability(item(1), campaign({ 2: 'unlocked' }))).toBe('locked')
    expect(itemAvailability(item(1), campaign({ 2: 'completed' }))).toBe('shop')
  })

  it('offers item 14 as a reward after scenario 4 or after looting treasure 16', () => {
    expect(itemAvailability(item(14), campaign({ 4: 'unlocked' }))).toBe('locked')
    expect(itemAvailability(item(14), campaign({ 4: 'completed' }))).toBe('reward')
    expect(itemAvailability(item(14), campaign({}, [16]))).toBe('reward')
  })

  it('offers item 32 once the misplaced-goods scenario 20 is unlocked', () => {
    expect(itemAvailability(item(32), campaign({ 20: 'locked' }))).toBe('locked')
    expect(itemAvailability(item(32), campaign({ 20: 'unlocked' }))).toBe('reward')
    expect(itemAvailability(item(32), campaign({ 20: 'completed' }))).toBe('reward')
  })

  it('puts item 15 in the shop after scenario 9 is completed', () => {
    expect(itemAvailability(item(15), campaign({ 9: 'unlocked' }))).toBe('locked')
    expect(itemAvailability(item(15), campaign({ 9: 'completed' }))).toBe('shop')
  })
})

describe('partyCopiesOwned', () => {
  it('counts the characters that own a copy of the item', () => {
    const party = [
      { itemIds: [2, 11] },
      { itemIds: [2] },
      { itemIds: [1, 12] },
    ]
    expect(partyCopiesOwned(2, party)).toBe(2)
    expect(partyCopiesOwned(11, party)).toBe(1)
    expect(partyCopiesOwned(13, party)).toBe(0)
  })
})

describe('abilityCardsFor', () => {
  it('lists the Hatchet cards as A, B, 1, X, 2 … 9, by initiative inside a level', () => {
    expect(abilityCardsFor('hatchet').map((card) => card.id)).toEqual([
      'hatchet-a-second-wind',
      'hatchet-a-center-mass',
      'hatchet-a-close-cuts',
      'hatchet-a-stopping-power',
      'hatchet-a-disorienting-barrage',
      'hatchet-a-double-throw',
      'hatchet-b-center-mass',
      'hatchet-b-close-cuts',
      'hatchet-1-the-favorite',
      'hatchet-1-second-wind',
      'hatchet-1-center-mass',
      'hatchet-1-close-cuts',
      'hatchet-1-stopping-power',
      'hatchet-1-follow-through',
      'hatchet-1-retrieval',
      'hatchet-1-disorienting-barrage',
      'hatchet-1-power-pitch',
      'hatchet-1-double-throw',
      'hatchet-x-fancy-hat',
      'hatchet-x-extra-lift',
      'hatchet-x-care-package',
      'hatchet-2-repeat-shot',
      'hatchet-2-ricochet',
      'hatchet-3-sharpened-blades',
      'hatchet-3-fearsome-efficiency',
      'hatchet-4-ripped-from-the-flesh',
      'hatchet-4-overwatch',
      'hatchet-5-the-new-favorite',
      'hatchet-6-quick-turnaround',
      'hatchet-6-bombardment',
      'hatchet-7-brutalize',
      'hatchet-7-excessive-force',
      'hatchet-8-shrapnel',
      'hatchet-8-camaraderie',
      'hatchet-9-heart-seeker',
      'hatchet-9-executioners-axe',
    ])
  })

  it('returns every card exactly once', () => {
    expect(abilityCardsFor('voidwarden').length).toBe(37)
    expect(new Set(abilityCardsFor('demolitionist').map((card) => card.id)).size).toBe(35)
  })
})

describe('handLimitFor', () => {
  it('reads the hand limit from the character mats', () => {
    expect(handLimitFor('demolitionist')).toBe(9)
    expect(handLimitFor('red_guard')).toBe(10)
    expect(handLimitFor('hatchet')).toBe(10)
    expect(handLimitFor('voidwarden')).toBe(11)
  })

  it('throws for an unknown character', () => {
    expect(() => handLimitFor('quartermaster')).toThrow()
  })
})

// Completing a scenario closes its not-completed alternatives (Glossary p.18).
describe('scenariosClosedByCompleting', () => {
  it('lists only the blocks that are not completed', () => {
    expect(scenariosClosedByCompleting(7, { 7: 'unlocked', 8: 'unlocked' }).map((s) => s.id)).toEqual([8])
    expect(scenariosClosedByCompleting(7, { 7: 'unlocked', 8: 'completed' })).toEqual([])
    expect(scenariosClosedByCompleting(6, { 6: 'unlocked', 7: 'locked', 8: 'locked' })).toEqual([])
  })
})

describe('closingConfirmText', () => {
  it('names the scenario the completion closes', () => {
    const closed = scenariosClosedByCompleting(8, { 7: 'locked', 8: 'unlocked' })
    expect(closingConfirmText(closed)).toBe('Completing this closes scenario 7 (Sunken Tumor). Continue?')
  })

  it('has nothing to ask when no alternative is closed', () => {
    expect(closingConfirmText([])).toBeNull()
  })
})
