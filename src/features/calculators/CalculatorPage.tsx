import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useLoadedCampaign } from '@/shared/hooks/useLoadedCampaign'
import { characters } from '@/data'
import { computeLevelFromXp, computeScenarioLevel, scenarioLevelRow, type Difficulty } from '@/features/campaign/rules'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'

export function CalculatorPage() {
  const { campaignId } = useParams<{ campaignId: string }>()

  const { isLoaded, campaign } = useLoadedCampaign(campaignId)
  useDocumentTitle('Set Up Scenario', campaign?.name)

  const [difficulty, setDifficulty] = useState<Difficulty>('normal')

  // Difficulty selector (LtP p.29): easy −1, normal 0, hard +1, very hard +2.
  const difficulties: { label: string; value: Difficulty; modifier: number; color: string }[] = [
    { label: 'Easy', value: 'easy', modifier: -1, color: 'bg-emerald-700' },
    { label: 'Normal', value: 'normal', modifier: 0, color: 'bg-blue-600' },
    { label: 'Hard', value: 'hard', modifier: 1, color: 'bg-orange-700' },
    { label: 'Very Hard', value: 'very_hard', modifier: 2, color: 'bg-red-600' },
  ]

  const selectedDifficulty = difficulties.find((d) => d.value === difficulty) ?? difficulties[1]

  // Scenario level from the character levels and the difficulty (LtP p.29).
  const characterLevels = (campaign?.characters ?? []).map((char) => computeLevelFromXp(char.experience))
  const finalLevel = computeScenarioLevel(characterLevels, selectedDifficulty.value)
  const levelData = scenarioLevelRow(finalLevel)

  // Base values before the difficulty modifier, for the overview display.
  const avgLevel = characterLevels.length > 0
    ? characterLevels.reduce((sum, level) => sum + level, 0) / characterLevels.length
    : 1
  const baseLevel = Math.ceil(avgLevel / 2)

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900">
        <p className="text-zinc-500">Loading…</p>
      </div>
    )
  }

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

  return (
    <div className="min-h-screen bg-zinc-900 px-4 py-8">
      <div className="mx-auto max-w-lg">
        {/* Back link */}
        <Link
          to={`/campaign/${campaignId}`}
          className="inline-flex min-h-11 items-center text-sm text-zinc-400 transition-colors hover:text-amber-400"
        >
          ← Back to campaign
        </Link>

        {/* Header */}
        <h1 className="mt-4 text-2xl font-bold text-amber-500">Game Calculators</h1>

        {/* Party Overview */}
        <div className="mt-6 rounded-lg border border-zinc-700 bg-zinc-800 p-4">
          <h2 className="mb-3 text-sm font-semibold text-zinc-300">Party Overview</h2>
          {campaign.characters.length === 0 ? (
            <p className="text-sm text-zinc-500">No characters in the party yet.</p>
          ) : (
            <div className="space-y-2">
              {campaign.characters.map((char) => {
                const charDef = characters.find((c) => c.id === char.type)
                const computedLevel = computeLevelFromXp(char.experience)
                return (
                  <div key={char.id} className="flex items-center justify-between rounded-md bg-zinc-900 px-3 py-2">
                    <div>
                      <span className="text-sm font-medium text-zinc-200">{char.name}</span>
                      <span className="ml-2 text-xs text-zinc-500">({charDef?.name ?? char.type})</span>
                    </div>
                    <span className="text-sm font-semibold text-amber-400">Lv {computedLevel}</span>
                  </div>
                )
              })}
            </div>
          )}

          {campaign.characters.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-md bg-zinc-900 p-3 text-xs">
              <div>
                <span className="block text-zinc-500">Average Level</span>
                <span className="text-lg font-semibold text-zinc-100">{avgLevel.toFixed(1)}</span>
              </div>
              <div>
                <span className="block text-zinc-500">Base Scenario Level</span>
                <span className="text-lg font-semibold text-zinc-100">{baseLevel}</span>
              </div>
            </div>
          )}
        </div>

        {/* Scenario Level Calculator */}
        <div className="mt-6 rounded-lg border border-zinc-700 bg-zinc-800 p-4">
          <h2 className="mb-3 text-sm font-semibold text-zinc-300">Scenario Level Calculator</h2>

          {/* Difficulty Selector */}
          <div className="mb-4">
            <p id="calculator-difficulty" className="mb-2 block text-xs text-zinc-500">Difficulty</p>
            <div role="group" aria-labelledby="calculator-difficulty" className="grid grid-cols-4 gap-2">
              {difficulties.map((diff) => (
                <button
                  key={diff.label}
                  type="button"
                  onClick={() => setDifficulty(diff.value)}
                  className={[
                    'min-h-11 rounded-md px-2 py-2 text-xs font-medium transition-colors',
                    difficulty === diff.value
                      ? `${diff.color} text-white shadow-lg`
                      : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600',
                  ].join(' ')}
                >
                  {diff.label}
                  <span className="block text-[10px]">{diff.modifier > 0 ? `+${diff.modifier}` : diff.modifier}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Big Result */}
          <div className="rounded-lg border-2 border-amber-500/50 bg-amber-500/10 p-6 text-center">
            <p className="text-xs uppercase tracking-wider text-amber-300">Scenario Level</p>
            <p className="mt-2 text-5xl font-bold text-amber-400">{finalLevel}</p>
            <p className="mt-2 text-xs text-zinc-400">
              Base {baseLevel} {selectedDifficulty.modifier > 0 ? `+ ${selectedDifficulty.modifier}` : selectedDifficulty.modifier < 0 ? `- ${Math.abs(selectedDifficulty.modifier)}` : ''}
            </p>
          </div>
        </div>

        {/* Scenario Stats */}
        <div className="mt-6 rounded-lg border border-zinc-700 bg-zinc-800 p-4">
          <h2 className="mb-3 text-sm font-semibold text-zinc-300">Scenario Stats (Level {finalLevel})</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md bg-zinc-900 p-3">
              <span className="block text-xs text-zinc-500">Monster Level</span>
              <span className="text-xl font-semibold text-red-400">{finalLevel}</span>
            </div>
            <div className="rounded-md bg-zinc-900 p-3">
              <span className="block text-xs text-zinc-500">Trap Damage</span>
              <span className="text-xl font-semibold text-orange-400">{levelData.trapDamage}</span>
            </div>
            <div className="rounded-md bg-zinc-900 p-3">
              <span className="block text-xs text-zinc-500">Gold per Token</span>
              <span className="text-xl font-semibold text-amber-400">{levelData.goldConversion}</span>
            </div>
            <div className="rounded-md bg-zinc-900 p-3">
              <span className="block text-xs text-zinc-500">Bonus XP</span>
              <span className="text-xl font-semibold text-emerald-400">+{levelData.bonusXp}</span>
            </div>
          </div>
        </div>

        {/* Note */}
        <p className="mt-4 text-xs text-zinc-500">
          ℹ️ Scenario Level is calculated as <code className="rounded bg-zinc-800 px-1 py-0.5">ceil(Average Party Level / 2)</code> adjusted by difficulty. LtP p.29.
        </p>
      </div>
    </div>
  )
}
