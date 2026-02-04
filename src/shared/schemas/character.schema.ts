import * as z from 'zod'
import { CharacterTypeSchema, UuidSchema } from './common.schema.ts'

export const CharacterProgressSchema = z.object({
  id: UuidSchema,
  type: CharacterTypeSchema,
  /** Player-given display name (1-50 chars). */
  name: z.string().min(1).max(50),
  /** Current character level (1-9). */
  level: z.number().int().min(1).max(9),
  /** Cumulative experience; never resets. */
  experience: z.number().int().min(0),
  /** Current gold balance. */
  gold: z.number().int().min(0),
  /** Check marks earned via battle goals (0-18; every 3 → 1 perk). */
  checkmarks: z.number().int().min(0).max(18),
  /** IDs of perks taken — references perks.json. */
  perkIds: z.array(z.string()),
  /** IDs of owned items — references items.json. */
  itemIds: z.array(z.number().int()),
  /** IDs of selected ability cards (for optional tracking). */
  selectedAbilityIds: z.array(z.string()),
})

export type CharacterProgress = z.infer<typeof CharacterProgressSchema>
