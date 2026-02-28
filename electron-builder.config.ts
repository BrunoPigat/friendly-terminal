import { Configuration } from 'electron-builder'

const config: Configuration = {
  appId: 'com.yourfriendlyterminal.app',
  productName: 'Your Friendly Terminal',
  directories: {
    buildResources: 'resources',
    output: 'dist'
  },
  files: [
    'out/**/*',
    '!node_modules/**/*',
    'node_modules/node-pty/**/*',
    'node_modules/ws/**/*',
    'node_modules/@modelcontextprotocol/**/*'
  ],
  extraResources: [
    {
      from: 'resources/default-projects',
      to: 'default-projects',
      filter: ['**/*']
    }
  ],
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      }
    ],
    icon: 'resources/logo.png'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Your Friendly Terminal'
  },
  publish: {
    provider: 'github',
    owner: 'BrunoPigat',
    repo: 'friendly-terminal'
  }
}

export default config
