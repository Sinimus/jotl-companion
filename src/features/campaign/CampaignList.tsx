import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCampaignStore } from './store'
import { CampaignCard } from './CampaignCard'

export function CampaignList() {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const campaigns = useCampaignStore((s) => s.campaigns)
  const activeCampaignId = useCampaignStore((s) => s.activeCampaignId)
  const isLoaded = useCampaignStore((s) => s.isLoaded)
  const createCampaign = useCampaignStore((s) => s.createCampaign)
  const deleteCampaign = useCampaignStore((s) => s.deleteCampaign)
  const setActiveCampaign = useCampaignStore((s) => s.setActiveCampaign)

  const navigate = useNavigate()

  // -----------------------------------------------------------------------
  const handleCreate = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    try {
      await createCampaign({ name: trimmed })
      setName('')
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create campaign')
    }
  }
  // -----------------------------------------------------------------------

  // Loading gate — Dexie hydration in progress
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900">
        <p className="text-zinc-500">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 px-4 py-8">
      <div className="mx-auto max-w-lg">
        {/* Page header */}
        <h1 className="mb-2 text-2xl font-bold text-amber-500">Gloomhaven</h1>
        <p className="mb-6 text-sm text-zinc-400">Jaws of the Lion — Your Campaigns</p>

        {/* Create-campaign form */}
        <div className="mb-2 flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="New campaign name…"
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
          />
          <button
            disabled={!name.trim()}
            onClick={handleCreate}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-zinc-900 disabled:opacity-40 hover:bg-amber-500"
          >
            Create
          </button>
        </div>

        {/* Inline error */}
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        {/* Campaign list or empty state */}
        {campaigns.length === 0 ? (
          <p className="mt-8 text-center text-zinc-500">No campaigns yet — create one above.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                isActive={campaign.id === activeCampaignId}
                onSelect={() => {
                  setActiveCampaign(campaign.id)
                  navigate(`/campaign/${campaign.id}`)
                }}
                onDelete={() => deleteCampaign(campaign.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
