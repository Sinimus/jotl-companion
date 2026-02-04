import { Routes, Route } from 'react-router-dom'
import { CampaignList, CampaignDetail, CharacterDetail } from '@/features/campaign'
import { PostScenarioChecklist } from '@/features/scenarios'
import { CalculatorPage } from '@/features/calculators'
import { GlossaryPage, ReferencePage, RulesLayout, FocusHelperPage } from '@/features/rules'
import { SettingsPage } from '@/features/settings'
import { AppLayout } from '@/shared/components/layout/AppLayout'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<CampaignList />} />
        <Route path="/campaign/:id" element={<CampaignDetail />} />
        <Route path="/campaign/:campaignId/character/:characterId" element={<CharacterDetail />} />
        <Route path="/campaign/:campaignId/checklist" element={<PostScenarioChecklist />} />
        <Route path="/campaign/:campaignId/calculators" element={<CalculatorPage />} />
        
        <Route path="/rules" element={<RulesLayout />}>
          <Route index element={<GlossaryPage />} />
          <Route path="glossary" element={<GlossaryPage />} />
          <Route path="reference" element={<ReferencePage />} />
          <Route path="focus-helper" element={<FocusHelperPage />} />
        </Route>

        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}