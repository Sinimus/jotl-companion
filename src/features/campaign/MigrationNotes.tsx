import type { MigrationNote } from '@/shared/db'

interface MigrationNotesProps {
  notes: MigrationNote[]
}

/**
 * Migration notes grouped by campaign and character: the campaign as a
 * heading, one block per character (or the campaign itself) with the
 * `detail` line of every change.
 */
export function MigrationNotes({ notes }: MigrationNotesProps) {
  const grouped = new Map<string, Map<string | null, string[]>>()
  for (const note of notes) {
    let characters = grouped.get(note.campaignName)
    if (!characters) {
      characters = new Map()
      grouped.set(note.campaignName, characters)
    }
    const details = characters.get(note.characterName) ?? []
    details.push(note.detail)
    characters.set(note.characterName, details)
  }

  return (
    <div className="space-y-3">
      {[...grouped.entries()].map(([campaignName, characters]) => (
        <div key={campaignName} className="rounded-md border border-zinc-700/50 bg-black/20 p-3">
          <p className="text-sm font-semibold text-zinc-200">{campaignName}</p>
          {[...characters.entries()].map(([characterName, details]) => (
            <div key={characterName ?? 'campaign'} className="mt-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                {characterName ?? 'Campaign'}
              </p>
              <ul className="mt-0.5 list-disc space-y-0.5 pl-4">
                {details.map((detail, index) => (
                  <li key={index} className="text-xs text-zinc-400">
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
