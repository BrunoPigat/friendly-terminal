# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Your Friendly Terminal is an Electron-based desktop application that provides a friendly interface for AI coding assistants (Claude Code and Gemini CLI). It bridges chat-style interaction with terminal commands, allowing users to interact with AI assistants through both a chat interface and raw terminal output.

## Build & Development Commands

### Development
```bash
npm run dev              # Start electron-vite dev server with hot reload
```

### Building
```bash
npm run build            # Build the application (compiles to out/)
npm run build:win        # Build + create Windows installer (outputs to dist/)
npm run rebuild          # Rebuild native dependencies (node-pty)
```

### Testing
```bash
npm test                 # Run unit tests with vitest
npm run test:e2e         # Run end-to-end tests with Playwright
npm run lint             # Run ESLint
```

## Architecture

### Three-Process Electron Architecture

1. **Main Process** (`src/main/`): Node.js process managing the app lifecycle, native modules, and IPC
2. **Preload Script** (`src/preload/`): Secure bridge exposing specific IPC APIs to renderer via `contextBridge`
3. **Renderer Process** (`src/renderer/`): React UI running in Chromium, communicating via the preload-exposed API

### Key Subsystems

#### PTY Management (`src/main/pty/`)
- `pty-manager.ts`: Manages pseudo-terminal instances using `node-pty`
- `pty-ipc.ts`: IPC handlers for PTY operations (spawn, write, resize, kill)
- Each terminal gets a unique ID and spawns either PowerShell (Windows) or bash/zsh (Unix)
- PTY data flows: Main (node-pty) → IPC events → Renderer (xterm.js or chat parser)

#### AI Engine Integration (`src/main/ai-engines/`)
- `engine-registry.ts`: Detects available AI CLI tools (claude, gemini) via PATH lookup
- `command-dictionary.ts`: Maps high-level intents (start-session, add-file, add-mcp) to engine-specific commands
- `claude-engine.ts` / `gemini-engine.ts`: Engine-specific configuration
- Commands are either **shell-level** (spawn new process) or **in-session** (slash commands typed into REPL)

#### Project & MCP Management (`src/main/project/`)
- `project-manager.ts`: Creates/lists/deletes project directories under `<userData>/projects`
- `mcp-config.ts`: Manages `.mcp.json` files (MCP server configurations)
  - Also syncs to `.gemini/settings.json` for Gemini CLI compatibility
- Each project is a directory that can contain MCP server definitions

#### Chat-PTY Bridge (`src/renderer/hooks/useChatPtyBridge.ts`)
- **Critical component**: Parses PTY output in real-time to extract AI assistant messages
- Detects ready prompts (`>` or `❯`) to know when Claude/Gemini is waiting for input
- Filters out terminal echo and ANSI codes to create clean chat messages
- Auto-starts Claude Code when a new chat terminal is created
- Message roles: `user` (input), `assistant` (AI response), `tool` (approval prompts), `system` (startup/exit)

#### State Management (Zustand stores)
- `terminal-store.ts`: Terminal tabs, active terminal, view mode (chat vs raw terminal)
- `chat-store.ts`: Chat messages per terminal, streaming state, output buffers
- `project-store.ts`: Active project, project list
- `settings-store.ts`: User preferences (default engine, sidebar width)

### File Browser & Filesystem (`src/main/filesystem/`)
- `disk-service.ts`: Lists available drives (Windows-specific logic using `fsutil fsinfo drives`)
- `tree-service.ts`: Recursively reads directory structures
- `fs-ipc.ts`: IPC handlers + file watching with debounced change events

## Important Implementation Details

### Node-pty as External Dependency
- `node-pty` is externalized in `electron.vite.config.ts` and must be included in `electron-builder.config.ts`
- After installing/updating node-pty, run `npm run rebuild` to compile native bindings for Electron

### Terminal View Modes
Each terminal has a `viewMode`:
- `chat`: Parsed chat UI (useChatPtyBridge processes output)
- `terminal`: Raw xterm.js terminal with full ANSI rendering

### IPC Communication Pattern
Main ↔ Renderer communication follows this flow:
1. Renderer calls `window.api.methodName()` (from preload-exposed API)
2. Preload forwards to `ipcRenderer.invoke('channel:method', ...args)`
3. Main handles via `ipcMain.handle('channel:method', async (event, ...args) => { ... })`
4. For events (PTY data, FS changes), Main sends via `mainWindow.webContents.send('channel:event', ...args)`
5. Preload exposes listeners as `onEventName(callback)` that return unsubscribe functions

### AI Engine Command Execution
When starting a chat session:
1. Renderer requests command via `api.getCommand(engineId, 'start-session')`
2. Main consults `command-dictionary.ts` to get the shell command
3. Terminal spawns PTY with that command (e.g., `claude --dangerously-skip-permissions`)
4. Chat bridge auto-detects ready state and manages message flow

