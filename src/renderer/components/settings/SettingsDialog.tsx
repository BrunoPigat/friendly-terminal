import { useEffect, useState, useRef, useCallback } from 'react'
import { useSettingsStore } from '@/stores/settings-store'
import { ENGINE_NAMES, type EngineId } from '@/lib/constants'
import * as api from '@/lib/api'

export default function SettingsDialog() {
  const show = useSettingsStore((s) => s.showSettingsDialog)
  const setShow = useSettingsStore((s) => s.setShowSettingsDialog)
  const defaultEngine = useSettingsStore((s) => s.defaultEngine)
  const updateSetting = useSettingsStore((s) => s.updateSetting)

  const [activeSection, setActiveSection] = useState<'general' | 'git' | 'about'>('general')
  const [gitName, setGitName] = useState('')
  const [gitEmail, setGitEmail] = useState('')
  const [gitAvailable, setGitAvailable] = useState<boolean | null>(null)
  const [appVersion, setAppVersion] = useState('')

  const nameTimer = useRef<ReturnType<typeof setTimeout>>()
  const emailTimer = useRef<ReturnType<typeof setTimeout>>()

  // Load git config + app version on open
  useEffect(() => {
    if (!show) return
    api.gitAvailable().then(setGitAvailable).catch(() => setGitAvailable(false))
    api.gitConfigGet('user.name').then((v) => setGitName(v ?? '')).catch(() => {})
    api.gitConfigGet('user.email').then((v) => setGitEmail(v ?? '')).catch(() => {})
    api.getAppVersion().then(setAppVersion).catch(() => setAppVersion('unknown'))
  }, [show])

  // Close on Escape
  useEffect(() => {
    if (!show) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setShow(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [show, setShow])

  // Debounced git config saves
  const handleNameChange = useCallback((value: string) => {
    setGitName(value)
    if (nameTimer.current) clearTimeout(nameTimer.current)
    nameTimer.current = setTimeout(() => {
      if (value.trim()) api.gitConfigSet('user.name', value.trim()).catch(() => {})
    }, 500)
  }, [])

  const handleEmailChange = useCallback((value: string) => {
    setGitEmail(value)
    if (emailTimer.current) clearTimeout(emailTimer.current)
    emailTimer.current = setTimeout(() => {
      if (value.trim()) api.gitConfigSet('user.email', value.trim()).catch(() => {})
    }, 500)
  }, [])

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) setShow(false) }}
    >
      <div className="w-full max-w-lg rounded-lg border border-win-border bg-win-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-win-border px-5 py-3.5">
          <h2 className="text-sm font-semibold text-win-text">Settings</h2>
          <button
            onClick={() => setShow(false)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-win-text-tertiary hover:bg-win-hover hover:text-win-text transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="1" y1="1" x2="11" y2="11" />
              <line x1="11" y1="1" x2="1" y2="11" />
            </svg>
          </button>
        </div>

        {/* Section tabs */}
        <div className="flex border-b border-win-border bg-win-surface">
          {(['general', 'git', 'about'] as const).map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`relative px-4 py-2.5 text-xs font-medium capitalize transition-colors ${
                activeSection === section
                  ? 'text-win-accent'
                  : 'text-win-text-secondary hover:text-win-text'
              }`}
            >
              {section}
              {activeSection === section && (
                <div className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-win-accent" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5 min-h-[200px]">
          {activeSection === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-win-text-secondary mb-1.5">
                  Default AI Engine
                </label>
                <select
                  value={defaultEngine}
                  onChange={(e) => updateSetting('defaultEngine', e.target.value as EngineId)}
                  className="w-full rounded border border-win-border bg-win-surface px-3 py-2 text-sm text-win-text outline-none focus:border-win-accent"
                >
                  {Object.entries(ENGINE_NAMES).map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-win-text-tertiary">
                  New sessions will use this engine by default
                </p>
              </div>
            </div>
          )}

          {activeSection === 'git' && (
            <div className="space-y-4">
              {/* Git status */}
              <div className="flex items-center gap-2">
                {gitAvailable === true ? (
                  <>
                    <div className="h-2 w-2 rounded-full bg-green-400" />
                    <span className="text-xs text-win-text-secondary">Git detected</span>
                  </>
                ) : gitAvailable === false ? (
                  <>
                    <div className="h-2 w-2 rounded-full bg-red-400" />
                    <span className="text-xs text-win-text-secondary">Git not found</span>
                    <a
                      href="https://git-scm.com/downloads"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-win-accent hover:underline ml-1"
                    >
                      Install
                    </a>
                  </>
                ) : (
                  <span className="text-xs text-win-text-tertiary">Checking...</span>
                )}
              </div>

              {/* Git user config */}
              <div>
                <label className="block text-xs font-medium text-win-text-secondary mb-1.5">
                  user.name
                </label>
                <input
                  type="text"
                  value={gitName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Your Name"
                  className="w-full rounded border border-win-border bg-win-surface px-3 py-2 text-sm text-win-text placeholder:text-win-text-tertiary outline-none focus:border-win-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-win-text-secondary mb-1.5">
                  user.email
                </label>
                <input
                  type="text"
                  value={gitEmail}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded border border-win-border bg-win-surface px-3 py-2 text-sm text-win-text placeholder:text-win-text-tertiary outline-none focus:border-win-accent"
                />
              </div>

              <p className="text-[10px] text-win-text-tertiary">
                These are saved to your global git config (~/.gitconfig)
              </p>
            </div>
          )}

          {activeSection === 'about' && (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-win-text-tertiary">Version</p>
                <p className="text-sm font-medium text-win-text">{appVersion || '...'}</p>
              </div>
              <div>
                <p className="text-xs text-win-text-tertiary">Repository</p>
                <a
                  href="https://github.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-win-accent hover:underline"
                >
                  View on GitHub
                </a>
              </div>
              <div className="pt-2 border-t border-win-border">
                <p className="text-[10px] text-win-text-tertiary">
                  Your Friendly Terminal — AI coding assistant interface
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
