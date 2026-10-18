// ---------------------------------------------------------------------------
// Database version history.
// Bump DB_VERSION and add upgrade logic in database.ts whenever the schema
// stored in IndexedDB changes in an incompatible way.
//
//   v1 — initial table set (campaigns).
//   v2 — content migration of S3: legacy items 37-52 refunded and removed,
//        red_guard_7 split into 7a/7b, ability names mapped to card ids,
//        alternative scenarios closed.  Notes land in the new `meta` table.
// ---------------------------------------------------------------------------

/** Current Dexie schema version. */
export const DB_VERSION = 2
