import { useState } from 'react'
import { type CharacterProgress, type ScenarioStatus } from '@/shared/schemas'
import { items, type Item, type ItemSlot } from '@/data'
import { computeLevelFromXp } from '@/features/campaign/rules'
import { ItemShop } from './ItemShop'

interface ItemManagerProps {
  character: CharacterProgress
  scenarioStatus: Record<number, ScenarioStatus>
  /** Called with updated item IDs and new gold balance after equip / remove. */
  onUpdateItems: (updates: { itemIds: number[]; gold: number }) => void
}

export function ItemManager({ character, scenarioStatus, onUpdateItems }: ItemManagerProps) {
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

  // Calculate limits
  const smallItemLimit = Math.ceil(computeLevelFromXp(character.experience) / 2)
  const limits: Record<ItemSlot, number> = {
    head: 1,
    body: 1,
    feet: 1,
    hand: 2,
    small: smallItemLimit,
  }

  const handleEquip = (itemId: number) => {
    const newItem = items.find((i) => i.id === itemId)
    if (!newItem) return

    const slot = newItem.slot as ItemSlot
    const currentInSlot = itemsBySlot[slot]
    const limit = limits[slot]

    let newIds = [...character.itemIds]
    let sellValue = 0

    if (slot === 'hand') {
      // Hand logic: check total hands used
      // Existing items in hand slot
      const currentHandItems = newIds
        .map(id => items.find(i => i.id === id))
        .filter((i): i is Item => i?.slot === 'hand')

      const currentHandsUsed = currentHandItems.reduce((acc, item) => acc + (item.hands ?? 1), 0)
      const newHandsRequired = newItem.hands ?? 1
      
      // Calculate max hands (always 2)
      const maxHands = 2

      // If adding this item exceeds maxHands, we must prompt to remove items
      if (currentHandsUsed + newHandsRequired > maxHands) {
         // Simple strategy: If full, ask to clear slot? 
         // Or just alert?
         // User wants "allow 2 items in hands".
         // If we are at 2/2, and add 1-hand, we need to remove 1.
         // If we are at 1/2, and add 2-hand, we need to remove 1.
         // If we are at 2/2, and add 2-hand, we need to remove all 2.
         
         alert(`Cannot equip ${newItem.name}. Hand slots full (${currentHandsUsed}/${maxHands}). Remove items first.`)
         return
      }
    } else if (slot !== 'small') {
      // Single-slot: replacing the existing item gives a sell refund
      const existing = currentInSlot[0]
      if (existing) {
        sellValue = Math.ceil(existing.cost / 2)
        if (!confirm(`Replace ${existing.name} with ${newItem.name}?`)) return
        newIds = newIds.filter((id) => id !== existing.id)
      }
    } else {
      // Small items
      if (currentInSlot.length >= limit) {
        alert(`Slot full! Remove an item from ${slot} first.`)
        return
      }
    }

    const netCost = newItem.cost - sellValue
    // Gold check removed per user request
    // if (character.gold < netCost) { ... }

    newIds.push(itemId)
    onUpdateItems({ itemIds: newIds, gold: character.gold - netCost })
  }

  const handleRemove = (itemId: number) => {
    const removedItem = items.find((i) => i.id === itemId)
    const sellValue = removedItem ? Math.ceil(removedItem.cost / 2) : 0
    if (confirm(`Remove this item? Sell for ${sellValue} gold.`)) {
      onUpdateItems({
        itemIds: character.itemIds.filter((id) => id !== itemId),
        gold: character.gold + sellValue,
      })
    }
  }

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
          const isFull = slotItems.length >= limit

          return (
            <div key={slot} className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-zinc-500">{slot}</span>
                <span className={`text-[10px] ${isFull ? 'text-amber-500' : 'text-zinc-600'}`}>
                  {slotItems.length}/{limit}
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
                      <span className="text-sm text-zinc-200">{item.name}</span>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="text-zinc-500 hover:text-red-400"
                      >
                        ×
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
          onEquip={handleEquip}
          onClose={() => setIsShopOpen(false)}
        />
      )}
    </div>
  )
}
