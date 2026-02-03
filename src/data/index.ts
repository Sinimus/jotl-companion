// ---------------------------------------------------------------------------
// Static game-data barrel.  Import anywhere in the app:
//   import { characters, scenarios } from '@/data'
// ---------------------------------------------------------------------------

import characters from './characters.json'
import perks from './perks.json'
import conditions from './conditions.json'
import elements from './elements.json'
import scenarios from './scenarios.json'
import tables from './tables.json'
import items from './items.json'

export { characters, perks, conditions, elements, scenarios, tables, items }

export type {
  Character,
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
