import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db, readPendingMigration } from '@/shared/db'
import type { Campaign, CharacterProgress } from '@/shared/schemas'
import { useCampaignStore } from './store'

// Records are written straight into IndexedDB in the shape of database version 1
// (the schema before any content migration), so that a change of Dexie or Zod
// is checked against what players already have stored in their browsers.

const CAMPAIGN_ID = '6f1c2f3e-5a6b-4c7d-8e9f-0a1b2c3d4e5f'
const LEGACY_ID = '0b9a8c7d-6e5f-4a3b-9c2d-1e0f9a8b7c6d'
const BROKEN_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
const CHARACTER_ID = '11111111-2222-4333-8444-555555555555'
const LEGACY_CHARACTER_ID = '66666666-7777-4888-8999-000000000000'

const scenarioStatus = { 1: 'completed', 2: 'unlocked', 3: 'locked' }

const currentV1Campaign = {
  id: CAMPAIGN_ID,
  name: 'Friday group',
  createdAt: new Date('2026-04-01T10:00:00.000Z'),
  updatedAt: new Date('2026-04-29T18:30:00.000Z'),
  characters: [
    {
      id: CHARACTER_ID,
      type: 'hatchet',
      name: 'Hatchet',
      experience: 95,
      gold: 40,
      checkmarks: 4,
      perkIds: ['hatchet_6'],
      itemIds: [1, 52],
      selectedAbilityIds: ['Void Walk'],
      bonusPerks: 1,
    },
  ],
  scenarioStatus,
  cityEventsDrawn: [3, 7],
  lootedTreasureIds: [1, 5],
}

// The same record after the content migration: item 52 is refunded,
// 'Void Walk' has no card, the owned item is equipped by default.
const migratedV1Campaign = {
  ...currentV1Campaign,
  characters: [
    {
      ...currentV1Campaign.characters[0],
      gold: 70,
      itemIds: [1],
      equippedItemIds: [1],
      selectedAbilityIds: [],
    },
  ],
}

// An early record: no lootedTreasureIds, no selectedAbilityIds, no bonusPerks,
// timestamps stored as ISO strings.
const legacyV1Campaign = {
  id: LEGACY_ID,
  name: 'Old campaign',
  createdAt: '2026-02-08T09:00:00.000Z',
  updatedAt: '2026-02-09T09:00:00.000Z',
  characters: [
    {
      id: LEGACY_CHARACTER_ID,
      type: 'red_guard',
      name: 'Guard',
      experience: 0,
      gold: -5,
      checkmarks: 0,
      perkIds: [],
      itemIds: [],
    },
  ],
  scenarioStatus,
  cityEventsDrawn: [],
}

const brokenCampaign = { ...currentV1Campaign, id: BROKEN_ID, name: '' }

function resetStore(): void {
  useCampaignStore.setState({
    campaigns: [],
    corruptedCampaigns: [],
    migrationNotes: [],
    activeCampaignId: null,
    isLoaded: false,
  })
}

/** Recreate the database at version 1 and fill it with raw rows. */
async function writeV1Database(rows: unknown[]): Promise<void> {
  // disableAutoOpen: false keeps the singleton able to reopen itself; with the
  // default it would refuse every operation after the deletion.
  await db.delete({ disableAutoOpen: false })
  const v1 = new Dexie('jotl-companion')
  v1.version(1).stores({ campaigns: 'id, name, updatedAt' })
  await v1.open()
  await v1.table('campaigns').bulkPut(rows as never)
  v1.close()
}

beforeEach(async () => {
  vi.stubGlobal('localStorage', {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
  })
  await db.campaigns.clear()
  await db.meta.clear()
  resetStore()
})

