import { tables, scenarios, items, type ItemSlot } from '@/data'
import type { ScenarioStatus } from '@/shared/schemas'

/**
 * Derive character level from cumulative experience.
 * Based on the Jaws of the Lion level-threshold table.
 */
export function computeLevelFromXp(experience: number): number {
  const thresholds = tables.levelThresholds as Record<string, number>
  for (let level = 9; level >= 1; level--) {
    if (experience >= thresholds[String(level)]) {
      return level
    }
  }
  return 1
}

/**
 * Determine which scenarios should be unlocked after completing a scenario.
 * Returns an array of scenario IDs.
 */
export function getUnlockedScenarios(
  currentStatus: Record<number, ScenarioStatus>,
  completedScenarioId: number
): number[] {
  const scenarioDef = scenarios.find((s) => s.id === completedScenarioId)
  if (!scenarioDef || !scenarioDef.unlocks) {
    return []
  }

  // Only return scenarios that are currently locked
  return scenarioDef.unlocks.filter((id) => currentStatus[id] === 'locked')
}

/**
 * Per-slot equip limits at a character level (Glossary p.11):
 * head 1, body 1, feet 1, hand 2, small ceil(level / 2).
 */
export function itemSlotLimits(level: number): Record<ItemSlot, number> {
  return {
    head: 1,
    body: 1,
    feet: 1,
    hand: 2,
    small: Math.ceil(level / 2),
  }
}

/**
 * Check a list of item IDs against the equip limits for a level.
 * Returns the slots whose item count is over the limit.
 */
export function equipmentViolations(itemIds: number[], level: number): ItemSlot[] {
  const limits = itemSlotLimits(level)
  const counts: Record<ItemSlot, number> = { head: 0, body: 0, feet: 0, hand: 0, small: 0 }
  for (const id of itemIds) {
    const item = items.find((i) => i.id === id)
    if (item) counts[item.slot] += 1
  }
  const slots: ItemSlot[] = ['head', 'body', 'feet', 'hand', 'small']
  return slots.filter((slot) => counts[slot] > limits[slot])
}
