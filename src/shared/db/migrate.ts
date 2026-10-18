import { abilities, items, perks, scenarios } from '@/data'
import type { Item, ItemSlot } from '@/data'
import { computeLevelFromXp, itemSlotLimits } from '@/features/campaign/rules'

// ---------------------------------------------------------------------------
// Pure content migration of a stored campaign record to the S3 data model.
// No Dexie, no clock, no mutation of the input — new objects are built and
// every change is reported as a MigrationNote.  Works on any input: a
// version-1 record, an already migrated record, or garbage (returned
// unchanged; validation elsewhere rejects it).  Applying it twice yields the
// same record and no notes the second time.
// ---------------------------------------------------------------------------

export type MigrationNoteKind =
  | 'item_removed'
  | 'item_dropped'
  | 'perk_renamed'
  | 'perk_dropped'
  | 'ability_renamed'
  | 'ability_dropped'
  | 'scenario_closed'
  | 'scenario_conflict'

export interface MigrationNote {
  campaignName: string
  characterName: string | null
  kind: MigrationNoteKind
  detail: string
}

/**
 * Purchase prices of the items 37-52 that Jaws of the Lion does not have
 * (r192): they are refunded in full when removed from a record.
 */
export const LEGACY_ITEM_COSTS: Readonly<Record<number, number>> = {
  37: 20, 38: 30, 39: 30, 40: 10, 41: 30, 42: 30, 43: 40, 44: 30, 45: 50,
  46: 50, 47: 60, 48: 50, 49: 30, 50: 50, 51: 50, 52: 30,
}

const LEGACY_ITEM_NAMES: Readonly<Record<number, string>> = {
  37: 'Cloak of Invisibility', 38: 'Piercing Bow', 39: 'War Hammer', 40: 'Minor Antidote',
  41: 'Major Healing Potion', 42: 'Major Stamina Potion', 43: 'Major Power Potion',
  44: 'Major Mana Potion', 45: 'Super Healing Potion', 46: 'Super Stamina Potion',
  47: 'Super Power Potion', 48: 'Ring of Skulls', 49: 'Second Skin',
  50: 'Pendant of Dark Pacts', 51: 'Drakescale Helm', 52: 'Steel Ring (duplicate)',
}

const itemById = new Map<number, Item>()
for (const item of items) itemById.set(item.id, item)

const perkIdsByCharacter = new Map<string, Set<string>>()
for (const perk of perks) {
  let ids = perkIdsByCharacter.get(perk.characterId)
  if (!ids) {
    ids = new Set<string>()
    perkIdsByCharacter.set(perk.characterId, ids)
  }
  ids.add(perk.id)
}

