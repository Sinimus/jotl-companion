import { useParams, Link } from 'react-router-dom'
import { useCampaignStore } from './store'
import { CharacterCard } from './CharacterCard'
import { CharacterForm } from './CharacterForm'

export function CampaignDetail() {
  const { id } = useParams<{ id: string }>()

  const isLoaded = useCampaignStore((s) => s.isLoaded)
  const campaigns = useCampaignStore((s) => s.campaigns)
  const addCharacter = useCampaignStore((s) => s.addCharacter)
  const removeCharacter = useCampaignStore((s) => s.removeCharacter)

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

  const campaign = campaigns.find((c) => c.id === id)

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
      </div>
    </div>
  )
}
