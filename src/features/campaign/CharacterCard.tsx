import { useState } from 'react'
import { type CharacterProgress } from '@/shared/schemas'
import { characters } from '@/data'
import { computeLevelFromXp } from './rules'

interface CharacterCardProps {
  character: CharacterProgress
  /** Navigate to the character detail page */
  onSelect: () => void
  onDelete: () => void
}

export function CharacterCard({ character, onSelect, onDelete }: CharacterCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Static character definition — name, race, HP table.
  // hitPoints keys are literal "1"-"9" strings in the JSON; cast to generic Record for dynamic lookup.
  const charDef = characters.find((c) => c.id === character.type)
  const computedLevel = computeLevelFromXp(character.experience)
  const maxHp = (charDef?.hitPoints as Record<string, number>)?.[String(computedLevel)] ?? 0

  return (
    <div
      onClick={onSelect}
      className="cursor-pointer rounded-lg border border-zinc-700 bg-zinc-800 p-4 transition-colors hover:border-zinc-500"
    >
      {/* Header: type badge + player name + delete control */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs font-medium text-amber-400">
            {charDef?.name ?? character.type}
          </span>
          <h3 className="text-lg font-semibold text-zinc-100">{character.name}</h3>
        </div>

        {/* stopPropagation — delete click must not navigate to detail */}
        <div onClick={(e) => e.stopPropagation()}>
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
              className="text-zinc-500 hover:text-red-400 transition-colors"
              aria-label={`Remove ${character.name}`}
            >
              ×
            </button>
          )}
        </div>
      </div>

      <p className="mt-1 text-sm text-zinc-500">
        {charDef?.race} &bull; {charDef?.role}
      </p>

      {/* Stats row */}
      <p className="mt-1.5 text-sm text-zinc-400">
        Lv {computedLevel} &bull; HP {maxHp} &bull; {character.gold}g &bull; {character.itemIds.length} items
      </p>
    </div>
  )
}
