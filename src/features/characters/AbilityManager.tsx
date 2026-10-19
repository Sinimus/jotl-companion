import { useState } from 'react'
import { type CharacterProgress } from '@/shared/schemas'
import { type AbilityCard, type AbilityLevel } from '@/data'
import { abilityCardsFor, computeLevelFromXp } from '@/features/campaign/rules'
import { canUnlockCard, cardLevel, cardPool, handCheck, levelUpPicks } from '@/features/campaign/progression'
import { cn } from '@/shared/lib/utils'

interface AbilityManagerProps {
  character: CharacterProgress
  /** Learning stage of the campaign: how many of scenarios 1-5 are completed. */
  stage: number
  onSetHand: (abilityIds: string[]) => void
  onUnlock: (abilityId: string) => void
  onRemoveUnlocked: (abilityId: string) => void
}

const GROUP_LABEL: Partial<Record<AbilityLevel, string>> = {
  A: 'Level A',
  B: 'Level B',
  '1': 'Level 1',
  X: 'Level X',
}

/** Cards grouped by level in pool order: A, B, 1, X, then 2-9. */
function groupByLevel(cards: AbilityCard[]): { level: AbilityLevel; cards: AbilityCard[] }[] {
  const groups: { level: AbilityLevel; cards: AbilityCard[] }[] = []
  for (const card of cards) {
    const last = groups[groups.length - 1]
    if (last?.level === card.level) last.cards.push(card)
    else groups.push({ level: card.level, cards: [card] })
  }
  return groups
}

const chipClass = 'min-h-11 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors'

/**
 * The hand for the next scenario, chosen from the card pool of the learning
 * stage within the hand size (LtP p.27), and the cards gained at level-up,
 * one per level of up to that level (LtP p.29).
 */
