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

  return (
    <div
      className={[
        'rounded-lg border bg-zinc-800 p-4 transition-colors',
        isActive ? 'border-amber-500' : 'border-zinc-700',
      ].join(' ')}
    >
      {/* Header row: name (clickable) + delete control */}
      <div className="flex items-start justify-between gap-2">
        <button
          onClick={onSelect}
          className="text-left"
          aria-label={`Open campaign ${campaign.name}`}
        >
          <h3 className="text-lg font-semibold text-amber-400 hover:text-amber-300 transition-colors">
            {campaign.name}
          </h3>
        </button>

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
            className="shrink-0 text-zinc-500 hover:text-red-400 transition-colors"
            aria-label={`Delete campaign ${campaign.name}`}
          >
            ×
          </button>
        )}
      </div>

      {/* Meta row */}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400">
        <span>Created {campaign.createdAt.toLocaleDateString()}</span>
        <span>Characters: {campaign.characters.length} / 4</span>
      </div>

      {/* Next scenario */}
      <p className="mt-1 text-sm text-zinc-500">{getNextScenarioLabel(campaign)}</p>
    </div>
  )
}
