import { useState, useEffect, useRef, useCallback } from 'react'
import { useProjectStore } from '@/stores/project-store'
import { useTerminalStore } from '@/stores/terminal-store'
import { useSettingsStore, type CanvasMode } from '@/stores/settings-store'
import * as api from '@/lib/api'

const YFT_PREAMBLE = `<script>
(function() {
  var _reqId = 0;
  var _pending = {};
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'yft_response' && _pending[e.data.reqId]) {
      _pending[e.data.reqId](e.data);
      delete _pending[e.data.reqId];
    }
  });
  function _request(type, payload) {
    return new Promise(function(resolve) {
      var id = ++_reqId;
      _pending[id] = resolve;
      var msg = Object.assign({ type: type, reqId: id }, payload);
      parent.postMessage(msg, '*');
      setTimeout(function() { if (_pending[id]) { _pending[id]({ error: 'timeout' }); delete _pending[id]; } }, 5000);
    });
  }
  window.yft = {
    sendToTerminal: function(text) {
      parent.postMessage({ type: 'send_to_terminal', text: String(text) }, '*');
    },
    switchTab: function(tab) {
      parent.postMessage({ type: 'switch_tab', tab: String(tab) }, '*');
    },
    setMode: function(mode) {
      parent.postMessage({ type: 'set_canvas_mode', mode: String(mode) }, '*');
    },
    readFile: function(path) {
      return _request('read_file', { path: String(path) }).then(function(r) { return r.error ? null : r.content; });
    },
    readDir: function(path) {
      return _request('read_dir', { path: String(path) }).then(function(r) { return r.error ? null : r.entries; });
    }
  };
})();
</script>`

/**
 * Strips control characters from text to prevent terminal injection.
 */
function sanitizeTerminalText(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '').slice(0, 4096)
}

interface CanvasPanelProps {
  /** Layout mode — affects close button visibility and empty state */
  mode?: CanvasMode
}

