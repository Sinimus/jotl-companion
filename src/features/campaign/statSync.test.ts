import { describe, expect, it } from 'vitest'
import { changedStats } from './statSync'

const axe = { id: 'a', experience: 100, gold: 4, checkmarks: 1 }

describe('changedStats', () => {
  it('refreshes only the experience when only the experience was saved', () => {
    // The gold input keeps what the player is typing.
    expect(changedStats({ ...axe, experience: 0 }, axe)).toEqual({ experience: 100 })
  })

  it('refreshes each field that changed in the store', () => {
    expect(changedStats(axe, { ...axe, gold: 30, checkmarks: 2 })).toEqual({ gold: 30, checkmarks: 2 })
    expect(changedStats(axe, { ...axe })).toEqual({})
  })

  it('refreshes every field for another character or the first render', () => {
    const other = { id: 'b', experience: 100, gold: 4, checkmarks: 1 }
    expect(changedStats(axe, other)).toEqual({ experience: 100, gold: 4, checkmarks: 1 })
    expect(changedStats(undefined, axe)).toEqual({ experience: 100, gold: 4, checkmarks: 1 })
  })
})
