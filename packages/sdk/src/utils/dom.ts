import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { MessageChannelClientTransport } from '@opentiny/next'

export const isWindow = () => {
  return typeof window !== 'undefined'
}

export const createCloseTransport = (
  client: Client,
  transport: StreamableHTTPClientTransport | SSEClientTransport | MessageChannelClientTransport | null
) => {
  const close = async () => {
    if (transport instanceof StreamableHTTPClientTransport) {
      await transport?.terminateSession()
    } else if (transport instanceof SSEClientTransport) {
      await transport?.close()
    }

    client.close()
  }

  if (isWindow()) {
    window.addEventListener('beforeunload', close)
    window.addEventListener('pagehide', close)
  }
}
