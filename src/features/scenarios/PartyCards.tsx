import { characters } from '@/data'
import { cardChangesAfter } from '@/features/campaign/learning'
import type { CharacterProgress } from '@/shared/schemas'

/** The card changes after this scenario, named for each character of the party. */
export function PartyCards({ id, party }: { id: number; party: CharacterProgress[] }) {
  const rows = party
    .map((character) => ({ character, change: cardChangesAfter(id, character.type) }))
    .filter(({ change }) => change.added.length > 0 || change.removed.length > 0)
  if (rows.length === 0) return null

  return (
    <div className="mt-3 space-y-2 rounded-md border border-zinc-700/60 bg-zinc-900/60 p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Your party's cards</h3>
      {rows.map(({ character, change }) => (
        <div key={character.id} className="text-sm leading-snug">
          <p className="font-medium text-zinc-200">
            {character.name}
            <span className="font-normal text-zinc-400">
              {' '}
              · {characters.find((c) => c.id === character.type)?.name}
            </span>
          </p>
          {change.added.length > 0 && (
            <p className="text-zinc-300">
              <span className="text-emerald-400">Add:</span> {change.added.map((card) => `${card.name} (${card.level})`).join(', ')}
            </p>
          )}
          {change.removed.length > 0 && (
            <p className="text-zinc-300">
              <span className="text-red-400">Set aside:</span>{' '}
              {change.removed.map((card) => `${card.name} (${card.level})`).join(', ')}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
