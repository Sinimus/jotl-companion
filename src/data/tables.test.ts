import { describe, expect, it } from 'vitest'
import { tables } from '@/data'

// The tables below are the chart on p. 29 of the Learn to Play Guide.
describe('tables.json', () => {
  it('has the level thresholds of the character sheet', () => {
    expect(tables.levelThresholds).toEqual({
      '1': 0,
      '2': 45,
      '3': 95,
      '4': 150,
      '5': 210,
      '6': 275,
      '7': 345,
      '8': 420,
      '9': 500,
    })
  })

  it('has strictly increasing level thresholds', () => {
    const values = Object.keys(tables.levelThresholds)
      .map(Number)
      .sort((a, b) => a - b)
      .map((level) => tables.levelThresholds[String(level)])
    values.forEach((value, index) => {
      if (index > 0) expect(value).toBeGreaterThan(values[index - 1])
    })
  })

  it('has the scenario level chart for levels 0 to 7', () => {
    expect(tables.scenarioLevelTable).toEqual([
      { level: 0, trapDamage: 2, goldConversion: 2, bonusXp: 4 },
      { level: 1, trapDamage: 3, goldConversion: 2, bonusXp: 6 },
      { level: 2, trapDamage: 4, goldConversion: 3, bonusXp: 8 },
      { level: 3, trapDamage: 5, goldConversion: 3, bonusXp: 10 },
      { level: 4, trapDamage: 6, goldConversion: 4, bonusXp: 12 },
      { level: 5, trapDamage: 7, goldConversion: 4, bonusXp: 14 },
      { level: 6, trapDamage: 8, goldConversion: 5, bonusXp: 16 },
      { level: 7, trapDamage: 9, goldConversion: 6, bonusXp: 18 },
    ])
  })
})
