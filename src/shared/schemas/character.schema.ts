import * as z from 'zod/mini'
import { CharacterTypeSchema, UuidSchema } from './common.schema.ts'

export const CharacterProgressSchema = z.object({
  id: UuidSchema,
  type: CharacterTypeSchema,
  /** Player-given display name (1-50 chars). */
  name: z.string().check(z.minLength(1), z.maxLength(50)),
  /** Cumulative experience; never resets. */
  experience: z.int().check(z.minimum(0)),
  /** Current gold balance. */
  gold: z.int(),
  /** Check marks earned via battle goals (0-18; every 3 → 1 perk). */
  checkmarks: z.int().check(z.minimum(0), z.maximum(18)),
  /** IDs of perks taken — references perks.json. */
  perkIds: z.array(z.string()),
  /** IDs of owned items — references items.json. */
  itemIds: z.array(z.int()),
  /** Items brought into the next scenario — a subset of itemIds. */
  equippedItemIds: z._default(z.array(z.int()), []),
  /** IDs of selected ability cards — references abilities.json. */
  selectedAbilityIds: z.array(z.string()),
  /** Bonus perks earned from scenario rewards or other sources. */
  bonusPerks: z._default(z.int().check(z.minimum(0)), 0),
})

export type CharacterProgress = z.infer<typeof CharacterProgressSchema>
