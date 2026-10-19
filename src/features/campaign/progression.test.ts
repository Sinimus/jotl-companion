import { describe, expect, it } from 'vitest'
import { abilities, items, scenarios } from '@/data'
import { itemAvailability } from './rules'
import { CampaignSchema, type Campaign, type CharacterProgress, type ScenarioStatus } from '@/shared/schemas'
import {
  FIRST_LEVEL_1_CARDS,
  applyScenarioResult,
  canUnlockCard,
  cardPool,
  computeScenarioResult,
  followUpSteps,
  handCheck,
  handSize,
  isValidUnlockSet,
  learningStage,
  levelUpPicks,
  rewardItemCandidates,
  scenarioRules,
  type CharacterResultInput,
} from './progression'
import { cardChangesAfter, LEARNING_SCENARIOS } from './learning'

const HATCHET_ID = '11111111-2222-4333-8444-555555555555'
const RED_GUARD_ID = '22222222-3333-4444-8555-666666666666'

function hero(patch: Partial<CharacterProgress> = {}): CharacterProgress {
  return {
    id: HATCHET_ID,
    type: 'hatchet',
    name: 'Hatchet',
    experience: 0,
    gold: 0,
    checkmarks: 0,
    perkIds: [],
    itemIds: [],
    equippedItemIds: [],
    selectedAbilityIds: [],
    unlockedAbilityIds: [],
    bonusPerks: 0,
    ...patch,
  }
}

function statusAfter(completed: number[], unlocked: number[] = []): Record<number, ScenarioStatus> {
  const status: Record<number, ScenarioStatus> = {}
  for (const s of scenarios) status[s.id] = 'locked'
  for (const id of completed) status[id] = 'completed'
  for (const id of unlocked) status[id] = 'unlocked'
  return status
}

function campaign(characters: CharacterProgress[], status: Record<number, ScenarioStatus>): Campaign {
  return CampaignSchema.parse({
    id: '6f1c2f3e-5a6b-4c7d-8e9f-0a1b2c3d4e5f',
    name: 'Friday group',
    createdAt: '2026-04-01T10:00:00.000Z',
    updatedAt: '2026-04-01T10:00:00.000Z',
    characters,
    scenarioStatus: status,
    cityEventsDrawn: [],
    lootedTreasureIds: [],
  })
}

const played = (characterId: string, patch: Partial<CharacterResultInput> = {}): CharacterResultInput => ({
  characterId,
  played: true,
  moneyTokens: 0,
  actionXp: 0,
  battleGoalMet: false,
  ...patch,
})

const ids = (cards: { id: string }[]) => cards.map((card) => card.id)

describe('learningStage', () => {
  it('counts the learning scenarios completed in order', () => {
    expect(learningStage(statusAfter([], [1]))).toBe(0)
    expect(learningStage(statusAfter([1, 2], [3]))).toBe(2)
    expect(learningStage(statusAfter([1, 2, 3, 4, 5, 6]))).toBe(5)
  })

  it('stops at the first gap', () => {
    expect(learningStage(statusAfter([1, 3]))).toBe(1)
  })
})

