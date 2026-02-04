import { Routes, Route } from 'react-router-dom'
import { CampaignList } from '@/features/campaign'

// Placeholder — fleshed out in Task 005 (Character creation)
function CampaignDetailPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-900">
      <p className="text-zinc-400">Campaign detail — coming in Task 005.</p>
    </div>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<CampaignList />} />
      <Route path="/campaign/:id" element={<CampaignDetailPage />} />
    </Routes>
  )
}
