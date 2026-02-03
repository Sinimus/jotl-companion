import Dexie, { type EntityTable } from 'dexie'
import { type Campaign } from '../schemas/index.ts'
import { DB_VERSION } from './migrations.ts'

/**
 * Dexie database class for JotL companion.
 *
 * Table layout (v1):
 *   campaigns — primary key `id` (uuid string)
 *                secondary indices: name, updatedAt
 *
 * Campaign objects are stored whole (embedded characters, scenarioStatus, etc.)
 * because the dataset is small (single campaign at a time) and this avoids
 * normalised-relational complexity for no measurable gain.
 */
export class JotlDatabase extends Dexie {
  campaigns!: EntityTable<Campaign, 'id'>

  constructor() {
    super('jotl-companion')

    this.version(DB_VERSION).stores({
      campaigns: 'id, name, updatedAt',
    })
  }
}
