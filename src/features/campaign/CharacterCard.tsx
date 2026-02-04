import { useState } from 'react'
import { type CharacterProgress } from '@/shared/schemas'
import { characters } from '@/data'

interface CharacterCardProps {
  character: CharacterProgress
  onDelete: () => void
}

export function CharacterCard({ character, onDelete }: CharacterCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Static character definition — name, race, HP table.
  // hitPoints keys are literal "1"-"9" strings in the JSON; cast to generic Record for dynamic lookup.
  const charDef = characters.find((c) => c.id === character.type)
  const maxHp = (charDef?.hitPoints as Record<string, number>)?.[String(character.level)] ?? 0

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-4">
      {/* Header: type badge + player name + delete control */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs font-medium text-amber-400">
            {charDef?.name ?? character.type}
          </span>
          <h3 className="text-lg font-semibold text-zinc-100">{character.name}</h3>
        </div>

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
            className="shrink-0 text-zinc-500 hover:text-red-400 transition-colors"
            aria-label={`Remove ${character.name}`}
          >
            ×
          </button>
        )}
      </div>

      {/* Stats row */}
      <p className="mt-2 text-sm text-zinc-400">
        Level {character.level} &bull; HP {maxHp}
      </p>
    </div>
  )
}
