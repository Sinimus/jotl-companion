import { create } from 'zustand'
import { toast } from 'sonner'
import { db, migrateCampaignRecord, MIGRATION_NOTE_KEYS, type MigrationNote } from '@/shared/db'
import { scenarios, items, type Item } from '@/data'
import { computeLevelFromXp, equipmentViolations, getUnlockedScenarios } from './rules'
import {
  applyScenarioResult,
  canUnlockCard,
  computeScenarioResult,
  type ScenarioResult,
  type ScenarioResultInput,
} from './progression'
import {
  CampaignSchema,
  CreateCampaignSchema,
  CharacterProgressSchema,
  type Campaign,
  type CharacterProgress,
  type CreateCampaign,
} from '@/shared/schemas'
import * as z from 'zod/mini'

// ---------------------------------------------------------------------------
// localStorage key for the currently active campaign ID
// ---------------------------------------------------------------------------
const ACTIVE_KEY = 'jotl:activeCampaignId'

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------
interface CampaignState {
  campaigns: Campaign[]
  /** Campaigns that failed Zod validation during load. */
  corruptedCampaigns: Array<{
    localId: string
    id: string | null
    name: string | null
    error: string
    rawData: unknown
  }>
  /** Notes of the content migrations (database versions 2 and 3), if any. */
  migrationNotes: MigrationNote[]
  activeCampaignId: string | null
  /** false until the first Dexie hydration resolves */
  isLoaded: boolean
}

interface CampaignActions {
  /** Hydrate store from Dexie + restore activeCampaignId from localStorage. */
  initStore: () => Promise<void>
  /** Validate → build full Campaign → persist to Dexie → update state. */
  createCampaign: (input: CreateCampaign) => Promise<void>
  /** Remove from Dexie + state.  Clears active selection when it matches. */
  deleteCampaign: (id: string) => Promise<void>
  /** Remove a corrupted entry from the store (UI only). */
  dismissCorrupted: (localId: string) => void
  /** Delete the stored migration notes and clear them from state. */
  dismissMigrationNotes: () => Promise<void>
  /** Persist choice to localStorage, update state. */
  setActiveCampaign: (id: string) => void
  /** Add a character to a campaign (max 4).  Updates Dexie + state. */
  addCharacter: (campaignId: string, input: CreateCharacter) => Promise<void>
  /** Remove a character from a campaign.  Updates Dexie + state. */
  removeCharacter: (campaignId: string, characterId: string) => Promise<void>
  /** Update character stats.  Auto-recomputes level when XP changes. */
  updateCharacter: (campaignId: string, characterId: string, updates: UpdateCharacterInput) => Promise<void>
  /** Take or drop one perk, computed from the stored perks at the time of the write. */
  setPerk: (campaignId: string, characterId: string, perkId: string, selected: boolean) => Promise<void>
  /** Update status of a scenario. If 'completed', auto-unlocks child scenarios and closes alternatives. */
  setScenarioStatus: (campaignId: string, scenarioId: number, status: 'unlocked' | 'completed') => Promise<void>
  /** Mark a treasure chest as looted or not. */
  setTreasureLooted: (campaignId: string, treasureId: number, isLooted: boolean) => Promise<void>
  /** Buy an item at the shop — pays the gold value (LtP p.19). */
  buyItem: (campaignId: string, characterId: string, itemId: number) => Promise<void>
  /** Gain an item without paying (scenario or treasure reward). */
  gainItem: (campaignId: string, characterId: string, itemId: number) => Promise<void>
  /** Sell an owned item for half its gold value, rounded up (LtP p.19); it goes into the shop (Glossary p.19). */
  sellItem: (campaignId: string, characterId: string, itemId: number) => Promise<void>
  /** Record a scenario result on the campaign sheet (Finish Scenario). Throws on an invalid result. */
  recordScenarioResult: (campaignId: string, input: ScenarioResultInput) => Promise<ScenarioResult>
  /** Add a card gained at level-up (LtP p.29); refuses a card the level does not allow. */
  unlockAbility: (campaignId: string, characterId: string, cardId: string) => Promise<void>
  /** Remove a card gained at level-up; it also leaves the hand. */
  removeUnlockedAbility: (campaignId: string, characterId: string, cardId: string) => Promise<void>
  /** Set the equipped items — a subset of the owned items within the slot limits. */
  setEquippedItems: (campaignId: string, characterId: string, itemIds: number[]) => Promise<void>
  /** Export all campaigns as JSON string. */
  exportData: () => Promise<string>
  /** Import campaigns from JSON string. Migrates and validates each campaign. */
  importData: (json: string) => Promise<{ success: boolean; count: number; error?: string; notes?: MigrationNote[] }>
  /** Wipe all campaigns from Dexie + state. Clears activeCampaignId. */
  clearAllCampaigns: () => Promise<void>
}

