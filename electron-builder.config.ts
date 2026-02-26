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
    'node_modules/node-pty/**/*'
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
    icon: 'resources/icon.ico'
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
    owner: '',
    repo: 'your-friendly-terminal'
  }
}

export default config