export default function CanvasPanel({ mode = 'panel' }: CanvasPanelProps) {
  const activeProject = useProjectStore((s) => s.activeProject)
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const prevPathRef = useRef<string | null>(null)

  // Listen for postMessage from iframe
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      // Validate message comes from our iframe
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return
      const data = event.data
      if (!data || typeof data !== 'object') return

      const iframe = iframeRef.current
      switch (data.type) {
        case 'send_to_terminal': {
          const termId = useTerminalStore.getState().activeTerminalId
          if (termId && typeof data.text === 'string') {
            api.ptyWrite(termId, sanitizeTerminalText(data.text))
          }
          break
        }
        case 'switch_tab': {
          if (typeof data.tab === 'string') {
            useSettingsStore.getState().setRightPanelActiveTab(data.tab as never)
          }
          break
        }
        case 'set_canvas_mode': {
          if (typeof data.mode === 'string' && ['panel', 'full', 'bottom'].includes(data.mode)) {
            useSettingsStore.getState().setCanvasMode(data.mode as CanvasMode)
          }
          break
        }
        case 'read_file': {
          if (typeof data.path === 'string' && data.reqId && iframe?.contentWindow) {
            const project = useProjectStore.getState().activeProject
            // Resolve relative paths against project root
            const filePath = data.path.startsWith('/') || /^[A-Z]:/i.test(data.path)
              ? data.path
              : `${project?.path}/${data.path}`
            api.readFile(filePath).then((content) => {
              iframe.contentWindow!.postMessage({ type: 'yft_response', reqId: data.reqId, content }, '*')
            }).catch(() => {
              iframe.contentWindow!.postMessage({ type: 'yft_response', reqId: data.reqId, error: 'not_found' }, '*')
            })
          }
          break
        }
        case 'read_dir': {
          if (typeof data.path === 'string' && data.reqId && iframe?.contentWindow) {
            const project = useProjectStore.getState().activeProject
            const dirPath = data.path.startsWith('/') || /^[A-Z]:/i.test(data.path)
              ? data.path
              : `${project?.path}/${data.path}`
            api.readDir(dirPath).then((entries) => {
              iframe.contentWindow!.postMessage({ type: 'yft_response', reqId: data.reqId, entries }, '*')
            }).catch(() => {
              iframe.contentWindow!.postMessage({ type: 'yft_response', reqId: data.reqId, error: 'not_found' }, '*')
            })
          }
          break
        }
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  // Load canvas.html and watch for changes
  useEffect(() => {
    if (!activeProject) {
      setContent(null)
      prevPathRef.current = null
      return
    }

    const projectPath = activeProject.path
    const canvasPath = `${projectPath}/canvas.html`

    const load = async () => {
      setLoading(true)
      try {
        const text = await api.readFile(canvasPath)
        setContent(text)
      } catch {
        setContent(null)
      } finally {
        setLoading(false)
      }
    }

    load()

    api.fsWatch(projectPath)
    prevPathRef.current = projectPath

    const unsub = api.onFsChanged((rootPath, changedDir) => {
      if (rootPath !== projectPath) return
      const normalizedChanged = changedDir.replace(/\\/g, '/')
      const normalizedRoot = projectPath.replace(/\\/g, '/')
      if (normalizedChanged === normalizedRoot || changedDir === projectPath) {
        api.readFile(canvasPath).then((text) => {
          setContent(text)
          if (text !== null) {
            const store = useSettingsStore.getState()
            // Only auto-switch to canvas tab when in panel mode
            if (store.canvasMode === 'panel') {
              store.setRightPanelActiveTab('canvas')
            }
          }
        }).catch(() => setContent(null))
      }
    })

    return () => {
      unsub()
    }
  }, [activeProject])

  // Build srcdoc with preamble injected
  const srcdoc = useCallback(() => {
    if (!content) return ''
    // Inject preamble right after <head> or at the start of the document
    const headIdx = content.toLowerCase().indexOf('<head>')
    if (headIdx !== -1) {
      const insertPos = headIdx + 6
      return content.slice(0, insertPos) + YFT_PREAMBLE + content.slice(insertPos)
    }
    // No <head> tag — prepend preamble
    return YFT_PREAMBLE + content
  }, [content])

  const handleClose = useCallback(() => {
    useSettingsStore.getState().setCanvasMode('panel')
    useSettingsStore.getState().setRightPanelActiveTab('canvas')
  }, [])

  if (!activeProject) {
    return (
      <div className="p-4 text-sm text-win-text-tertiary">
        Select a project to use Canvas.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4 text-sm text-win-text-tertiary">Loading canvas...</div>
    )
  }

  if (content === null) {
    // In full/bottom mode, show a minimal empty state
    if (mode !== 'panel') {
      return (
        <div className="flex flex-1 items-center justify-center text-sm text-win-text-tertiary">
          <p>No canvas.html found. Ask your AI assistant to create one.</p>
        </div>
      )
    }
    return (
      <div className="flex flex-col items-center gap-3 p-6 text-center">
        <div className="text-win-text-tertiary">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z" />
            <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7" />
            <path d="M14.5 17.5 4.5 15" />
          </svg>
        </div>
        <p className="text-sm text-win-text-secondary font-medium">Canvas</p>
        <p className="text-xs text-win-text-tertiary leading-relaxed max-w-[240px]">
          Ask your AI assistant to create a dashboard, form, visualization, or any custom UI.
          It will appear here as an interactive HTML page.
        </p>
      </div>
    )
  }

  return (
    <div className="relative flex flex-1 flex-col h-full overflow-hidden">
      {/* Close button for full/bottom modes */}
      {mode !== 'panel' && (
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 z-10 flex items-center gap-1.5 rounded-md border border-win-border bg-win-surface/90 backdrop-blur-sm px-2.5 py-1.5 text-xs font-medium text-win-text-secondary hover:bg-win-hover hover:text-win-text transition-colors shadow-sm"
          title="Move canvas to panel"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
      <iframe
        ref={iframeRef}
        srcDoc={srcdoc()}
        sandbox="allow-scripts"
        className="w-full h-full border-0 flex-1"
        title="Canvas"
      />
    </div>
  )
}
