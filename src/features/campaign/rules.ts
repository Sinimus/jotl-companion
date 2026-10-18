import {
  tables,
  scenarios,
  items,
  abilities,
  characters,
  type Item,
  type ItemSlot,
  type AbilityCard,
  type AbilityLevel,
  type ScenarioLevelRow,
} from '@/data'
import type { ScenarioStatus } from '@/shared/schemas'

/**
 * Derive character level from cumulative experience.
 * Based on the Jaws of the Lion level-threshold table.
 */
export function computeLevelFromXp(experience: number): number {
  const thresholds = tables.levelThresholds as Record<string, number>
  for (let level = 9; level >= 1; level--) {
    if (experience >= thresholds[String(level)]) {
      return level
    }
  }
  return 1
}

/**
 * Determine which scenarios should be unlocked after completing a scenario.
 * Returns an array of scenario IDs.
 */
export function getUnlockedScenarios(
  currentStatus: Record<number, ScenarioStatus>,
  completedScenarioId: number
): number[] {
  const scenarioDef = scenarios.find((s) => s.id === completedScenarioId)
  if (!scenarioDef || !scenarioDef.unlocks) {
    return []
  }

  // Only return scenarios that are currently locked
  return scenarioDef.unlocks.filter((id) => currentStatus[id] === 'locked')
}

/**
 * Per-slot equip limits at a character level (Glossary p.11):
 * head 1, body 1, feet 1, hand 2, small ceil(level / 2).
 */
export function itemSlotLimits(level: number): Record<ItemSlot, number> {
  return {
    head: 1,
    body: 1,
    feet: 1,
    hand: 2,
    small: Math.ceil(level / 2),
  }
}

/**
 * Check a list of item IDs against the equip limits for a level.
 * Returns the slots whose item count is over the limit.
 */
export function equipmentViolations(itemIds: number[], level: number): ItemSlot[] {
  const limits = itemSlotLimits(level)
  const counts: Record<ItemSlot, number> = { head: 0, body: 0, feet: 0, hand: 0, small: 0 }
  for (const id of itemIds) {
    const item = items.find((i) => i.id === id)
    if (item) counts[item.slot] += 1
  }
  const slots: ItemSlot[] = ['head', 'body', 'feet', 'hand', 'small']
  return slots.filter((slot) => counts[slot] > limits[slot])
}

// ---------------------------------------------------------------------------
// Scenario level (LtP p.29)
// ---------------------------------------------------------------------------

export type Difficulty = 'easy' | 'normal' | 'hard' | 'very_hard'

const DIFFICULTY_MODIFIER: Record<Difficulty, number> = { easy: -1, normal: 0, hard: 1, very_hard: 2 }

/**
 * Scenario level from the party's character levels and the chosen difficulty
 * (LtP p.29): average level (an empty party counts as level 1), divided by two
 * and rounded up, then −1/0/+1/+2, clamped to 0-7.
 */
export function computeScenarioLevel(characterLevels: number[], difficulty: Difficulty): number {
  const average =
    characterLevels.length > 0
      ? characterLevels.reduce((sum, level) => sum + level, 0) / characterLevels.length
      : 1
  const base = Math.ceil(average / 2)
  return Math.max(0, Math.min(7, base + DIFFICULTY_MODIFIER[difficulty]))
}

/**
 * Row of the scenario level chart (LtP p.29) for a level 0-7.
 * Throws for a level outside that range.
 */
export function scenarioLevelRow(level: number): ScenarioLevelRow {
  const row = tables.scenarioLevelTable.find((entry) => entry.level === level)
  if (!row) throw new Error(`Scenario level ${level} is outside 0-7`)
  return row
}

// ---------------------------------------------------------------------------
// Perks (LtP p.24, p.25, p.29)
// ---------------------------------------------------------------------------

/**
 * Perk points of a character: earned = one per level gained above 1
 * (LtP p.29) + one per three battle-goal checkmarks (LtP p.25) + bonus perks
 * from scenario rewards (LtP p.24); spent = number of perks taken.
 */
