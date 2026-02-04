// ---------------------------------------------------------------------------
// Derived from game documentation in docs/game-docs/.
// These types mirror the shape of the companion JSON fixtures exactly.
// ---------------------------------------------------------------------------

export interface Character {
  id: string
  name: string
  race: string
  role: string
  handLimit: number
  /** Level (1-9) mapped to maximum hit-point value. */
  hitPoints: Record<string, number>
  /** Ordered list of perk IDs available to this character. */
  perkIds: string[]
}

export interface Perk {
  id: string
  characterId: string
  description: string
  /** How many copies of this perk exist in the physical deck (always 1 here — duplicates are separate entries). */
  count: number
}

export type ConditionType = 'positive' | 'negative'
export type ConditionRemoval = 'end_of_turn' | 'on_heal' | 'on_reveal'

export interface Condition {
  id: string
  name: string
  type: ConditionType
  removal: ConditionRemoval
  description: string
}

export interface Element {
  id: string
  name: string
  /** Hex colour string for UI badges / icons. */
  color: string
}

export interface Scenario {
  id: number
  name: string
  /** City-map grid reference (e.g. "B1"). */
  location: string
  /** Plain-language victory condition. */
  goal: string
  /** Scenario ID that unlocks this one, or null for the campaign start. */
  unlockedBy: number | null
  /** Scenario IDs that are unlocked upon completing this scenario. */
  unlocks: number[]
}

export type ItemSlot = 'head' | 'body' | 'feet' | 'hand' | 'small'
export type ItemUsageType = 'consumed' | 'spent' | 'passive'

export interface Item {
  id: number
  name: string
  slot: ItemSlot
  /** Gold cost to buy at the shop. Sell value = ceil(cost / 2). */
  cost: number
  usageType: ItemUsageType
  /** Human-readable effect text. */
  effect: string
  /** Total physical copies of this item in the game box. */
  copies: number
}

// ---------------------------------------------------------------------------
// tables.json
// ---------------------------------------------------------------------------

export interface ScenarioLevelRow {
  level: number
  trapDamage: number
  /** Gold gained per money token collected. */
  goldConversion: number
  /** Bonus XP awarded for successfully completing the scenario. */
  bonusXp: number
}

export type ItemSlotLimitKey = 'head' | 'body' | 'feet' | 'hand' | 'small'

export interface Tables {
  /** Level (1-9) as string key → cumulative XP required to reach that level. */
  levelThresholds: Record<string, number>
  scenarioLevelTable: ScenarioLevelRow[]
  /** Per-slot equip limits.  "half_level" means ceil(characterLevel / 2). */
  itemSlotLimits: Record<ItemSlotLimitKey, number | 'half_level'>
}


// ---------------------------------------------------------------------------
// rules.json - Game rules and reference data
// ---------------------------------------------------------------------------

export interface GlossaryEntry {
  term: string
  description: string
  category?: string
}

export interface RuleSection {
  id: string
  title: string
  content: string[]
}

export interface TreasureReward {
  id: number
  reward: string
}

export interface RulesData {
  glossary: GlossaryEntry[]
  guides: RuleSection[]
  treasures: TreasureReward[]
}
