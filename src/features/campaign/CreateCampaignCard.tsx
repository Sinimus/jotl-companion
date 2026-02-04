import { useState } from 'react'

interface CreateCampaignCardProps {
  initiallyExpanded?: boolean
  onCreate: (name: string) => void
}

export function CreateCampaignCard({ initiallyExpanded, onCreate }: CreateCampaignCardProps) {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded ?? false)
  const [name, setName] = useState('')

  const handleSubmit = () => {
    if (name.trim()) {
      onCreate(name)
      setName('')
      setIsExpanded(false)
    }
  }

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full rounded-lg border border-dashed border-zinc-700 px-4 py-3 text-left text-sm text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-300"
      >
        + New Campaign
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-6">
      <h3 className="mb-4 font-semibold text-zinc-100">Create New Campaign</h3>
      <input
        type="text"
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder="Campaign Name..."
        className="mb-4 w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-zinc-900 disabled:opacity-50 hover:bg-amber-500"
        >
          Create
        </button>
        <button
          onClick={() => setIsExpanded(false)}
          className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
