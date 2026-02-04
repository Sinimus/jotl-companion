import { useState, useMemo } from 'react'
import { items, type ItemSlot } from '@/data'

interface ItemShopProps {
  ownedItemIds: number[]
  onEquip: (itemId: number) => void
  onClose: () => void
}

export function ItemShop({ ownedItemIds, onEquip, onClose }: ItemShopProps) {
  const [selectedSlot, setSelectedSlot] = useState<ItemSlot | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSlot = selectedSlot === 'all' || item.slot === selectedSlot
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSlot && matchesSearch
    })
  }, [selectedSlot, searchQuery])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="flex h-full max-h-[800px] w-full max-w-2xl flex-col rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-700 p-4">
          <h2 className="text-xl font-bold text-zinc-100">Item Shop</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100">
            ✕
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-zinc-700 bg-zinc-800/50 p-4">
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-zinc-100 focus:border-amber-500 focus:outline-none"
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(['all', 'head', 'body', 'feet', 'hand', 'small'] as const).map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedSlot(slot)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  selectedSlot === slot
                    ? 'bg-amber-600 text-white'
                    : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
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
              const isOwned = ownedItemIds.includes(item.id)
              return (
                <div
                  key={item.id}
                  className={`flex flex-col justify-between rounded-lg border p-3 transition-colors ${
                    isOwned
                      ? 'border-emerald-900/50 bg-emerald-950/10'
                      : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                  }`}
                >
                  <div>
                    <div className="mb-1 flex items-start justify-between">
                      <span className="font-semibold text-zinc-200">{item.name}</span>
                      <span className="text-xs font-medium uppercase text-zinc-500">{item.slot}</span>
                    </div>
                    <p className="mb-3 text-xs text-zinc-400">{item.effect}</p>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-zinc-700/50 pt-2">
                    <span className="text-xs font-medium text-amber-500">{item.cost} Gold</span>
                    {isOwned ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-500">
                        ✓ Owned
                      </span>
                    ) : (
                      <button
                        onClick={() => onEquip(item.id)}
                        className="rounded bg-zinc-700 px-3 py-1 text-xs font-medium text-zinc-200 hover:bg-amber-600 hover:text-white"
                      >
                        Buy
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {filteredItems.length === 0 && (
            <p className="py-8 text-center text-zinc-500">No items found matching your filters.</p>
          )}
        </div>
      </div>
    </div>
  )
}
