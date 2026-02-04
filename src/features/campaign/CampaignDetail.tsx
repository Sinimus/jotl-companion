import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useCampaignStore } from './store'
import { useLoadedCampaign } from '@/shared/hooks/useLoadedCampaign'
import { CharacterCard } from './CharacterCard'
import { CharacterForm } from './CharacterForm'
import { ScenarioTracker } from './ScenarioTracker'
import { scenarios } from '@/data'

export function CampaignDetail() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<'party' | 'scenarios'>('party')

  const { isLoaded, campaign } = useLoadedCampaign(id)
  const addCharacter = useCampaignStore((s) => s.addCharacter)
  const removeCharacter = useCampaignStore((s) => s.removeCharacter)

  const navigate = useNavigate()

  // ---------------------------------------------------------------------------
  // Loading gate — Dexie hydration may not have finished on a deep-link entry
  // ---------------------------------------------------------------------------
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-zinc-500 animate-pulse">Loading…</p>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // 404 — invalid or deleted campaign ID
  // ---------------------------------------------------------------------------
  if (!campaign) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950">
        <p className="mb-4 text-zinc-400">Campaign not found.</p>
        <Link to="/" className="text-sm text-amber-400 hover:text-amber-300">
          ← Back to campaigns
        </Link>
      </div>
    )
  }

  const completedScenarios = Object.values(campaign.scenarioStatus).filter(s => s === 'completed').length
  const nextScenario = scenarios
    .filter(s => campaign.scenarioStatus[s.id] === 'unlocked')
    .sort((a, b) => a.id - b.id)[0] ?? null
  const allCompleted = !nextScenario && completedScenarios === 17

  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {/* Sticky header — copy the structure from CharacterDetail exactly */}
      <div className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="px-4 py-3">
          <Link to="/" className="mb-1 block text-xs font-medium text-zinc-500 hover:text-zinc-300">← Campaigns</Link>
          <h1 className="text-xl font-bold text-zinc-100">{campaign.name}</h1>

          {/* Progress bar */}
          <div className="mt-2">
            <div className="mb-1 flex justify-between text-[10px] uppercase text-zinc-500">
              <span>{completedScenarios}/17 Scenarios</span>
              <span>{Math.round((completedScenarios / 17) * 100)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full bg-amber-600 transition-all duration-500"
                style={{ width: `${(completedScenarios / 17) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Tab row */}
        <div className="flex border-t border-zinc-800">
          {(['party', 'scenarios'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab ? 'border-b-2 border-amber-500 text-amber-500' : 'text-zinc-500 hover:text-zinc-300'
              }`}>
              {tab === 'party' ? 'Party' : 'Scenarios'}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-4">
        {activeTab === 'party' ? (
          <div className="flex flex-col gap-6">
            {/* Party section */}
            <section>
              <h2 className="mb-3 text-base font-semibold text-zinc-300">
                Your Party ({campaign.characters.length}/4)
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
              <div className="mt-4">
                <CharacterForm
                  disabled={campaign.characters.length >= 4}
                  onAdd={(input) => addCharacter(campaign.id, input)}
                />
              </div>
            </section>

            {/* "What's Next" card */}
            <section className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
              <h3 className="mb-2 text-sm font-semibold text-amber-500">What's Next</h3>
              {allCompleted ? (
                <p className="text-sm text-zinc-300">Campaign complete! All 17 scenarios finished.</p>
              ) : nextScenario ? (
                <div>
                  <p className="text-sm font-medium text-zinc-200">
                    Scenario {nextScenario.id} — {nextScenario.name}
                  </p>
                  <p className="text-xs text-zinc-500">{nextScenario.location} · {nextScenario.goal}</p>
                </div>
              ) : (
                <p className="text-sm text-zinc-500">No scenarios unlocked yet.</p>
              )}
            </section>

            {/* Tools section */}
            <section>
              <h3 className="mb-2 text-sm font-semibold text-zinc-400">Tools</h3>
              <div className="flex flex-col gap-2">
                <Link to={`/campaign/${campaign.id}/calculators`}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 p-3 transition-colors hover:border-zinc-500">
                  <p className="text-sm font-semibold text-zinc-200">Set Up Scenario</p>
                  <p className="text-xs text-zinc-500">Calculate scenario level, difficulty, and expected rewards</p>
                </Link>
                <Link to={`/campaign/${campaign.id}/checklist`}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 p-3 transition-colors hover:border-zinc-500">
                  <p className="text-sm font-semibold text-zinc-200">Finish Scenario</p>
                  <p className="text-xs text-zinc-500">Step-by-step checklist to collect rewards and update records</p>
                </Link>
              </div>
            </section>
          </div>
        ) : (
          <ScenarioTracker
            campaignId={campaign.id}
            scenarioStatus={campaign.scenarioStatus}
          />
        )}
      </div>
    </div>
  )
}
