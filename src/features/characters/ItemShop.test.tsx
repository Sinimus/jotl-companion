import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ItemShop } from './ItemShop'
import type { CharacterProgress } from '@/shared/schemas'

const hero: CharacterProgress = {
  id: '11111111-2222-4333-8444-555555555555',
  type: 'hatchet',
  name: 'Hatchet',
  experience: 0,
  gold: 100,
  checkmarks: 0,
  perkIds: [],
  itemIds: [],
  equippedItemIds: [],
  selectedAbilityIds: [],
  unlockedAbilityIds: [],
  bonusPerks: 0,
}

const shop = (soldItemIds: number[]) =>
  renderToStaticMarkup(
    <ItemShop
      character={hero}
      party={[hero]}
      scenarioStatus={{ 1: 'completed', 2: 'completed' }}
      lootedTreasureIds={[]}
      soldItemIds={soldItemIds}
      onBuy={() => undefined}
      onGain={() => undefined}
      onClose={() => undefined}
    />
  )

describe('a reward item sold to the shop (Glossary p.19)', () => {
  it('is offered for its price with a buy button and marked as sold to the shop', () => {
    const markup = shop([28])
    expect(markup).toContain('#28 Flea-Bitten Shawl')
    expect(markup).toContain('Sold to shop')
    expect(markup).toContain('Available: 14')
  })

  it('stays a locked spoiler tile while nobody has sold it', () => {
    const markup = shop([])
    expect(markup).not.toContain('Flea-Bitten Shawl')
    expect(markup).not.toContain('Sold to shop')
    expect(markup).toContain('Available: 13')
  })
})
