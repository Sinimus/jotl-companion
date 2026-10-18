import Dexie from 'dexie'
import { DB_VERSION } from './migrations.ts'

/**
 * Look into IndexedDB without touching the `db` singleton: is there a
 * version-1 database whose records have not been migrated yet?
 * Returns the raw records so the UI can preview the migration; null when
 * there is nothing to migrate (no database, or already at DB_VERSION).
 */
export async function readPendingMigration(): Promise<{ fromVersion: number; records: unknown[] } | null> {
  if (!(await Dexie.exists('jotl-companion'))) return null

  // Dynamic mode: no version declared, opens whatever is on disk.
  const probe = new Dexie('jotl-companion')
  try {
    await probe.open()
    if (probe.verno >= DB_VERSION) return null
    const records = probe.tables.some((table) => table.name === 'campaigns')
      ? await probe.table('campaigns').toArray()
      : []
    return { fromVersion: probe.verno, records }
  } finally {
    probe.close()
  }
}
