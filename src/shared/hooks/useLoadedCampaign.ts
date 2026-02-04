import { useCampaignStore } from '@/features/campaign/store'

/**
 * Shared loading-gate hook.
 * Returns { isLoaded, campaign } for the given campaignId.
 * Centralises the "wait for Dexie hydration / look up campaign" pattern
 * that every campaign-scoped route needs.
 */
export function useLoadedCampaign(campaignId: string | undefined) {
  const isLoaded = useCampaignStore((s) => s.isLoaded)
  const campaign = useCampaignStore((s) =>
    campaignId ? s.campaigns.find((c) => c.id === campaignId) : undefined,
  )

  return { isLoaded, campaign }
}
