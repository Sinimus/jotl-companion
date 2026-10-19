import { abilities, characters, items, scenarios, type AbilityCard, type Scenario } from '@/data'
import type { Campaign, CharacterProgress, ScenarioLogEntry, ScenarioStatus } from '@/shared/schemas'
import { abilityCardsFor, computeLevelFromXp, handLimitFor, scenarioLevelRow } from './rules'

// ---------------------------------------------------------------------------
// Campaign progression between scenarios: the learning stage of scenarios
// 1-5, the card pool and hand size it implies, cards gained at level-up, and
// the result of a scenario applied to the campaign sheet.  Pure functions.
// ---------------------------------------------------------------------------

/** Scenarios 1-5 teach the game step by step (LtP p.3-29). */
export const LEARNING_SCENARIO_COUNT = 5

/**
 * Learning stage of a campaign: how many of scenarios 1-5 are completed, in
 * order.  0 before Scenario 1, 5 once the guide is behind the party.
 */
export function learningStage(scenarioStatus: Record<number, ScenarioStatus>): number {
  let stage = 0
  while (stage < LEARNING_SCENARIO_COUNT && scenarioStatus[stage + 1] === 'completed') stage += 1
  return stage
}

/** The two level 1 cards added after Scenario 2, named on LtP p.19. */
export const FIRST_LEVEL_1_CARDS: Readonly<Record<string, readonly [string, string]>> = {
  demolitionist: ['demolitionist-1-windup', 'demolitionist-1-crushing-weight'],
  hatchet: ['hatchet-1-the-favorite', 'hatchet-1-retrieval'],
  red_guard: ['red_guard-1-swift-strength', 'red_guard-1-healing-sands'],
  voidwarden: ['voidwarden-1-signs-of-the-void', 'voidwarden-1-close-to-the-abyss'],
}

/** Numeric level of a card, or null for A, B and X. */
export function cardLevel(card: AbilityCard): number | null {
  const parsed = Number.parseInt(card.level, 10)
  return Number.isInteger(parsed) ? parsed : null
}

function requireCard(id: string): AbilityCard {
  const card = abilities.find((a) => a.id === id)
  if (!card) throw new Error(`Unknown ability card ${id}`)
  return card
}

/**
 * The starting hand after Scenario 1: the two B cards replace the A cards of
 * the same name (LtP p.13).
 */
function startingHandAfterScenario1(own: AbilityCard[]): AbilityCard[] {
  const bCards = own.filter((card) => card.level === 'B')
  const bNames = new Set(bCards.map((card) => card.name))
  return [...own.filter((card) => card.level === 'A' && !bNames.has(card.name)), ...bCards]
}

/**
 * The cards a character can choose a hand from at a learning stage:
 * stage 0 the six A cards (LtP p.3), stage 1 two of them swapped for B cards
 * (LtP p.13), stage 2 plus the first two level 1 cards (LtP p.19), from
 * stage 3 all level 1 cards (LtP p.24), from stage 4 plus the three X cards
 * (LtP p.27), and the level 2+ cards gained at level-up (LtP p.29).
 */
export function cardPool(characterType: string, stage: number, unlockedAbilityIds: readonly string[]): AbilityCard[] {
  const own = abilityCardsFor(characterType)
  if (stage <= 0) return own.filter((card) => card.level === 'A')
  const startingHand = startingHandAfterScenario1(own)
  if (stage === 1) return startingHand
  if (stage === 2) {
    const firstTwo = FIRST_LEVEL_1_CARDS[characterType] ?? []
    return [...startingHand, ...firstTwo.map(requireCard)]
  }
  const unlocked = new Set(unlockedAbilityIds)
  return own.filter(
    (card) =>
      card.level === '1' ||
      (card.level === 'X' && stage >= 4) ||
      (unlocked.has(card.id) && (cardLevel(card) ?? 0) >= 2)
  )
}

/**
 * How many cards a character brings into the next scenario: 6 in Scenarios 1
 * and 2 (LtP p.3, p.13), 8 in Scenario 3 (LtP p.19), then the hand limit on
 * the character mat (LtP p.24, p.27).
 */
export function handSize(characterType: string, stage: number): number {
  return learningHandSize(stage) ?? handLimitFor(characterType)
}

