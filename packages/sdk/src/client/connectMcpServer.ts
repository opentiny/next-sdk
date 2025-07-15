import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { streamOptions, sseOptions } from '@opentiny/next'
import type { McpServerInfo } from '../type'
import type { NextClient } from './createClient'

export const connectMcpServer = (options: McpServerInfo) => {
  return (nextClient: NextClient) => {
    const { type, url, token } = options
    let transport = null

    if (type === 'stream') {
      transport = new StreamableHTTPClientTransport(new URL(url), streamOptions(token as string))
    } else if (type === 'sse') {
      transport = new SSEClientTransport(new URL(url), sseOptions(token as string))
    }

    nextClient.nextTransport = transport
  }
}
