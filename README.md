<p align="center">
  <img src="resources/logo.png" alt="Friendly Terminal" width="120" height="120" style="border-radius: 20px;" />
</p>

<h1 align="center">Your Friendly Terminal</h1>

<p align="center">
  <strong>AI-powered development for everyone.</strong><br />
  A desktop app that lets anyone build software using Claude Code and Gemini CLI — no coding experience required.
</p>

<p align="center">
  <a href="https://github.com/BrunoPigat/friendly-terminal/releases/latest"><img src="https://img.shields.io/github/v/release/BrunoPigat/friendly-terminal?style=flat-square&color=f59e0b" alt="Latest Release" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-blue?style=flat-square" alt="License" /></a>
  <img src="https://img.shields.io/badge/platform-Windows%2010+-blue?style=flat-square" alt="Platform" />
  <img src="https://img.shields.io/badge/electron-40-47848f?style=flat-square&logo=electron" alt="Electron" />
</p>

<p align="center">
  <a href="https://github.com/BrunoPigat/friendly-terminal/releases/latest">Download for Windows</a> ·
  <a href="#features">Features</a> ·
  <a href="#getting-started">Getting Started</a> ·
  <a href="#development">Development</a>
</p>

---

<p align="center">
  <img src="screenshots/friendly-terminal-project-page-screenshot.jpg" alt="Friendly Terminal — Main project view" width="800" />
</p>

## What is this?

Your Friendly Terminal is a free, open-source desktop application that bridges the gap between you and AI coding assistants. It wraps [Claude Code](https://docs.anthropic.com/en/docs/claude-code) and [Gemini CLI](https://github.com/google-gemini/gemini-cli) in a clean, approachable interface with project management, file browsing, git integration, and more.

**You don't need to be a developer to use it.** If you're a designer, business owner, student, or just someone with ideas — this app lets you turn those ideas into reality by talking to AI.

## Features

### Multi-Engine AI
Switch between **Claude Code** and **Gemini CLI** per terminal. Use the best model for each task — one click to switch.

### Split Terminals
Run up to **4 AI terminals simultaneously**. Have one agent analyze data while another builds a visualization.

<p align="center">
  <img src="screenshots/friendly-terminal-project-page-multiple-terminals-screenshot.jpg" alt="Multiple terminals running side by side" width="700" />
</p>

### Project Management
Organize your work by project. Each project gets its own file explorer, terminals, AI memory, and settings. Switch contexts instantly.

<p align="center">
  <img src="screenshots/friendly-terminal-multi-projects-screenshot.jpg" alt="Multiple projects with tabbed navigation" width="700" />
</p>

### Built-in Git
A visual git panel with plain-English explanations. Stage, commit, push, and pull without memorizing commands.

<p align="center">
  <img src="screenshots/friendly-terminal-project-page-git-tab-screenshot.jpg" alt="Git panel with friendly descriptions" width="700" />
</p>

### MCP Connections
Connect external tools via the [Model Context Protocol](https://modelcontextprotocol.io/). Figma, databases, APIs — plug them in and let AI use them directly.

<p align="center">
  <img src="screenshots/friendly-terminal-project-page-add-mcp-screenshot.jpg" alt="MCP server configuration" width="700" />
</p>

### Skills & Agents
Create reusable AI skills and specialized agents per project. Teach your AI how your project works, then let it do the job.

<p align="center">
  <img src="screenshots/friendly-terminal-project-page-skills-tab-screenshot.jpg" alt="Skills and agents panel" width="700" />
</p>

## Getting Started

### Download

1. Go to the [latest release](https://github.com/BrunoPigat/friendly-terminal/releases/latest)
2. Download the `.exe` installer
3. Double-click, install, done — no terminal commands, no configuration, no prerequisites

### Requirements

- **Windows 10** or later (macOS & Linux coming soon)
- An API key for [Claude](https://console.anthropic.com/) or [Gemini](https://aistudio.google.com/apikey) (the app will guide you through setup)

### First Steps

1. Open the app and create a new project
2. Point it to a folder (or let it create one)
3. Start telling the AI what you want to build

That's it. You're now building with the same tools professional developers use.

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Git](https://git-scm.com/)

### Setup

```bash
# Clone the repository
git clone https://github.com/BrunoPigat/friendly-terminal.git
cd friendly-terminal

# Install dependencies
npm install

# Rebuild native dependencies (node-pty)
npm run rebuild
```

### Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the app in development mode with hot reload |
| `npm run build` | Compile TypeScript to `out/` |
| `npm run build:win` | Build + create Windows installer in `dist/` |
| `npm run rebuild` | Rebuild native dependencies (run after `npm install`) |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run end-to-end tests (Playwright) |
| `npm run lint` | Lint with ESLint |

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | Electron 40 |
| UI | React 19 + Tailwind CSS 4 |
| Language | TypeScript |
| Build | electron-vite + Vite |
| Terminal | xterm.js + node-pty |
| State | Zustand |
| MCP | @modelcontextprotocol/sdk |
| Packaging | electron-builder (NSIS) |
| Testing | Vitest + Playwright |

### Project Structure

```
src/
├── main/                # Main process (Electron + Node.js)
│   ├── ai-engines/      # Claude & Gemini CLI integration
│   ├── filesystem/       # File browser & disk listing
│   ├── git/             # Git operations
│   ├── gui-control/     # WebSocket server for GUI control
│   ├── project/         # Project, MCP, agents & skills management
│   ├── pty/             # Pseudo-terminal management
│   ├── updater/         # Auto-update via GitHub Releases
│   └── index.ts         # App entry point
├── preload/             # Secure IPC bridge (contextBridge)
└── renderer/            # Renderer process (React)
    ├── components/      # UI components
    ├── hooks/           # React hooks
    ├── stores/          # Zustand state stores
    └── App.tsx          # Root component
```

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the GNU General Public License v3.0 — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with care. Open source forever.<br />
  <sub>Powered by <a href="https://www.anthropic.com/claude-code">Claude Code</a> & <a href="https://github.com/google-gemini/gemini-cli">Gemini CLI</a></sub>
</p>
