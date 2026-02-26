#!/usr/bin/env node

/**
 * MCP Server for Your Friendly Terminal GUI control.
 *
 * Provides tools for AI assistants (Claude Code, Gemini CLI) to control
 * the app's right panel: switch tabs, open/close the panel.
 *
 * Communication: reads the GUI server port from a file specified by
 * the YFT_GUI_PORT_FILE environment variable, then connects via WebSocket.
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js')
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js')
const {
  CallToolRequestSchema,
  ListToolsRequestSchema
} = require('@modelcontextprotocol/sdk/types.js')
const { readFileSync } = require('fs')
const { WebSocket } = require('ws')

const VALID_TABS = ['tips', 'agents', 'skills', 'mcps']

/**
 * Sends an action to the GUI server via WebSocket and waits for a response.
 */
function sendAction(port, action) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Connection to GUI server timed out'))
    }, 5000)

    let ws
    try {
      ws = new WebSocket(`ws://127.0.0.1:${port}`)
    } catch (err) {
      clearTimeout(timeout)
      reject(new Error(`Failed to create WebSocket connection: ${err.message}`))
      return
    }

    ws.on('open', () => {
      ws.send(JSON.stringify(action))
    })

    ws.on('message', (data) => {
      clearTimeout(timeout)
      try {
        const result = JSON.parse(data.toString())
        ws.close()
        resolve(result)
      } catch (err) {
        ws.close()
        reject(new Error(`Invalid response from GUI server: ${err.message}`))
      }
    })

    ws.on('error', (err) => {
      clearTimeout(timeout)
      reject(new Error(`WebSocket error: ${err.message}`))
    })
  })
}

/**
 * Reads the GUI server port from the port file.
 */
function readPort() {
  const portFile = process.env.YFT_GUI_PORT_FILE
  if (!portFile) {
    throw new Error('YFT_GUI_PORT_FILE environment variable is not set')
  }

  try {
    const content = readFileSync(portFile, 'utf-8').trim()
    const port = parseInt(content, 10)
    if (isNaN(port) || port <= 0) {
      throw new Error(`Invalid port number: "${content}"`)
    }
    return port
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(
        `Port file not found at "${portFile}". Is Your Friendly Terminal running?`
      )
    }
    throw err
  }
}

async function main() {
  const server = new Server(
    {
      name: 'gui-control',
      version: '1.0.0'
    },
    {
      capabilities: {
        tools: {}
      }
    }
  )

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'switch_tab',
          description:
            'Switch the right panel of Your Friendly Terminal to a specific tab. Available tabs: tips (shows tips.md content), agents (lists AI agents), skills (lists available skills), mcps (shows MCP server configurations).',
          inputSchema: {
            type: 'object',
            properties: {
              tab: {
                type: 'string',
                enum: VALID_TABS,
                description: 'The tab to switch to'
              }
            },
            required: ['tab']
          }
        },
        {
          name: 'open_panel',
          description:
            'Open (expand) the right panel of Your Friendly Terminal if it is currently collapsed.',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'close_panel',
          description:
            'Close (collapse) the right panel of Your Friendly Terminal.',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        }
      ]
    }
  })

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params

    let port
    try {
      port = readPort()
    } catch (err) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${err.message}`
          }
        ],
        isError: true
      }
    }

    let action
    switch (name) {
      case 'switch_tab': {
        const tab = args?.tab
        if (!tab || !VALID_TABS.includes(tab)) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: Invalid tab "${tab}". Must be one of: ${VALID_TABS.join(', ')}`
              }
            ],
            isError: true
          }
        }
        action = { action: 'switch_tab', tab }
        break
      }

      case 'open_panel':
        action = { action: 'open_panel' }
        break

      case 'close_panel':
        action = { action: 'close_panel' }
        break

      default:
        return {
          content: [
            {
              type: 'text',
              text: `Error: Unknown tool "${name}"`
            }
          ],
          isError: true
        }
    }

    try {
      const result = await sendAction(port, action)
      if (result.success) {
        return {
          content: [
            {
              type: 'text',
              text: `Successfully executed ${name}${args?.tab ? ` (tab: ${args.tab})` : ''}`
            }
          ]
        }
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${result.error || 'Unknown error'}`
            }
          ],
          isError: true
        }
      }
    } catch (err) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${err.message}`
          }
        ],
        isError: true
      }
    }
  })

  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
