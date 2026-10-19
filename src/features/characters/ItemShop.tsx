import { useEffect, useId, useState } from 'react'
import { items, type Item, type ItemSlot, type ItemUnlock } from '@/data'
import { type CharacterProgress, type ScenarioStatus } from '@/shared/schemas'
import { itemAvailability, partyCopiesOwned } from '@/features/campaign/rules'
import { filterShopItems } from './shopFilter'

interface ItemShopProps {
  /** The character buying or gaining the item. */
  character: CharacterProgress
  /** Whole party — the box holds a limited number of copies of each item. */
  party: CharacterProgress[]
  scenarioStatus: Record<number, ScenarioStatus>
  /** Treasures the party has looted — some items enter the game through them. */
  lootedTreasureIds: number[]
  /** Items sold to the shop — they stay available there (Glossary p.19). */
  soldItemIds: number[]
  onBuy: (itemId: number) => void
  onGain: (itemId: number) => void
  onClose: () => void
}

/** Human-readable origin of one unlock entry, e.g. "shop after scenario 2". */
function unlockLabel(unlock: ItemUnlock): string {
  switch (unlock.type) {
    case 'shop':
      return `shop after scenario ${unlock.scenario}`
    case 'scenario':
      return `scenario ${unlock.scenario} reward`
    case 'treasure':
      return `treasure ${unlock.treasure}`
    case 'misplacedGoods':
      return `misplaced goods ${unlock.token}, scenario ${unlock.scenario}`
  }
}