describe('card pool and hand size by learning stage (LtP p.3, p.13, p.19, p.24, p.27)', () => {
  it('names existing level 1 cards for the cards added after Scenario 2', () => {
    for (const [type, cardIds] of Object.entries(FIRST_LEVEL_1_CARDS)) {
      for (const id of cardIds) {
        expect(abilities.find((a) => a.id === id && a.characterId === type)?.level).toBe('1')
      }
    }
  })

  it('starts with the six A cards', () => {
    const pool = cardPool('hatchet', 0, [])
    expect(pool).toHaveLength(6)
    expect(pool.every((card) => card.level === 'A')).toBe(true)
    expect(handSize('hatchet', 0)).toBe(6)
  })

  it('swaps two A cards for the B cards of the same name after Scenario 1', () => {
    const pool = cardPool('hatchet', 1, [])
    expect(pool).toHaveLength(6)
    expect(ids(pool)).toEqual(
      expect.arrayContaining(['hatchet-b-center-mass', 'hatchet-b-close-cuts', 'hatchet-a-stopping-power'])
    )
    expect(ids(pool)).not.toContain('hatchet-a-center-mass')
    expect(handSize('hatchet', 1)).toBe(6)
  })

  it('adds the two named level 1 cards after Scenario 2 for eight cards', () => {
    const pool = cardPool('red_guard', 2, [])
    expect(pool).toHaveLength(8)
    expect(ids(pool)).toEqual(expect.arrayContaining(['red_guard-1-swift-strength', 'red_guard-1-healing-sands']))
    expect(handSize('red_guard', 2)).toBe(8)
  })

  it('uses every level 1 card and the hand limit after Scenario 3', () => {
    for (const type of ['demolitionist', 'hatchet', 'red_guard', 'voidwarden']) {
      const pool = cardPool(type, 3, [])
      expect(pool.every((card) => card.level === '1')).toBe(true)
      expect(pool).toHaveLength(handSize(type, 3))
    }
  })

  it('adds the X cards after Scenario 4, so three cards stay behind', () => {
    const pool = cardPool('voidwarden', 4, [])
    expect(pool.filter((card) => card.level === 'X')).toHaveLength(3)
    expect(pool.length - handSize('voidwarden', 4)).toBe(3)
  })

  it('adds cards gained at level-up, but no A, B or foreign cards from that list', () => {
    const level2 = abilities.find((a) => a.characterId === 'hatchet' && a.level === '2')
    if (!level2) throw new Error('fixture')
    const pool = cardPool('hatchet', 5, [level2.id, 'hatchet-a-close-cuts', 'red_guard-1-swift-strength'])
    expect(ids(pool)).toContain(level2.id)
    expect(ids(pool)).not.toContain('hatchet-a-close-cuts')
    expect(ids(pool)).not.toContain('red_guard-1-swift-strength')
  })
})

describe('handCheck', () => {
  it('flags a hand over the size and cards outside the pool', () => {
    const pool = ids(cardPool('hatchet', 2, []))
    const check = handCheck(
      hero({ selectedAbilityIds: [...pool, 'hatchet-x-care-package'] }),
      2
    )
    expect(check).toEqual({ size: 8, selected: 9, overLimit: true, notInPool: ['hatchet-x-care-package'] })
  })

  it('accepts a full hand from the pool', () => {
    const pool = ids(cardPool('hatchet', 4, [])).slice(0, 10)
    expect(handCheck(hero({ selectedAbilityIds: pool }), 4)).toMatchObject({ overLimit: false, notInPool: [] })
  })
})

describe('cards gained at level-up (LtP p.29)', () => {
  const card = (level: string, index = 0) => {
    const found = abilities.filter((a) => a.characterId === 'hatchet' && a.level === level)[index]
    if (!found) throw new Error(`no level ${level} card`)
    return found.id
  }

  it('allows one card per level, each up to the level it was gained at', () => {
    expect(isValidUnlockSet([], 1)).toBe(true)
    expect(isValidUnlockSet([2], 2)).toBe(true)
    expect(isValidUnlockSet([3], 2)).toBe(false)
    expect(isValidUnlockSet([3, 2], 3)).toBe(true)
    expect(isValidUnlockSet([3, 3], 3)).toBe(false)
    expect(isValidUnlockSet([2, 2, 2], 3)).toBe(false)
  })

  it('counts the pending picks of a level 3 character (95 XP)', () => {
    expect(levelUpPicks(hero({ experience: 95, unlockedAbilityIds: [card('2')] }))).toEqual({
      allowed: 2,
      used: 1,
      pending: 1,
      valid: true,
    })
  })

  it('lets a level 3 character add a level 3 card after a level 2 one, not a second level 3', () => {
    const levelThree = hero({ experience: 95, unlockedAbilityIds: [card('3')] })
    expect(canUnlockCard(levelThree, card('2'))).toBe(true)
    expect(canUnlockCard(levelThree, card('3', 1))).toBe(false)
    expect(canUnlockCard(hero({ experience: 44 }), card('2'))).toBe(false)
    expect(canUnlockCard(hero({ experience: 45 }), card('2'))).toBe(true)
    expect(canUnlockCard(hero({ experience: 45 }), 'hatchet-x-care-package')).toBe(false)
  })

  it('marks a stored set that is not possible at the level as invalid', () => {
    expect(levelUpPicks(hero({ experience: 45, unlockedAbilityIds: [card('3')] })).valid).toBe(false)
  })
})

