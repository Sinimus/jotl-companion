import { describe, expect, it } from 'vitest'
import { computeLevelFromXp } from './rules'

// Level thresholds are printed under the levels on the character sheet and
// repeated in the Learn to Play Guide (p. 29): 0, 45, 95, 150, 210, 275, 345, 420, 500.
describe('computeLevelFromXp', () => {
  it('starts at level 1 with no experience', () => {
    expect(computeLevelFromXp(0)).toBe(1)
  })

  it('stays at level 1 one point below the level 2 threshold', () => {
    expect(computeLevelFromXp(44)).toBe(1)
  })

  it('reaches level 2 at exactly 45 experience', () => {
    expect(computeLevelFromXp(45)).toBe(2)
  })

  it('reaches level 9 at exactly 500 experience', () => {
    expect(computeLevelFromXp(500)).toBe(9)
  })

  it('does not go above level 9', () => {
    expect(computeLevelFromXp(10_000)).toBe(9)
  })

  it.each([
    [94, 2],
    [95, 3],
    [149, 3],
    [150, 4],
    [209, 4],
    [210, 5],
    [274, 5],
    [275, 6],
    [344, 6],
    [345, 7],
    [419, 7],
    [420, 8],
    [499, 8],
  ])('maps %i experience to level %i', (experience, level) => {
    expect(computeLevelFromXp(experience)).toBe(level)
  })
})