export function perkPoints(c: {
  experience: number
  checkmarks: number
  bonusPerks: number
  perkIds: string[]
}): { earned: number; spent: number; available: number } {
  const earned = computeLevelFromXp(c.experience) - 1 + Math.floor(c.checkmarks / 3) + c.bonusPerks
  const spent = c.perkIds.length
  return { earned, spent, available: earned - spent }
}

// ---------------------------------------------------------------------------
// Item availability
// ---------------------------------------------------------------------------

export type ItemAvailability = 'shop' | 'reward' | 'locked'

/**
 * How an item can enter the campaign right now.  A satisfied `shop` unlock
 * (that scenario completed, LtP p.19) puts it in the shop; otherwise any
 * satisfied reward entry — a scenario reward completed, a looted treasure
 * (Glossary p.31) or misplaced goods of an unlocked scenario — makes it a
 * reward; otherwise it is locked.
 */
export function itemAvailability(
  item: Item,
  campaign: { scenarioStatus: Record<number, ScenarioStatus>; lootedTreasureIds: number[] }
): ItemAvailability {
  if (item.unlock.some((unlock) => unlock.type === 'shop' && campaign.scenarioStatus[unlock.scenario] === 'completed')) {
    return 'shop'
  }
  const rewardEarned = item.unlock.some((unlock) => {
    if (unlock.type === 'scenario') return campaign.scenarioStatus[unlock.scenario] === 'completed'
    if (unlock.type === 'treasure') return campaign.lootedTreasureIds.includes(unlock.treasure)
    if (unlock.type === 'misplacedGoods') return campaign.scenarioStatus[unlock.scenario] !== 'locked'
    return false // a shop unlock that is not satisfied yet is no reward
  })
  return rewardEarned ? 'reward' : 'locked'
}

/**
 * How many copies of an item the party owns across all characters
 * (the box holds a limited number of copies of each item).
 */
export function partyCopiesOwned(itemId: number, party: { itemIds: number[] }[]): number {
  return party.filter((character) => character.itemIds.includes(itemId)).length
}

// ---------------------------------------------------------------------------
// Ability cards
// ---------------------------------------------------------------------------

/** A and B are the starting-hand alternatives, X replaces a level 1 card. */
const ABILITY_LEVEL_ORDER: AbilityLevel[] = ['A', 'B', '1', 'X', '2', '3', '4', '5', '6', '7', '8', '9']

/**
 * All cards of a character in the order A, B, 1, X, 2 … 9, sorted by
 * initiative inside each level (the order the cards sit in within one row).
 */
export function abilityCardsFor(characterType: string): AbilityCard[] {
  return abilities
    .filter((card) => card.characterId === characterType)
    .sort(
      (a, b) =>
        ABILITY_LEVEL_ORDER.indexOf(a.level) - ABILITY_LEVEL_ORDER.indexOf(b.level) ||
        a.initiative - b.initiative
    )
}

/**
 * Hand limit of a character — the number of cards brought into a scenario
 * (LtP p.25 "full hand limit"), printed on the character mat.
 */
export function handLimitFor(characterType: string): number {
  const character = characters.find((c) => c.id === characterType)
  if (!character) throw new Error(`Unknown character type: ${characterType}`)
  return character.handLimit
}

/**
 * Warnings for a card selection: `overHandLimit` when more cards are selected
 * than the hand limit allows (LtP p.25), `tooHighLevel` the ids of selected
 * cards whose numeric level is above the character's level (LtP p.29).
 */
export function abilityWarnings(c: {
  type: string
  experience: number
  selectedAbilityIds: string[]
}): { overHandLimit: boolean; tooHighLevel: string[] } {
  const level = computeLevelFromXp(c.experience)
  const tooHighLevel = c.selectedAbilityIds.filter((id) => {
    const card = abilities.find((a) => a.id === id)
    if (!card) return false
    const numericLevel = Number.parseInt(card.level, 10)
    return Number.isInteger(numericLevel) && numericLevel > level
  })
  return {
    overHandLimit: c.selectedAbilityIds.length > handLimitFor(c.type),
    tooHighLevel,
  }
}
