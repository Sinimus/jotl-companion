import { useState } from 'react'
import { type CharacterProgress, type ScenarioStatus } from '@/shared/schemas'
import { items, type Item, type ItemSlot } from '@/data'
import { computeLevelFromXp, itemSlotLimits } from '@/features/campaign/rules'
import { ItemShop } from './ItemShop'

interface ItemManagerProps {
  character: CharacterProgress
  /** Whole party — the shop checks how many copies of an item it owns. */
  party: CharacterProgress[]
  scenarioStatus: Record<number, ScenarioStatus>
  /** Treasures the party has looted — passed down to the shop lock logic. */
  lootedTreasureIds: number[]
  onBuy: (itemId: number) => void
  onGain: (itemId: number) => void
  onSell: (itemId: number) => void
  onSetEquippedItems: (itemIds: number[]) => void
}

const SLOTS: ItemSlot[] = ['head', 'body', 'feet', 'hand', 'small']

export function ItemManager({
  character,
  party,
  scenarioStatus,
  lootedTreasureIds,
  onBuy,
  onGain,
  onSell,
  onSetEquippedItems,
}: ItemManagerProps) {
  const [isShopOpen, setIsShopOpen] = useState(false)
  const [sellConfirmId, setSellConfirmId] = useState<number | null>(null)

  const ownedItems = character.itemIds
    .map((id) => items.find((i) => i.id === id))
    .filter((i): i is Item => i !== undefined)

  const itemById = new Map(ownedItems.map((item) => [item.id, item]))
  const equippedIds = new Set(character.equippedItemIds)

  // The limits govern what is brought into a scenario, not what is owned.
  const level = computeLevelFromXp(character.experience)
  const limits = itemSlotLimits(level)

  const toggleEquipped = (item: Item) => {
    const next = equippedIds.has(item.id)
      ? character.equippedItemIds.filter((id) => id !== item.id)
      : [...character.equippedItemIds, item.id]
    onSetEquippedItems(next)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-zinc-300">
          Inventory{' '}
          <span className="ml-1 text-lg font-bold text-amber-400">{character.gold}g</span>
        </h3>
        <button
          onClick={() => setIsShopOpen(true)}
          className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-zinc-900 hover:bg-amber-500"
        >
          Open Shop
        </button>
      </div>

      {/* What the character brings into the next scenario */}
      <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3">
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
          Brings into the next scenario
        </h4>
        <div className="space-y-1.5">
          {SLOTS.map((slot) => {
            const equipped = character.equippedItemIds
              .map((id) => itemById.get(id))
              .filter((item): item is Item => item !== undefined && item.slot === slot)
            return (
              <div
                key={slot}
                className="flex items-center justify-between gap-3 rounded bg-zinc-900 px-2 py-1.5"
              >
                <span className="text-xs font-bold uppercase text-zinc-500">{slot}</span>
                <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                  {equipped.length === 0 ? (
                    <span className="text-xs italic text-zinc-600">—</span>
                  ) : (
                    equipped.map((item) => (
                      <span
                        key={item.id}
                        className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-200"
                      >
                        {item.name}
                      </span>
                    ))
                  )}
                </span>
                <span className="shrink-0 text-[10px] font-bold text-zinc-500">
                  {equipped.length}/{limits[slot]}
                </span>
              </div>
            )
          })}
        </div>
        <p className="mt-2 text-[10px] italic text-zinc-600">
          Limits apply only to what a character brings into a scenario; owning more is fine (Glossary p.11).
        </p>
      </div>

      {/* Everything the character owns */}
      <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3">
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
          Owned items
        </h4>
        {ownedItems.length === 0 ? (
          <p className="py-2 text-center text-xs italic text-zinc-600">
            No items yet — visit the shop.
          </p>
        ) : (
          <div className="space-y-2">
            {ownedItems.map((item) => {
              const isEquipped = equippedIds.has(item.id)
              return (
                <div key={item.id} className="rounded bg-zinc-900 p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-zinc-200">
                        {item.name}{' '}
                        <span className="text-xs text-zinc-500">#{item.id}</span>
                      </span>
                      <div className="mt-0.5 flex gap-2 text-[10px] uppercase text-zinc-500">
                        <span>{item.slot}</span>
                        <span>{item.usageType}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => toggleEquipped(item)}
                        className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                          isEquipped
                            ? 'bg-amber-600/20 text-amber-400 hover:bg-amber-600/30'
                            : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                        }`}
                      >
                        {isEquipped ? 'Leave' : 'Bring'}
                      </button>
                      {sellConfirmId === item.id ? (
                        <>
                          <button
                            onClick={() => {
                              setSellConfirmId(null)
                              onSell(item.id)
                            }}
                            className="rounded bg-red-600/80 px-2 py-1 text-xs font-bold text-white hover:bg-red-500"
                          >
                            Confirm sell
                          </button>
                          <button
                            onClick={() => setSellConfirmId(null)}
                            className="rounded px-1.5 py-1 text-xs text-zinc-500 hover:text-zinc-300"
                          >
                            Keep
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setSellConfirmId(item.id)}
                          className="rounded px-2 py-1 text-xs font-medium text-zinc-500 hover:text-red-400"
                        >
                          Sell (+{Math.ceil(item.cost / 2)} gold)
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">{item.effect}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {isShopOpen && (
        <ItemShop
          character={character}
          party={party}
          scenarioStatus={scenarioStatus}
          lootedTreasureIds={lootedTreasureIds}
          onBuy={onBuy}
          onGain={onGain}
          onClose={() => setIsShopOpen(false)}
        />
      )}
    </div>
  )
}
