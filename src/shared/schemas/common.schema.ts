import * as z from 'zod'

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
])

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export const UuidSchema = z.string().uuid()

/** Accepts Date objects or ISO-string representations and coerces to Date. */
export const TimestampSchema = z.coerce.date()
