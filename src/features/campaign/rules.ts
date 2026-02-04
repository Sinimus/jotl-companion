import { tables, scenarios } from '@/data'

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
  currentStatus: Record<number, 'locked' | 'unlocked' | 'completed'>,
  completedScenarioId: number
): number[] {
  const scenarioDef = scenarios.find((s) => s.id === completedScenarioId)
  if (!scenarioDef || !scenarioDef.unlocks) {
    return []
  }

  // Only return scenarios that are currently locked
  return scenarioDef.unlocks.filter((id) => currentStatus[id] === 'locked')
}