export function AbilityManager({ character, stage, onSetHand, onUnlock, onRemoveUnlocked }: AbilityManagerProps) {
  const picks = levelUpPicks(character)
  const check = handCheck(character, stage)
  // Open by itself when something waits: a level-up pick or a hand to fix.
  const [isExpanded, setIsExpanded] = useState(
    picks.pending > 0 || check.overLimit || check.notInPool.length > 0
  )

  const pool = cardPool(character.type, stage, character.unlockedAbilityIds)
  const level = computeLevelFromXp(character.experience)
  const selected = new Set(character.selectedAbilityIds)
  const full = check.selected >= check.size

  const toggle = (id: string) => {
    if (selected.has(id)) onSetHand(character.selectedAbilityIds.filter((cardId) => cardId !== id))
    else if (!full) onSetHand([...character.selectedAbilityIds, id])
  }

  const summary = `Hand ${check.selected} / ${check.size}`

  if (!isExpanded) {
    return (
      <button
        type="button"
        aria-expanded="false"
        onClick={() => setIsExpanded(true)}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-left transition-colors hover:border-zinc-700"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-300">Ability Cards</h3>
            <p className="text-xs text-zinc-400">
              {summary}
              {picks.pending > 0 && (
                <span className="ml-2 font-semibold text-amber-400">
                  {picks.pending} level-up card{picks.pending > 1 ? 's' : ''} to choose
                </span>
              )}
            </p>
          </div>
          <span className="text-zinc-400">→</span>
        </div>
      </button>
    )
  }

  const levelUpCards = abilityCardsFor(character.type).filter((card) => (cardLevel(card) ?? 0) >= 2)

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-zinc-300">Ability Cards</h3>
        <button
          type="button"
          aria-expanded="true"
          onClick={() => setIsExpanded(false)}
          className="min-h-11 px-2 text-xs font-medium text-amber-400 hover:underline"
        >
          Close
        </button>
      </div>

      <section aria-labelledby="hand-heading">
        <div className="flex items-baseline justify-between gap-2">
          <h4 id="hand-heading" className="text-sm font-semibold text-zinc-200">
            Hand for the next scenario
          </h4>
          <span className={cn('text-xs font-semibold', check.overLimit ? 'text-red-400' : 'text-zinc-300')}>
            {summary}
          </span>
        </div>
        <p className="mt-1 text-xs text-zinc-400">
          {stage >= 3
            ? 'Bring up to your hand limit; the rest stays in the box (Learn to Play p.27).'
            : `In the learning scenarios every character brings ${check.size} cards (Learn to Play p.3, p.13, p.19).`}
        </p>
        {check.overLimit && (
          <p className="mt-2 text-xs font-semibold text-red-400">More cards than the hand allows: remove {check.selected - check.size}.</p>
        )}
        {check.notInPool.length > 0 && (
          <div className="mt-2 rounded-md border border-red-500/40 bg-red-500/5 p-2 text-xs text-red-300">
            <p>Not available at this point of the campaign:</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {check.notInPool.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSetHand(character.selectedAbilityIds.filter((cardId) => cardId !== id))}
                  className={cn(chipClass, 'border-red-500/60 text-red-300')}
                >
                  Remove {abilityCardsFor(character.type).find((card) => card.id === id)?.name ?? id}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 space-y-4">
          {groupByLevel(pool).map((group) => (
            <div key={group.level}>
              <h5 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                {GROUP_LABEL[group.level] ?? `Level ${group.level} (gained)`}
              </h5>
              <div className="flex flex-wrap gap-2">
                {group.cards.map((card) => {
                  const isSelected = selected.has(card.id)
                  const blocked = !isSelected && full
                  return (
                    <button
                      key={card.id}
                      type="button"
                      aria-pressed={isSelected}
                      aria-disabled={blocked}
                      onClick={() => toggle(card.id)}
                      className={cn(
                        chipClass,
                        isSelected
                          ? 'border-amber-500/60 bg-amber-500/10 text-amber-300'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500',
                        blocked && 'cursor-not-allowed'
                      )}
                    >
                      {card.name}
                      <span className="ml-1.5 text-[11px] text-zinc-400">{card.initiative}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        {check.selected > 0 && (
          <button
            type="button"
            onClick={() => onSetHand([])}
            className="mt-3 min-h-11 text-xs font-medium text-zinc-400 hover:text-zinc-200"
          >
            Clear hand
          </button>
        )}
      </section>

      {(level >= 2 || character.unlockedAbilityIds.length > 0) && (
        <section aria-labelledby="levelup-heading" className="mt-6 border-t border-zinc-800 pt-4">
          <div className="flex items-baseline justify-between gap-2">
            <h4 id="levelup-heading" className="text-sm font-semibold text-zinc-200">
              Cards gained at level-up
            </h4>
            <span className="text-xs font-semibold text-zinc-300">
              {picks.used} / {picks.allowed}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            One card per level gained, of that level or lower (Learn to Play p.29). Level {level}.
          </p>
          {!picks.valid && (
            <p className="mt-2 text-xs font-semibold text-red-400">
              These cards do not fit level {level}: one card per level, each up to the level it was gained at.
            </p>
          )}
          <div className="mt-3 space-y-4">
            {groupByLevel(levelUpCards.filter((card) => (cardLevel(card) ?? 0) <= level || character.unlockedAbilityIds.includes(card.id))).map(
              (group) => (
                <div key={group.level}>
                  <h5 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400">Level {group.level}</h5>
                  <div className="flex flex-wrap gap-2">
                    {group.cards.map((card) => {
                      const gained = character.unlockedAbilityIds.includes(card.id)
                      const allowed = gained || canUnlockCard(character, card.id)
                      return (
                        <button
                          key={card.id}
                          type="button"
                          aria-pressed={gained}
                          aria-disabled={!allowed}
                          onClick={() => {
                            if (gained) onRemoveUnlocked(card.id)
                            else if (allowed) onUnlock(card.id)
                          }}
                          className={cn(
                            chipClass,
                            gained
                              ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
                              : allowed
                                ? 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500'
                                : 'cursor-not-allowed border-zinc-800 bg-zinc-900 text-zinc-400'
                          )}
                        >
                          {card.name}
                          <span className="ml-1.5 text-[11px] text-zinc-400">{card.initiative}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            )}
          </div>
        </section>
      )}

      <p className="mt-6 text-[11px] italic text-zinc-400">
        Card levels and initiatives: GHS (community data). The hand limit is printed on the character mat.
      </p>
    </div>
  )
}
