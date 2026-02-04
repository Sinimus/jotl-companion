import { type Campaign } from '@/shared/schemas'

interface ActiveCampaignCardProps {
  campaign: Campaign
  onContinue: () => void
}

export function ActiveCampaignCard({ campaign, onContinue }: ActiveCampaignCardProps) {
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
            Active Campaign
          </span>
          <h2 className="text-3xl font-bold text-white">{campaign.name}</h2>
          <p className="text-sm text-zinc-400">
            Last played: {new Date(campaign.updatedAt).toLocaleDateString()}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-zinc-800/50 p-3">
            <span className="block text-xs text-zinc-500">Party Size</span>
            <span className="text-lg font-semibold text-zinc-200">
              {campaign.characters.length}/4 Heroes
            </span>
          </div>
          <div className="rounded-lg bg-zinc-800/50 p-3">
            <span className="block text-xs text-zinc-500">Progress</span>
            <span className="text-lg font-semibold text-zinc-200">
              {completedScenarios}/17 Scenarios
            </span>
          </div>
          <div className="rounded-lg bg-zinc-800/50 p-3">
            <span className="block text-xs text-zinc-500">Avg Level</span>
            <span className="text-lg font-semibold text-zinc-200">
              Lv {avgLevel}
            </span>
          </div>
          <div className="rounded-lg bg-zinc-800/50 p-3">
            <span className="block text-xs text-zinc-500">City Events</span>
            <span className="text-lg font-semibold text-zinc-200">
              {campaign.cityEventsDrawn.length} Drawn
            </span>
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
