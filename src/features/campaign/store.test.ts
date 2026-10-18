import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/shared/db'
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
    activeCampaignId: null,
    isLoaded: false,
  })
}

beforeEach(async () => {
  vi.stubGlobal('localStorage', {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
  })
  await db.campaigns.clear()
  resetStore()
})

describe('loading stored campaigns in the version 1 shape', () => {
  it('loads a current record unchanged and does not mark it corrupted', async () => {
    await db.campaigns.put(currentV1Campaign as never)
    await useCampaignStore.getState().initStore()

    const { campaigns, corruptedCampaigns, isLoaded } = useCampaignStore.getState()
    expect(isLoaded).toBe(true)
    expect(corruptedCampaigns).toEqual([])
    expect(campaigns).toHaveLength(1)
    expect(campaigns[0]).toEqual(currentV1Campaign)
  })

  it('fills the fields an early record lacks and coerces its timestamps', async () => {
    await db.campaigns.put(legacyV1Campaign as never)
    await useCampaignStore.getState().initStore()

    const { campaigns, corruptedCampaigns } = useCampaignStore.getState()
    expect(corruptedCampaigns).toEqual([])
    expect(campaigns).toHaveLength(1)
    const [campaign] = campaigns
    expect(campaign?.lootedTreasureIds).toEqual([])
    expect(campaign?.createdAt).toEqual(new Date('2026-02-08T09:00:00.000Z'))
    expect(campaign?.characters[0]).toMatchObject({
      id: LEGACY_CHARACTER_ID,
      gold: -5,
      selectedAbilityIds: [],
      bonusPerks: 0,
    })
  })

  it('keeps scenario statuses keyed by number', async () => {
    await db.campaigns.put(currentV1Campaign as never)
    await useCampaignStore.getState().initStore()

    expect(useCampaignStore.getState().campaigns[0]?.scenarioStatus).toEqual(scenarioStatus)
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

    expect(result).toEqual({ success: true, count: 1 })
    const { campaigns, corruptedCampaigns } = useCampaignStore.getState()
    expect(corruptedCampaigns).toEqual([])
    expect(campaigns).toEqual([currentV1Campaign])
  })

  // Pins today's behaviour: the import validates without the defaults that the
  // load applies, so an early record is rejected there. Not changed in this sprint.
  it('rejects an early record without lootedTreasureIds in the import', async () => {
    const result = await useCampaignStore
      .getState()
      .importData(JSON.stringify([legacyV1Campaign]))

    expect(result.success).toBe(false)
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
