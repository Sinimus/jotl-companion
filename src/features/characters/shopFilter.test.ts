import { describe, expect, it } from 'vitest'
import { items } from '@/data'
import { itemAvailability } from '@/features/campaign/rules'
import { filterShopItems } from './shopFilter'

// Fresh campaign: only scenario 1 is done, so some items are locked.
const campaign = { scenarioStatus: { 1: 'completed' as const }, lootedTreasureIds: [], soldItemIds: [] }
const isLocked = (id: number) => {
  const item = items.find((candidate) => candidate.id === id)
  return item !== undefined && itemAvailability(item, campaign) === 'locked'
}
const lockedItem = items.find((item) => isLocked(item.id))
const openItem = items.find((item) => !isLocked(item.id))

describe('filterShopItems', () => {
  it('has a locked and an open item to test with', () => {
    expect(lockedItem).toBeDefined()
    expect(openItem).toBeDefined()
  })

  it('lists every item for no search, locked ones as spoiler tiles', () => {
    const list = filterShopItems(items, { slot: 'all', query: '', isHidden: (item) => isLocked(item.id) })
    expect(list).toHaveLength(items.length)
  })

  it('does not find a hidden item by its name (no oracle for locked names)', () => {
    const list = filterShopItems(items, {
      slot: 'all',
      query: lockedItem?.name ?? '',
      isHidden: (item) => isLocked(item.id),
    })
    expect(list.map((item) => item.id)).not.toContain(lockedItem?.id)
  })

  it('finds a locked item once the player has revealed it', () => {
    const list = filterShopItems(items, { slot: 'all', query: lockedItem?.name ?? '', isHidden: () => false })
    expect(list.map((item) => item.id)).toContain(lockedItem?.id)
  })

  it('finds an open item by a part of its name, ignoring case and outer spaces', () => {
    const part = (openItem?.name ?? '').slice(1, 6).toUpperCase()
    const list = filterShopItems(items, { slot: 'all', query: ` ${part} `, isHidden: (item) => isLocked(item.id) })
    expect(list.map((item) => item.id)).toContain(openItem?.id)
  })

  it('filters by slot', () => {
    const list = filterShopItems(items, { slot: 'head', query: '', isHidden: () => false })
    expect(list.length).toBeGreaterThan(0)
    expect(list.every((item) => item.slot === 'head')).toBe(true)
  })
})
