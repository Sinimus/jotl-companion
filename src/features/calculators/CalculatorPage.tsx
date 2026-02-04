import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useCampaignStore } from '@/features/campaign'
import { tables, characters } from '@/data'

export function CalculatorPage() {
  const { campaignId } = useParams<{ campaignId: string }>()

  const campaigns = useCampaignStore((s) => s.campaigns)
  const campaign = campaigns.find((c) => c.id === campaignId)

  // Difficulty modifier state: -1 (Easy), 0 (Normal), 1 (Hard), 2 (Very Hard)
  const [difficultyModifier, setDifficultyModifier] = useState<0 | 1 | 2 | 3>(1) // Index: 0=-1, 1=0, 2=1, 3=2

  // Difficulty modifier mapping: index -> actual modifier
  const modifiers: { label: string; value: number; color: string }[] = [
    { label: 'Easy', value: -1, color: 'bg-emerald-600' },
    { label: 'Normal', value: 0, color: 'bg-blue-600' },
    { label: 'Hard', value: 1, color: 'bg-orange-600' },
    { label: 'Very Hard', value: 2, color: 'bg-red-600' },
  ]

  const selectedDifficulty = modifiers[difficultyModifier]

  // Calculate average party level
  const avgLevel =
    campaign?.characters.length && campaign.characters.length > 0
      ? campaign.characters.reduce((sum, char) => sum + char.level, 0) / campaign.characters.length
      : 1

  // Base scenario level: ceil(average / 2)
  const baseLevel = Math.ceil(avgLevel / 2)

  // Final level: clamped between 0 and 7
  const finalLevel = Math.max(0, Math.min(7, baseLevel + selectedDifficulty.value))

  // Look up scenario level data from tables.json
  const levelData = useMemo(
    () => tables.scenarioLevelTable.find((row) => row.level === finalLevel) ?? tables.scenarioLevelTable[0],
    [finalLevel]
  )

  if (!campaign) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900">
        <p className="text-zinc-500">Campaign not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 px-4 py-8">
      <div className="mx-auto max-w-lg">
        {/* Back link */}
        <Link
          to={`/campaign/${campaignId}`}
          className="text-sm text-zinc-500 hover:text-amber-400 transition-colors"
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
                return (
                  <div key={char.id} className="flex items-center justify-between rounded-md bg-zinc-900 px-3 py-2">
                    <div>
                      <span className="text-sm font-medium text-zinc-200">{char.name}</span>
                      <span className="ml-2 text-xs text-zinc-500">({charDef?.name ?? char.type})</span>
                    </div>
                    <span className="text-sm font-semibold text-amber-400">Lv {char.level}</span>
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
            <label className="mb-2 block text-xs text-zinc-500">Difficulty</label>
            <div className="grid grid-cols-4 gap-2">
              {modifiers.map((diff, index) => (
                <button
                  key={diff.label}
                  type="button"
                  onClick={() => setDifficultyModifier(index as 0 | 1 | 2 | 3)}
                  className={[
                    'rounded-md px-2 py-2 text-xs font-medium transition-colors',
                    difficultyModifier === index
                      ? `${diff.color} text-white shadow-lg`
                      : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600',
                  ].join(' ')}
                >
                  {diff.label}
                  <span className="block text-[10px] opacity-75">{diff.value > 0 ? `+${diff.value}` : diff.value}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Big Result */}
          <div className="rounded-lg border-2 border-amber-500/50 bg-amber-500/10 p-6 text-center">
            <p className="text-xs uppercase tracking-wider text-amber-300">Scenario Level</p>
            <p className="mt-2 text-5xl font-bold text-amber-400">{finalLevel}</p>
            <p className="mt-2 text-xs text-zinc-400">
              Base {baseLevel} {selectedDifficulty.value > 0 ? `+ ${selectedDifficulty.value}` : selectedDifficulty.value < 0 ? `- ${Math.abs(selectedDifficulty.value)}` : ''}
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
          ℹ️ Scenario Level is calculated as <code className="rounded bg-zinc-800 px-1 py-0.5">ceil(Average Party Level / 2)</code> adjusted by difficulty.
        </p>
      </div>
    </div>
  )
}
