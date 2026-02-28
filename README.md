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

Contributions are welcome! This project exists to make AI-powered development accessible to **non-technical users** — designers, business owners, students, and anyone with ideas. Every change should serve that goal.

### Guiding Principle

> If a feature, fix, or improvement doesn't make the experience better for someone who has never opened a terminal before, it needs a strong justification.

Before contributing, ask yourself:
- **Does this reduce friction** for a non-technical user?
- **Does this prevent confusion** or remove a footgun?
- **Is this discoverable** without reading documentation?

### Reporting Issues

Use [GitHub Issues](https://github.com/BrunoPigat/friendly-terminal/issues) to report bugs or suggest features. Before opening a new issue, search existing issues to avoid duplicates.

**Bug reports** should include:

- **What you expected** to happen
- **What actually happened** (include error messages or screenshots if possible)
- **Steps to reproduce** — be specific: _"I opened a project, clicked + New Chat, right-clicked the terminal, and nothing happened"_
- **Environment**: your OS version (e.g. Windows 11 23H2) and the app version (Settings > About)
- **Severity**: does it crash the app, block your workflow, or is it a minor annoyance?

**Feature requests** should explain:

- **The use case**, framed from a non-technical user's perspective. _"As someone who doesn't know git, I want to undo my last change so I don't have to start over"_ is much more actionable than _"Add git revert support"_.
- **Why existing features don't cover it** — maybe the functionality exists but is hard to find, and the real fix is better discoverability.
- **How you imagine it working** — a rough description is fine, no mockups required.

If you're unsure whether something is a bug or a feature request, open it anyway. We'll help sort it out.

### Submitting Changes

1. **Fork** the repository and clone your fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/friendly-terminal.git
   cd friendly-terminal
   npm install && npm run rebuild
   ```
2. **Create a branch** from `master` with a descriptive name that includes the type of change:
   ```bash
   git checkout -b fix/copy-paste-not-working
   git checkout -b feature/theme-selector
   git checkout -b docs/update-contributing-guide
   ```
   Use prefixes like `fix/`, `feature/`, `docs/`, `refactor/`, or `chore/`.
3. **Make your changes** — keep them focused on a single concern. If you find an unrelated bug while working, open a separate issue or PR for it.
4. **Test locally** with `npm run dev`:
   - Verify your change works as expected
   - Check that existing features aren't broken (open a project, start a terminal, use the sidebar, switch themes, etc.)
   - Run `npm run lint` to catch code style issues
   - If tests exist for the area you changed, run `npm test`
5. **Commit** with a clear message. The first line should summarize the change; the body should explain _why_ this change is needed:
   ```bash
   git commit -m "Fix copy from terminal not working

   xterm.js selections are internal canvas state, not native DOM
   selections. The browser's Ctrl+C handler sees nothing to copy.
   Now explicitly reads terminal.getSelection() and writes to
   clipboard via navigator.clipboard API."
   ```
   - Use imperative mood: _"Fix bug"_, not _"Fixed bug"_ or _"Fixes bug"_
   - Keep the first line under 72 characters
   - Reference related issues with `Closes #123` or `Relates to #456`
6. **Push** to your fork and open a **Pull Request** against `master`:
   ```bash
   git push origin fix/copy-paste-not-working
   ```
   Then go to the original repository on GitHub — you'll see a prompt to create a PR.

### Pull Request Guidelines

Your PR description is the first thing reviewers read. A good description speeds up the review and increases the chance of a quick merge.

**Structure your PR description like this:**

```markdown
## Summary
Brief explanation of what this PR does and why.

## User Impact
How does this change improve the experience for a non-technical user?

## Changes
- Bullet list of specific changes made
- One line per logical change

## Test Plan
- [ ] Step-by-step instructions to verify the change
- [ ] Include edge cases you checked
- [ ] Note anything that should be regression-tested

## Screenshots (if applicable)
Before/after screenshots for any visual changes.
```

**General rules:**

- **One concern per PR.** A bug fix and a new feature should be separate PRs, even if you found the bug while building the feature. This makes reviews faster and reverts safer.
- **Keep diffs small.** PRs under 300 lines get reviewed in hours. PRs over 1000 lines get reviewed in days (or never). If your change is large, consider splitting it into a stack of smaller PRs.
- **No drive-by refactors.** If you're fixing a bug, don't also rename variables in unrelated files or add type annotations to code you didn't change. Clean-up PRs are welcome, but they should be separate.
- **Don't break existing UX.** If your change alters how something currently works, call it out explicitly in the description and explain why the new behavior is better for users. Breaking changes without justification will be rejected.
- **Simple > clever.** This codebase is maintained by a small team. Write code that's easy to read, easy to debug, and easy to delete. If a reviewer can't understand your change in 5 minutes, it's too complex.
- **Respond to feedback.** If a reviewer requests changes, address every comment — either make the change or explain why you disagree. Don't leave comments unresolved.

### What We Look For

- Improvements to onboarding and first-run experience
- Better error messages and recovery (users shouldn't see stack traces)
- Accessibility and inclusive design
- Performance improvements that reduce wait times
- Bug fixes that remove paper cuts

### What We'll Push Back On

- Features that add complexity without a clear non-tech user benefit
- Changes that require users to understand technical concepts (git internals, shell syntax, etc.)
- Dependencies that significantly increase bundle size without strong justification
- Cosmetic-only changes with no functional improvement

## License

This project is licensed under the GNU General Public License v3.0 — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with care. Open source forever.<br />
  <sub>Powered by <a href="https://www.anthropic.com/claude-code">Claude Code</a> & <a href="https://github.com/google-gemini/gemini-cli">Gemini CLI</a></sub>
</p>
