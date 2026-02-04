import { useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCampaignStore } from './store'
import { CampaignCard } from './CampaignCard'
import { ActiveCampaignCard } from './ActiveCampaignCard'
import { CreateCampaignCard } from './CreateCampaignCard'
import { TOTAL_SCENARIOS } from '@/data'

export function CampaignList() {
  const campaigns = useCampaignStore((s) => s.campaigns)
  const corruptedCampaigns = useCampaignStore((s) => s.corruptedCampaigns)
  const activeCampaignId = useCampaignStore((s) => s.activeCampaignId)
  const isLoaded = useCampaignStore((s) => s.isLoaded)
  const createCampaign = useCampaignStore((s) => s.createCampaign)
  const deleteCampaign = useCampaignStore((s) => s.deleteCampaign)
  const setActiveCampaign = useCampaignStore((s) => s.setActiveCampaign)

  const navigate = useNavigate()

  // Memoize campaign list derived states
  const { featuredCampaign, listCampaigns } = useMemo(() => {
    const active = campaigns.find((c) => c.id === activeCampaignId)
    const others = [...campaigns]
      .filter((c) => c.id !== activeCampaignId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    return {
      featuredCampaign: active || others[0],
      listCampaigns: active ? others : others.slice(1),
    }
  }, [campaigns, activeCampaignId])

  // Loading gate
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-zinc-500 animate-pulse">Loading…</p>
      </div>
    )
  }

  // Determine active campaign for label check
  const activeCampaign = campaigns.find((c) => c.id === activeCampaignId)

  // Branch A — campaigns.length === 0
  if (campaigns.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-amber-500">Gloomhaven: Jaws of the Lion</h1>
        <p className="mt-1 text-zinc-400">Unofficial Companion App</p>

        {corruptedCampaigns.length > 0 && (
          <div className="mt-4 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-left">
            <p className="text-xs text-zinc-200">
              <span className="font-bold text-red-400">⚠️ {corruptedCampaigns.length} corrupted records</span> were found. 
              Go to <Link to="/settings" className="text-amber-500 underline">Settings</Link> to recover your data.
            </p>
          </div>
        )}

        <div className="mt-8 rounded-lg border border-zinc-700 bg-zinc-800 p-6 text-left">
          <p className="text-zinc-300">
            Track your party through all {TOTAL_SCENARIOS} scenarios, manage character progression,
            and look up rules — all in one place.
          </p>
        </div>

        <div className="mt-6 text-left">
          <CreateCampaignCard initiallyExpanded={true} onCreate={(name) => createCampaign({ name })} />
        </div>
      </div>
    )
  }

  // Branch B — campaigns.length > 0
  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-amber-500">Gloomhaven: Jaws of the Lion</h1>
        {corruptedCampaigns.length > 0 && (
          <Link to="/settings" className="text-[10px] font-bold uppercase tracking-tighter text-red-400 hover:text-red-300">
            ⚠️ Data Error
          </Link>
        )}
      </div>

      {/* Featured card */}
      <div className="mt-4">
        <ActiveCampaignCard
          campaign={featuredCampaign}
          label={activeCampaign ? 'Active' : 'Most Recent'}
          onContinue={() => {
            setActiveCampaign(featuredCampaign.id)
            navigate(`/campaign/${featuredCampaign.id}`)
          }}
        />
      </div>

      {/* Other campaigns — vertical list, not grid */}
      {listCampaigns.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-zinc-400">All Campaigns</h2>
          <div className="flex flex-col gap-2">
            {listCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                isActive={false}
                onSelect={() => {
                  setActiveCampaign(campaign.id)
                  navigate(`/campaign/${campaign.id}`)
                }}
                onDelete={() => deleteCampaign(campaign.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Create strip at the bottom */}
      <div className="mt-4">
        <CreateCampaignCard onCreate={(name) => createCampaign({ name })} />
      </div>
    </div>
  )
}