export type CampaignStore = CampaignState & CampaignActions

/** Payload for addCharacter — only type + name are supplied by the player. */
export interface CreateCharacter {
  type: 'demolitionist' | 'red_guard' | 'hatchet' | 'voidwarden'
  name: string
}

/** Payload for updateCharacter — only the fields being changed. */
export interface UpdateCharacterInput {
  experience?: number
  gold?: number
  checkmarks?: number
  perkIds?: string[]
  itemIds?: number[]
  equippedItemIds?: number[]
  selectedAbilityIds?: string[]
  bonusPerks?: number
}

type SetCampaignState = (
  updater: (state: CampaignStore) => Partial<CampaignStore>,
) => void

// ---------------------------------------------------------------------------
// Domain helper — initial scenarioStatus for a brand-new campaign.
// Scenario 1 is always the entry point; every other scenario starts locked.
// ---------------------------------------------------------------------------
function buildInitialScenarioStatus(): Record<number, 'locked' | 'unlocked' | 'completed'> {
  const status: Record<number, 'locked' | 'unlocked' | 'completed'> = {}
  for (const scenario of scenarios) {
    // Scenario 1 is always unlocked by default. Side scenarios start locked.
    status[scenario.id] = scenario.id === 1 ? 'unlocked' : 'locked'
  }
  return status
}

/** Persist an updated campaign to Dexie and swap it into state. */
async function persistCampaign(updated: Campaign, set: SetCampaignState): Promise<void> {
  await db.campaigns.put(updated)
  set((state) => ({
    campaigns: state.campaigns.map((c) => (c.id === updated.id ? updated : c)),
  }))
}

/** Apply changes to one character, validate the whole record and persist. */
async function commitCharacter(
  campaign: Campaign,
  characterId: string,
  changes: Partial<CharacterProgress>,
  set: SetCampaignState
): Promise<void> {
  const characters = campaign.characters.map((c) =>
    c.id === characterId ? CharacterProgressSchema.parse({ ...c, ...changes }) : c
  )
  await persistCampaign({ ...campaign, characters, updatedAt: new Date() }, set)
}

/**
 * A queue that runs async tasks one after another. Every write reads the campaign
 * from state when its turn comes, so a write issued before the previous one is
 * saved builds on it instead of on the state both started from (S4 finding: gold
 * confirmed right after experience overwrote the experience). A failed task does
 * not stop the queue; its caller still gets the rejection.
 */
