import { create } from 'zustand'

export type ChatRole = 'user' | 'assistant' | 'tool' | 'system'

export interface ChatMessage {
  id: string
  terminalId: string
  role: ChatRole
  content: string
  timestamp: number
}

interface ChatSession {
  messages: ChatMessage[]
  /** Raw buffer accumulating PTY output between ready prompts */
  outputBuffer: string
  /** Whether Claude is currently processing (not at ready prompt) */
  isStreaming: boolean
  /** The streaming content being accumulated (for live preview) */
  streamingContent: string
  /** Last text the user sent, used to filter PTY echo */
  lastUserInput: string | null
  /** Whether claude has been auto-started in this session */
  claudeStarted: boolean
  /** Whether the initial shell prompt has been seen */
  shellReady: boolean
}

interface ChatState {
  sessions: Map<string, ChatSession>

  initSession: (terminalId: string) => void
  removeSession: (terminalId: string) => void
  getSession: (terminalId: string) => ChatSession | undefined

  addMessage: (terminalId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  appendToBuffer: (terminalId: string, data: string) => void
  flushBuffer: (terminalId: string, role: ChatRole) => void
  setStreaming: (terminalId: string, streaming: boolean) => void
  setStreamingContent: (terminalId: string, content: string) => void
  setLastUserInput: (terminalId: string, text: string | null) => void
  setClaudeStarted: (terminalId: string, started: boolean) => void
  setShellReady: (terminalId: string, ready: boolean) => void
  clearBuffer: (terminalId: string) => void
  clearAll: () => void
}

let nextMsgId = 1

function createEmptySession(): ChatSession {
  return {
    messages: [],
    outputBuffer: '',
    isStreaming: false,
    streamingContent: '',
    lastUserInput: null,
    claudeStarted: false,
    shellReady: false
  }
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: new Map(),

  initSession: (terminalId) =>
    set((state) => {
      console.log('[ChatStore] initSession called for:', terminalId)
      if (state.sessions.has(terminalId)) {
        console.log('[ChatStore] Session already exists for:', terminalId)
        return state
      }
      const next = new Map(state.sessions)
      next.set(terminalId, createEmptySession())
      console.log('[ChatStore] Session created, total sessions:', next.size)
      return { sessions: next }
    }),

  removeSession: (terminalId) =>
    set((state) => {
      const next = new Map(state.sessions)
      next.delete(terminalId)
      return { sessions: next }
    }),

  getSession: (terminalId) => get().sessions.get(terminalId),

  addMessage: (terminalId, message) =>
    set((state) => {
      const session = state.sessions.get(terminalId)
      if (!session) return state
      const next = new Map(state.sessions)
      const msg: ChatMessage = {
        ...message,
        id: `msg-${nextMsgId++}`,
        timestamp: Date.now()
      }
      next.set(terminalId, {
        ...session,
        messages: [...session.messages, msg]
      })
      return { sessions: next }
    }),

  appendToBuffer: (terminalId, data) =>
    set((state) => {
      const session = state.sessions.get(terminalId)
      if (!session) return state
      const next = new Map(state.sessions)
      next.set(terminalId, {
        ...session,
        outputBuffer: session.outputBuffer + data
      })
      return { sessions: next }
    }),

  flushBuffer: (terminalId, role) => {
    const session = get().sessions.get(terminalId)
    if (!session || !session.outputBuffer.trim()) {
      // Clear buffer even if empty
      set((state) => {
        const s = state.sessions.get(terminalId)
        if (!s) return state
        const next = new Map(state.sessions)
        next.set(terminalId, { ...s, outputBuffer: '', streamingContent: '' })
        return { sessions: next }
      })
      return
    }

    set((state) => {
      const s = state.sessions.get(terminalId)
      if (!s) return state
      const next = new Map(state.sessions)
      const msg: ChatMessage = {
        id: `msg-${nextMsgId++}`,
        terminalId,
        role,
        content: s.outputBuffer,
        timestamp: Date.now()
      }
      next.set(terminalId, {
        ...s,
        messages: [...s.messages, msg],
        outputBuffer: '',
        streamingContent: ''
      })
      return { sessions: next }
    })
  },

  setStreaming: (terminalId, streaming) =>
    set((state) => {
      const session = state.sessions.get(terminalId)
      if (!session) return state
      const next = new Map(state.sessions)
      next.set(terminalId, { ...session, isStreaming: streaming })
      return { sessions: next }
    }),

  setStreamingContent: (terminalId, content) =>
    set((state) => {
      const session = state.sessions.get(terminalId)
      if (!session) return state
      const next = new Map(state.sessions)
      next.set(terminalId, { ...session, streamingContent: content })
      return { sessions: next }
    }),

  setLastUserInput: (terminalId, text) =>
    set((state) => {
      const session = state.sessions.get(terminalId)
      if (!session) return state
      const next = new Map(state.sessions)
      next.set(terminalId, { ...session, lastUserInput: text })
      return { sessions: next }
    }),

  setClaudeStarted: (terminalId, started) =>
    set((state) => {
      const session = state.sessions.get(terminalId)
      if (!session) return state
      const next = new Map(state.sessions)
      next.set(terminalId, { ...session, claudeStarted: started })
      return { sessions: next }
    }),

  setShellReady: (terminalId, ready) =>
    set((state) => {
      const session = state.sessions.get(terminalId)
      if (!session) return state
      const next = new Map(state.sessions)
      next.set(terminalId, { ...session, shellReady: ready })
      return { sessions: next }
    }),

  clearBuffer: (terminalId) =>
    set((state) => {
      const session = state.sessions.get(terminalId)
      if (!session) return state
      const next = new Map(state.sessions)
      next.set(terminalId, { ...session, outputBuffer: '', streamingContent: '' })
      return { sessions: next }
    }),

  clearAll: () => set({ sessions: new Map() })
}))
