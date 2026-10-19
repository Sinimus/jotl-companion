import { useState } from 'react'
import { toast } from 'sonner'
import { scenarios, type Scenario } from '@/data'
import { cn } from '@/shared/lib/utils'
import { formatSource } from '@/shared/lib/source'
import { closingConfirmText, scenarioLabel, scenariosClosedByCompleting } from './rules'
import { useCampaignStore } from './store'
import type { ScenarioStatus } from '@/shared/schemas'

interface ScenarioTrackerProps {
  campaignId: string
  scenarioStatus: Record<number, ScenarioStatus>
}

export function ScenarioTracker({ campaignId, scenarioStatus }: ScenarioTrackerProps) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {scenarios.map((scenario) => (
        <ScenarioCard
          key={scenario.id}
          campaignId={campaignId}
          scenario={scenario}
          scenarioStatus={scenarioStatus}
        />
      ))}
    </div>
  )
}

interface ScenarioCardProps {
  campaignId: string
  scenario: Scenario
  scenarioStatus: Record<number, ScenarioStatus>
}

function ScenarioCard({ campaignId, scenario, scenarioStatus }: ScenarioCardProps) {
  const setScenarioStatus = useCampaignStore((s) => s.setScenarioStatus)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [spoilersShown, setSpoilersShown] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const status = scenarioStatus[scenario.id] ?? 'locked'
  const isLocked = status === 'locked'
  const isCompleted = status === 'completed'
  const isUnlocked = status === 'unlocked'
  const isClosed = status === 'closed'
  // Details exist only while the scenario can still be played (r193).
  const canShowDetails = isUnlocked || isCompleted

  const confirmText = closingConfirmText(scenariosClosedByCompleting(scenario.id, scenarioStatus))

  const applyStatus = async (next: 'unlocked' | 'completed') => {
    try {
      await setScenarioStatus(campaignId, scenario.id, next)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update scenario')
    }
  }

  // A closed scenario can no longer be played (Glossary p.18). Locked unlocks,
  // completed reopens, unlocked completes — after confirming the closing of an
  // alternative when there is one.
  const handleToggle = () => {
    if (isClosed) return
    if (isLocked || isCompleted) {
      setConfirming(false)
      void applyStatus('unlocked')
      return
    }
    if (confirmText) {
      setConfirming(true)
      return
    }
    void applyStatus('completed')
  }

  const toggleDetails = () => {
    // Hiding the panel hides the spoilers with it, so they come back guarded.
    if (detailsOpen) setSpoilersShown(false)
    setDetailsOpen(!detailsOpen)
  }

  return (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden rounded-lg border transition-all',
        (isLocked || isClosed) && 'border-zinc-800 bg-zinc-900/50',
        isUnlocked && 'border-zinc-600 bg-zinc-800 hover:border-amber-500/50',
        isCompleted && 'border-emerald-900/50 bg-emerald-950/30'
      )}
    >
      {/* Status Indicator Stripe */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-1',
          (isLocked || isClosed) && 'bg-zinc-800',
          isUnlocked && 'bg-amber-500',
          isCompleted && 'bg-emerald-500'
        )}
      />

      <div className="flex items-stretch">
        {/* Status toggle — the whole text area is one keyboard-accessible button */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={isClosed}
          className={cn(
            'flex min-w-0 flex-1 items-center justify-between gap-2 py-3 pl-5 pr-3 text-left',
            isClosed ? 'cursor-not-allowed' : 'cursor-pointer'
          )}
        >
          <div className="flex min-w-0 flex-col">
            <span
              className={cn(
                'text-xs font-bold uppercase tracking-wider',
                (isLocked || isClosed) && 'text-zinc-500',
                isUnlocked && 'text-amber-500',
                isCompleted && 'text-emerald-500'
              )}
            >
              Scenario {scenario.id}
            </span>
            {isLocked ? (
              <>
                <span className="text-sm font-medium text-zinc-500">Locked</span>
                {scenario.unlockedByCityEvent !== null && (
                  <span className="mt-0.5 text-xs text-zinc-500">
                    City event {scenario.unlockedByCityEvent} unlocks it: tap when it does
                  </span>
                )}
              </>
            ) : (
              <>
                <span
                  className={cn(
                    'font-medium leading-tight',
                    isClosed && 'text-zinc-500 line-through decoration-zinc-600',
                    isUnlocked && 'text-zinc-200',
                    isCompleted && 'text-zinc-400 line-through decoration-zinc-600'
                  )}
                >
                  {scenario.name}
                </span>
                <span className="mt-0.5 text-xs text-zinc-500">{scenario.location}</span>
              </>
            )}
            {isClosed && (
              <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Closed
              </span>
            )}
          </div>

          {/* Checkbox / Icon */}
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900">
            {isCompleted && <span className="text-sm font-bold text-emerald-500">✓</span>}
            {isClosed && <span className="text-xs font-bold text-zinc-500">✕</span>}
          </div>
        </button>

        {canShowDetails && (
          <button
            type="button"
            onClick={toggleDetails}
            aria-expanded={detailsOpen}
            className="shrink-0 border-l border-zinc-700/60 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 transition-colors hover:text-amber-400"
          >
            {detailsOpen ? 'Hide' : 'Details'}
          </button>
        )}
      </div>

      {confirming && confirmText && (
        <div className="border-t border-zinc-700/60 bg-zinc-900/60 px-4 py-3">
          <p className="text-xs leading-snug text-amber-300">{confirmText}</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setConfirming(false)
                void applyStatus('completed')
              }}
              className="min-h-11 rounded-md bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-500"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="min-h-11 rounded-md bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {detailsOpen && (
        <div className="border-t border-zinc-700/60 px-4 py-3 text-xs">
          <p className="leading-snug text-zinc-400">
            <span className="font-semibold text-zinc-500">Goal: </span>
            {scenario.goal}
          </p>
          <p className="mt-1 leading-snug text-zinc-400">
            <span className="font-semibold text-zinc-500">Location: </span>
            {scenario.location}
          </p>

          {!spoilersShown ? (
            <button
              type="button"
              onClick={() => setSpoilersShown(true)}
              className="min-h-11 mt-3 rounded-md border border-zinc-600 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 transition-colors hover:border-amber-500/50 hover:text-amber-400"
            >
              Reveal spoilers
            </button>
          ) : (
            <div className="mt-3 space-y-2">
              <SpoilerList
                label="Monsters (Scenario Key)"
                values={scenario.monsters}
                source={scenario.source}
              />
              <SpoilerList
                label="Treasure tiles"
                values={scenario.treasures.map(String)}
                source={scenario.treasuresSource}
              />
              <SpoilerList label="Rewards" values={scenario.rewards} source={scenario.rewardsSource} />
              <SpoilerList
                label="Unlocks"
                values={scenario.unlocks.map(scenarioLabel)}
                source={scenario.unlocksSource}
              />
              <SpoilerList
                label="Closes"
                values={scenario.blocks.map(scenarioLabel)}
                source={scenario.blocksSource}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** One spoiler line with its source citation — rendered only after "Reveal spoilers". */
function SpoilerList({ label, values, source }: { label: string; values: string[]; source: string }) {
  return (
    <div>
      <p className="leading-snug text-zinc-400">
        <span className="font-semibold text-zinc-500">{label}: </span>
        {values.length > 0 ? values.join(', ') : 'none'}
      </p>
      <p className="mt-0.5 text-[10px] text-zinc-500">{formatSource(source)}</p>
    </div>
  )
}
