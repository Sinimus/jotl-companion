import { JotlDatabase } from './database.ts'

/** Singleton — use this everywhere in the app. */
export const db = new JotlDatabase()

export { JotlDatabase, MIGRATION_NOTE_KEYS, type MetaRow } from './database.ts'
export { DB_VERSION } from './migrations.ts'
export { migrateCampaignRecord, LEGACY_ITEM_COSTS } from './migrate.ts'
export type { MigrationNote, MigrationNoteKind } from './migrate.ts'
export { readPendingMigration } from './pending.ts'
