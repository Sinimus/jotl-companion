import { useState } from 'react'
import { characters } from '@/data'
import { type CreateCharacter } from './store'

interface CharacterFormProps {
  /** Disable the entire form when the party already has 4 characters. */
  disabled: boolean
  onAdd: (input: CreateCharacter) => Promise<void>
}

export function CharacterForm({ disabled, onAdd }: CharacterFormProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  // ---------------------------------------------------------------------------
  if (disabled) {
    return <p className="text-sm text-zinc-500">Party is full (4/4)</p>
  }
  // ---------------------------------------------------------------------------

  const handleAdd = async () => {
    if (!selectedType || !name.trim()) return
    try {
      await onAdd({ type: selectedType as CreateCharacter['type'], name: name.trim() })
      setSelectedType(null)
      setName('')
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add character')
    }
  }

  return (
    <div>
      {/* Type selector — 4 buttons, one per character class */}
      <div className="mb-3 flex flex-wrap gap-2">
        {characters.map((char) => (
          <button
            key={char.id}
            onClick={() => setSelectedType(char.id)}
            className={[
              'rounded-lg border px-3 py-2 text-sm transition-colors',
              selectedType === char.id
                ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                : 'border-zinc-700 text-zinc-300 hover:border-zinc-500',
            ].join(' ')}
          >
            <span className="font-medium">{char.name}</span>
            <span className="ml-1 text-zinc-500">({char.race})</span>
          </button>
        ))}
      </div>

      {/* Name input + submit */}
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Character name…"
          maxLength={50}
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
        />
        <button
          disabled={!selectedType || !name.trim()}
          onClick={handleAdd}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-zinc-900 disabled:opacity-40 hover:bg-amber-500"
        >
          Add Character
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  )
}
