import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { tables } from '@/data'

export function PostScenarioChecklist() {
  const { campaignId } = useParams<{ campaignId: string }>()

  // Local state - does not persist to DB
  const [outcome, setOutcome] = useState<'success' | 'failure'>('success')
  const [scenarioLevel, setScenarioLevel] = useState(1)
  const [moneyTokens, setMoneyTokens] = useState(0)
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set())

  // Look up scenario level data from tables.json
  const levelData = useMemo(() => {
    return tables.scenarioLevelTable.find((row) => row.level === scenarioLevel) ?? tables.scenarioLevelTable[0]
  }, [scenarioLevel])

  const calculatedGold = moneyTokens * levelData.goldConversion

  const toggleStep = (stepIndex: number) => {
    setCheckedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(stepIndex)) {
        next.delete(stepIndex)
      } else {
        next.add(stepIndex)
      }
      return next
    })
  }

  const successSteps = [
    'Read the conclusion text in the Scenario Book.',
    `Add **+${levelData.bonusXp}** bonus experience to each character.`,
    `Tally money tokens. Convert at **${levelData.goldConversion} gold** each.`,
    'Check Battle Goals. Add checkmarks (✓) if criteria met.',
    'Update Scenario Tracker (mark completed).',
    'Draw a City Event card (if instructed).',
  ]

  const failureSteps = [
    'Record XP earned from abilities.',
    `Tally money tokens. Convert at **${levelData.goldConversion} gold** each.`,
    'No Battle Goals, no Bonus XP, no Scenario Completion.',
  ]

  const steps = outcome === 'success' ? successSteps : failureSteps

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
        <h1 className="mt-4 text-2xl font-bold text-amber-500">Post-Scenario Checklist</h1>

        {/* Configuration */}
        <div className="mt-6 rounded-lg border border-zinc-700 bg-zinc-800 p-4">
          <h2 className="mb-3 text-sm font-semibold text-zinc-300">Configuration</h2>

          {/* Outcome toggle */}
          <div className="mb-4">
            <label className="mb-2 block text-xs text-zinc-500">Outcome</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOutcome('success')}
                className={[
                  'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  outcome === 'success'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600',
                ].join(' ')}
              >
                Success (Won)
              </button>
              <button
                type="button"
                onClick={() => setOutcome('failure')}
                className={[
                  'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  outcome === 'failure'
                    ? 'bg-red-600 text-white'
                    : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600',
                ].join(' ')}
              >
                Failure (Lost)
              </button>
            </div>
          </div>

          {/* Scenario level selector */}
          <div>
            <label className="mb-2 block text-xs text-zinc-500">Scenario Level</label>
            <select
              value={scenarioLevel}
              onChange={(e) => setScenarioLevel(Number(e.target.value))}
              className="w-full rounded-md border border-zinc-600 bg-zinc-700 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
            >
              {tables.scenarioLevelTable.map((row) => (
                <option key={row.level} value={row.level}>
                  Level {row.level}
                </option>
              ))}
            </select>

            {/* Level stats */}
            <div className="mt-3 grid grid-cols-3 gap-2 rounded-md bg-zinc-900 p-3 text-xs">
              <div>
                <span className="block text-zinc-500">Bonus XP</span>
                <span className="text-lg font-semibold text-emerald-400">+{levelData.bonusXp}</span>
              </div>
              <div>
                <span className="block text-zinc-500">Gold/Token</span>
                <span className="text-lg font-semibold text-amber-400">{levelData.goldConversion}</span>
              </div>
              <div>
                <span className="block text-zinc-500">Trap Dmg</span>
                <span className="text-lg font-semibold text-red-400">{levelData.trapDamage}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Money calculator */}
        <div className="mt-4 rounded-lg border border-zinc-700 bg-zinc-800 p-4">
          <h2 className="mb-3 text-sm font-semibold text-zinc-300">Gold Calculator</h2>
          <div className="flex items-center gap-3">
            <label className="text-sm text-zinc-400">Money Tokens</label>
            <input
              type="number"
              min={0}
              value={moneyTokens}
              onChange={(e) => setMoneyTokens(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-20 rounded-md border border-zinc-600 bg-zinc-700 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
            />
            <span className="text-sm text-zinc-500">×</span>
            <span className="text-sm font-semibold text-amber-400">{levelData.goldConversion}</span>
            <span className="text-sm text-zinc-500">=</span>
            <span className="text-lg font-bold text-amber-300">{calculatedGold} gold</span>
          </div>
        </div>

        {/* Checklist */}
        <div className="mt-6 rounded-lg border border-zinc-700 bg-zinc-800 p-4">
          <h2 className="mb-3 text-sm font-semibold text-zinc-300">
            {outcome === 'success' ? 'Success Steps' : 'Failure Steps'}
          </h2>
          <div className="space-y-2">
            {steps.map((step, index) => {
              const isChecked = checkedSteps.has(index)
              return (
                <label
                  key={index}
                  className={[
                    'flex items-start gap-3 rounded-md border px-3 py-3 transition-colors cursor-pointer',
                    isChecked
                      ? 'border-amber-500/50 bg-amber-500/10'
                      : 'border-zinc-700 hover:border-zinc-600',
                  ].join(' ')}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStep(index)}
                    className="mt-0.5 h-4 w-4 rounded border-zinc-600 bg-zinc-700 text-amber-500 focus:ring-2 focus:ring-amber-500 focus:ring-offset-0 focus:ring-offset-zinc-900"
                  />
                  <span
                    className={[
                      'text-sm leading-snug',
                      isChecked ? 'text-amber-200' : 'text-zinc-300',
                    ].join(' ')}
                    dangerouslySetInnerHTML={{ __html: step.replace(/\*\*(.+?)\*\*/g, '<strong class="text-amber-400">$1</strong>') }}
                  />
                </label>
              )
            })}
          </div>
        </div>

        {/* Note */}
        <p className="mt-4 text-xs text-zinc-500">
          ℹ️ This checklist is a helper only. You must manually update your characters and scenarios based on the completed steps.
        </p>
      </div>
    </div>
  )
}
