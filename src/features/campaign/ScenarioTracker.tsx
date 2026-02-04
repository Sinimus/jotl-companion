import { scenarios } from '@/data'
import { cn } from '@/shared/lib/utils'
import { useCampaignStore } from './store'
import type { ScenarioStatus } from '@/shared/schemas'

interface ScenarioTrackerProps {
  campaignId: string
  scenarioStatus: Record<number, ScenarioStatus>
}

export function ScenarioTracker({ campaignId, scenarioStatus }: ScenarioTrackerProps) {
  const setScenarioStatus = useCampaignStore((s) => s.setScenarioStatus)

  const handleToggle = (scenarioId: number, currentStatus: ScenarioStatus) => {
    // If locked, do nothing (should be handled by disabled UI, but safety check)
    if (currentStatus === 'locked') return

    // If completed, toggle back to unlocked.
    // If unlocked, toggle to completed.
    const newStatus = currentStatus === 'completed' ? 'unlocked' : 'completed'
    void setScenarioStatus(campaignId, scenarioId, newStatus)
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {scenarios.map((scenario) => {
        const status = scenarioStatus[scenario.id] ?? 'locked'
        const isLocked = status === 'locked'
        const isCompleted = status === 'completed'
        const isUnlocked = status === 'unlocked'

        return (
          <div
            key={scenario.id}
            className={cn(
              'relative flex items-center justify-between overflow-hidden rounded-lg border px-4 py-3 transition-all',
              isLocked && 'border-zinc-800 bg-zinc-900/50 opacity-60',
              isUnlocked && 'cursor-pointer border-zinc-600 bg-zinc-800 hover:border-amber-500/50',
              isCompleted && 'cursor-pointer border-emerald-900/50 bg-emerald-950/30'
            )}
            onClick={() => handleToggle(scenario.id, status)}
          >
            {/* Status Indicator Stripe */}
            <div
              className={cn(
                'absolute left-0 top-0 bottom-0 w-1',
                isLocked && 'bg-zinc-800',
                isUnlocked && 'bg-amber-500',
                isCompleted && 'bg-emerald-500'
              )}
            />

            <div className="ml-2 flex flex-col">
              <span
                className={cn(
                  'text-xs font-bold uppercase tracking-wider',
                  isLocked && 'text-zinc-600',
                  isUnlocked && 'text-amber-500',
                  isCompleted && 'text-emerald-500'
                )}
              >
                Scenario {scenario.id}
              </span>
              <span
                className={cn(
                  'font-medium leading-tight',
                  isLocked && 'text-zinc-500',
                  isUnlocked && 'text-zinc-200',
                  isCompleted && 'text-zinc-400 line-through decoration-zinc-600'
                )}
              >
                {scenario.name}
              </span>
              <span className="mt-0.5 text-xs text-zinc-600">{scenario.location}</span>
              <span className="mt-0.5 text-xs italic text-zinc-500">{scenario.goal}</span>
            </div>

            {/* Checkbox / Icon */}
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900">
              {isCompleted && (
                <span className="text-sm font-bold text-emerald-500">✓</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
