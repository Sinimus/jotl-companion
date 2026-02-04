import { create } from 'zustand'
import { db } from '@/shared/db'
import { tables, scenarios } from '@/data'
import {
  CampaignSchema,
  CreateCampaignSchema,
  CharacterProgressSchema,
  type Campaign,
  type CreateCampaign,
} from '@/shared/schemas'
import * as z from 'zod'

// ---------------------------------------------------------------------------
// localStorage key for the currently active campaign ID
// ---------------------------------------------------------------------------
const ACTIVE_KEY = 'jotl:activeCampaignId'

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------
interface CampaignState {
  campaigns: Campaign[]
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
  /** Persist choice to localStorage, update state. */
  setActiveCampaign: (id: string) => void
  /** Add a character to a campaign (max 4).  Updates Dexie + state. */
  addCharacter: (campaignId: string, input: CreateCharacter) => Promise<void>
  /** Remove a character from a campaign.  Updates Dexie + state. */
  removeCharacter: (campaignId: string, characterId: string) => Promise<void>
  /** Update character stats.  Auto-recomputes level when XP changes. */
  updateCharacter: (campaignId: string, characterId: string, updates: UpdateCharacterInput) => Promise<void>
  /** Update status of a scenario. If 'completed', auto-unlocks child scenarios. */
  setScenarioStatus: (campaignId: string, scenarioId: number, status: 'unlocked' | 'completed') => Promise<void>
  /** Mark a treasure chest as looted or not. */
  setTreasureLooted: (campaignId: string, treasureId: number, isLooted: boolean) => Promise<void>
  /** Export all campaigns as JSON string. */
  exportData: () => Promise<string>
  /** Import campaigns from JSON string. Validates each campaign. */
  importData: (json: string) => Promise<{ success: boolean; count: number; error?: string }>
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
  selectedAbilityIds?: string[]
}

// ---------------------------------------------------------------------------
// Domain helpers
// ---------------------------------------------------------------------------

/** Derive level from cumulative XP using the level-threshold table. */
export function computeLevelFromXp(experience: number): number {
  const thresholds = tables.levelThresholds as Record<string, number>
  for (let level = 9; level >= 1; level--) {
    if (experience >= thresholds[String(level)]) {
      return level
    }
  }
  return 1
}

// ---------------------------------------------------------------------------
// Domain helper — initial scenarioStatus for a brand-new campaign.
// Scenario 1 (unlockedBy === null) is always the entry point.
// ---------------------------------------------------------------------------
function buildInitialScenarioStatus(): Record<number, 'locked' | 'unlocked' | 'completed'> {
  const status: Record<number, 'locked' | 'unlocked' | 'completed'> = {}
  for (const scenario of scenarios) {
    // Scenario 1 is always unlocked by default. Side scenarios start locked.
    status[scenario.id] = scenario.id === 1 ? 'unlocked' : 'locked'
  }
  return status
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
export const useCampaignStore = create<CampaignStore>((set, get) => ({
  campaigns: [],
  activeCampaignId: null,
  isLoaded: false,

  async initStore() {
    try {
      const rows = await db.campaigns.toArray()
      // Re-parse through Zod; skip any row that fails validation (e.g. after a schema change)
      const campaigns: Campaign[] = []
      for (const row of rows) {
        // Data Migration: Ensure new fields exist for legacy campaigns
        // We perform defensive checks instead of blind casting
        const rawRow = row as Record<string, unknown>
        
        const charactersArray = Array.isArray(rawRow.characters) ? rawRow.characters : []
        const lootedTreasuresArray = Array.isArray(rawRow.lootedTreasureIds) ? rawRow.lootedTreasureIds : []

        const migrated = {
          ...rawRow,
          lootedTreasureIds: lootedTreasuresArray,
          characters: charactersArray
            .filter((c): c is Record<string, unknown> => !!c && typeof c === 'object')
            .map((charObj) => {
              return {
                ...charObj,
                selectedAbilityIds: Array.isArray(charObj.selectedAbilityIds) ? charObj.selectedAbilityIds : [],
              }
            }),
        }

        const result = CampaignSchema.safeParse(migrated)
        if (result.success) {
          campaigns.push(result.data)
        } else {
          console.warn('Skipping corrupted campaign in IndexedDB:', result.error)
        }
      }
      const activeCampaignId = localStorage.getItem(ACTIVE_KEY)
      set({ campaigns, activeCampaignId, isLoaded: true })
    } catch (error) {
      console.error('Failed to load campaigns from IndexedDB:', error)
      // Ensure app marks as loaded even on failure to avoid infinite spinner
      set({ isLoaded: true })
    }
  },

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
      level: 1,
      experience: 0,
      gold: 0,
      checkmarks: 0,
      perkIds: [],
      itemIds: [],
      selectedAbilityIds: [],
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
    const merged = { ...character }
    if (updates.experience !== undefined) merged.experience = updates.experience
    if (updates.gold !== undefined) merged.gold = updates.gold
    if (updates.checkmarks !== undefined) merged.checkmarks = updates.checkmarks
    if (updates.perkIds !== undefined) merged.perkIds = updates.perkIds
    if (updates.itemIds !== undefined) merged.itemIds = updates.itemIds
    if (updates.selectedAbilityIds !== undefined) merged.selectedAbilityIds = updates.selectedAbilityIds

    // Auto-recompute level when XP changes
    if (updates.experience !== undefined) {
      merged.level = computeLevelFromXp(updates.experience)
    }

    // Full Zod safety check before persisting
    const validated = CharacterProgressSchema.parse(merged)

    const updated = {
      ...campaign,
      characters: campaign.characters.map((c) => (c.id === characterId ? validated : c)),
      updatedAt: new Date(),
    }

    await db.campaigns.put(updated)

    set((state) => ({
      campaigns: state.campaigns.map((c) => (c.id === campaignId ? updated : c)),
    }))
  },

  async setScenarioStatus(campaignId: string, scenarioId: number, status: 'unlocked' | 'completed') {
    const { campaigns } = get()
    const campaign = campaigns.find((c) => c.id === campaignId)
    if (!campaign) throw new Error('Campaign not found')

    const newStatusMap = { ...campaign.scenarioStatus }
    newStatusMap[scenarioId] = status

    // Auto-unlock logic
    if (status === 'completed') {
      const scenarioDef = scenarios.find((s) => s.id === scenarioId)
      if (scenarioDef && scenarioDef.unlocks) {
        for (const childId of scenarioDef.unlocks) {
          if (newStatusMap[childId] === 'locked') {
            newStatusMap[childId] = 'unlocked'
          }
        }
      }
    }

    const updated = {
      ...campaign,
      scenarioStatus: newStatusMap,
      updatedAt: new Date(),
    }

    await db.campaigns.put(updated)

    set((state) => ({
      campaigns: state.campaigns.map((c) => (c.id === campaignId ? updated : c)),
    }))
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

  async exportData() {
    const { campaigns } = get()
    return JSON.stringify(campaigns, null, 2)
  },

  async importData(json: string) {
    try {
      const data = JSON.parse(json)
      const campaigns = z.array(CampaignSchema).parse(data)

      // Use bulkPut to overwrite existing IDs or add new ones
      await db.campaigns.bulkPut(campaigns)

      // Refresh store state
      await get().initStore()

      return { success: true, count: campaigns.length }
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
}))