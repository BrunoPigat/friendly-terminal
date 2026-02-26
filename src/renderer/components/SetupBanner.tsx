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
  const [showExplainer, setShowExplainer] = useState(false)

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
  const noneFound = missingEngines.length === engines.length && engines.length > 0

  // When none are found, only suggest installing one engine (Claude as default)
  const displayedEngines = noneFound
    ? missingEngines.filter((e) => e.id === 'claude')
    : missingEngines

  if (loading || missingEngines.length === 0) return null

  return (
    <>
      <div className="mb-6 rounded-lg border border-win-border bg-win-card px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-win-text-tertiary">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span className="text-xs text-win-text-secondary">
              {noneFound
                ? 'No AI engine found'
                : `${missingEngines.map((e) => e.name).join(' and ')} not found`}
            </span>
            {!noneFound && (
              <button
                onClick={() => setShowExplainer((v) => !v)}
                className="text-[11px] text-win-text-tertiary hover:text-win-text-secondary transition-colors"
              >
                {showExplainer ? 'Hide' : 'Why am I seeing this?'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {displayedEngines.map((engine) => (
              <button
                key={engine.id}
                onClick={() => setInstalling({ id: engine.id, name: engine.name })}
                className="text-xs text-win-text-secondary hover:text-win-text underline underline-offset-2 transition-colors"
              >
                Install {engine.name}
              </button>
            ))}
          </div>
        </div>

        {(showExplainer || noneFound) && (
          <div className="mt-3 border-t border-win-border pt-3 text-xs text-win-text-secondary leading-relaxed space-y-2">
            <p>
              Your Friendly Terminal needs at least one AI coding assistant installed on your system to work. These are command-line tools that run locally on your machine.
            </p>
            <p>
              <strong className="text-win-text">Claude Code</strong> is Anthropic's CLI assistant and <strong className="text-win-text">Gemini CLI</strong> is Google's. You only need one, but you can install both to switch between them.
            </p>
            <p>
              Click "Install" above for step-by-step instructions. After installing, restart the app and this message will go away.
            </p>
          </div>
        )}
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