/** Where a reward item comes from, capitalized for the reward label. */
function rewardOrigin(unlock: ItemUnlock): string {
  const label = unlockLabel(unlock)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function ItemShop({
  character,
  party,
  scenarioStatus,
  lootedTreasureIds,
  soldItemIds,
  onBuy,
  onGain,
  onClose,
}: ItemShopProps) {
  const [selectedSlot, setSelectedSlot] = useState<ItemSlot | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  // Spoiler reveals live per session only (locked names stay out of the DOM).
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set())

  const campaign = { scenarioStatus, lootedTreasureIds, soldItemIds }
  const titleId = useId()

  // Escape closes the dialog, as the close button does.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const counts = { shop: 0, reward: 0, locked: 0 }
  for (const item of items) {
    const availability = itemAvailability(item, campaign)
    if (availability === 'shop') counts.shop += 1
    else if (availability === 'reward') counts.reward += 1
    else counts.locked += 1
  }

  const filteredItems = filterShopItems(items, {
    slot: selectedSlot,
    query: searchQuery,
    isHidden: (item) => itemAvailability(item, campaign) === 'locked' && !revealedIds.has(item.id),
  })

  const reveal = (id: number) => {
    setRevealedIds((prev) => new Set(prev).add(id))
  }
  const revealAll = () => {
    setRevealedIds(new Set(items.map((item) => item.id)))
  }

  /** Reason the character cannot take the item right now, if any. */
  const takeBlockReason = (item: Item): string | null => {
    if (character.itemIds.includes(item.id)) return 'Owned'
    if (partyCopiesOwned(item.id, party) >= item.copies) return 'All copies owned'
    if (itemAvailability(item, campaign) === 'shop' && character.gold < item.cost) {
      return 'Not enough gold'
    }
    return null
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <div className="flex h-full max-h-[800px] w-full max-w-2xl flex-col rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-700 p-4">
          <div>
            <h2 id={titleId} className="text-xl font-bold text-zinc-100">Item Shop</h2>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">
              Available: {counts.shop} · Rewards: {counts.reward} · Locked: {counts.locked}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {counts.locked > 0 && (
              <button
                onClick={revealAll}
                className="min-h-11 px-1 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200"
              >
                Reveal all
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close shop"
              className="flex h-11 w-11 shrink-0 items-center justify-center text-zinc-400 hover:text-zinc-100"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-zinc-700 bg-zinc-800/50 p-4">
          <input
            type="text"
            aria-label="Search items"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-h-11 w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-zinc-100 focus:border-amber-500 focus:outline-none"
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(['all', 'head', 'body', 'feet', 'hand', 'small'] as const).map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedSlot(slot)}
                className={`flex min-h-11 shrink-0 items-center rounded-full px-4 text-xs font-medium capitalize transition-colors ${
                  selectedSlot === slot
                    ? 'bg-amber-700 text-white'
                    : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredItems.map((item) => {
              const availability = itemAvailability(item, campaign)
              const ownedByParty = partyCopiesOwned(item.id, party)
              const isOwned = character.itemIds.includes(item.id)
              const isRevealed = revealedIds.has(item.id)

              // Spoiler tile: until revealed, the name and effect stay out of the DOM.
              if (availability === 'locked' && !isRevealed) {
                return (
                  <div
                    key={item.id}
                    className="flex flex-col items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/50 p-3"
                  >
                    <span className="text-sm font-bold text-zinc-500">#{item.id}</span>
                    <span className="mb-2 text-[10px] uppercase text-zinc-500">{item.slot}</span>
                    <button
                      onClick={() => reveal(item.id)}
                      aria-label={`Reveal item ${item.id}`}
                      className="min-h-11 rounded-full border border-zinc-600 px-4 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    >
                      Reveal
                    </button>
                  </div>
                )
              }

              const blockReason = availability === 'locked' ? 'Not available yet' : takeBlockReason(item)
              const rewardOrigins = item.unlock
                .filter((unlock) => {
                  if (unlock.type === 'scenario') return scenarioStatus[unlock.scenario] === 'completed'
                  if (unlock.type === 'treasure') return lootedTreasureIds.includes(unlock.treasure)
                  if (unlock.type === 'misplacedGoods') return scenarioStatus[unlock.scenario] !== 'locked'
                  return false
                })
                .map((unlock) => rewardOrigin(unlock))
              // In the shop only because a copy was sold there (Glossary p.19).
              const soldIntoShop =
                soldItemIds.includes(item.id) &&
                !item.unlock.some((unlock) => unlock.type === 'shop' && scenarioStatus[unlock.scenario] === 'completed')

              return (
                <div
                  key={item.id}
                  className={`flex flex-col justify-between rounded-lg border p-3 transition-colors ${
                    isOwned
                      ? 'border-emerald-900/50 bg-emerald-950/10'
                      : availability === 'locked'
                        ? 'border-zinc-800 bg-zinc-900/60'
                        : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                  }`}
                >
                  <div>
                    <div className="mb-1 flex items-start justify-between">
                      <div className="min-w-0">
                        <span className="block truncate font-semibold text-zinc-200">
                          #{item.id} {item.name}
                        </span>
                        <div className="flex gap-2">
                          <span className="text-[10px] uppercase text-zinc-500">{item.slot}</span>
                          {availability === 'reward' && (
                            <span className="text-[10px] font-bold uppercase text-amber-500">Reward</span>
                          )}
                          {soldIntoShop && (
                            <span className="text-[10px] font-bold uppercase text-zinc-400">Sold to shop</span>
                          )}
                          {availability === 'locked' && (
                            <span className="text-[10px] font-bold uppercase text-zinc-500">Locked</span>
                          )}
                        </div>
                      </div>
                      {availability === 'shop' && (
                        <span className="shrink-0 text-xs font-medium text-amber-500">{item.cost} Gold</span>
                      )}
                    </div>
                    {availability === 'reward' && (
                      <p className="mb-1 text-[10px] uppercase tracking-wider text-zinc-500">
                        {rewardOrigins.join(' · ')}
                      </p>
                    )}
                    <p className="mb-3 text-xs text-zinc-400">{item.effect}</p>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-zinc-700/50 pt-2">
                    {availability === 'locked' ? (
                      <span className="text-xs italic text-zinc-500">{blockReason}</span>
                    ) : (
                      <>
                        <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                          In party: {ownedByParty}/{item.copies}
                        </span>
                        {isOwned ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-emerald-500">
                            ✓ Owned
                          </span>
                        ) : blockReason ? (
                          <button
                            disabled
                            className="min-h-11 cursor-not-allowed rounded bg-zinc-700/60 px-3 py-1 text-xs font-medium text-zinc-500"
                          >
                            {blockReason}
                          </button>
                        ) : availability === 'shop' ? (
                          <button
                            onClick={() => onBuy(item.id)}
                            className="min-h-11 rounded bg-zinc-700 px-3 py-1 text-xs font-medium text-zinc-200 transition-colors hover:bg-amber-600 hover:text-white"
                          >
                            Buy ({item.cost} gold)
                          </button>
                        ) : (
                          <button
                            onClick={() => onGain(item.id)}
                            className="min-h-11 rounded bg-zinc-700 px-3 py-1 text-xs font-medium text-zinc-200 transition-colors hover:bg-amber-600 hover:text-white"
                          >
                            Gain
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  <p className="mt-2 text-[10px] italic text-zinc-500">
                    {item.source} · {item.unlock.map((unlock) => `${unlockLabel(unlock)} (${unlock.source})`).join('; ')}
                  </p>
                </div>
              )
            })}
          </div>
          {filteredItems.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-zinc-500">No items found matching your filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
