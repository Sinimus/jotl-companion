import type { CharacterProgress } from '@/shared/schemas'

type Stats = Pick<CharacterProgress, 'id' | 'experience' | 'gold' | 'checkmarks'>

/**
 * The editable stats whose stored value changed between two versions of a character,
 * so the sheet refreshes only those inputs. A save of one field must not reset
 * another field the player is still typing in (S4 finding: gold typed while the
 * experience was being saved fell back to the stored gold). Another character
 * refreshes every field.
 */
export function changedStats(
  previous: Stats | undefined,
  next: Stats
): Partial<Pick<CharacterProgress, 'experience' | 'gold' | 'checkmarks'>> {
  const other = previous?.id !== next.id
  const changes: Partial<Pick<CharacterProgress, 'experience' | 'gold' | 'checkmarks'>> = {}
  if (other || previous.experience !== next.experience) changes.experience = next.experience
  if (other || previous.gold !== next.gold) changes.gold = next.gold
  if (other || previous.checkmarks !== next.checkmarks) changes.checkmarks = next.checkmarks
  return changes
}
