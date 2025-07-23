import { MessageChannelClientTransport, MessageChannelServerTransport } from '@opentiny/next'
import { NextClient } from '../client/createClient'
import { NextServer } from '../server/createServer'

export const createMessageChannelTransport = (options: Record<string, any>) => {
  return (nextClientOrServer: NextClient | NextServer) => {
    // 创建本地或者跨iframe的client
    if ((nextClientOrServer as NextClient).nextTransport) {
      nextClientOrServer.nextTransport = new MessageChannelClientTransport(options.endpoint, options.globalObject)
    } else {
      nextClientOrServer.nextTransport = new MessageChannelServerTransport(options.endpoint, options.globalObject)
    }

    nextClientOrServer.isMessageChannel = true
  }
}
