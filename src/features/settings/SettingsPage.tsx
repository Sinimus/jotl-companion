import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCampaignStore } from '@/features/campaign/store'

export function SettingsPage() {
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  
  const campaigns = useCampaignStore((s) => s.campaigns)
  const corruptedCampaigns = useCampaignStore((s) => s.corruptedCampaigns)
  const dismissCorrupted = useCampaignStore((s) => s.dismissCorrupted)
  const exportData = useCampaignStore((s) => s.exportData)
  const importData = useCampaignStore((s) => s.importData)
  const clearAllCampaigns = useCampaignStore((s) => s.clearAllCampaigns)

  const handleExport = async () => {
    try {
      const data = await exportData()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `jotl-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setStatus({ type: 'success', message: 'Campaign data exported successfully.' })
    } catch (e) {
      setStatus({ type: 'error', message: e instanceof Error ? e.message : 'Export failed' })
    }
  }

  const handleExportCorrupted = (rawData: unknown, name: string | null) => {
    const data = JSON.stringify(rawData, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `corrupted-campaign-${name || 'unknown'}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = async (file: File) => {
    try {
      const content = await file.text()
      const result = await importData(content)
      if (result.success) {
        setStatus({ type: 'success', message: `Import successful! ${result.count} campaign(s) imported.` })
      } else {
        setStatus({ type: 'error', message: result.error || 'Import failed' })
      }
    } catch (e) {
      setStatus({ type: 'error', message: e instanceof Error ? e.message : 'Import failed' })
    }
  }

  const handleReset = async () => {
    if (confirm('Are you sure? This will delete ALL campaigns. This action cannot be undone.')) {
      await clearAllCampaigns()
      setStatus({ type: 'success', message: 'All data has been reset.' })
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 pb-24">
      <h1 className="mb-6 text-2xl font-bold text-amber-500">Settings</h1>

      {/* Corrupted Data Warning */}
      {corruptedCampaigns.length > 0 && (
        <section className="mb-8 rounded-lg border border-red-500/50 bg-red-500/10 p-4">
          <h2 className="mb-2 text-lg font-bold text-red-400">⚠️ Data Corruption Warning</h2>
          <p className="mb-4 text-sm text-zinc-300">
            Some campaign records failed validation and were not loaded. This usually happens after an app update if your data is malformed.
          </p>
          <div className="space-y-3">
            {corruptedCampaigns.map((c) => (
              <div key={c.localId} className="rounded border border-red-500/30 bg-black/20 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-zinc-200">{c.name || 'Unnamed Campaign'}</p>
                  <button
                    onClick={() => dismissCorrupted(c.localId)}
                    className="text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    Dismiss
                  </button>
                </div>
                <p className="mt-1 text-xs text-red-400/80 line-clamp-2">{c.error}</p>
                <button
                  onClick={() => handleExportCorrupted(c.rawData, c.name)}
                  className="mt-2 text-xs font-medium text-amber-500 hover:underline"
                >
                  Download Raw JSON (Recover Data)
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Support & Documentation */}
      <section className="mb-8 rounded-lg border border-zinc-700 bg-zinc-800 p-4">
        <h2 className="mb-4 text-lg font-semibold text-zinc-100">Help & Support</h2>
        
        <p className="mb-4 text-sm text-zinc-400">
          New to the app? Read the handbook to learn how to manage your campaigns and characters.
        </p>

        <Link
          to="/settings/handbook"
          className="flex w-full items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm font-medium text-amber-500 transition-colors hover:bg-amber-500/10"
        >
          📖 How to Use (User Handbook)
        </Link>
      </section>

      {/* Data Management */}
      <section className="mb-8 rounded-lg border border-zinc-700 bg-zinc-800 p-4">
        <h2 className="mb-4 text-lg font-semibold text-zinc-100">Data Management</h2>
        
        <p className="mb-4 text-sm text-zinc-400">
          Backup your campaigns or transfer them to another device.
        </p>

        {status && (
          <p className={`mb-4 text-sm ${status.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
            {status.type === 'success' ? '✓ ' : '⚠ '}{status.message}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleExport}
            disabled={campaigns.length === 0}
            className="flex w-full items-center justify-center rounded-lg border border-zinc-600 bg-zinc-700 px-4 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-600 disabled:opacity-50"
          >
            ⬇ Export Data
          </button>

          <label className="flex w-full cursor-pointer items-center justify-center rounded-lg border border-zinc-600 bg-zinc-700 px-4 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-600">
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  handleImport(file)
                  e.target.value = '' // Reset input
                }
              }}
            />
            ⬆ Import Data
          </label>
        </div>

        <div className="mt-6 border-t border-zinc-700 pt-6">
          <button
            onClick={handleReset}
            className="w-full rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-900/30"
          >
            Reset App (Delete All Data)
          </button>
        </div>
      </section>

      {/* About */}
      <section className="rounded-lg border border-zinc-700 bg-zinc-800 p-4">
        <h2 className="mb-2 text-lg font-semibold text-zinc-100">About</h2>
        <p className="text-sm text-zinc-400">
          <span className="font-semibold text-zinc-300">Version:</span> 1.0.0
        </p>
        <p className="mt-1 text-sm text-zinc-400">
          <span className="font-semibold text-zinc-300">Source:</span>{' '}
          <a
            href="https://github.com/Sinimus/jotl-companion"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-500 hover:underline"
          >
            GitHub Repository
          </a>
        </p>
        <p className="mt-1 text-sm text-zinc-400">
          <span className="font-semibold text-zinc-300">License:</span> GNU GPLv3
        </p>
        <p className="mt-4 text-xs text-zinc-500">
          A fan-made companion app for Gloomhaven: Jaws of the Lion.
          Not affiliated with Cephalofair Games.
        </p>
      </section>
    </div>
  )
}
