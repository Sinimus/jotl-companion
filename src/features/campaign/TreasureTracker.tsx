import { rules } from '@/data'
import { useCampaignStore } from './store'
import { cn } from '@/shared/lib/utils'

interface TreasureTrackerProps {
  campaignId: string
  lootedTreasureIds: number[]
}

export function TreasureTracker({ campaignId, lootedTreasureIds }: TreasureTrackerProps) {
  const setTreasureLooted = useCampaignStore((s) => s.setTreasureLooted)

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rules.treasures.map((treasure) => {
        const isLooted = lootedTreasureIds.includes(treasure.id)

        return (
          <div
            key={treasure.id}
            onClick={() => void setTreasureLooted(campaignId, treasure.id, !isLooted)}
            className={cn(
              'relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-lg border p-4 transition-all',
              isLooted
                ? 'border-emerald-900/50 bg-emerald-950/20 opacity-80'
                : 'border-zinc-700 bg-zinc-800/50 hover:border-amber-500/50'
            )}
          >
            {/* Looted Indicator Stripe */}
            <div
              className={cn(
                'absolute left-0 top-0 bottom-0 w-1',
                isLooted ? 'bg-emerald-500' : 'bg-zinc-700'
              )}
            />

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 font-bold text-zinc-400">
              {treasure.id}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className={cn(
                  'text-xs font-bold uppercase tracking-wider',
                  isLooted ? 'text-emerald-500' : 'text-zinc-500'
                )}>
                  Treasure Index
                </span>
                {isLooted && (
                  <span className="text-[10px] font-bold uppercase text-emerald-500">
                    Found
                  </span>
                )}
              </div>
              <p className={cn(
                'truncate text-sm font-medium',
                isLooted ? 'text-zinc-400 line-through' : 'text-zinc-200'
              )}>
                {isLooted ? treasure.reward : '?????'}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
