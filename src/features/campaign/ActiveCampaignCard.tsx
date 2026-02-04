import { type Campaign } from '@/shared/schemas'
import { TOTAL_SCENARIOS } from '@/data'

interface ActiveCampaignCardProps {
  campaign: Campaign
  label?: string
  onContinue: () => void
}

export function ActiveCampaignCard({ campaign, label, onContinue }: ActiveCampaignCardProps) {
  const completedScenarios = Object.values(campaign.scenarioStatus).filter(
    (status) => status === 'completed'
  ).length

  const avgLevel =
    campaign.characters.length > 0
      ? (
          campaign.characters.reduce((sum, c) => sum + c.level, 0) /
          campaign.characters.length
        ).toFixed(1)
      : '1.0'

  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 shadow-lg shadow-black/50">
      {/* Decorative accent */}
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative z-10">
        <div className="mb-4">
          <span className="text-xs font-medium uppercase tracking-wider text-amber-500">
            {label ?? 'Active Campaign'}
          </span>
          <h2 className="text-3xl font-bold text-white">{campaign.name}</h2>
          <p className="text-sm text-zinc-400">
            Last played: {new Date(campaign.updatedAt).toLocaleDateString()}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-zinc-500">{completedScenarios}/{TOTAL_SCENARIOS} Scenarios</span>
            <span className="text-xs font-medium text-amber-500">
              {Math.round((completedScenarios / TOTAL_SCENARIOS) * 100)}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full bg-amber-600 transition-all duration-500"
              style={{ width: `${(completedScenarios / TOTAL_SCENARIOS) * 100}%` }}
            />
          </div>
        </div>

        {/* Inline stats — Party + Avg Level only. Drop City Events. */}
        <div className="mb-6 flex gap-6">
          <div>
            <span className="block text-xs text-zinc-500">Party</span>
            <span className="text-sm font-semibold text-zinc-200">{campaign.characters.length}/4</span>
          </div>
          <div>
            <span className="block text-xs text-zinc-500">Avg Level</span>
            <span className="text-sm font-semibold text-zinc-200">Lv {avgLevel}</span>
          </div>
        </div>

        <button
          onClick={onContinue}
          className="w-full rounded-lg bg-amber-600 px-4 py-3 text-center text-sm font-bold text-zinc-950 transition-colors hover:bg-amber-500"
        >
          Continue Campaign →
        </button>
      </div>
    </div>
  )
}
