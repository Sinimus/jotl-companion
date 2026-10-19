import { useState } from 'react'

interface MigrationGateProps {
  /** Database version on disk (1 to 3). */
  fromVersion: number
  /** Raw campaign records as they sit in the old database. */
  records: unknown[]
  /** Opens the database, runs the upgrade and continues into the app. */
  onUpdate: () => void
}

/** What the update changes, by the version found on disk. */
function updateSummary(fromVersion: number): string {
  if (fromVersion >= 3) {
    return 'This version remembers the items you sell to the shop: a sold item stays in the shop and can be bought there again, a reward item too. Your campaigns get an empty list of sold items; nothing else changes and nothing is removed. Download a backup first; you can import it again at any time from Settings.'
  }
  if (fromVersion >= 2) {
    return 'This version separates the cards you gained when levelling up from the hand you bring into the next scenario, and keeps a log of recorded scenarios. Ability cards of level 2 and above in your card list are kept as cards gained at level-up; nothing is removed. Download a backup first; you can import it again at any time from Settings.'
  }
  return 'This version fixes the item list, the perks and the ability cards to match the printed game. Your campaigns will be converted: items 37 to 52, which the game does not have, are removed and their full price is refunded; ability cards are stored by card instead of by name. Download a backup first; you can import it again at any time from Settings.'
}

/**
 * Shown before anything touches the `db` singleton when an older database
 * is waiting: the upgrade runs the moment the database opens, so the player
 * is offered a backup of the raw records first.
 */
export function MigrationGate({ fromVersion, records, onUpdate }: MigrationGateProps) {
  const [downloaded, setDownloaded] = useState(false)
  const [skipBackup, setSkipBackup] = useState(false)

  const handleDownload = () => {
    const data = JSON.stringify(records, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `jotl-backup-before-update-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setDownloaded(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-lg rounded-xl border border-zinc-700 bg-zinc-900 p-6">
        <h1 className="text-xl font-bold text-amber-500">Your saved campaigns need an update</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">{updateSummary(fromVersion)}</p>

        <button
          onClick={handleDownload}
          className="mt-5 flex w-full items-center justify-center rounded-lg border border-zinc-600 bg-zinc-700 px-4 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-600"
        >
          {downloaded ? '✓ Backup downloaded' : '⬇ Download backup'}
        </button>

        <label className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
          <input
            type="checkbox"
            checked={skipBackup}
            onChange={(e) => setSkipBackup(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-700 checked:border-amber-500 checked:bg-amber-500"
          />
          I don't need a backup
        </label>

        <button
          onClick={onUpdate}
          disabled={!downloaded && !skipBackup}
          className="mt-5 flex w-full items-center justify-center rounded-lg bg-amber-600 px-4 py-3 text-sm font-bold text-zinc-900 transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Update my campaigns
        </button>
      </div>
    </div>
  )
}
