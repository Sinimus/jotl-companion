// ---------------------------------------------------------------------------
// Static game-data barrel.  Import anywhere in the app:
//   import { characters, scenarios } from '@/data'
// ---------------------------------------------------------------------------

import charactersRaw from './characters.json'
import perksRaw from './perks.json'
import conditionsRaw from './conditions.json'
import elementsRaw from './elements.json'
import scenariosRaw from './scenarios.json'
import tablesRaw from './tables.json'
import itemsRaw from './items.json'
import rulesRaw from './rules.json'

import type {
  Character,
  Perk,
  Condition,
  Element,
  Scenario,
  Tables,
  Item,
  RulesData,
} from './types.ts'

const characters = charactersRaw as Character[]
const perks = perksRaw as Perk[]
const conditions = conditionsRaw as Condition[]
const elements = elementsRaw as Element[]
const scenarios = scenariosRaw as Scenario[]
const tables = tablesRaw as Tables
const items = itemsRaw as Item[]
const rules = rulesRaw as RulesData

export const TOTAL_SCENARIOS = scenarios.length

export { characters, perks, conditions, elements, scenarios, tables, items, rules }

export type {
  Character,
  GlossaryEntry,
  RuleSection,
  TreasureReward,
  RulesData,
  Perk,
  Condition,
  ConditionType,
  ConditionRemoval,
  Element,
  Scenario,
  Item,
  ItemSlot,
  ItemUsageType,
  Tables,
  ScenarioLevelRow,
} from './types.ts'