const abilityIdsByCharacter = new Map<string, Set<string>>()
// Version 1 stored card names; names map only to the level 1-9 / X cards,
// never to the A / B alternatives of the starting hand.
const abilityNamesByCharacter = new Map<string, Map<string, string>>()
for (const card of abilities) {
  let ids = abilityIdsByCharacter.get(card.characterId)
  if (!ids) {
    ids = new Set<string>()
    abilityIdsByCharacter.set(card.characterId, ids)
  }
  ids.add(card.id)

  if (card.level === 'A' || card.level === 'B') continue
  let names = abilityNamesByCharacter.get(card.characterId)
  if (!names) {
    names = new Map<string, string>()
    abilityNamesByCharacter.set(card.characterId, names)
  }
  const key = card.name.trim().toLowerCase()
  if (!names.has(key)) names.set(key, card.id)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toItemId(entry: unknown): number | null {
  return typeof entry === 'number' && Number.isInteger(entry) ? entry : null
}

/** Greedy equip of the owned items in itemIds order under the slot limits. */
function defaultEquippedItems(itemIds: number[], level: number): number[] {
  const limits = itemSlotLimits(level)
  const counts: Record<ItemSlot, number> = { head: 0, body: 0, feet: 0, hand: 0, small: 0 }
  const equipped: number[] = []
  for (const id of itemIds) {
    const item = itemById.get(id)
    if (!item) continue
    if (counts[item.slot] >= limits[item.slot]) continue
    counts[item.slot] += 1
    equipped.push(id)
  }
  return equipped
}

function migrateCharacter(
  character: Record<string, unknown>,
  campaignName: string,
  notes: MigrationNote[]
): Record<string, unknown> {
  const migrated: Record<string, unknown> = { ...character }
  const name = typeof character.name === 'string' && character.name
    ? character.name
    : typeof character.type === 'string'
      ? character.type
      : null
  const note = (kind: MigrationNoteKind, detail: string): void => {
    notes.push({ campaignName, characterName: name, kind, detail })
  }

  const rawItemIds: unknown[] = Array.isArray(character.itemIds) ? character.itemIds : []
  const rawPerkIds: unknown[] = Array.isArray(character.perkIds) ? character.perkIds : []
  const rawAbilityIds: unknown[] = Array.isArray(character.selectedAbilityIds)
    ? character.selectedAbilityIds
    : []

  // --- Items: refund the legacy ones JotL does not have, drop unknown ids.
  const gold = character.gold
  const goldIsInteger = typeof gold === 'number' && Number.isInteger(gold)
  let refund = 0
  const keptItemIds: number[] = []
  for (const entry of rawItemIds) {
    const id = toItemId(entry)
    if (id !== null && Object.hasOwn(LEGACY_ITEM_COSTS, id)) {
      const cost = LEGACY_ITEM_COSTS[id]
      if (goldIsInteger) {
        refund += cost
        note('item_removed', `#${id} ${LEGACY_ITEM_NAMES[id]}: +${cost} gold refunded`)
      } else {
        // Gold is not an integer — leave it alone, the schema rejects the record.
        note('item_removed', `#${id} ${LEGACY_ITEM_NAMES[id]}`)
      }
      continue
    }
    if (id !== null && itemById.has(id)) {
      if (!keptItemIds.includes(id)) keptItemIds.push(id)
      continue
    }
    note('item_dropped', `${typeof entry === 'number' ? `#${entry}` : String(entry)}: unknown item`)
  }
  migrated.itemIds = keptItemIds
  if (goldIsInteger) migrated.gold = gold + refund

  // --- Equipped items: fill the slot limits when absent, prune when present.
  const level = typeof character.experience === 'number' && Number.isFinite(character.experience)
    ? computeLevelFromXp(character.experience)
    : 1
  if (!Array.isArray(character.equippedItemIds)) {
    migrated.equippedItemIds = defaultEquippedItems(keptItemIds, level)
  } else {
    const owned = new Set(keptItemIds)
    const equipped: number[] = []
    for (const entry of character.equippedItemIds) {
      const id = toItemId(entry)
      if (id !== null && owned.has(id) && !equipped.includes(id)) equipped.push(id)
    }
    migrated.equippedItemIds = equipped
  }

  // --- Perks and cards depend on the class. With an unknown class the record
  // fails validation anyway; keep its lists untouched so nothing is lost.
  const type = typeof character.type === 'string' ? character.type : ''
  if (!perkIdsByCharacter.has(type)) return migrated

  // --- Perks: split the doubled Red Guard perk 7, drop foreign ids.
  const validPerkIds = perkIdsByCharacter.get(type) ?? new Set<string>()
  const keptPerkIds: string[] = []
  for (const entry of rawPerkIds) {
    let id = typeof entry === 'string' ? entry : null
    if (id === 'red_guard_7') {
      const target = keptPerkIds.includes('red_guard_7a') ? 'red_guard_7b' : 'red_guard_7a'
      note('perk_renamed', `red_guard_7 → ${target}`)
      id = target
    }
    if (id !== null && validPerkIds.has(id)) {
      if (!keptPerkIds.includes(id)) keptPerkIds.push(id)
    } else {
      note('perk_dropped', `${String(entry)}: not available to this character`)
    }
  }
  migrated.perkIds = keptPerkIds

  // --- Ability cards: ids stay, version 1 names map to card ids.
  const validAbilityIds = abilityIdsByCharacter.get(type) ?? new Set<string>()
  const nameIndex = abilityNamesByCharacter.get(type) ?? new Map<string, string>()
  const keptAbilityIds: string[] = []
  for (const entry of rawAbilityIds) {
    if (typeof entry === 'string' && validAbilityIds.has(entry)) {
      if (!keptAbilityIds.includes(entry)) keptAbilityIds.push(entry)
      continue
    }
    const label = String(entry)
    const cardId = nameIndex.get(label.trim().toLowerCase())
    if (cardId !== undefined) {
      note('ability_renamed', `${label} → ${cardId}`)
      if (!keptAbilityIds.includes(cardId)) keptAbilityIds.push(cardId)
    } else {
      note('ability_dropped', label)
    }
  }
  migrated.selectedAbilityIds = keptAbilityIds

  return migrated
}

function migrateScenarioStatus(
  status: Record<string, unknown>,
  campaignName: string,
  notes: MigrationNote[]
): Record<string, unknown> {
  const migrated: Record<string, unknown> = { ...status }
  const seenConflicts = new Set<string>()

  // Glossary p.18: completing a scenario closes its alternatives.
  for (const scenario of scenarios) {
    if (migrated[scenario.id] !== 'completed') continue
    for (const blockedId of scenario.blocks) {
      if (migrated[blockedId] === 'completed') {
        const pair = `${Math.min(scenario.id, blockedId)}-${Math.max(scenario.id, blockedId)}`
        if (!seenConflicts.has(pair)) {
          seenConflicts.add(pair)
          notes.push({
            campaignName,
            characterName: null,
            kind: 'scenario_conflict',
            detail: `Scenarios ${scenario.id} and ${blockedId} are both completed (they are alternatives)`,
          })
        }
        continue
      }
      if (migrated[blockedId] === 'closed') continue
      migrated[blockedId] = 'closed'
      notes.push({
        campaignName,
        characterName: null,
        kind: 'scenario_closed',
        detail: `Scenario ${blockedId} closed by completing scenario ${scenario.id}`,
      })
    }
  }
  return migrated
}

export function migrateCampaignRecord(raw: unknown): { record: unknown; notes: MigrationNote[] } {
  if (!isRecord(raw)) return { record: raw, notes: [] }

  const notes: MigrationNote[] = []
  const campaignName = typeof raw.name === 'string' ? raw.name : 'Unknown'

  const migrated: Record<string, unknown> = { ...raw }
  if (!Array.isArray(migrated.lootedTreasureIds)) migrated.lootedTreasureIds = []
  if (!Array.isArray(migrated.cityEventsDrawn)) migrated.cityEventsDrawn = []
  migrated.characters = Array.isArray(raw.characters)
    ? raw.characters.filter(isRecord).map((character) => migrateCharacter(character, campaignName, notes))
    : []
  if (isRecord(raw.scenarioStatus)) {
    migrated.scenarioStatus = migrateScenarioStatus(raw.scenarioStatus, campaignName, notes)
  }

  return { record: migrated, notes }
}