### MCP Server Configuration
- Stored in project root as `.mcp.json` with format: `{ "mcpServers": { "name": { "command": "...", "args": [...], "env": {...} } } }`
- Also synced to `.gemini/settings.json` for Gemini CLI
- Can be edited via UI (MCPServerForm component) or manually

### Default Permissions
On project creation, `createDefaultPermissions()` auto-allows GUI MCP tools per engine:
- **Claude**: `.claude/settings.local.json` → `permissions.allow: ["mcp__gui-control__*"]`
- **Gemini**: `.gemini/settings.json` → `trust: true` on the gui-control server entry

### File Browser Context Integration
- Files show an `@` button on hover → writes `@<project-relative-path> ` into the active terminal (no newline, user continues composing)
- Directories show `+ ctx` button → writes `/add-dir <path>\n` (executes immediately)
- Both Claude and Gemini use the `@filePath` syntax for file context references
- Paths are relative to the project root with forward slashes (e.g., `@src/index.ts`)

### Live Panel Reloading
- Skills and Agents tabs auto-reload when files change in their respective directories (`.claude/skills/`, `.claude/agents/`, etc.)
- Uses the existing recursive `fs:watch` on the project root + `fs:changed` event filtering

## Project Structure

```
src/
├── main/           # Main process (Node.js)
│   ├── ai-engines/    # AI CLI detection & command mapping
│   ├── filesystem/    # File browser & disk listing
│   ├── project/       # Project & MCP management
│   ├── pty/          # PTY process management
│   ├── updater/      # Auto-updater (electron-updater)
│   ├── util/         # Path utilities
│   └── index.ts      # App entry point
├── preload/        # Preload script (secure IPC bridge)
│   ├── index.ts
│   └── types.ts      # TypeScript API definitions
└── renderer/       # Renderer process (React UI)
    ├── components/    # React components
    │   ├── chat/       # Chat view & input
    │   ├── layout/     # App shell, sidebar, title bar
    │   ├── project/    # Project & MCP UI
    │   ├── sidebar/    # File browser, folder tree
    │   └── terminal/   # Terminal tabs & xterm.js instance
    ├── hooks/         # Custom React hooks
    ├── lib/           # Utilities (ANSI parsing, API wrapper)
    ├── stores/        # Zustand state management
    ├── App.tsx
    └── main.tsx
```

## Common Development Patterns

### Adding a New IPC Handler
1. Add method signature to `IElectronAPI` interface in `src/preload/types.ts`
2. Implement preload wrapper in `src/preload/index.ts`
3. Add main handler in appropriate `-ipc.ts` file (or `src/main/index.ts` for globals)
4. Use typed wrapper in `src/renderer/lib/api.ts` if needed

### Creating a New Terminal
```typescript
const id = generateTerminalId()
addTerminal({
  id,
  ptyId: null,  // Will be assigned when PTY spawns
  name: 'Terminal Name',
  engine: 'claude',
  isActive: true,
  cwd: '/path/to/working/directory',
  viewMode: 'chat'  // or 'terminal'
})
initSession(id)  // Initialize chat session for chat view mode
```

### Working with Chat Messages
- Always initialize session before sending messages: `useChatStore.getState().initSession(terminalId)`
- Chat bridge (`useChatPtyBridge`) must be mounted for PTY→chat parsing to work
- User input is sent via `api.ptyWrite(terminalId, text + '\n')`
- Bridge automatically detects when AI is ready and flushes messages

## Configuration Files

- `electron.vite.config.ts`: Vite configuration for main, preload, renderer processes
- `electron-builder.config.ts`: Build configuration for Windows installer (NSIS)
- `tsconfig.json`, `tsconfig.node.json`, `tsconfig.web.json`: TypeScript configurations
- `package.json`: Dependencies and npm scripts

## Native Dependencies

This project uses `node-pty` which requires native compilation. When working with this dependency:
1. Always run `npm run rebuild` after installing or updating it
2. Ensure the correct Node.js version is used (match Electron's Node version)
3. On Windows, may require Visual Studio Build Tools

### ConPTY Window Close Crash (Windows)
On Windows, ConPTY crashes the entire Electron process (`0xC000041D` / `STATUS_FATAL_APP_EXIT`) if a PTY process is alive during native `BrowserWindow` destruction. This affects multi-window scenarios (pop-out projects).

**Solution** (in `setupWindow`, `src/main/index.ts`):
- Secondary window close is intercepted with `e.preventDefault()`
- PTYs owned by the window are **killed first** while the window is still alive
- After a 300ms delay (for ConPTY native cleanup), `win.destroy()` is called
- The last window closing only **detaches** PTY callbacks (actual kill happens in `window-all-closed` / `before-quit`)

**Key rule**: Never let a window with live ConPTY processes be destroyed directly. Always kill PTYs before destroying the window, or detach and defer kill.

## Auto-Updates

- Uses `electron-updater` with GitHub releases as the provider
- Configured in `electron-builder.config.ts` under `publish` field
- Update flow: Check → Download → Prompt user → Quit and install
- Main process code in `src/main/updater/auto-updater.ts`