/** The hand size every class shares in the learning stages 0-2, null from stage 3 on. */
export function learningHandSize(stage: number): number | null {
  if (stage <= 1) return 6
  if (stage === 2) return 8
  return null
}

export interface HandCheck {
  size: number
  selected: number
  /** More cards selected than the hand size allows. */
  overLimit: boolean
  /** Selected ids that are not in the pool right now. */
  notInPool: string[]
}

/** Check the hand selected for the next scenario against the pool and the hand size. */
export function handCheck(
  character: Pick<CharacterProgress, 'type' | 'selectedAbilityIds' | 'unlockedAbilityIds'>,
  stage: number
): HandCheck {
  const size = handSize(character.type, stage)
  const pool = new Set(cardPool(character.type, stage, character.unlockedAbilityIds).map((card) => card.id))
  return {
    size,
    selected: character.selectedAbilityIds.length,
    overLimit: character.selectedAbilityIds.length > size,
    notInPool: character.selectedAbilityIds.filter((id) => !pool.has(id)),
  }
}

// ---------------------------------------------------------------------------
// Cards gained at level-up (LtP p.29)
// ---------------------------------------------------------------------------

/**
 * Whether a set of cards gained at level-up is possible at a character level:
 * one card per level gained, each of a level up to the level it was gained at.
 * Sorted ascending, the i-th card (from 0) must be at most level i + 2, and
 * there can be at most level − 1 of them.
 */
export function isValidUnlockSet(levels: readonly number[], characterLevel: number): boolean {
  if (levels.length > characterLevel - 1) return false
  return [...levels].sort((a, b) => a - b).every((level, index) => level >= 2 && level <= index + 2)
}

export interface LevelUpPicks {
  /** Cards the character may have gained: one per level above 1. */
  allowed: number
  used: number
  pending: number
  valid: boolean
}

function unlockedLevels(type: string, unlockedAbilityIds: readonly string[]): number[] {
  return unlockedAbilityIds.flatMap((id) => {
    const card = abilities.find((a) => a.id === id && a.characterId === type)
    const level = card ? cardLevel(card) : null
    return level !== null ? [level] : []
  })
}

/** The level-up card picks of a character: how many are left and whether the set holds. */
export function levelUpPicks(
  character: Pick<CharacterProgress, 'type' | 'experience' | 'unlockedAbilityIds'>
): LevelUpPicks {
  const level = computeLevelFromXp(character.experience)
  const levels = unlockedLevels(character.type, character.unlockedAbilityIds)
  const allowed = level - 1
  return {
    allowed,
    used: character.unlockedAbilityIds.length,
    pending: Math.max(0, allowed - character.unlockedAbilityIds.length),
    valid:
      levels.length === character.unlockedAbilityIds.length &&
      isValidUnlockSet(levels, level),
  }
}

/** Whether a card of level 2+ can be added to the cards gained at level-up. */
export function canUnlockCard(
  character: Pick<CharacterProgress, 'type' | 'experience' | 'unlockedAbilityIds'>,
  cardId: string
): boolean {
  const card = abilities.find((a) => a.id === cardId && a.characterId === character.type)
  const level = card ? cardLevel(card) : null
  if (level === null || level < 2 || character.unlockedAbilityIds.includes(cardId)) return false
  const levels = unlockedLevels(character.type, character.unlockedAbilityIds)
  return isValidUnlockSet([...levels, level], computeLevelFromXp(character.experience))
}

// ---------------------------------------------------------------------------
// Recording a scenario result (LtP pp.13-29, Glossary p.18)
// ---------------------------------------------------------------------------

export interface ScenarioRules {
  /** Scenario level used for the chart: 1 in scenarios 1-5 (LtP p.29). */
  effectiveLevel: number
  goldPerToken: number
  bonusXp: number
  /** Experience from actions is tracked (from Scenario 3, LtP p.20). */
  actionXp: boolean
  /** Battle goals are in play (from Scenario 4, LtP p.25). */
  battleGoals: boolean
  /** A city event follows the scenario (successful, from Scenario 3, LtP p.24). */
  cityEvent: boolean
}

export function requireScenario(id: number): Scenario {
  const scenario = scenarios.find((s) => s.id === id)
  if (!scenario) throw new Error(`Unknown scenario ${id}`)
  return scenario
}

