import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db, readPendingMigration } from '@/shared/db'
import type { Campaign, CharacterProgress } from '@/shared/schemas'
import { useCampaignStore } from './store'
import { itemAvailability } from './rules'
import { items } from '@/data'
import v2Export from '@/shared/db/fixtures/v2-export.json'
import v3Export from '@/shared/db/fixtures/v3-export.json'

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
      unlockedAbilityIds: [],
    },
  ],
  soldItemIds: [],
  scenarioLog: [],
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

  it('returns null once the app has opened the database at the current version', async () => {
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

  it('puts a sold reward item into the shop, where it can be bought back (Glossary p.19)', async () => {
    const store = useCampaignStore.getState()
    await store.setScenarioStatus(campaignId, 4, 'completed') // item 14 becomes a reward
    await store.updateCharacter(campaignId, characterId, { gold: 20 })
    await store.gainItem(campaignId, characterId, 14)
    await store.sellItem(campaignId, characterId, 14)

    const [stored] = await db.campaigns.toArray()
    expect(stored.soldItemIds).toEqual([14])
    expect(useCampaignStore.getState().campaigns[0].soldItemIds).toEqual([14])
    const potion = items.find((i) => i.id === 14)
    expect(potion && itemAvailability(potion, stored)).toBe('shop')

    const gold = getCharacter().gold
    await store.buyItem(campaignId, characterId, 14)
    expect(getCharacter()).toMatchObject({ itemIds: [14], gold: gold - (potion?.cost ?? 0) })

    // Selling it again keeps one entry.
    await store.sellItem(campaignId, characterId, 14)
    expect(useCampaignStore.getState().campaigns[0].soldItemIds).toEqual([14])
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

// ---------------------------------------------------------------------------
// Database version 3 (S5) over data stored by the S4 build.  The fixture is a
// real export of the S4 app (database version 2), made by clicking through it:
// a level 3 Hatchet with a level 1 and a level 2 card in its one card list,
// a perk, an item, two checkmarks; scenarios 1-7 completed and 8 closed.
// ---------------------------------------------------------------------------

/** Stored rows hold Date objects, the export ISO strings. */
function v2Rows(): Record<string, unknown>[] {
  return (v2Export as Record<string, unknown>[]).map((row) => ({
    ...row,
    createdAt: new Date(String(row.createdAt)),
    updatedAt: new Date(String(row.updatedAt)),
  }))
}

/** Recreate the database at version 2, as the S4 build left it. */
async function writeV2Database(rows: unknown[]): Promise<void> {
  await db.delete({ disableAutoOpen: false })
  const v2 = new Dexie('jotl-companion')
  v2.version(1).stores({ campaigns: 'id, name, updatedAt' })
  v2.version(2).stores({ campaigns: 'id, name, updatedAt', meta: 'key' })
  await v2.open()
  await v2.table('campaigns').bulkPut(rows as never)
  v2.close()
}

describe('the version 3 database upgrade over S4 data', () => {
  it('keeps every field of the stored campaign and splits the cards gained at level-up', async () => {
    const [before] = v2Rows() as unknown as Campaign[]
    await writeV2Database([before])

    expect(await readPendingMigration()).toMatchObject({ fromVersion: 2 })

    await useCampaignStore.getState().initStore()
    const { campaigns, corruptedCampaigns, migrationNotes } = useCampaignStore.getState()
    expect(corruptedCampaigns).toEqual([])
    expect(campaigns).toHaveLength(1)
    const [after] = campaigns

    expect(after.scenarioStatus).toEqual(
      Object.fromEntries(Object.entries(before.scenarioStatus).map(([id, status]) => [Number(id), status]))
    )
    expect(after.scenarioLog).toEqual([])
    expect(after.createdAt).toEqual(before.createdAt)
    const [axe, guard] = after.characters
    expect(axe).toEqual({
      ...before.characters[0],
      selectedAbilityIds: ['hatchet-1-retrieval', 'hatchet-2-repeat-shot'],
      unlockedAbilityIds: ['hatchet-2-repeat-shot'],
    })
    expect(guard).toEqual({ ...before.characters[1], unlockedAbilityIds: [] })
    expect(migrationNotes.map((note) => note.kind)).toEqual(['ability_unlocked'])

    // Written back, and the database no longer waits for a migration.
    const stored = await db.campaigns.toArray()
    expect(stored[0].characters[0].unlockedAbilityIds).toEqual(['hatchet-2-repeat-shot'])
    expect(await readPendingMigration()).toBeNull()
    expect(await db.meta.get('migration-v3')).toBeDefined()
  })

  it('imports the S4 export file itself', async () => {
    const result = await useCampaignStore.getState().importData(JSON.stringify(v2Export))
    expect(result).toMatchObject({ success: true, count: 1 })
    const [campaign] = useCampaignStore.getState().campaigns
    expect(campaign.characters[0].unlockedAbilityIds).toEqual(['hatchet-2-repeat-shot'])
    expect(campaign.characters[0].gold).toBe(30)
  })

  it('runs the version 2 and 3 upgrades in one go from a version 1 database', async () => {
    await writeV1Database([currentV1Campaign, legacyV1Campaign])
    await useCampaignStore.getState().initStore()
    const { campaigns, corruptedCampaigns } = useCampaignStore.getState()
    expect(corruptedCampaigns).toEqual([])
    expect(campaigns.every((c) => Array.isArray(c.scenarioLog))).toBe(true)
    expect(campaigns.flatMap((c) => c.characters).every((ch) => Array.isArray(ch.unlockedAbilityIds))).toBe(true)
  })
})

describe('recordScenarioResult', () => {
  it('writes the gains, completes the scenario and logs it in the database', async () => {
    const store = useCampaignStore.getState()
    await store.createCampaign({ name: 'Record' })
    const campaignId = useCampaignStore.getState().campaigns[0].id
    await store.addCharacter(campaignId, { type: 'hatchet', name: 'Axe' })
    const characterId = useCampaignStore.getState().campaigns[0].characters[0].id
    await store.setScenarioStatus(campaignId, 1, 'completed')

    await store.recordScenarioResult(campaignId, {
      scenarioId: 2,
      success: true,
      scenarioLevel: 1,
      characters: [{ characterId, played: true, moneyTokens: 3, actionXp: 0, battleGoalMet: false }],
      itemRecipients: {},
    })

    const [stored] = await db.campaigns.toArray()
    expect(stored.characters[0].gold).toBe(31)
    expect(stored.scenarioStatus[2]).toBe('completed')
    expect(stored.scenarioStatus[3]).toBe('unlocked')
    expect(stored.scenarioLog).toHaveLength(1)
    await expect(
      store.recordScenarioResult(campaignId, {
        scenarioId: 2,
        success: true,
        scenarioLevel: 1,
        characters: [],
        itemRecipients: {},
      })
    ).rejects.toThrow()
  })
})

describe('cards gained at level-up', () => {
  it('adds an allowed card, refuses one above the level and removes it from the hand too', async () => {
    const store = useCampaignStore.getState()
    await store.createCampaign({ name: 'Cards' })
    const campaignId = useCampaignStore.getState().campaigns[0].id
    await store.addCharacter(campaignId, { type: 'hatchet', name: 'Axe' })
    const characterId = useCampaignStore.getState().campaigns[0].characters[0].id
    await store.updateCharacter(campaignId, characterId, { experience: 45 })

    await expect(store.unlockAbility(campaignId, characterId, 'hatchet-3-sharpened-blades')).rejects.toThrow()
    await store.unlockAbility(campaignId, characterId, 'hatchet-2-repeat-shot')
    await store.updateCharacter(campaignId, characterId, { selectedAbilityIds: ['hatchet-2-repeat-shot'] })
    await store.removeUnlockedAbility(campaignId, characterId, 'hatchet-2-repeat-shot')

    const [character] = useCampaignStore.getState().campaigns[0].characters
    expect(character.unlockedAbilityIds).toEqual([])
    expect(character.selectedAbilityIds).toEqual([])
  })
})

describe('writes in quick succession', () => {
  let campaignId: string
  let characterId: string

  beforeEach(async () => {
    await useCampaignStore.getState().createCampaign({ name: 'Quick hands' })
    campaignId = useCampaignStore.getState().campaigns[0].id
    await useCampaignStore.getState().addCharacter(campaignId, { type: 'hatchet', name: 'Axe' })
    characterId = useCampaignStore.getState().campaigns[0].characters[0].id
  })

  it('keeps both of two character edits confirmed before the first one is saved', async () => {
    // Experience confirmed with Enter, gold confirmed right after: neither call
    // waits for the other, as on the character sheet (S4 finding).
    const store = useCampaignStore.getState()
    await Promise.all([
      store.updateCharacter(campaignId, characterId, { experience: 100 }),
      store.updateCharacter(campaignId, characterId, { gold: 25 }),
    ])

    const [inState] = useCampaignStore.getState().campaigns[0].characters
    expect(inState).toMatchObject({ experience: 100, gold: 25 })
    const [stored] = await db.campaigns.toArray()
    expect(stored.characters[0]).toMatchObject({ experience: 100, gold: 25 })
  })

  it('applies a sale, a scenario change and a perk toggle issued together', async () => {
    const store = useCampaignStore.getState()
    await store.updateCharacter(campaignId, characterId, { gold: 30, experience: 45 })
    await store.gainItem(campaignId, characterId, 1)
    await Promise.all([
      store.sellItem(campaignId, characterId, 1),
      store.setScenarioStatus(campaignId, 2, 'unlocked'),
      store.setPerk(campaignId, characterId, 'hatchet_1a', true),
      store.setPerk(campaignId, characterId, 'hatchet_2', true),
    ])

    const [campaign] = await db.campaigns.toArray()
    expect(campaign.characters[0]).toMatchObject({ gold: 45, itemIds: [], perkIds: ['hatchet_1a', 'hatchet_2'] })
    expect(campaign.scenarioStatus[2]).toBe('unlocked')
    expect(useCampaignStore.getState().campaigns[0]).toEqual(campaign)
  })

  it('keeps the queue running after a refused write', async () => {
    const store = useCampaignStore.getState()
    const results = await Promise.allSettled([
      store.buyItem(campaignId, characterId, 1), // no gold yet
      store.updateCharacter(campaignId, characterId, { gold: 40 }),
    ])
    expect(results.map((r) => r.status)).toEqual(['rejected', 'fulfilled'])
    expect(useCampaignStore.getState().campaigns[0].characters[0].gold).toBe(40)
  })
})

/** Stored rows of the S5 export, with Date objects as Dexie keeps them. */
function v3Rows(): Record<string, unknown>[] {
  return (v3Export as Record<string, unknown>[]).map((row) => ({
    ...row,
    createdAt: new Date(String(row.createdAt)),
    updatedAt: new Date(String(row.updatedAt)),
    scenarioLog: (row.scenarioLog as Record<string, unknown>[]).map((entry) => ({
      ...entry,
      recordedAt: new Date(String(entry.recordedAt)),
    })),
  }))
}

/** Recreate the database at version 3, as the S5 build left it. */
async function writeV3Database(rows: unknown[]): Promise<void> {
  await db.delete({ disableAutoOpen: false })
  const v3 = new Dexie('jotl-companion')
  v3.version(1).stores({ campaigns: 'id, name, updatedAt' })
  v3.version(2).stores({ campaigns: 'id, name, updatedAt', meta: 'key' })
  v3.version(3).stores({ campaigns: 'id, name, updatedAt', meta: 'key' })
  await v3.open()
  await v3.table('campaigns').bulkPut(rows as never)
  v3.close()
}

describe('the version 4 database upgrade over S5 data', () => {
  it('keeps every field of the stored campaign and adds an empty list of sold items', async () => {
    const [before] = v3Rows() as unknown as Campaign[]
    await writeV3Database([before])

    expect(await readPendingMigration()).toMatchObject({ fromVersion: 3 })

    await useCampaignStore.getState().initStore()
    const { campaigns, corruptedCampaigns, migrationNotes } = useCampaignStore.getState()
    expect(corruptedCampaigns).toEqual([])
    expect(migrationNotes).toEqual([])
    expect(campaigns).toHaveLength(1)
    expect(campaigns[0]).toEqual({
      ...before,
      scenarioStatus: Object.fromEntries(
        Object.entries(before.scenarioStatus).map(([id, status]) => [Number(id), status])
      ),
      soldItemIds: [],
    })

    // Written back, and the database no longer waits for a migration.
    const [stored] = await db.campaigns.toArray()
    expect(stored.soldItemIds).toEqual([])
    expect(stored.characters).toEqual(before.characters)
    expect(stored.scenarioLog).toEqual(before.scenarioLog)
    expect(await readPendingMigration()).toBeNull()
    expect(await db.meta.get('migration-v4')).toBeUndefined()
  })

  it('lets the migrated party sell its reward item into the shop', async () => {
    await writeV3Database(v3Rows())
    await useCampaignStore.getState().initStore()
    const [campaign] = useCampaignStore.getState().campaigns
    const axe = campaign.characters[0]
    expect(axe.itemIds).toEqual([14])

    await useCampaignStore.getState().sellItem(campaign.id, axe.id, 14)
    const [after] = useCampaignStore.getState().campaigns
    expect(after.soldItemIds).toEqual([14])
    const potion = items.find((i) => i.id === 14)
    expect(potion && itemAvailability(potion, after)).toBe('shop')
  })

  it('imports the S5 export file itself', async () => {
    const result = await useCampaignStore.getState().importData(JSON.stringify(v3Export))
    expect(result).toMatchObject({ success: true, count: 1, notes: [] })
    const [campaign] = useCampaignStore.getState().campaigns
    expect(campaign.soldItemIds).toEqual([])
    expect(campaign.scenarioLog).toHaveLength(1)
    expect(campaign.characters[0].unlockedAbilityIds).toEqual(['hatchet-2-repeat-shot'])
  })

  it('runs the upgrades 2, 3 and 4 in one go from a version 1 database', async () => {
    await writeV1Database([currentV1Campaign, legacyV1Campaign])
    await useCampaignStore.getState().initStore()
    const { campaigns, corruptedCampaigns } = useCampaignStore.getState()
    expect(corruptedCampaigns).toEqual([])
    const stored = await db.campaigns.toArray()
    expect(stored.every((c) => Array.isArray(c.soldItemIds))).toBe(true)
    expect(campaigns).toHaveLength(2)
  })
})
