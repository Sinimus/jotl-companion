import { useState } from 'react'
import { type CharacterProgress } from '@/shared/schemas'
import { items, type Item, type ItemSlot } from '@/data'
import { ItemShop } from './ItemShop'

interface ItemManagerProps {
  character: CharacterProgress
  onUpdateItems: (itemIds: number[]) => void
}

export function ItemManager({ character, onUpdateItems }: ItemManagerProps) {
  const [isShopOpen, setIsShopOpen] = useState(false)

  const ownedItems = character.itemIds
    .map((id) => items.find((i) => i.id === id))
    .filter((i): i is Item => !!i)

  const itemsBySlot: Record<ItemSlot, Item[]> = {
    head: ownedItems.filter((i) => i.slot === 'head'),
    body: ownedItems.filter((i) => i.slot === 'body'),
    feet: ownedItems.filter((i) => i.slot === 'feet'),
    hand: ownedItems.filter((i) => i.slot === 'hand'),
    small: ownedItems.filter((i) => i.slot === 'small'),
  }

  // Calculate limits
  const smallItemLimit = Math.ceil(character.level / 2)
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

    // If active loadout is full, we need to decide whether to Block or Replace.
    // The spec said "Equip or Replace". 
    // Since we don't have a sophisticated "Backpack" vs "Equipped" storage yet,
    // I will simply ADD it. If it exceeds the limit, I'll visually flag it or 
    // just let it be (player freedom) but the Shop UI in `ItemShop` handles the "Buy" click.
    // Actually, let's implement strict "Replace" logic for single-slot items to keep it clean.
    
    if (slot !== 'small' && slot !== 'hand') {
       // Single slot items: Remove existing item of that slot if present
       const existing = currentInSlot[0]
       if (existing) {
         if (!confirm(`Replace ${existing.name} with ${newItem.name}?`)) return
         newIds = newIds.filter(id => id !== existing.id)
       }
    } else {
      // Multi-slot (Hand/Small): Check count
      if (currentInSlot.length >= limit) {
        alert(`Slot full! Remove an item from ${slot} first.`)
        return
      }
    }

    newIds.push(itemId)
    onUpdateItems(newIds)
  }

  const handleRemove = (itemId: number) => {
    if (confirm('Remove this item?')) {
      onUpdateItems(character.itemIds.filter((id) => id !== itemId))
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
          onEquip={handleEquip}
          onClose={() => setIsShopOpen(false)}
        />
      )}
    </div>
  )
}