/**
 * What a scenario pays out at a scenario level.  Scenarios 1-5 are played at
 * level 1, where a money token is worth 2 gold and the bonus is 6 experience
 * (LtP p.18, p.23, p.29); from Scenario 6 the scenario level chart applies
 * (LtP p.29).  Scenario 1 pays no gold, Scenarios 1 and 2 no bonus experience
 * (GHS `ignoredBonus`; LtP p.13, p.18, p.23).
 */
export function scenarioRules(scenarioId: number, success: boolean, scenarioLevel: number): ScenarioRules {
  const scenario = requireScenario(scenarioId)
  const effectiveLevel = scenarioId <= LEARNING_SCENARIO_COUNT ? 1 : scenarioLevel
  const row = scenarioLevelRow(effectiveLevel)
  return {
    effectiveLevel,
    goldPerToken: scenario.reward.tokenGold ? row.goldConversion : 0,
    bonusXp: success && scenario.reward.bonusExperience ? row.bonusXp : 0,
    actionXp: scenarioId >= 3,
    battleGoals: scenarioId >= 4,
    cityEvent: success && scenarioId >= 3,
  }
}

export interface CharacterResultInput {
  characterId: string
  /** false: the character sat this scenario out and gains nothing. */
  played: boolean
  moneyTokens: number
  actionXp: number
  battleGoalMet: boolean
}

export interface ScenarioResultInput {
  scenarioId: number
  success: boolean
  scenarioLevel: number
  characters: CharacterResultInput[]
  /** Reward item id → id of the character who takes it (null: nobody yet). */
  itemRecipients: Record<number, string | null>
}

export interface CharacterResult {
  characterId: string
  name: string
  type: string
  played: boolean
  goldFromTokens: number
  rewardGold: number
  gold: number
  actionXp: number
  bonusXp: number
  rewardXp: number
  experience: number
  checkmarks: number
  perks: number
  itemIds: number[]
  levelBefore: number
  levelAfter: number
  /** Maximum hit points at levelAfter (character mat). */
  hitPointsAfter: number
}

export interface ScenarioResult {
  scenarioId: number
  success: boolean
  rules: ScenarioRules
  characters: CharacterResult[]
  /** Scenarios a success unlocks and closes (Glossary p.18). */
  unlocks: number[]
  closes: number[]
  /** Items that join the shop with this success. */
  shopItems: number[]
  /** Reward items still without a recipient. */
  unassignedItems: number[]
  /** Problems that block recording; empty when the result can be recorded. */
  errors: string[]
}

/** Characters who can take a reward item: they do not own it and a copy is left in the box. */
export function rewardItemCandidates(campaign: Pick<Campaign, 'characters'>, itemId: number): CharacterProgress[] {
  const item = items.find((i) => i.id === itemId)
  if (!item) return []
  const owned = campaign.characters.filter((c) => c.itemIds.includes(itemId)).length
  if (owned >= item.copies) return []
  return campaign.characters.filter((c) => !c.itemIds.includes(itemId))
}

const MAX_CHECKMARKS = 18

