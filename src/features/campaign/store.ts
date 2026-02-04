import { create } from 'zustand'
import { db } from '@/shared/db'
import { tables } from '@/data'
import {
  CampaignSchema,
  CreateCampaignSchema,
  CharacterProgressSchema,
  type Campaign,
  type CreateCampaign,
} from '@/shared/schemas'

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
  for (let i = 1; i <= 17; i++) {
    status[i] = i === 1 ? 'unlocked' : 'locked'
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
    const rows = await db.campaigns.toArray()
    // Re-parse through Zod so dates (and any future coercions) are correct
    const campaigns = rows.map((row) => CampaignSchema.parse(row))
    const activeCampaignId = localStorage.getItem(ACTIVE_KEY)
    set({ campaigns, activeCampaignId, isLoaded: true })
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
}))
