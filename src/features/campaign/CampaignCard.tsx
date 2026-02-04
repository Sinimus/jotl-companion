import { useState } from 'react'
import { type Campaign } from '@/shared/schemas'
import { scenarios } from '@/data'

interface CampaignCardProps {
  campaign: Campaign
  isActive: boolean
  /** Navigate to detail + mark as active */
  onSelect: () => void
  /** Fires only after the player confirms deletion */
  onDelete: () => void
}

// ---------------------------------------------------------------------------
// Derive a human-readable "next scenario" label from scenarioStatus.
// Returns the lowest-ID scenario that is still "unlocked", or a completion
// message when none remain.
// ---------------------------------------------------------------------------
function getNextScenarioLabel(campaign: Campaign): string {
  const ids = Object.keys(campaign.scenarioStatus)
    .map(Number)
    .sort((a, b) => a - b)

  for (const id of ids) {
    if (campaign.scenarioStatus[id] === 'unlocked') {
      const scenario = scenarios.find((s) => s.id === id)
      return scenario ? `Scenario ${id} – ${scenario.name}` : `Scenario ${id}`
    }
  }
  return 'All scenarios completed'
}

export function CampaignCard({ campaign, isActive, onSelect, onDelete }: CampaignCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const completedScenarios = Object.values(campaign.scenarioStatus).filter(s => s === 'completed').length

  return (
    <div
      className={[
        'rounded-lg border bg-zinc-800 p-3 transition-colors',
        isActive ? 'border-amber-500' : 'border-zinc-700',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: campaign name button (amber, truncate) + next-scenario label below it */}
        <div className="min-w-0 flex-1">
          <button
            onClick={onSelect}
            className="block w-full text-left"
            aria-label={`Open campaign ${campaign.name}`}
          >
            <h3 className="truncate text-base font-semibold text-amber-400 hover:text-amber-300 transition-colors">
              {campaign.name}
            </h3>
            <p className="truncate text-xs text-zinc-500">{getNextScenarioLabel(campaign)}</p>
          </button>
        </div>

        {/* Middle: {completedScenarios}/17 · {N} heroes in text-xs text-zinc-400 */}
        <div className="shrink-0 text-right">
          <span className="text-xs text-zinc-400">
            {completedScenarios}/17 &bull; {campaign.characters.length} heroes
          </span>
        </div>

        {/* Right: existing delete × control, unchanged logic */}
        <div className="shrink-0">
          {confirmDelete ? (
            <div className="flex shrink-0 gap-2">
              <button
                onClick={onDelete}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-zinc-500 hover:text-red-400 transition-colors"
              aria-label={`Delete campaign ${campaign.name}`}
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
