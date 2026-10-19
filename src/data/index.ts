// ---------------------------------------------------------------------------
// Static game-data barrel.  Import anywhere in the app:
//   import { characters, scenarios } from '@/data'
// ---------------------------------------------------------------------------

import charactersRaw from './characters.json'
import perksRaw from './perks.json'
import scenariosRaw from './scenarios.json'
import tablesRaw from './tables.json'
import itemsRaw from './items.json'
import abilitiesRaw from './abilities.json'
import treasuresRaw from './treasures.json'

import type {
  Character,
  Perk,
  Scenario,
  Tables,
  Item,
  AbilityCard,
  Treasure,
} from './types.ts'

const characters = charactersRaw as Character[]
const perks = perksRaw as Perk[]
const scenarios = scenariosRaw as Scenario[]
const tables = tablesRaw as Tables
const items = itemsRaw as Item[]
const abilities = abilitiesRaw as AbilityCard[]
const treasures = treasuresRaw as Treasure[]

export const TOTAL_SCENARIOS = scenarios.length

export { characters, perks, scenarios, tables, items, abilities, treasures }

export type {
  Character,
  GlossaryEntry,
  RuleSection,
  RulesData,
  Perk,
  Condition,
  ConditionType,
  ConditionRemoval,
  Element,
  Scenario,
  ScenarioReward,
  Item,
  ItemSlot,
  ItemUsageType,
  ItemUnlock,
  AbilityCard,
  AbilityLevel,
  Treasure,
  Tables,
  ScenarioLevelRow,
} from './types.ts'
