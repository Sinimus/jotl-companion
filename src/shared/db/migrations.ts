// ---------------------------------------------------------------------------
// Database version history.
// Bump DB_VERSION and add upgrade logic in database.ts whenever the schema
// stored in IndexedDB changes in an incompatible way.
//
//   v1 — initial table set (campaigns).
//   v2 — content migration of S3: legacy items 37-52 refunded and removed,
//        red_guard_7 split into 7a/7b, ability names mapped to card ids,
//        alternative scenarios closed.  Notes land in the new `meta` table.
//   v3 — S5: level 2+ cards of the card list become `unlockedAbilityIds`
//        (gained at level-up), the list itself stays the hand; empty
//        `scenarioLog` on every campaign.
//   v4 — S6: empty `soldItemIds` on every campaign (items sold to the shop
//        stay in it, Glossary p.19).  Nothing else changes.
// ---------------------------------------------------------------------------

/** Current Dexie schema version. */
export const DB_VERSION = 4
