import { JotlDatabase } from './database.ts'

/** Singleton — use this everywhere in the app. */
export const db = new JotlDatabase()

export { JotlDatabase } from './database.ts'
export { DB_VERSION } from './migrations.ts'
