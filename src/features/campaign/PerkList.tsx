import { perks } from '@/data'
import type { CharacterProgress } from '@/shared/schemas'
import { cn } from '@/shared/lib/utils'

interface PerkListProps {
  character: CharacterProgress
  onToggle: (perkId: string, isSelected: boolean) => void
}

export function PerkList({ character, onToggle }: PerkListProps) {
  // Filter perks for this character class
  const characterPerks = perks.filter((p) => p.characterId === character.type)

  // Calculate available perk points
  const levelPerks = character.level - 1
  const checkmarkPerks = Math.floor(character.checkmarks / 3)
  const totalEarned = levelPerks + checkmarkPerks
  const spent = character.perkIds.length
  const available = totalEarned - spent

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-zinc-300">Perks</h3>
        <span className="text-xs text-zinc-500">
          Available: <span className={cn(available > 0 ? 'text-emerald-400' : 'text-zinc-400')}>{available}</span>
          {' '}/ Total: {totalEarned}
        </span>
      </div>

      <div className="space-y-2">
        {characterPerks.map((perk) => {
          const isSelected = character.perkIds.includes(perk.id)
          const isDisabled = !isSelected && available <= 0

          return (
            <label
              key={perk.id}
              className={cn(
                'flex items-start gap-3 rounded-md border px-3 py-2 transition-colors',
                isSelected
                  ? 'border-amber-500/50 bg-amber-500/10'
                  : 'border-zinc-700 hover:border-zinc-600',
                isDisabled && 'cursor-not-allowed opacity-50'
              )}
            >
              <input
                type="checkbox"
                checked={isSelected}
                disabled={isDisabled}
                onChange={(e) => onToggle(perk.id, e.target.checked)}
                className={cn(
                  'mt-0.5 h-4 w-4 rounded border-zinc-600 bg-zinc-700',
                  'focus:ring-2 focus:ring-amber-500 focus:ring-offset-0 focus:ring-offset-zinc-900',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  'checked:bg-amber-500 checked:border-amber-500'
                )}
              />
              <span
                className={cn(
                  'text-sm leading-snug',
                  isSelected ? 'text-amber-200' : 'text-zinc-300',
                  isDisabled && 'text-zinc-500'
                )}
              >
                {perk.description}
              </span>
            </label>
          )
        })}
      </div>

      {characterPerks.length === 0 && (
        <p className="text-sm text-zinc-500">No perks available for this character class.</p>
      )}
    </div>
  )
}