/** The gains of every character and the campaign changes of one scenario result. */
export function computeScenarioResult(campaign: Campaign, input: ScenarioResultInput): ScenarioResult {
  const scenario = requireScenario(input.scenarioId)
  const rules = scenarioRules(input.scenarioId, input.success, input.scenarioLevel)
  const status = campaign.scenarioStatus[scenario.id] ?? 'locked'
  const errors: string[] = []
  if (status === 'locked') errors.push(`Scenario ${scenario.id} is not unlocked`)
  if (status === 'closed') errors.push(`Scenario ${scenario.id} is closed`)
  if (input.success && status === 'completed') errors.push(`Scenario ${scenario.id} is already completed`)

  const reward = input.success ? scenario.reward : null
  const rewardItems = reward?.items ?? []
  const unassignedItems = rewardItems.filter((id) => !input.itemRecipients[id])
  for (const itemId of rewardItems) {
    const recipient = input.itemRecipients[itemId]
    if (!recipient) continue
    if (!rewardItemCandidates(campaign, itemId).some((c) => c.id === recipient)) {
      errors.push(`Item #${itemId} cannot go to that character`)
    }
  }

  const characterResults = campaign.characters.map((character): CharacterResult => {
    const entry = input.characters.find((c) => c.characterId === character.id)
    const played = entry?.played ?? true
    const tokens = played ? Math.max(0, entry?.moneyTokens ?? 0) : 0
    const goldFromTokens = tokens * rules.goldPerToken
    const rewardGold = played ? (reward?.goldEach ?? 0) : 0
    const actionXp = played && rules.actionXp ? Math.max(0, entry?.actionXp ?? 0) : 0
    const bonusXp = played ? rules.bonusXp : 0
    const rewardXp = played ? (reward?.experienceEach ?? 0) : 0
    const experience = actionXp + bonusXp + rewardXp
    const battleGoal = played && input.success && rules.battleGoals && (entry?.battleGoalMet ?? false) ? 1 : 0
    const checkmarks = Math.min(
      MAX_CHECKMARKS - character.checkmarks,
      battleGoal + (played ? (reward?.checkmarksEach ?? 0) : 0)
    )
    const itemIds = rewardItems.filter((id) => input.itemRecipients[id] === character.id)
    const levelAfter = computeLevelFromXp(character.experience + experience)
    const definition = characters.find((c) => c.id === character.type)
    return {
      characterId: character.id,
      name: character.name,
      type: character.type,
      played,
      goldFromTokens,
      rewardGold,
      gold: goldFromTokens + rewardGold,
      actionXp,
      bonusXp,
      rewardXp,
      experience,
      checkmarks: Math.max(0, checkmarks),
      perks: played ? (reward?.perksEach ?? 0) : 0,
      itemIds,
      levelBefore: computeLevelFromXp(character.experience),
      levelAfter,
      hitPointsAfter: definition?.hitPoints[String(levelAfter)] ?? 0,
    }
  })

  return {
    scenarioId: scenario.id,
    success: input.success,
    rules,
    characters: characterResults,
    unlocks: input.success ? scenario.unlocks.filter((id) => campaign.scenarioStatus[id] === 'locked') : [],
    closes: input.success ? scenario.blocks.filter((id) => campaign.scenarioStatus[id] !== 'completed') : [],
    shopItems: reward?.shopItems ?? [],
    unassignedItems,
    errors,
  }
}

/**
 * The campaign after recording a scenario result: gold, experience,
 * checkmarks, reward perks and items on every character, the scenario
 * completed with its unlocks and closes (on success), and a log entry.
 * Throws when the result has errors.
 */
export function applyScenarioResult(
  campaign: Campaign,
  result: ScenarioResult,
  meta: { logId: string; now: Date }
): Campaign {
  if (result.errors.length > 0) throw new Error(result.errors[0])

  const charactersAfter = campaign.characters.map((character) => {
    const gain = result.characters.find((c) => c.characterId === character.id)
    if (!gain) return character
    return {
      ...character,
      gold: character.gold + gain.gold,
      experience: character.experience + gain.experience,
      checkmarks: character.checkmarks + gain.checkmarks,
      bonusPerks: character.bonusPerks + gain.perks,
      itemIds: [...character.itemIds, ...gain.itemIds.filter((id) => !character.itemIds.includes(id))],
    }
  })

  const scenarioStatus = { ...campaign.scenarioStatus }
  if (result.success) {
    scenarioStatus[result.scenarioId] = 'completed'
    for (const id of result.unlocks) scenarioStatus[id] = 'unlocked'
    for (const id of result.closes) scenarioStatus[id] = 'closed'
  }

  const entry: ScenarioLogEntry = {
    id: meta.logId,
    scenarioId: result.scenarioId,
    success: result.success,
    scenarioLevel: result.rules.effectiveLevel,
    recordedAt: meta.now,
    characters: result.characters.map((c) => ({
      characterId: c.characterId,
      name: c.name,
      gold: c.gold,
      experience: c.experience,
      checkmarks: c.checkmarks,
      perks: c.perks,
      itemIds: c.itemIds,
      levelBefore: c.levelBefore,
      levelAfter: c.levelAfter,
    })),
  }

  return {
    ...campaign,
    characters: charactersAfter,
    scenarioStatus,
    scenarioLog: [...campaign.scenarioLog, entry],
    updatedAt: meta.now,
  }
}
