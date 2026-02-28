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
    },
    {
      from: 'resources/icon.ico',
      to: 'icon.ico'
    },
    {
      from: 'resources/logo.png',
      to: 'logo.png'
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
    shortcutName: 'Your Friendly Terminal',
    installerIcon: 'resources/icon.ico',
    uninstallerIcon: 'resources/icon.ico',
    installerHeader: 'resources/installer/header.bmp',
    installerSidebar: 'resources/installer/sidebar.bmp',
    uninstallerSidebar: 'resources/installer/sidebar.bmp',
    include: 'resources/installer/installer.nsh'
  },
  publish: {
    provider: 'github',
    owner: 'BrunoPigat',
    repo: 'friendly-terminal'
  }
}

export default config
