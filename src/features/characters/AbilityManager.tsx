import { useState } from 'react'
import { type CharacterProgress } from '@/shared/schemas'
import { abilities } from '@/data'
import { cn } from '@/shared/lib/utils'

interface AbilityManagerProps {
  character: CharacterProgress
  onUpdateAbilities: (abilityIds: string[]) => void
}

export function AbilityManager({ character, onUpdateAbilities }: AbilityManagerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const charAbilities = (abilities as Record<string, Record<string, string[]>>)[character.type] || {}

  const toggleAbility = (abilityId: string) => {
    const current = new Set(character.selectedAbilityIds)
    if (current.has(abilityId)) {
      current.delete(abilityId)
    } else {
      current.add(abilityId)
    }
    onUpdateAbilities(Array.from(current))
  }

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-left transition-colors hover:border-zinc-700"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-300">Ability Cards</h3>
            <p className="text-xs text-zinc-500">
              {character.selectedAbilityIds.length} cards selected
            </p>
          </div>
          <span className="text-zinc-500">→</span>
        </div>
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-zinc-300">Manage Ability Deck</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-xs font-medium text-amber-500 hover:underline"
        >
          Close
        </button>
      </div>

      <div className="space-y-6">
        {Object.entries(charAbilities).map(([level, cards]) => (
          <div key={level}>
            <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Level {level}
            </h4>
            <div className="flex flex-wrap gap-2">
              {cards.map((cardName) => {
                const isSelected = character.selectedAbilityIds.includes(cardName)
                return (
                  <button
                    key={cardName}
                    onClick={() => toggleAbility(cardName)}
                    className={cn(
                      'rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
                      isSelected
                        ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                        : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
                    )}
                  >
                    {cardName}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-[10px] italic text-zinc-600">
        Note: This is for optional tracking of your card choices at level up.
      </p>
    </div>
  )
}
