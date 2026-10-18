import type { Item, ItemSlot } from '@/data'

interface ShopFilter {
  slot: ItemSlot | 'all'
  query: string
  /** True while the item is a spoiler tile: locked and not revealed by the player. */
  isHidden: (item: Item) => boolean
}

/**
 * The shop list for a slot filter and a search text. A hidden item never matches a
 * search, so typing a name cannot show whether a locked item with that name exists (r193).
 * Without a search text it stays in the list as its spoiler tile.
 */
export function filterShopItems(items: readonly Item[], { slot, query, isHidden }: ShopFilter): Item[] {
  const needle = query.trim().toLowerCase()
  return items.filter((item) => {
    if (slot !== 'all' && item.slot !== slot) return false
    if (needle === '') return true
    return !isHidden(item) && item.name.toLowerCase().includes(needle)
  })
}
