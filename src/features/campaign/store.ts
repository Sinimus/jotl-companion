import { create } from 'zustand'
import { db } from '@/shared/db'
import {
  CampaignSchema,
  CreateCampaignSchema,
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
}

export type CampaignStore = CampaignState & CampaignActions

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
export const useCampaignStore = create<CampaignStore>((set) => ({
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
}))