describe('scenarioRules', () => {
  it('pays nothing in Scenario 1', () => {
    expect(scenarioRules(1, true, 3)).toMatchObject({ goldPerToken: 0, bonusXp: 0, actionXp: false, cityEvent: false })
  })

  it('pays 2 gold per token without bonus experience in Scenario 2 (LtP p.18)', () => {
    expect(scenarioRules(2, true, 4)).toMatchObject({ effectiveLevel: 1, goldPerToken: 2, bonusXp: 0, actionXp: false })
  })

  it('adds experience, the 6 bonus and the city event from Scenario 3 (LtP p.20, p.23, p.24)', () => {
    expect(scenarioRules(3, true, 1)).toMatchObject({ goldPerToken: 2, bonusXp: 6, actionXp: true, battleGoals: false, cityEvent: true })
  })

  it('uses the scenario level chart from Scenario 6 (LtP p.29)', () => {
    expect(scenarioRules(6, true, 3)).toMatchObject({ effectiveLevel: 3, goldPerToken: 3, bonusXp: 10, battleGoals: true })
    expect(scenarioRules(6, false, 3)).toMatchObject({ goldPerToken: 3, bonusXp: 0, cityEvent: false })
  })
})

describe('computeScenarioResult and applyScenarioResult', () => {
  const now = new Date('2026-10-19T20:00:00.000Z')
  const meta = { logId: '33333333-4444-4555-8666-777777777777', now }

  it('records Scenario 2: 25 gold each plus tokens × 2, items 01-13 join the shop', () => {
    const before = campaign([hero(), hero({ id: RED_GUARD_ID, type: 'red_guard', name: 'Red' })], statusAfter([1], [2]))
    const result = computeScenarioResult(before, {
      scenarioId: 2,
      success: true,
      scenarioLevel: 1,
      characters: [played(HATCHET_ID, { moneyTokens: 4, actionXp: 9 }), played(RED_GUARD_ID, { moneyTokens: 1 })],
      itemRecipients: {},
    })
    expect(result.errors).toEqual([])
    expect(result.characters.map((c) => [c.gold, c.experience])).toEqual([[33, 0], [27, 0]])
    expect(result.shopItems).toHaveLength(13)
    expect(result.unlocks).toEqual([3])

    const after = applyScenarioResult(before, result, meta)
    expect(after.characters.map((c) => c.gold)).toEqual([33, 27])
    expect(after.scenarioStatus[2]).toBe('completed')
    expect(after.scenarioStatus[3]).toBe('unlocked')
    expect(after.scenarioLog).toHaveLength(1)
    expect(CampaignSchema.safeParse(after).success).toBe(true)
  })

  it('records Scenario 5 with 25 experience, the 6 bonus and a level-up past 45 (LtP p.28, p.29)', () => {
    const before = campaign([hero({ experience: 20, checkmarks: 2 })], statusAfter([1, 2, 3, 4], [5]))
    const result = computeScenarioResult(before, {
      scenarioId: 5,
      success: true,
      scenarioLevel: 1,
      characters: [played(HATCHET_ID, { moneyTokens: 3, actionXp: 7, battleGoalMet: true })],
      itemRecipients: {},
    })
    const gain = result.characters[0]
    expect(gain).toMatchObject({ gold: 6, actionXp: 7, bonusXp: 6, rewardXp: 25, experience: 38, checkmarks: 1 })
    expect(gain).toMatchObject({ levelBefore: 1, levelAfter: 2, hitPointsAfter: 9 })

    const after = applyScenarioResult(before, result, meta)
    expect(after.characters[0]).toMatchObject({ experience: 58, gold: 6, checkmarks: 3 })
  })

  it('records Scenario 9 at level 4: tokens × 4 gold, dial + 12 bonus + 20 reward XP, checkmark, shop, unlock, log', () => {
    const before = campaign(
      [hero({ experience: 150, gold: 7, checkmarks: 1 }), hero({ id: RED_GUARD_ID, type: 'red_guard', name: 'Red', experience: 140 })],
      statusAfter([1, 2, 3, 4, 5, 6, 7], [9])
    )
    const result = computeScenarioResult(before, {
      scenarioId: 9,
      success: true,
      scenarioLevel: 4,
      characters: [
        played(HATCHET_ID, { moneyTokens: 3, actionXp: 11, battleGoalMet: true }),
        played(RED_GUARD_ID, { moneyTokens: 0, actionXp: 2, battleGoalMet: false }),
      ],
      itemRecipients: {},
    })
    // LtP p.29: level 4 converts at 4 gold per token and gives 12 bonus experience.
    expect(result.rules).toMatchObject({ goldPerToken: 4, bonusXp: 12 })
    expect(result.characters[0]).toMatchObject({ goldFromTokens: 12, rewardGold: 0, gold: 12 })
    expect(result.characters[0]).toMatchObject({ actionXp: 11, bonusXp: 12, rewardXp: 20, experience: 43, checkmarks: 1 })
    expect(result.characters[1]).toMatchObject({ gold: 0, experience: 34, checkmarks: 0 })
    expect(result.shopItems).toEqual([15, 16, 17, 18, 19, 20])
    expect(result.unlocks).toEqual([10])

    const after = applyScenarioResult(before, result, meta)
    expect(after.characters.map((c) => [c.gold, c.experience, c.checkmarks])).toEqual([[19, 193, 2], [0, 174, 0]])
    expect(after.characters[0].experience).toBeGreaterThanOrEqual(150)
    expect(after.scenarioStatus[9]).toBe('completed')
    expect(after.scenarioStatus[10]).toBe('unlocked')
    expect(after.scenarioLog).toEqual([
      {
        id: meta.logId,
        scenarioId: 9,
        success: true,
        scenarioLevel: 4,
        recordedAt: now,
        characters: [
          expect.objectContaining({ name: 'Hatchet', gold: 12, experience: 43, checkmarks: 1, levelBefore: 4, levelAfter: 4 }),
          expect.objectContaining({ name: 'Red', gold: 0, experience: 34, checkmarks: 0, levelBefore: 3, levelAfter: 4 }),
        ],
      },
    ])
  })

  it('adds the gold reward to the token gold (Scenario 15: 10 gold each at level 2)', () => {
    const before = campaign([hero({ gold: 5 })], statusAfter([1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 13], [15]))
    const result = computeScenarioResult(before, {
      scenarioId: 15,
      success: true,
      scenarioLevel: 2,
      characters: [played(HATCHET_ID, { moneyTokens: 5 })],
      itemRecipients: {},
    })
    expect(result.characters[0]).toMatchObject({ goldFromTokens: 15, rewardGold: 10, gold: 25 })
    expect(applyScenarioResult(before, result, meta).characters[0].gold).toBe(30)
  })

  it('keeps tokens and experience on a loss but gives no rewards, bonus or checkmark (LtP p.16, p.25)', () => {
    const before = campaign([hero({ experience: 10 })], statusAfter([1, 2, 3, 4, 5], [6]))
    const result = computeScenarioResult(before, {
      scenarioId: 6,
      success: false,
      scenarioLevel: 2,
      characters: [played(HATCHET_ID, { moneyTokens: 2, actionXp: 5, battleGoalMet: true })],
      itemRecipients: {},
    })
    expect(result.characters[0]).toMatchObject({ gold: 6, experience: 5, checkmarks: 0 })
    expect(result.unlocks).toEqual([])
    const after = applyScenarioResult(before, result, meta)
    expect(after.scenarioStatus[6]).toBe('unlocked')
    expect(after.scenarioLog[0].success).toBe(false)
  })

  it('gives the reward perk of Scenario 3 as a bonus perk and the checkmark of Scenario 6', () => {
    const three = computeScenarioResult(campaign([hero()], statusAfter([1, 2], [3])), {
      scenarioId: 3,
      success: true,
      scenarioLevel: 1,
      characters: [played(HATCHET_ID)],
      itemRecipients: {},
    })
    expect(three.characters[0].perks).toBe(1)

    const six = computeScenarioResult(campaign([hero({ checkmarks: 18 })], statusAfter([1, 2, 3, 4, 5], [6])), {
      scenarioId: 6,
      success: true,
      scenarioLevel: 1,
      characters: [played(HATCHET_ID, { battleGoalMet: true })],
      itemRecipients: {},
    })
    expect(six.characters[0].checkmarks).toBe(0)
  })

  it('gives nothing to a character who sat the scenario out', () => {
    const before = campaign([hero(), hero({ id: RED_GUARD_ID, type: 'red_guard', name: 'Red' })], statusAfter([1], [2]))
    const result = computeScenarioResult(before, {
      scenarioId: 2,
      success: true,
      scenarioLevel: 1,
      characters: [played(HATCHET_ID), played(RED_GUARD_ID, { played: false, moneyTokens: 5 })],
      itemRecipients: {},
    })
    expect(result.characters[1]).toMatchObject({ played: false, gold: 0, experience: 0 })
  })

  it('hands the reward item of Scenario 4 to the chosen character only', () => {
    const before = campaign([hero(), hero({ id: RED_GUARD_ID, type: 'red_guard', name: 'Red' })], statusAfter([1, 2, 3], [4]))
    const input = {
      scenarioId: 4,
      success: true,
      scenarioLevel: 1,
      characters: [played(HATCHET_ID), played(RED_GUARD_ID)],
      itemRecipients: { 14: RED_GUARD_ID },
    }
    const result = computeScenarioResult(before, input)
    expect(result.unassignedItems).toEqual([])
    const after = applyScenarioResult(before, result, meta)
    expect(after.characters.map((c) => c.itemIds)).toEqual([[], [14]])

    expect(computeScenarioResult(before, { ...input, itemRecipients: {} }).unassignedItems).toEqual([14])
  })

  it('closes the alternative branch when completing Scenario 7 (Glossary p.18)', () => {
    const before = campaign([hero()], statusAfter([1, 2, 3, 4, 5, 6], [7, 8]))
    const result = computeScenarioResult(before, {
      scenarioId: 7,
      success: true,
      scenarioLevel: 1,
      characters: [played(HATCHET_ID)],
      itemRecipients: {},
    })
    expect(result.closes).toEqual([8])
    const after = applyScenarioResult(before, result, meta)
    expect(after.scenarioStatus[8]).toBe('closed')
    expect(after.scenarioStatus[9]).toBe('unlocked')
  })

  it('refuses to reward a completed, closed or locked scenario twice', () => {
    const base = { success: true, scenarioLevel: 1, characters: [played(HATCHET_ID)], itemRecipients: {} }
    const done = campaign([hero()], { ...statusAfter([1, 2, 3, 4, 5, 6, 7]), 8: 'closed' })
    expect(computeScenarioResult(done, { ...base, scenarioId: 7 }).errors).toHaveLength(1)
    expect(computeScenarioResult(done, { ...base, scenarioId: 8 }).errors).toHaveLength(1)
    expect(computeScenarioResult(done, { ...base, scenarioId: 20 }).errors).toHaveLength(1)
    const result = computeScenarioResult(done, { ...base, scenarioId: 7 })
    expect(() => applyScenarioResult(done, result, meta)).toThrow('already completed')
  })

  it('offers a reward item only to characters without it while copies are left', () => {
    const before = campaign(
      [hero({ itemIds: [28] }), hero({ id: RED_GUARD_ID, type: 'red_guard', name: 'Red' })],
      statusAfter([1])
    )
    expect(rewardItemCandidates(before, 28)).toEqual([]) // one copy in the box
    expect(rewardItemCandidates(before, 14).map((c) => c.name)).toEqual(['Hatchet', 'Red'])
  })
})

