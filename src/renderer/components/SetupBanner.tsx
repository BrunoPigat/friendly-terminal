import { useState, useEffect, useCallback } from 'react'
import { detectEngines } from '@/lib/api'
import InstallEngineDialog from './InstallEngineDialog'

interface EngineInfo {
  id: string
  name: string
  isAvailable: boolean
}

const isWindows = navigator.userAgent.includes('Windows')

const INSTALL_COMMANDS: Record<string, string> = {
  claude: isWindows
    ? 'irm https://claude.ai/install.ps1 | iex'
    : 'curl -fsSL https://claude.ai/install.sh | bash',
  gemini: 'npm install -g @google/gemini-cli'
}

const ENGINE_ICONS: Record<string, JSX.Element> = {
  claude: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  gemini: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

export default function SetupBanner() {
  const [engines, setEngines] = useState<EngineInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [installing, setInstalling] = useState<{ id: string; name: string } | null>(null)

  const detect = useCallback(async () => {
    setLoading(true)
    try {
      const result = await detectEngines()
      setEngines(result as EngineInfo[])
    } catch (err) {
      console.error('[SetupBanner] Failed to detect engines:', err)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    detect()
  }, [detect])

  const missingEngines = engines.filter((e) => !e.isAvailable)

  if (loading || missingEngines.length === 0) return null

  return (
    <>
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
        <div className="mb-3 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="text-sm font-semibold text-amber-800">
            {missingEngines.length === engines.length
              ? 'No AI engines installed'
              : 'Some AI engines are missing'}
          </span>
        </div>
        <p className="mb-4 text-sm text-amber-700">
          Install an AI engine to start chatting. At least one is required.
        </p>
        <div className="flex flex-wrap gap-3">
          {missingEngines.map((engine) => (
            <button
              key={engine.id}
              onClick={() => setInstalling({ id: engine.id, name: engine.name })}
              className="flex items-center gap-2.5 rounded-lg border border-amber-300 bg-white px-4 py-2.5 text-sm font-medium text-amber-900 hover:bg-amber-100 transition-colors"
            >
              <span className="text-amber-600">
                {ENGINE_ICONS[engine.id]}
              </span>
              Install {engine.name}
            </button>
          ))}
        </div>
      </div>

      {installing && (
        <InstallEngineDialog
          engineName={installing.name}
          installCommand={INSTALL_COMMANDS[installing.id]}
          onClose={() => {
            setInstalling(null)
            detect()
          }}
        />
      )}
    </>
  )
}
