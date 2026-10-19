import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { CharacterProgress } from '@/shared/schemas'
import { AbilityManager } from './AbilityManager'

function hero(patch: Partial<CharacterProgress> = {}): CharacterProgress {
  return {
    id: '11111111-2222-4333-8444-555555555555',
    type: 'hatchet',
    name: 'Axe',
    experience: 0,
    gold: 0,
    checkmarks: 0,
    perkIds: [],
    itemIds: [],
    equippedItemIds: [],
    selectedAbilityIds: [],
    unlockedAbilityIds: [],
    bonusPerks: 0,
    ...patch,
  }
}

const noop = () => undefined
const render = (character: CharacterProgress, stage: number) =>
  renderToStaticMarkup(
    <AbilityManager character={character} stage={stage} onSetHand={noop} onUnlock={noop} onRemoveUnlocked={noop} />
  )

describe('AbilityManager', () => {
  it('opens on its own when a level-up card is waiting and shows the pool of the stage', () => {
    const markup = render(hero({ experience: 95, unlockedAbilityIds: ['hatchet-2-repeat-shot'] }), 5)
    expect(markup).toContain('Hand for the next scenario')
    expect(markup).toContain('Hand 0 / 10')
    expect(markup).toContain('1 / 2')
    expect(markup).toContain('Level 2 (gained)')
    expect(markup).toContain('Fancy Hat') // an X card
    expect(markup).not.toContain('Level A')
    // a level 4 card is above level 3 and not offered
    expect(markup).not.toContain('Ripped From the Flesh')
  })

  it('stays closed with no pending pick and names the hand size of the learning stage', () => {
    const markup = render(hero(), 2)
    expect(markup).toContain('aria-expanded="false"')
    expect(markup).toContain('Hand 0 / 8')
  })

  it('flags cards of an earlier stage and a hand over the limit', () => {
    const markup = render(
      hero({ experience: 0, selectedAbilityIds: ['hatchet-a-close-cuts', 'hatchet-x-care-package', 'hatchet-1-retrieval'] }),
      0
    )
    expect(markup).toContain('Hand 3 / 6')
    expect(markup).toContain('Not available at this point of the campaign')
  })
})