describe('learning guide', () => {
  it('covers scenarios 1 to 5 with a source on every line', () => {
    expect(LEARNING_SCENARIOS.map((s) => s.id)).toEqual([1, 2, 3, 4, 5])
    for (const scenario of LEARNING_SCENARIOS) {
      for (const line of [...scenario.introduces, ...scenario.afterwards]) {
        expect(line.source).toMatch(/^LtP p\.\d+/)
      }
    }
  })

  it('names the card changes that match the pool of the next stage', () => {
    for (const type of ['demolitionist', 'hatchet', 'red_guard', 'voidwarden']) {
      for (let stage = 1; stage <= 4; stage += 1) {
        const before = new Set(ids(cardPool(type, stage - 1, [])))
        const change = cardChangesAfter(stage, type)
        for (const card of change.removed) before.delete(card.id)
        for (const card of change.added) before.add(card.id)
        expect([...before].sort()).toEqual(ids(cardPool(type, stage, [])).sort())
      }
    }
  })
})

describe('followUpSteps', () => {
  const run = (before: Campaign, input: Parameters<typeof computeScenarioResult>[1]) => {
    const result = computeScenarioResult(before, input)
    const checkmarks = Object.fromEntries(before.characters.map((c) => [c.id, c.checkmarks]))
    return followUpSteps(result, checkmarks).map((step) => step.text)
  }

  it('lists the stickers, the shop items, the cards and the refresh after Scenario 2', () => {
    const texts = run(campaign([hero()], statusAfter([1], [2])), {
      scenarioId: 2,
      success: true,
      scenarioLevel: 1,
      characters: [played(HATCHET_ID)],
      itemRecipients: {},
    })
    expect(texts).toEqual([
      'Place the stickers of the new locations: scenario 3',
      'Move items 01-13 to the available side of the item deck',
      'Change the ability cards as listed below',
      'Full refresh: all cards and items back, conditions removed, Bless and Curse cards removed, HP to maximum',
      'Buy, sell (half the price, rounded up) or trade items; gold cannot be traded',
    ])
  })

  it('names the level-up, the checkmark perk and the city event after Scenario 5', () => {
    const texts = run(campaign([hero({ experience: 20, checkmarks: 2 })], statusAfter([1, 2, 3, 4], [5])), {
      scenarioId: 5,
      success: true,
      scenarioLevel: 1,
      characters: [played(HATCHET_ID, { actionXp: 5, battleGoalMet: true })],
      itemRecipients: {},
    })
    expect(texts).toContain('Hatchet: three checkmarks complete a perk; take it')
    expect(texts).toContain('Hatchet reaches level 2: add one card of level 2 or lower, take one perk, maximum HP 9')
    expect(texts).toContain('Draw a city event, choose option A or B together and apply the outcome')
    expect(texts).not.toContain('Change the ability cards as listed below')
  })

  it('tells the party to replay a lost scenario, with no event', () => {
    const texts = run(campaign([hero()], statusAfter([1, 2, 3, 4, 5], [6])), {
      scenarioId: 6,
      success: false,
      scenarioLevel: 1,
      characters: [played(HATCHET_ID)],
      itemRecipients: {},
    })
    expect(texts[0]).toContain('retry')
    expect(texts.some((t) => t.includes('city event'))).toBe(false)
  })
})

