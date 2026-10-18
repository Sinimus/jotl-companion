import { useState } from 'react'
import { type CharacterProgress } from '@/shared/schemas'
import { type AbilityLevel } from '@/data'
import { abilityCardsFor, abilityWarnings, computeLevelFromXp, handLimitFor } from '@/features/campaign/rules'
import { cn } from '@/shared/lib/utils'

interface AbilityManagerProps {
  character: CharacterProgress
  onUpdateAbilities: (abilityIds: string[]) => void
}

// A and B are the starting-hand alternatives (scenarios 1-3, LtP p.3, p.13),
// X replaces a level 1 card once battle goals start (from scenario 4, LtP p.27).
const CARD_GROUPS: { heading: string; levels: AbilityLevel[] }[] = [
  { heading: 'Starting cards A/B (scenarios 1–3, LtP p.3, p.13)', levels: ['A', 'B'] },
  { heading: 'Level 1', levels: ['1'] },
  { heading: 'Level X (from scenario 4, LtP p.27)', levels: ['X'] },
  { heading: 'Level 2', levels: ['2'] },
  { heading: 'Level 3', levels: ['3'] },
  { heading: 'Level 4', levels: ['4'] },
  { heading: 'Level 5', levels: ['5'] },
  { heading: 'Level 6', levels: ['6'] },
  { heading: 'Level 7', levels: ['7'] },
  { heading: 'Level 8', levels: ['8'] },
  { heading: 'Level 9', levels: ['9'] },
]

/** Numeric level of a card; A, B, X and level 1 have none above the start. */
function numericLevel(level: AbilityLevel): number | null {
  const parsed = Number.parseInt(level, 10)
  return Number.isInteger(parsed) ? parsed : null
}

export function AbilityManager({ character, onUpdateAbilities }: AbilityManagerProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const cards = abilityCardsFor(character.type)
  const handLimit = handLimitFor(character.type)
  const characterLevel = computeLevelFromXp(character.experience)
  const warnings = abilityWarnings({
    type: character.type,
    experience: character.experience,
    selectedAbilityIds: character.selectedAbilityIds,
  })
  const tooHighIds = new Set(warnings.tooHighLevel)

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
              Selected {character.selectedAbilityIds.length} / hand limit {handLimit}
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

      <p className="mb-4 text-xs text-zinc-400">
        Selected {character.selectedAbilityIds.length} / hand limit {handLimit}
        {warnings.overHandLimit && (
          <span className="ml-2 font-bold text-red-400">More cards than the hand limit</span>
        )}
      </p>

      <div className="space-y-6">
        {CARD_GROUPS.map((group) => {
          const groupCards = cards.filter((card) => group.levels.includes(card.level))
          if (groupCards.length === 0) return null
          return (
            <div key={group.heading}>
              <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                {group.heading}
              </h4>
              <div className="flex flex-wrap gap-2">
                {groupCards.map((card) => {
                  const isSelected = character.selectedAbilityIds.includes(card.id)
                  const isTooHigh = tooHighIds.has(card.id)
                  const cardLevel = numericLevel(card.level)
                  const isAboveLevel = cardLevel !== null && cardLevel > characterLevel
                  return (
                    <button
                      key={card.id}
                      onClick={() => toggleAbility(card.id)}
                      title={isAboveLevel ? `Above level ${characterLevel}` : undefined}
                      className={cn(
                        'rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
                        isTooHigh
                          ? 'border-red-500/60 bg-red-500/10 text-red-400'
                          : isSelected
                            ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                            : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600',
                        isAboveLevel && !isTooHigh && 'opacity-50'
                      )}
                    >
                      {card.name}
                      <span className="ml-1.5 text-[10px] text-zinc-500">{card.initiative}</span>
                      {isTooHigh && <span className="ml-1.5 text-[10px] font-bold uppercase">Level too high</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <p className="mt-6 text-[10px] italic text-zinc-600">
        Card levels and initiatives: GHS (community data). The hand limit is printed on the character mat.
      </p>
    </div>
  )
}
