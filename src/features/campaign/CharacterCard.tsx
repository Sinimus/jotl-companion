import { useState } from 'react'
import { Link } from 'react-router-dom'
import { type CharacterProgress } from '@/shared/schemas'
import { characters } from '@/data'
import { computeLevelFromXp } from './rules'

interface CharacterCardProps {
  character: CharacterProgress
  /** Address of the character detail page */
  to: string
  onDelete: () => void
}

export function CharacterCard({ character, to, onDelete }: CharacterCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Static character definition — name, race, HP table.
  // hitPoints keys are literal "1"-"9" strings in the JSON; cast to generic Record for dynamic lookup.
  const charDef = characters.find((c) => c.id === character.type)
  const computedLevel = computeLevelFromXp(character.experience)
  const maxHp = (charDef?.hitPoints as Record<string, number>)?.[String(computedLevel)] ?? 0

  return (
    <div className="relative rounded-lg border border-zinc-700 bg-zinc-800 transition-colors focus-within:border-zinc-500 hover:border-zinc-500">
      {/* The whole card is one link; the remove control sits beside it, not inside it. */}
      <Link
        to={to}
        className="block rounded-lg p-4 pr-24 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
      >
        <span className="block text-xs font-medium text-amber-400">
          {charDef?.name ?? character.type}
        </span>
        <span className="block text-lg font-semibold text-zinc-100">{character.name}</span>
        <span className="mt-1 block text-sm text-zinc-400">{charDef?.race}</span>
        {/* Stats row */}
        <span className="mt-1.5 block text-sm text-zinc-400">
          Lv {computedLevel} &bull; HP {maxHp} &bull; {character.gold}g &bull; {character.itemIds.length} items
        </span>
      </Link>

      <div className="absolute right-1 top-1">
        {confirmDelete ? (
          <div className="flex shrink-0">
            <button
              type="button"
              onClick={onDelete}
              className="min-h-11 px-2 text-xs text-red-400 hover:text-red-300"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="min-h-11 px-2 text-xs text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex h-11 w-11 items-center justify-center text-xl text-zinc-400 transition-colors hover:text-red-400"
            aria-label={`Remove ${character.name}`}
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}