describe('rewards open the shop and close branches (item 7)', () => {
  const meta = { logId: '44444444-5555-4666-8777-888888888888', now: new Date('2026-10-19T21:00:00.000Z') }

  it('puts items 15-20 in the shop after Scenario 9 and nothing of 21-26', () => {
    const before = campaign([hero()], statusAfter([1, 2, 3, 4, 5, 6, 7], [9]))
    const result = computeScenarioResult(before, {
      scenarioId: 9,
      success: true,
      scenarioLevel: 1,
      characters: [played(HATCHET_ID)],
      itemRecipients: {},
    })
    const after = applyScenarioResult(before, result, meta)
    const availability = (state: Campaign) => (id: number) => {
      const item = items.find((i) => i.id === id)
      if (!item) throw new Error(`no item ${id}`)
      return itemAvailability(item, state)
    }
    expect([15, 16, 17, 18, 19, 20].map(availability(after))).toEqual(Array(6).fill('shop'))
    expect([21, 22, 23, 24, 25, 26].map(availability(after))).toEqual(Array(6).fill('locked'))
    expect([15, 20].map(availability(before))).toEqual(['locked', 'locked'])
  })

  it('closes 12 and hands Flea-Bitten Shawl out when Scenario 11 is recorded', () => {
    const before = campaign([hero()], statusAfter([1, 2, 3, 4, 5, 6, 7, 9, 10], [11, 12]))
    const result = computeScenarioResult(before, {
      scenarioId: 11,
      success: true,
      scenarioLevel: 1,
      characters: [played(HATCHET_ID)],
      itemRecipients: { 28: HATCHET_ID },
    })
    const after = applyScenarioResult(before, result, meta)
    expect(after.scenarioStatus[12]).toBe('closed')
    expect(after.scenarioStatus[13]).toBe('unlocked')
    expect(after.scenarioStatus[19]).toBe('unlocked')
    expect(after.characters[0].itemIds).toEqual([28])
    // Completing 12 is no longer possible.
    const again = { scenarioId: 12, success: true, scenarioLevel: 1, characters: [], itemRecipients: {} }
    expect(computeScenarioResult(after, again).errors).toEqual(['Scenario 12 is closed'])
  })
})
