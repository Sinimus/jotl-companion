import { describe, expect, it } from 'vitest'
import { CampaignSchema, CharacterProgressSchema, CreateCampaignSchema } from './index.ts'

const ID = '6f1c2f3e-5a6b-4c7d-8e9f-0a1b2c3d4e5f'

const character = {
  id: '11111111-2222-4333-8444-555555555555',
  type: 'hatchet',
  name: 'Hatchet',
  experience: 0,
  gold: 0,
  checkmarks: 0,
  perkIds: [],
  itemIds: [],
  selectedAbilityIds: [],
}

const campaign = {
  id: ID,
  name: 'Friday group',
  createdAt: '2026-04-01T10:00:00.000Z',
  updatedAt: new Date('2026-04-02T10:00:00.000Z'),
  characters: [character],
  scenarioStatus: { '1': 'unlocked', '25': 'locked' },
  cityEventsDrawn: [],
  lootedTreasureIds: [],
}

describe('CampaignSchema', () => {
  it('coerces timestamps and numeric scenario keys', () => {
    const parsed = CampaignSchema.parse(campaign)
    expect(parsed.createdAt).toEqual(new Date('2026-04-01T10:00:00.000Z'))
    expect(parsed.scenarioStatus).toEqual({ 1: 'unlocked', 25: 'locked' })
  })

  it.each([
    ['an empty name', { name: '' }],
    ['a name over 100 characters', { name: 'x'.repeat(101) }],
    ['an id that is not a uuid', { id: 'not-a-uuid' }],
    ['more than four characters', { characters: Array.from({ length: 5 }, () => character) }],
    ['a scenario id of 0', { scenarioStatus: { '0': 'unlocked' } }],
    ['a scenario id past the last scenario', { scenarioStatus: { '99': 'unlocked' } }],
    ['an unknown scenario status', { scenarioStatus: { '1': 'done' } }],
    ['a fractional city event id', { cityEventsDrawn: [1.5] }],
    ['a missing lootedTreasureIds', { lootedTreasureIds: undefined }],
  ])('rejects %s', (_label, patch) => {
    expect(CampaignSchema.safeParse({ ...campaign, ...patch }).success).toBe(false)
  })
})

describe('CharacterProgressSchema', () => {
  it('defaults bonusPerks to 0', () => {
    expect(CharacterProgressSchema.parse(character).bonusPerks).toBe(0)
  })

  it('allows negative gold', () => {
    expect(CharacterProgressSchema.parse({ ...character, gold: -5 }).gold).toBe(-5)
  })

  it.each([
    ['an unknown character type', { type: 'wizard' }],
    ['an empty name', { name: '' }],
    ['a name over 50 characters', { name: 'x'.repeat(51) }],
    ['negative experience', { experience: -1 }],
    ['fractional experience', { experience: 1.5 }],
    ['checkmarks over 18', { checkmarks: 19 }],
    ['negative checkmarks', { checkmarks: -1 }],
    ['negative bonusPerks', { bonusPerks: -1 }],
    ['a non-integer item id', { itemIds: ['1'] }],
  ])('rejects %s', (_label, patch) => {
    expect(CharacterProgressSchema.safeParse({ ...character, ...patch }).success).toBe(false)
  })
})

describe('CreateCampaignSchema', () => {
  it('accepts a name of 1 to 100 characters only', () => {
    expect(CreateCampaignSchema.safeParse({ name: 'a' }).success).toBe(true)
    expect(CreateCampaignSchema.safeParse({ name: '' }).success).toBe(false)
    expect(CreateCampaignSchema.safeParse({ name: 'x'.repeat(101) }).success).toBe(false)
  })
})
