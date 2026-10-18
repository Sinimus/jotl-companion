// ---------------------------------------------------------------------------
// Derived from game documentation in docs/game-docs/.
// These types mirror the shape of the companion JSON fixtures exactly.
// ---------------------------------------------------------------------------

export interface Character {
  id: string
  name: string
  race: string
  handLimit: number
  /** Level (1-9) mapped to maximum hit-point value. */
  hitPoints: Record<string, number>
  source: string
}

export interface Perk {
  id: string
  characterId: string
  description: string
  /** How many copies of this perk exist in the physical deck (always 1 here — duplicates are separate entries). */
  count: number
  source: string
}

export type ConditionType = 'positive' | 'negative'
export type ConditionRemoval = 'end_of_turn' | 'on_heal' | 'on_reveal'

export interface Condition {
  id: string
  name: string
  type: ConditionType
  removal: ConditionRemoval
  description: string
  source: string
}

export interface Element {
  id: string
  name: string
  /** Hex colour string for UI badges / icons. */
  color: string
  description: string
  source: string
}

export interface Scenario {
  id: number
  name: string
  /** City-map grid reference (e.g. "B1"). */
  location: string
  /** Goal as printed on the scenario page. */
  goal: string
  /** Scenario IDs that are unlocked upon completing this scenario. */
  unlocks: number[]
  /** Scenario IDs this one blocks: completing this scenario closes them (Glossary p.18). */
  blocks: number[]
  /** Monster sets of the scenario key (spoiler). */
  monsters: string[]
  /** Numbers of the treasure tiles on the map (spoiler). */
  treasures: number[]
  /** Rewards of the conclusion (spoiler). */
  rewards: string[]
  /** Source of name, location, goal and monsters. */
  source: string
  unlocksSource: string
  blocksSource: string
  rewardsSource: string
  treasuresSource: string
}

export type ItemSlot = 'head' | 'body' | 'feet' | 'hand' | 'small'
export type ItemUsageType = 'consumed' | 'spent' | 'passive'

/** How an item enters the game — shop stock, scenario reward, treasure or misplaced goods. */
export type ItemUnlock =
  | { type: 'shop'; scenario: number; source: string }
  | { type: 'scenario'; scenario: number; source: string }
  | { type: 'treasure'; treasure: number; source: string }
  | { type: 'misplacedGoods'; token: string; scenario: number; source: string }

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
  /** Conditions under which the item is available; any satisfied entry unlocks it. */
  unlock: ItemUnlock[]
  source: string
}

/** Card levels: A/B are the starting hand alternatives, X replaces a level 1 card. */
export type AbilityLevel = 'A' | 'B' | 'X' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'

export interface AbilityCard {
  id: string
  characterId: string
  name: string
  level: AbilityLevel
  initiative: number
  source: string
}

export interface Treasure {
  id: number
  /** Reward printed on the treasure list (Glossary p.31). */
  reward: string
  /** Scenario the treasure chest appears in. */
  scenario: number
  source: string
  scenarioSource: string
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

export interface Tables {
  /** Level (1-9) as string key → cumulative XP required to reach that level. */
  levelThresholds: Record<string, number>
  scenarioLevelTable: ScenarioLevelRow[]
  source: string
}


// ---------------------------------------------------------------------------
// rules.json - Game rules and reference data
// ---------------------------------------------------------------------------

export interface GlossaryEntry {
  term: string
  description: string
  category: string
  source: string
}

export interface RuleSection {
  id: string
  title: string
  content: string[]
  source: string
}

export interface RulesData {
  glossary: GlossaryEntry[]
  guides: RuleSection[]
}
