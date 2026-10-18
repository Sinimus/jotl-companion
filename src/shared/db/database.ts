import Dexie, { type EntityTable } from 'dexie'
import { type Campaign } from '../schemas/index.ts'
import { DB_VERSION } from './migrations.ts'
import { migrateCampaignRecord, type MigrationNote } from './migrate.ts'

/** Row of the `meta` table — bookkeeping written by database upgrades. */
export interface MetaRow {
  key: string
  notes: MigrationNote[]
  migratedAt: string
}

/**
 * Dexie database class for JotL companion.
 *
 * Table layout (v2):
 *   campaigns — primary key `id` (uuid string)
 *                 secondary indices: name, updatedAt
 *   meta      — primary key `key`; notes of the last content migration
 *
 * Campaign objects are stored whole (embedded characters, scenarioStatus, etc.)
 * because the dataset is small (single campaign at a time) and this avoids
 * normalised-relational complexity for no measurable gain.
 */
export class JotlDatabase extends Dexie {
  campaigns!: EntityTable<Campaign, 'id'>
  meta!: EntityTable<MetaRow, 'key'>

  constructor() {
    super('jotl-companion')

    // v1 — initial table set.
    this.version(1).stores({
      campaigns: 'id, name, updatedAt',
    })

    // v2 — S3 content migration of stored campaigns, notes kept in `meta`.
    this.version(DB_VERSION)
      .stores({
        campaigns: 'id, name, updatedAt',
        meta: 'key',
      })
      .upgrade(async (tx) => {
        const notes: MigrationNote[] = []
        await tx
          .table('campaigns')
          .toCollection()
          .modify((row: unknown, ctx: { value: unknown }) => {
            const { record, notes: rowNotes } = migrateCampaignRecord(row)
            notes.push(...rowNotes)
            ctx.value = record
          })
        if (notes.length > 0) {
          await tx.table('meta').put({
            key: 'migration-v2',
            notes,
            migratedAt: new Date().toISOString(),
          })
        }
      })
  }
}
