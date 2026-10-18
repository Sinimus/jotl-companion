import { useState } from 'react'
import { type CharacterProgress, type ScenarioStatus } from '@/shared/schemas'
import { items, type Item, type ItemSlot } from '@/data'
import { computeLevelFromXp, itemSlotLimits } from '@/features/campaign/rules'
import { ItemShop } from './ItemShop'

interface ItemManagerProps {
  character: CharacterProgress
  scenarioStatus: Record<number, ScenarioStatus>
  /** Treasures the party has looted — passed down to the shop lock logic. */
  lootedTreasureIds: number[]
  onBuy: (itemId: number) => void
  onSell: (itemId: number) => void
}

export function ItemManager({ character, scenarioStatus, lootedTreasureIds, onBuy, onSell }: ItemManagerProps) {
  const [isShopOpen, setIsShopOpen] = useState(false)

  const ownedItems = character.itemIds
    .map((id) => items.find((i) => i.id === id))
    .filter((i): i is Item => i !== undefined)

  const itemsBySlot: Record<ItemSlot, Item[]> = {
    head: ownedItems.filter((i) => i.slot === 'head'),
    body: ownedItems.filter((i) => i.slot === 'body'),
    feet: ownedItems.filter((i) => i.slot === 'feet'),
    hand: ownedItems.filter((i) => i.slot === 'hand'),
    small: ownedItems.filter((i) => i.slot === 'small'),
  }

  // The limits govern what is brought into a scenario, not what is owned.
  const limits = itemSlotLimits(computeLevelFromXp(character.experience))
  const equippedIds = new Set(character.equippedItemIds)
  const equippedCount = (slot: ItemSlot): number =>
    itemsBySlot[slot].filter((i) => equippedIds.has(i.id)).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-zinc-300">Inventory</h3>
        <button
          onClick={() => setIsShopOpen(true)}
          className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-zinc-900 hover:bg-amber-500"
        >
          Open Shop
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Render slots */}
        {(['head', 'body', 'feet', 'hand', 'small'] as ItemSlot[]).map((slot) => {
          const slotItems = itemsBySlot[slot]
          const limit = limits[slot]

          return (
            <div key={slot} className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-zinc-500">{slot}</span>
                <span className="text-[10px] text-zinc-600">
                  {equippedCount(slot)}/{limit} equipped
                </span>
              </div>

              {slotItems.length === 0 ? (
                <div className="py-2 text-center text-xs italic text-zinc-600">Empty</div>
              ) : (
                <div className="space-y-2">
                  {slotItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded bg-zinc-900 px-2 py-1.5"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm text-zinc-200">{item.name}</span>
                        {equippedIds.has(item.id) && (
                          <span className="shrink-0 text-[10px] font-bold uppercase text-amber-500">
                            Equipped
                          </span>
                        )}
                      </span>
                      <button
                        onClick={() => onSell(item.id)}
                        className="shrink-0 text-xs font-medium text-zinc-500 hover:text-red-400"
                      >
                        Sell +{Math.ceil(item.cost / 2)}g
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {isShopOpen && (
        <ItemShop
          ownedItemIds={character.itemIds}
          scenarioStatus={scenarioStatus}
          lootedTreasureIds={lootedTreasureIds}
          onBuy={onBuy}
          onClose={() => setIsShopOpen(false)}
        />
      )}
    </div>
  )
}
