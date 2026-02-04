import { useParams, Link, useNavigate } from 'react-router-dom'
import { useCampaignStore } from './store'
import { useLoadedCampaign } from '@/shared/hooks/useLoadedCampaign'
import { CharacterCard } from './CharacterCard'
import { CharacterForm } from './CharacterForm'
import { ScenarioTracker } from './ScenarioTracker'

export function CampaignDetail() {
  const { id } = useParams<{ id: string }>()

  const { isLoaded, campaign } = useLoadedCampaign(id)
  const addCharacter = useCampaignStore((s) => s.addCharacter)
  const removeCharacter = useCampaignStore((s) => s.removeCharacter)

  const navigate = useNavigate()

  // ---------------------------------------------------------------------------
  // Loading gate — Dexie hydration may not have finished on a deep-link entry
  // ---------------------------------------------------------------------------
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900">
        <p className="text-zinc-500">Loading…</p>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // 404 — invalid or deleted campaign ID
  // ---------------------------------------------------------------------------
  if (!campaign) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-900">
        <p className="mb-4 text-zinc-400">Campaign not found.</p>
        <Link to="/" className="text-sm text-amber-400 hover:text-amber-300">
          ← Back to campaigns
        </Link>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-zinc-900 px-4 py-8">
      <div className="mx-auto max-w-lg">
        {/* Back link */}
        <Link
          to="/"
          className="text-sm text-zinc-500 hover:text-amber-400 transition-colors"
        >
          ← Back to campaigns
        </Link>

        {/* Campaign heading */}
        <h1 className="mt-4 text-2xl font-bold text-amber-500">{campaign.name}</h1>

        {/* Party section */}
        <h2 className="mt-6 mb-3 text-base font-semibold text-zinc-300">
          Party ({campaign.characters.length}/4)
        </h2>

        {campaign.characters.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No characters yet — add your first hero below.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {campaign.characters.map((char) => (
              <CharacterCard
                key={char.id}
                character={char}
                onSelect={() => navigate(`/campaign/${campaign.id}/character/${char.id}`)}
                onDelete={() => removeCharacter(campaign.id, char.id)}
              />
            ))}
          </div>
        )}

        {/* Add-character form */}
        <div className="mt-6 border-t border-zinc-700 pt-6">
          <h3 className="mb-3 text-sm font-semibold text-zinc-400">Add Character</h3>
          <CharacterForm
            disabled={campaign.characters.length >= 4}
            onAdd={(input) => addCharacter(campaign.id, input)}
          />
        </div>

        {/* Scenarios section */}
        <div className="mt-8 border-t border-zinc-700 pt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-zinc-300">Scenarios</h2>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/rules`)}
                className="rounded-md border border-zinc-500/50 bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                Rules →
              </button>
              <button
                onClick={() => navigate(`/campaign/${campaign.id}/checklist`)}
                className="rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 transition-colors"
              >
                Checklist →
              </button>
              <button
                onClick={() => navigate(`/campaign/${campaign.id}/calculators`)}
                className="rounded-md border border-blue-500/50 bg-blue-500/10 px-3 py-1.5 text-sm font-medium text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-colors"
              >
                Calculators →
              </button>
            </div>
          </div>
          <ScenarioTracker
            campaignId={campaign.id}
            scenarioStatus={campaign.scenarioStatus}
          />
        </div>
      </div>
    </div>
  )
}
