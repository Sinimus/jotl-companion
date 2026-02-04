import { useNavigate } from 'react-router-dom'
import { useCampaignStore } from './store'
import { CampaignCard } from './CampaignCard'
import { ActiveCampaignCard } from './ActiveCampaignCard'
import { CreateCampaignCard } from './CreateCampaignCard'

export function CampaignList() {
  const campaigns = useCampaignStore((s) => s.campaigns)
  const activeCampaignId = useCampaignStore((s) => s.activeCampaignId)
  const isLoaded = useCampaignStore((s) => s.isLoaded)
  const createCampaign = useCampaignStore((s) => s.createCampaign)
  const deleteCampaign = useCampaignStore((s) => s.deleteCampaign)
  const setActiveCampaign = useCampaignStore((s) => s.setActiveCampaign)

  const navigate = useNavigate()

  // Loading gate
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900">
        <p className="text-zinc-500">Loading…</p>
      </div>
    )
  }

  // Determine active campaign
  const activeCampaign = campaigns.find((c) => c.id === activeCampaignId)
  
  // Sort remaining campaigns by last updated
  const otherCampaigns = campaigns
    .filter((c) => c.id !== activeCampaignId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  // If no active campaign but we have campaigns, suggest the most recent one as "active" candidate logic-wise,
  // but visually we might just want to show the list.
  // Requirement says: "If activeCampaignId exists, show ActiveCampaignCard. If not, show most recently updated."
  
  const featuredCampaign = activeCampaign || otherCampaigns[0]
  const listCampaigns = activeCampaign ? otherCampaigns : otherCampaigns.slice(1)

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-amber-500">Welcome Back</h1>
        <p className="text-zinc-400">Ready for your next adventure?</p>
      </header>

      <section className="mb-10">
        {featuredCampaign ? (
          <ActiveCampaignCard
            campaign={featuredCampaign}
            onContinue={() => {
              setActiveCampaign(featuredCampaign.id)
              navigate(`/campaign/${featuredCampaign.id}`)
            }}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/30 p-8 text-center">
            <p className="mb-4 text-zinc-400">No campaigns found. Start your journey below!</p>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-300">
          {featuredCampaign ? 'Other Campaigns' : 'Create Campaign'}
        </h2>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <CreateCampaignCard onCreate={(name) => createCampaign({ name })} />
          
          {listCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              isActive={false} // We don't need to highlight it in the list since we have the Active card
              onSelect={() => {
                setActiveCampaign(campaign.id)
                navigate(`/campaign/${campaign.id}`)
              }}
              onDelete={() => deleteCampaign(campaign.id)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}