describe('loading stored campaigns in the version 1 shape', () => {
  it('migrates a current record on load and does not mark it corrupted', async () => {
    await db.campaigns.put(currentV1Campaign as never)
    await useCampaignStore.getState().initStore()

    const { campaigns, corruptedCampaigns, isLoaded } = useCampaignStore.getState()
    expect(isLoaded).toBe(true)
    expect(corruptedCampaigns).toEqual([])
    expect(campaigns).toHaveLength(1)
    expect(campaigns[0]).toEqual(migratedV1Campaign)
  })

  it('fills the fields an early record lacks and coerces its timestamps', async () => {
    await db.campaigns.put(legacyV1Campaign as never)
    await useCampaignStore.getState().initStore()

    const { campaigns, corruptedCampaigns } = useCampaignStore.getState()
    expect(corruptedCampaigns).toEqual([])
    expect(campaigns).toHaveLength(1)
    const [campaign] = campaigns
    expect(campaign.lootedTreasureIds).toEqual([])
    expect(campaign.createdAt).toEqual(new Date('2026-02-08T09:00:00.000Z'))
    expect(campaign.characters[0]).toMatchObject({
      id: LEGACY_CHARACTER_ID,
      gold: -5,
      selectedAbilityIds: [],
      equippedItemIds: [],
      bonusPerks: 0,
    })
  })

  it('keeps scenario statuses keyed by number', async () => {
    await db.campaigns.put(currentV1Campaign as never)
    await useCampaignStore.getState().initStore()

    expect(useCampaignStore.getState().campaigns[0].scenarioStatus).toEqual(scenarioStatus)
  })

  it('still reports a record that breaks the schema as corrupted', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await db.campaigns.bulkPut([currentV1Campaign, brokenCampaign] as never[])
    await useCampaignStore.getState().initStore()

    const { campaigns, corruptedCampaigns } = useCampaignStore.getState()
    expect(campaigns.map((c) => c.id)).toEqual([CAMPAIGN_ID])
    expect(corruptedCampaigns).toHaveLength(1)
    expect(corruptedCampaigns[0]).toMatchObject({ id: BROKEN_ID })
  })

  it('accepts an export of a current version 1 record back through the import', async () => {
    const json = JSON.stringify([currentV1Campaign])
    const result = await useCampaignStore.getState().importData(json)

    expect(result.success).toBe(true)
    expect(result.count).toBe(1)
    expect(result.notes?.length).toBeGreaterThan(0)
    const { campaigns, corruptedCampaigns } = useCampaignStore.getState()
    expect(corruptedCampaigns).toEqual([])
    expect(campaigns).toEqual([migratedV1Campaign])
  })

  // The S2 finding: an export of an early record without lootedTreasureIds
  // must import — the migration fills the field first.
  it('accepts an early record without lootedTreasureIds in the import', async () => {
    const result = await useCampaignStore
      .getState()
      .importData(JSON.stringify([legacyV1Campaign]))

    expect(result).toMatchObject({ success: true, count: 1 })
    expect(await db.campaigns.count()).toBe(1)
    const [campaign] = useCampaignStore.getState().campaigns
    expect(campaign.lootedTreasureIds).toEqual([])
  })

  it('rejects an import that is not a list of campaigns', async () => {
    const result = await useCampaignStore.getState().importData('{"name": "nope"}')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Expected a list of campaigns')
    expect(await db.campaigns.count()).toBe(0)
  })

  it('rejects an import with a broken record without writing anything', async () => {
    const result = await useCampaignStore
      .getState()
      .importData(JSON.stringify([currentV1Campaign, brokenCampaign]))

    expect(result.success).toBe(false)
    expect(await db.campaigns.count()).toBe(0)
  })
})

