import { describe, expect, it } from 'vitest'
import { migrateCampaignRecord, LEGACY_ITEM_COSTS } from './migrate.ts'

// Version-1 records as they sit in a player's browser: card names instead of
// ids, the unsplit Red Guard perk 7, items of the bigger Gloomhaven box.

function character(patch: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: '11111111-2222-4333-8444-555555555555',
    type: 'hatchet',
    name: 'Hatchet',
    experience: 95,
    gold: 40,
    checkmarks: 0,
    perkIds: [],
    itemIds: [],
    selectedAbilityIds: [],
    ...patch,
  }
}

function campaignWith(
  characters: unknown[],
  scenarioStatus: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    id: '6f1c2f3e-5a6b-4c7d-8e9f-0a1b2c3d4e5f',
    name: 'Friday group',
    createdAt: '2026-04-01T10:00:00.000Z',
    updatedAt: '2026-04-29T18:30:00.000Z',
    characters,
    scenarioStatus,
    cityEventsDrawn: [],
  }
}

interface MigratedCharacter {
  gold: unknown
  itemIds: unknown
  equippedItemIds: unknown
  perkIds: unknown
  selectedAbilityIds: unknown
}

function asMigrated(record: unknown): {
  characters: MigratedCharacter[]
  scenarioStatus: Record<string, unknown>
  lootedTreasureIds: unknown[]
} {
  return record as {
    characters: MigratedCharacter[]
    scenarioStatus: Record<string, unknown>
    lootedTreasureIds: unknown[]
  }
}

