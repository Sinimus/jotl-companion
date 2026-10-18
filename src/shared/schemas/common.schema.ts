import * as z from 'zod/mini'

// ---------------------------------------------------------------------------
// Enums — IDs must stay in sync with src/data/characters.json
// ---------------------------------------------------------------------------

export const CharacterTypeSchema = z.enum([
  'demolitionist',
  'red_guard',
  'hatchet',
  'voidwarden',
])

export const ScenarioStatusSchema = z.enum([
  'locked',
  'unlocked',
  'completed',
  // A scenario the campaign can no longer play because an alternative
  // branch was completed (Glossary p.18 "Closed Scenario").
  'closed',
])

export type ScenarioStatus = z.infer<typeof ScenarioStatusSchema>

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export const UuidSchema = z.uuid()

/** Accepts Date objects or ISO-string representations and coerces to Date. */
export const TimestampSchema = z.coerce.date()