describe('the version 2 database upgrade', () => {
  it('migrates the stored rows and collects their notes when the app opens the database', async () => {
    await writeV1Database([currentV1Campaign])

    await useCampaignStore.getState().initStore()

    const { campaigns, corruptedCampaigns, migrationNotes } = useCampaignStore.getState()
    expect(corruptedCampaigns).toEqual([])
    expect(campaigns).toHaveLength(1)
    const [character] = campaigns[0].characters
    expect(character.gold).toBe(70)
    expect(character.itemIds).toEqual([1])
    expect(character.selectedAbilityIds).toEqual([])
    expect(migrationNotes.length).toBeGreaterThan(0)

    // The upgrade writes back: the rows in the database are migrated too.
    const stored = await db.campaigns.toArray()
    expect(stored[0].characters[0].gold).toBe(70)
  })

  it('keeps every version 1 campaign, early ones included, and the party gold adds up', async () => {
    await writeV1Database([currentV1Campaign, legacyV1Campaign])

    await useCampaignStore.getState().initStore()

    const { campaigns, corruptedCampaigns } = useCampaignStore.getState()
    expect(corruptedCampaigns).toEqual([])
    expect(campaigns.map((c) => c.id).sort()).toEqual([CAMPAIGN_ID, LEGACY_ID].sort())
    const gold = campaigns.flatMap((c) => c.characters.map((ch) => ch.gold))
    // 40 + 30 refunded for item 52, and the early record's -5 untouched
    expect(gold.sort((a, b) => a - b)).toEqual([-5, 70])
  })

  it('clears the notes from state when they are dismissed', async () => {
    await writeV1Database([currentV1Campaign])
    await useCampaignStore.getState().initStore()

    await useCampaignStore.getState().dismissMigrationNotes()

    expect(useCampaignStore.getState().migrationNotes).toEqual([])
    expect(await db.meta.get('migration-v2')).toBeUndefined()
  })
})

describe('readPendingMigration', () => {
  it('returns the records of a version 1 database', async () => {
    await writeV1Database([currentV1Campaign])

    const pending = await readPendingMigration()

    expect(pending?.fromVersion).toBe(1)
    expect(pending?.records).toHaveLength(1)
  })

  it('returns null once the app has opened the database at version 2', async () => {
    await writeV1Database([currentV1Campaign])
    await useCampaignStore.getState().initStore()

    expect(await readPendingMigration()).toBeNull()
  })

  it('returns null for a missing database', async () => {
    await db.delete({ disableAutoOpen: false })

    expect(await readPendingMigration()).toBeNull()
  })
})

describe('setScenarioStatus', () => {
  let campaignId: string

  beforeEach(async () => {
    await useCampaignStore.getState().createCampaign({ name: 'Branches' })
    campaignId = useCampaignStore.getState().campaigns[0].id
  })

  it('closes the alternative scenario when a branch is completed', async () => {
    const store = useCampaignStore.getState()
    await store.setScenarioStatus(campaignId, 7, 'unlocked')
    await store.setScenarioStatus(campaignId, 7, 'completed')

    const status = useCampaignStore.getState().campaigns[0].scenarioStatus
    expect(status[7]).toBe('completed')
    expect(status[9]).toBe('unlocked') // child of 7
    expect(status[8]).toBe('closed') // alternative of 7
  })

  it('refuses to change a closed scenario and reopens it with its blocker', async () => {
    const store = useCampaignStore.getState()
    await store.setScenarioStatus(campaignId, 7, 'unlocked')
    await store.setScenarioStatus(campaignId, 7, 'completed')

    await expect(
      useCampaignStore.getState().setScenarioStatus(campaignId, 8, 'completed')
    ).rejects.toThrow('Scenario is closed')

    await useCampaignStore.getState().setScenarioStatus(campaignId, 7, 'unlocked')
    const status = useCampaignStore.getState().campaigns[0].scenarioStatus
    expect(status[7]).toBe('unlocked')
    expect(status[8]).toBe('unlocked')
  })
})