describe('migrateCampaignRecord', () => {
  it('refunds the removed items and keeps the rest of a version 1 campaign', () => {
    const input = campaignWith(
      [
        character({
          gold: 40,
          perkIds: ['hatchet_6'],
          itemIds: [1, 10, 18, 52, 40],
          selectedAbilityIds: ['Void Walk', 'Repeat Shot', 'Repeat Shot', 'The Favorite', 'Center Mass'],
        }),
        character({
          id: '66666666-7777-4888-8999-000000000000',
          type: 'red_guard',
          name: 'Guard',
          perkIds: ['red_guard_7'],
        }),
      ],
      { 6: 'completed', 7: 'completed', 8: 'unlocked' }
    )
    const before = structuredClone(input)
    const { record, notes } = migrateCampaignRecord(input)
    const migrated = asMigrated(record)

    expect(input).toEqual(before) // the input is never mutated

    const [hatchet, redGuard] = migrated.characters
    expect(hatchet.gold).toBe(80) // 40 + 30 (item 52) + 10 (item 40)
    expect(hatchet.itemIds).toEqual([1, 10, 18])
    expect(hatchet.equippedItemIds).toEqual([1, 10, 18]) // head 1, hand 2 at level 3
    expect(hatchet.perkIds).toEqual(['hatchet_6'])
    expect(hatchet.selectedAbilityIds).toEqual([
      'hatchet-2-repeat-shot',
      'hatchet-1-the-favorite',
      'hatchet-1-center-mass',
    ])
    expect(redGuard.perkIds).toEqual(['red_guard_7a'])
    expect(migrated.scenarioStatus).toEqual({ 6: 'completed', 7: 'completed', 8: 'closed' })
    expect(migrated.lootedTreasureIds).toEqual([])

    expect(notes).toContainEqual({
      campaignName: 'Friday group',
      characterName: 'Hatchet',
      kind: 'item_removed',
      detail: '#52 Steel Ring (duplicate): +30 gold refunded',
    })
    expect(notes).toContainEqual({
      campaignName: 'Friday group',
      characterName: 'Hatchet',
      kind: 'item_removed',
      detail: '#40 Minor Antidote: +10 gold refunded',
    })
    expect(notes.filter((n) => n.kind === 'ability_renamed').map((n) => n.detail)).toEqual([
      'Repeat Shot → hatchet-2-repeat-shot',
      'Repeat Shot → hatchet-2-repeat-shot',
      'The Favorite → hatchet-1-the-favorite',
      'Center Mass → hatchet-1-center-mass',
    ])
    expect(notes).toContainEqual({
      campaignName: 'Friday group',
      characterName: 'Hatchet',
      kind: 'ability_dropped',
      detail: 'Void Walk: no such card for this class, removed',
    })
    expect(notes).toContainEqual({
      campaignName: 'Friday group',
      characterName: 'Guard',
      kind: 'perk_renamed',
      detail: 'red_guard_7 → red_guard_7a',
    })
    expect(notes).toContainEqual({
      campaignName: 'Friday group',
      characterName: null,
      kind: 'scenario_closed',
      detail: 'Scenario 8 closed by completing scenario 7',
    })
  })

  it('is idempotent — the second run returns an equal record and no notes', () => {
    const input = campaignWith(
      [character({ itemIds: [1, 52], selectedAbilityIds: ['The Favorite'] })],
      { 7: 'completed', 8: 'unlocked' }
    )
    const first = migrateCampaignRecord(input)
    const second = migrateCampaignRecord(first.record)

    expect(second.record).toEqual(first.record)
    expect(second.notes).toEqual([])
  })

  it('splits a doubled Red Guard perk 7 into 7a and 7b', () => {
    const input = campaignWith([
      character({
        id: '66666666-7777-4888-8999-000000000000',
        type: 'red_guard',
        name: 'Guard',
        perkIds: ['red_guard_7', 'red_guard_7'],
      }),
    ])
    const { record, notes } = migrateCampaignRecord(input)

    expect(asMigrated(record).characters[0].perkIds).toEqual(['red_guard_7a', 'red_guard_7b'])
    expect(notes.map((n) => n.detail)).toEqual([
      'red_guard_7 → red_guard_7a',
      'red_guard_7 → red_guard_7b',
    ])
  })

  it('drops unknown items without a refund and deduplicates the rest', () => {
    const input = campaignWith([character({ gold: 25, itemIds: [99, 3, 3] })])
    const { record, notes } = migrateCampaignRecord(input)

    const [hatchet] = asMigrated(record).characters
    expect(hatchet.itemIds).toEqual([3])
    expect(hatchet.gold).toBe(25)
    expect(notes).toContainEqual({
      campaignName: 'Friday group',
      characterName: 'Hatchet',
      kind: 'item_dropped',
      detail: '#99: unknown item',
    })
  })

  it('prunes an equipped list down to the owned items', () => {
    const input = campaignWith([character({ itemIds: [1], equippedItemIds: [1, 2, 2] })])
    const { record } = migrateCampaignRecord(input)

    expect(asMigrated(record).characters[0].equippedItemIds).toEqual([1])
  })

  it('leaves non-integer gold alone when refunding a removed item', () => {
    const input = campaignWith([character({ gold: '40', itemIds: [52] })])
    const { record, notes } = migrateCampaignRecord(input)

    const [hatchet] = asMigrated(record).characters
    expect(hatchet.gold).toBe('40')
    expect(hatchet.itemIds).toEqual([])
    expect(notes.map((n) => n.kind)).toEqual(['item_removed'])
  })

  it('reports a pair of completed alternative scenarios once', () => {
    const input = campaignWith([character()], { 7: 'completed', 8: 'completed' })
    const { record, notes } = migrateCampaignRecord(input)

    expect(asMigrated(record).scenarioStatus).toEqual({ 7: 'completed', 8: 'completed' })
    expect(notes.filter((n) => n.kind === 'scenario_conflict')).toHaveLength(1)
  })

  it('returns garbage unchanged without notes and does not throw', () => {
    expect(migrateCampaignRecord(null)).toEqual({ record: null, notes: [] })
    expect(migrateCampaignRecord(42)).toEqual({ record: 42, notes: [] })
    expect(() => migrateCampaignRecord({})).not.toThrow()
    expect(migrateCampaignRecord('nonsense')).toEqual({ record: 'nonsense', notes: [] })
  })

  it('pins the refund prices of the legacy items', () => {
    expect(LEGACY_ITEM_COSTS[37]).toBe(20)
    expect(LEGACY_ITEM_COSTS[52]).toBe(30)
    expect(Object.keys(LEGACY_ITEM_COSTS)).toHaveLength(16)
  })
})