export function createSerialQueue(): <T>(task: () => Promise<T>) => Promise<T> {
  let tail: Promise<unknown> = Promise.resolve()
  return <T>(task: () => Promise<T>): Promise<T> => {
    const run = tail.then(task)
    tail = run.then(
      () => undefined,
      () => undefined
    )
    return run
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
export const useCampaignStore = create<CampaignStore>((set, get) => {
  /** Shared loader for the item actions: locate campaign + character, apply, persist. */
  const updateCharacterItems = async (
    campaignId: string,
    characterId: string,
    apply: (campaign: Campaign, character: CharacterProgress) => Partial<CharacterProgress>
  ): Promise<void> => {
    const campaign = get().campaigns.find((c) => c.id === campaignId)
    if (!campaign) throw new Error('Campaign not found')
    const character = campaign.characters.find((c) => c.id === characterId)
    if (!character) throw new Error('Character not found')
    const changes = apply(campaign, character)
    await commitCharacter(campaign, characterId, changes, set)
  }

  const requireItem = (itemId: number): Item => {
    const item = items.find((i) => i.id === itemId)
    if (!item) throw new Error(`Unknown item #${itemId}`)
    return item
  }

  /** Party stock check — the box holds a limited number of copies of each item. */
  const assertCopiesLeft = (campaign: Campaign, itemId: number, character: CharacterProgress): Item => {
    const item = requireItem(itemId)
    if (character.itemIds.includes(itemId)) {
      throw new Error(`${item.name} is already owned by this character`)
    }
    const owned = campaign.characters.filter((c) => c.itemIds.includes(itemId)).length
    if (owned >= item.copies) {
      throw new Error(`No copies of ${item.name} left in the party (${item.copies} in the box)`)
    }
    return item
  }

  // Every write to campaigns goes through this one queue (see createSerialQueue).
  const queued = createSerialQueue()

  /** Read every stored campaign, migrate it and validate it; also the migration notes. */
  const loadCampaigns = async (): Promise<void> => {
    try {
      const rows = await db.campaigns.toArray()
      // Migrate the stored content, then re-parse through Zod; capture any
      // row that still fails validation.
      const campaigns: Campaign[] = []
      const corruptedCampaigns: CampaignState['corruptedCampaigns'] = []

      for (const row of rows) {
        const { record } = migrateCampaignRecord(row)
        const result = CampaignSchema.safeParse(record)
        if (result.success) {
          campaigns.push(result.data)
        } else {
          console.error('Validation failed for campaign record:', result.error)
          corruptedCampaigns.push({
            localId: crypto.randomUUID(),
            id: typeof row.id === 'string' ? row.id : null,
            name: typeof row.name === 'string' ? row.name : 'Unknown',
            error: result.error.message,
            rawData: row,
          })
        }
      }
      const migrationRows = await db.meta.bulkGet([...MIGRATION_NOTE_KEYS])
      const activeCampaignId = localStorage.getItem(ACTIVE_KEY)
      set({
        campaigns,
        corruptedCampaigns,
        migrationNotes: migrationRows.flatMap((row) => row?.notes ?? []),
        activeCampaignId,
        isLoaded: true,
      })
    } catch (error) {
      console.error('Failed to load campaigns from IndexedDB:', error)
      toast.error('Failed to load campaign data. Please refresh the page.')
      // Ensure app marks as loaded even on failure to avoid infinite spinner
      set({ isLoaded: true })
    }
  }

  const store: CampaignStore = {
    campaigns: [],
    corruptedCampaigns: [],
    migrationNotes: [],
    activeCampaignId: null,
    isLoaded: false,

    initStore: () => queued(loadCampaigns),

    async createCampaign(input: CreateCampaign) {
      const { name } = CreateCampaignSchema.parse(input)
      const now = new Date()

      const campaign = CampaignSchema.parse({
        id: crypto.randomUUID(),
        name,
        createdAt: now,
        updatedAt: now,
        characters: [],
        scenarioStatus: buildInitialScenarioStatus(),
        cityEventsDrawn: [],
        lootedTreasureIds: [],
        soldItemIds: [],
        scenarioLog: [],
      })

      await db.campaigns.add(campaign)
      set((state) => ({ campaigns: [...state.campaigns, campaign] }))
    },

    async deleteCampaign(id: string) {
      await db.campaigns.delete(id)

      set((state) => {
        const wasActive = state.activeCampaignId === id
        if (wasActive) localStorage.removeItem(ACTIVE_KEY)
        return {
          campaigns: state.campaigns.filter((c) => c.id !== id),
          activeCampaignId: wasActive ? null : state.activeCampaignId,
        }
      })
    },

    dismissCorrupted(localId: string) {
      set((state) => ({
        corruptedCampaigns: state.corruptedCampaigns.filter((c) => c.localId !== localId),
      }))
    },

    async dismissMigrationNotes() {
      await db.meta.bulkDelete([...MIGRATION_NOTE_KEYS])
      set({ migrationNotes: [] })
    },

    setActiveCampaign(id: string) {
      localStorage.setItem(ACTIVE_KEY, id)
      set({ activeCampaignId: id })
    },

    async addCharacter(campaignId: string, input: CreateCharacter) {
      const { campaigns } = get()
      const campaign = campaigns.find((c) => c.id === campaignId)
      if (!campaign) throw new Error('Campaign not found')
      if (campaign.characters.length >= 4) throw new Error('Party is full (4/4)')

      // Full Zod validation — rejects invalid type or empty/over-long name
      const character = CharacterProgressSchema.parse({
        id: crypto.randomUUID(),
        type: input.type,
        name: input.name.trim(),
        experience: 0,
        gold: 0,
        checkmarks: 0,
        perkIds: [],
        itemIds: [],
        equippedItemIds: [],
        selectedAbilityIds: [],
        unlockedAbilityIds: [],
      })

      const updated = {
        ...campaign,
        characters: [...campaign.characters, character],
        updatedAt: new Date(),
      }

      await db.campaigns.put(updated)

      set((state) => ({
        campaigns: state.campaigns.map((c) => (c.id === campaignId ? updated : c)),
      }))
    },

    async removeCharacter(campaignId: string, characterId: string) {
      const { campaigns } = get()
      const campaign = campaigns.find((c) => c.id === campaignId)
      if (!campaign) throw new Error('Campaign not found')

      const updated = {
        ...campaign,
        characters: campaign.characters.filter((c) => c.id !== characterId),
        updatedAt: new Date(),
      }

      await db.campaigns.put(updated)

      set((state) => ({
        campaigns: state.campaigns.map((c) => (c.id === campaignId ? updated : c)),
      }))
    },

    async updateCharacter(campaignId: string, characterId: string, updates: UpdateCharacterInput) {
      const { campaigns } = get()
      const campaign = campaigns.find((c) => c.id === campaignId)
      if (!campaign) throw new Error('Campaign not found')

      const character = campaign.characters.find((c) => c.id === characterId)
      if (!character) throw new Error('Character not found')

      // Apply only the defined fields
      const changes: Partial<CharacterProgress> = {}
      if (updates.experience !== undefined) changes.experience = updates.experience
      if (updates.gold !== undefined) changes.gold = updates.gold
      if (updates.checkmarks !== undefined) changes.checkmarks = updates.checkmarks
      if (updates.perkIds !== undefined) changes.perkIds = updates.perkIds
      if (updates.itemIds !== undefined) changes.itemIds = updates.itemIds
      if (updates.equippedItemIds !== undefined) changes.equippedItemIds = updates.equippedItemIds
      if (updates.selectedAbilityIds !== undefined) changes.selectedAbilityIds = updates.selectedAbilityIds
      if (updates.bonusPerks !== undefined) changes.bonusPerks = updates.bonusPerks

      await commitCharacter(campaign, characterId, changes, set)
    },

    async setPerk(campaignId: string, characterId: string, perkId: string, selected: boolean) {
      await updateCharacterItems(campaignId, characterId, (_campaign, character) => {
        const others = character.perkIds.filter((id) => id !== perkId)
        return { perkIds: selected ? [...others, perkId] : others }
      })
    },

    async setScenarioStatus(campaignId: string, scenarioId: number, status: 'unlocked' | 'completed') {
      const { campaigns } = get()
      const campaign = campaigns.find((c) => c.id === campaignId)
      if (!campaign) throw new Error('Campaign not found')
      if (campaign.scenarioStatus[scenarioId] === 'closed') throw new Error('Scenario is closed')

      const previous = campaign.scenarioStatus[scenarioId]
      const newStatusMap = { ...campaign.scenarioStatus }
      newStatusMap[scenarioId] = status
      const scenarioDef = scenarios.find((s) => s.id === scenarioId)

      if (status === 'completed') {
        // Auto-unlock logic
        const unlockIds = getUnlockedScenarios(newStatusMap, scenarioId)
        for (const childId of unlockIds) {
          newStatusMap[childId] = 'unlocked'
        }
        // Completing a scenario closes its alternatives (Glossary p.18).
        for (const blockedId of scenarioDef?.blocks ?? []) {
          if (newStatusMap[blockedId] !== 'completed') newStatusMap[blockedId] = 'closed'
        }
      } else if (previous === 'completed') {
        // Reopening: a closed alternative comes back unless another completed
        // scenario still blocks it.
        for (const blockedId of scenarioDef?.blocks ?? []) {
          if (newStatusMap[blockedId] !== 'closed') continue
          const stillBlocked = scenarios.some(
            (s) => s.id !== scenarioId && s.blocks.includes(blockedId) && newStatusMap[s.id] === 'completed'
          )
          if (!stillBlocked) newStatusMap[blockedId] = 'unlocked'
        }
      }

      await persistCampaign({ ...campaign, scenarioStatus: newStatusMap, updatedAt: new Date() }, set)
    },

    async setTreasureLooted(campaignId: string, treasureId: number, isLooted: boolean) {
      const { campaigns } = get()
      const campaign = campaigns.find((c) => c.id === campaignId)
      if (!campaign) throw new Error('Campaign not found')

      let newLooted = [...campaign.lootedTreasureIds]
      if (isLooted) {
        if (!newLooted.includes(treasureId)) newLooted.push(treasureId)
      } else {
        newLooted = newLooted.filter((id) => id !== treasureId)
      }

      const updated = {
        ...campaign,
        lootedTreasureIds: newLooted,
        updatedAt: new Date(),
      }

      await db.campaigns.put(updated)

      set((state) => ({
        campaigns: state.campaigns.map((c) => (c.id === campaignId ? updated : c)),
      }))
    },

    async buyItem(campaignId: string, characterId: string, itemId: number) {
      await updateCharacterItems(campaignId, characterId, (campaign, character) => {
        const item = assertCopiesLeft(campaign, itemId, character)
        if (character.gold < item.cost) {
          throw new Error(`Not enough gold (${character.gold}/${item.cost})`)
        }
        return { itemIds: [...character.itemIds, itemId], gold: character.gold - item.cost }
      })
    },

    async gainItem(campaignId: string, characterId: string, itemId: number) {
      await updateCharacterItems(campaignId, characterId, (campaign, character) => {
        assertCopiesLeft(campaign, itemId, character)
        return { itemIds: [...character.itemIds, itemId] }
      })
    },

    async sellItem(campaignId: string, characterId: string, itemId: number) {
      const campaign = get().campaigns.find((c) => c.id === campaignId)
      if (!campaign) throw new Error('Campaign not found')
      const character = campaign.characters.find((c) => c.id === characterId)
      if (!character) throw new Error('Character not found')
      const item = requireItem(itemId)
      if (!character.itemIds.includes(itemId)) {
        throw new Error(`${item.name} is not owned by this character`)
      }
      // The sold copy goes into the available item deck (Glossary p.19), so a
      // reward item can be bought from the shop afterwards.
      const soldItemIds = campaign.soldItemIds.includes(itemId)
        ? campaign.soldItemIds
        : [...campaign.soldItemIds, itemId]
      await commitCharacter({ ...campaign, soldItemIds }, characterId, {
        itemIds: character.itemIds.filter((id) => id !== itemId),
        equippedItemIds: character.equippedItemIds.filter((id) => id !== itemId),
        gold: character.gold + Math.ceil(item.cost / 2),
      }, set)
    },

    async recordScenarioResult(campaignId: string, input: ScenarioResultInput) {
      const campaign = get().campaigns.find((c) => c.id === campaignId)
      if (!campaign) throw new Error('Campaign not found')
      const result = computeScenarioResult(campaign, input)
      const updated = CampaignSchema.parse(
        applyScenarioResult(campaign, result, { logId: crypto.randomUUID(), now: new Date() })
      )
      await persistCampaign(updated, set)
      return result
    },

    async unlockAbility(campaignId: string, characterId: string, cardId: string) {
      await updateCharacterItems(campaignId, characterId, (_campaign, character) => {
        if (!canUnlockCard(character, cardId)) {
          throw new Error('That card is not available at this level')
        }
        return { unlockedAbilityIds: [...character.unlockedAbilityIds, cardId] }
      })
    },

    async removeUnlockedAbility(campaignId: string, characterId: string, cardId: string) {
      await updateCharacterItems(campaignId, characterId, (_campaign, character) => ({
        unlockedAbilityIds: character.unlockedAbilityIds.filter((id) => id !== cardId),
        selectedAbilityIds: character.selectedAbilityIds.filter((id) => id !== cardId),
      }))
    },

    async setEquippedItems(campaignId: string, characterId: string, itemIds: number[]) {
      await updateCharacterItems(campaignId, characterId, (_campaign, character) => {
        const notOwned = itemIds.filter((id) => !character.itemIds.includes(id))
        if (notOwned.length > 0) {
          throw new Error(`Item #${String(notOwned[0])} is not owned by this character`)
        }
        const violations = equipmentViolations(itemIds, computeLevelFromXp(character.experience))
        if (violations.length > 0) {
          throw new Error(`Too many ${violations.join(' and ')} items equipped`)
        }
        return { equippedItemIds: itemIds }
      })
    },

    async exportData() {
      const { campaigns } = get()
      return JSON.stringify(campaigns, null, 2)
    },

    async importData(json: string) {
      try {
        const data: unknown = JSON.parse(json)
        if (!Array.isArray(data)) {
          return { success: false, count: 0, error: 'Expected a list of campaigns' }
        }
        // Migrate every entry first — an export of an old record must import.
        const migrated = data.map((entry) => migrateCampaignRecord(entry))
        const campaigns = z.array(CampaignSchema).parse(migrated.map((m) => m.record))
        const notes = migrated.flatMap((m) => m.notes)

        // Use bulkPut to overwrite existing IDs or add new ones
        await db.campaigns.bulkPut(campaigns)

        // Refresh store state (already inside the queue)
        await loadCampaigns()

        return { success: true, count: campaigns.length, notes }
      } catch (e) {
        return {
          success: false,
          count: 0,
          error: e instanceof Error ? e.message : 'Invalid data format',
        }
      }
    },

    async clearAllCampaigns() {
      await db.campaigns.clear()
      localStorage.removeItem(ACTIVE_KEY)
      set({ campaigns: [], activeCampaignId: null })
    },
  }

  return {
    ...store,
    createCampaign: (...args) => queued(() => store.createCampaign(...args)),
    deleteCampaign: (...args) => queued(() => store.deleteCampaign(...args)),
    dismissMigrationNotes: () => queued(() => store.dismissMigrationNotes()),
    addCharacter: (...args) => queued(() => store.addCharacter(...args)),
    removeCharacter: (...args) => queued(() => store.removeCharacter(...args)),
    updateCharacter: (...args) => queued(() => store.updateCharacter(...args)),
    setPerk: (...args) => queued(() => store.setPerk(...args)),
    setScenarioStatus: (...args) => queued(() => store.setScenarioStatus(...args)),
    setTreasureLooted: (...args) => queued(() => store.setTreasureLooted(...args)),
    buyItem: (...args) => queued(() => store.buyItem(...args)),
    gainItem: (...args) => queued(() => store.gainItem(...args)),
    sellItem: (...args) => queued(() => store.sellItem(...args)),
    recordScenarioResult: (...args) => queued(() => store.recordScenarioResult(...args)),
    unlockAbility: (...args) => queued(() => store.unlockAbility(...args)),
    removeUnlockedAbility: (...args) => queued(() => store.removeUnlockedAbility(...args)),
    setEquippedItems: (...args) => queued(() => store.setEquippedItems(...args)),
    importData: (...args) => queued(() => store.importData(...args)),
    clearAllCampaigns: () => queued(() => store.clearAllCampaigns()),
  }
})
