import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useLoadedCampaign } from '@/shared/hooks/useLoadedCampaign'
import { scenarios, tables } from '@/data'
import { cn } from '@/shared/lib/utils'
import { formatSource } from '@/shared/lib/source'
import { useCampaignStore } from '@/features/campaign/store'
import {
  closingConfirmText,
  computeLevelFromXp,
  computeScenarioLevel,
  postScenarioSummary,
  scenariosClosedByCompleting,
} from '@/features/campaign/rules'

export function PostScenarioChecklist() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const { isLoaded, campaign } = useLoadedCampaign(campaignId)
  const setScenarioStatus = useCampaignStore((s) => s.setScenarioStatus)

  // Local state - does not persist to DB
  const [outcome, setOutcome] = useState<'success' | 'failure'>('success')
  const [pickedScenarioId, setPickedScenarioId] = useState<number | null>(null)
  const [levelOverride, setLevelOverride] = useState<number | null>(null)
  const [moneyTokens, setMoneyTokens] = useState(0)
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set())
  const [confirmingComplete, setConfirmingComplete] = useState(false)

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

  // Only unlocked or completed scenarios can be played right now; the default
  // is the first unlocked one that is not completed yet.
  const playable = scenarios.filter((s) => {
    const status = campaign.scenarioStatus[s.id]
    return status === 'unlocked' || status === 'completed'
  })
  const selected =
    playable.find((s) => s.id === pickedScenarioId) ??
    playable.find((s) => campaign.scenarioStatus[s.id] === 'unlocked') ??
    playable[0] ??
    null

  // Scenarios 1-5 are fixed to level 1 (LtP p.29); from 6 on the party at
  // normal difficulty gives the default, editable 0-7.
  const partyLevels = campaign.characters.map((c) => computeLevelFromXp(c.experience))
  const partyDefaultLevel = computeScenarioLevel(partyLevels, 'normal')
  const scenarioLevel = selected !== null && selected.id > 5 ? (levelOverride ?? partyDefaultLevel) : 1

  const summary =
    selected === null
      ? null
      : postScenarioSummary({
          scenarioId: selected.id,
          success: outcome === 'success',
          scenarioLevel,
          moneyTokens,
        })

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

  const confirmText =
    selected !== null
      ? closingConfirmText(scenariosClosedByCompleting(selected.id, campaign.scenarioStatus))
      : null

  const markComplete = async () => {
    if (!selected) return
    try {
      await setScenarioStatus(campaign.id, selected.id, 'completed')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to mark scenario complete')
    }
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
        <h1 className="mt-4 text-2xl font-bold text-amber-500">Post-Scenario Checklist</h1>

        {selected === null || summary === null ? (
          <p className="mt-6 text-sm text-zinc-500">
            No unlocked scenarios — open one in the scenario tracker first.
          </p>
        ) : (
          <>
            {/* Configuration */}
            <div className="mt-6 rounded-lg border border-zinc-700 bg-zinc-800 p-4">
              <h2 className="mb-3 text-sm font-semibold text-zinc-300">Configuration</h2>

              {/* Scenario Selector */}
              <div className="mb-4">
                <label className="mb-2 block text-xs text-zinc-500">Scenario</label>
                <select
                  value={selected.id}
                  onChange={(e) => {
                    setPickedScenarioId(Number(e.target.value))
                    setLevelOverride(null)
                    setConfirmingComplete(false)
                    setCheckedSteps(new Set())
                  }}
                  className="w-full rounded-md border border-zinc-600 bg-zinc-700 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
                >
                  {playable.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id} {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Outcome toggle */}
              <div className="mb-4">
                <label className="mb-2 block text-xs text-zinc-500">Outcome</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOutcome('success')
                      setConfirmingComplete(false)
                      setCheckedSteps(new Set())
                    }}
                    className={cn(
                      'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      outcome === 'success'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                    )}
                  >
                    Success (Won)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOutcome('failure')
                      setCheckedSteps(new Set())
                    }}
                    className={cn(
                      'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      outcome === 'failure'
                        ? 'bg-red-600 text-white'
                        : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                    )}
                  >
                    Failure (Lost)
                  </button>
                </div>
              </div>

              {/* Scenario level selector */}
              <div className="mb-4">
                <label className="mb-2 block text-xs text-zinc-500">Scenario Level</label>
                <select
                  value={scenarioLevel}
                  onChange={(e) => setLevelOverride(Number(e.target.value))}
                  disabled={selected.id <= 5}
                  className="w-full rounded-md border border-zinc-600 bg-zinc-700 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {tables.scenarioLevelTable.map((row) => (
                    <option key={row.level} value={row.level}>
                      Level {row.level}
                    </option>
                  ))}
                </select>
                {selected.id <= 5 && (
                  <p className="mt-2 text-xs text-zinc-500">
                    Scenarios 1–5 are played at level 1 (LtP p.29).
                  </p>
                )}
              </div>

              {/* Money tokens */}
              <div className="flex items-center gap-3">
                <label className="text-sm text-zinc-400">Money tokens (per character)</label>
                <input
                  type="number"
                  min={0}
                  value={moneyTokens}
                  onChange={(e) => setMoneyTokens(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-20 rounded-md border border-zinc-600 bg-zinc-700 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
                />
                <span className="text-sm text-zinc-500">×</span>
                <span className="text-sm font-semibold text-amber-400">{summary.goldPerToken}</span>
                <span className="text-sm text-zinc-500">=</span>
                <span className="text-lg font-bold text-amber-300">{summary.goldFromTokens} gold</span>
              </div>
            </div>

            {/* Gold / XP summary */}
            <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-zinc-700 bg-zinc-800 p-4 text-xs">
              <div>
                <span className="block text-zinc-500">Gold / token</span>
                <span className="text-lg font-semibold text-amber-400">{summary.goldPerToken}</span>
              </div>
              <div>
                <span className="block text-zinc-500">Gold from tokens</span>
                <span className="text-lg font-semibold text-amber-300">{summary.goldFromTokens}</span>
              </div>
              <div>
                <span className="block text-zinc-500">Bonus XP</span>
                <span className="text-lg font-semibold text-emerald-400">+{summary.bonusXp}</span>
              </div>
            </div>

            {/* Checklist */}
            <div className="mt-6 rounded-lg border border-zinc-700 bg-zinc-800 p-4">
              <h2 className="mb-3 text-sm font-semibold text-zinc-300">
                {outcome === 'success' ? 'Success Steps' : 'Failure Steps'}
              </h2>
              <div className="space-y-2">
                {summary.steps.map((step, index) => {
                  const isChecked = checkedSteps.has(index)
                  return (
                    <label
                      key={index}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-md border px-3 py-3 transition-colors',
                        isChecked
                          ? 'border-amber-500/50 bg-amber-500/10'
                          : 'border-zinc-700 hover:border-zinc-600'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleStep(index)}
                        className="mt-0.5 h-4 w-4 rounded border-zinc-600 bg-zinc-700 text-amber-500 focus:ring-2 focus:ring-amber-500 focus:ring-offset-0 focus:ring-offset-zinc-900"
                      />
                      <span
                        className={cn(
                          'text-sm leading-snug',
                          isChecked ? 'text-amber-200' : 'text-zinc-300'
                        )}
                      >
                        {step.text}
                        <span className="mt-0.5 block text-[10px] text-zinc-600">
                          {formatSource(step.source)}
                        </span>
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Mark complete */}
            {outcome === 'success' &&
              (confirmingComplete && confirmText ? (
                <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
                  <p className="text-sm leading-snug text-amber-300">{confirmText}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmingComplete(false)
                        void markComplete()
                      }}
                      className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingComplete(false)}
                      className="rounded-md bg-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={campaign.scenarioStatus[selected.id] === 'completed'}
                  onClick={() => {
                    if (confirmText) {
                      setConfirmingComplete(true)
                      return
                    }
                    void markComplete()
                  }}
                  className="mt-4 w-full rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {campaign.scenarioStatus[selected.id] === 'completed'
                    ? 'Scenario already completed'
                    : 'Mark scenario complete'}
                </button>
              ))}

            {/* Note */}
            <p className="mt-4 text-xs text-zinc-500">
              ℹ️ This checklist is a helper only. Characters update from the steps above, not
              automatically.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