describe('item actions', () => {
  let campaignId: string
  let characterId: string

  beforeEach(async () => {
    await useCampaignStore.getState().createCampaign({ name: 'Shop run' })
    campaignId = useCampaignStore.getState().campaigns[0].id
    await useCampaignStore.getState().addCharacter(campaignId, { type: 'hatchet', name: 'Thrower' })
    characterId = useCampaignStore.getState().campaigns[0].characters[0].id
  })

  function getCharacter(): CharacterProgress {
    const campaign: Campaign | undefined = useCampaignStore
      .getState()
      .campaigns.find((c) => c.id === campaignId)
    const character = campaign?.characters.find((c) => c.id === characterId)
    if (!character) throw new Error('test character missing')
    return character
  }

  it('buys an item when the gold is there', async () => {
    await useCampaignStore.getState().updateCharacter(campaignId, characterId, { gold: 100 })
    await useCampaignStore.getState().buyItem(campaignId, characterId, 1) // Eagle-Eye Goggles, 30g

    const character = getCharacter()
    expect(character.gold).toBe(70)
    expect(character.itemIds).toEqual([1])
    expect(character.equippedItemIds).toEqual([]) // buying does not auto-equip
  })

  it('rejects a purchase without enough gold and changes nothing', async () => {
    await expect(
      useCampaignStore.getState().buyItem(campaignId, characterId, 1)
    ).rejects.toThrow('Not enough gold')

    const character = getCharacter()
    expect(character.gold).toBe(0)
    expect(character.itemIds).toEqual([])
  })

  it('rejects a purchase of the last copy owned by another party member', async () => {
    await useCampaignStore.getState().updateCharacter(campaignId, characterId, { gold: 100 })
    await useCampaignStore.getState().addCharacter(campaignId, { type: 'red_guard', name: 'Guard' })
    const guardId = useCampaignStore.getState().campaigns[0].characters[1].id
    await useCampaignStore.getState().updateCharacter(campaignId, guardId, { gold: 100 })

    await useCampaignStore.getState().buyItem(campaignId, characterId, 15) // Amulet of Life, 1 copy
    await expect(
      useCampaignStore.getState().buyItem(campaignId, guardId, 15)
    ).rejects.toThrow('No copies')

    expect(getCharacter().itemIds).toEqual([15])
    const guard = useCampaignStore.getState().campaigns[0].characters[1]
    expect(guard.itemIds).toEqual([])
    expect(guard.gold).toBe(100)
  })

  it('sells an owned item for half its cost rounded up', async () => {
    await useCampaignStore.getState().updateCharacter(campaignId, characterId, { gold: 100 })
    await useCampaignStore.getState().buyItem(campaignId, characterId, 1) // 30g
    await useCampaignStore.getState().setEquippedItems(campaignId, characterId, [1])

    await useCampaignStore.getState().sellItem(campaignId, characterId, 1)

    const character = getCharacter()
    expect(character.gold).toBe(85) // 70 + ceil(30 / 2)
    expect(character.itemIds).toEqual([])
    expect(character.equippedItemIds).toEqual([])
  })

  it('gains an item without paying', async () => {
    await useCampaignStore.getState().gainItem(campaignId, characterId, 27)

    const character = getCharacter()
    expect(character.itemIds).toEqual([27])
    expect(character.gold).toBe(0)
  })

  it('allows owning two head items but not equipping both', async () => {
    await useCampaignStore.getState().updateCharacter(campaignId, characterId, {
      itemIds: [1, 2], // both head
    })
    expect(getCharacter().itemIds).toEqual([1, 2]) // owning is not limited

    await expect(
      useCampaignStore.getState().setEquippedItems(campaignId, characterId, [1, 2])
    ).rejects.toThrow('head')

    await useCampaignStore.getState().setEquippedItems(campaignId, characterId, [2])
    expect(getCharacter().equippedItemIds).toEqual([2])
  })

  it('rejects equipping an item the character does not own', async () => {
    await expect(
      useCampaignStore.getState().setEquippedItems(campaignId, characterId, [1])
    ).rejects.toThrow('not owned')
  })
})
