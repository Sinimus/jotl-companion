import { Routes, Route } from 'react-router-dom'
import { CampaignList, CampaignDetail, CharacterDetail } from '@/features/campaign'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<CampaignList />} />
      <Route path="/campaign/:id" element={<CampaignDetail />} />
      <Route path="/campaign/:campaignId/character/:characterId" element={<CharacterDetail />} />
    </Routes>
  )
}
