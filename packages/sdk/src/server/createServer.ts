import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { CreateMessageRequest, Implementation } from '@modelcontextprotocol/sdk/types.d.ts'
import type { RequestOptions } from '@modelcontextprotocol/sdk/shared/protocol.d.ts'
import type { ServerOptions } from '@modelcontextprotocol/sdk/server/index.d.ts'
import {
  SetLevelRequestSchema,
  PingRequestSchema,
  SubscribeRequestSchema,
  UnsubscribeRequestSchema,
  ListResourcesRequestSchema,
  CreateMessageRequestSchema,
  ListRootsRequestSchema
} from '@modelcontextprotocol/sdk/types.js'
import { MessageChannelServerTransport } from '@opentiny/next'
import { serverTransport } from '../client/createProxy'

const eventMap = {
  subscribe: SubscribeRequestSchema,
  unsubscribe: UnsubscribeRequestSchema,
  listResources: ListResourcesRequestSchema,
  createMessage: CreateMessageRequestSchema,
  listRoots: ListRootsRequestSchema,
  setLevel: SetLevelRequestSchema,
  ping: PingRequestSchema
}

type SeverEventMapKey = keyof typeof eventMap
type ServerEventCallback = Parameters<McpServer['server']['setRequestHandler']>[1]

export class NextServer extends McpServer {
  nextTransport: any = serverTransport
  isMessageChannel = false

  constructor(serverInfo: Implementation, serverOptions: ServerOptions) {
    super(serverInfo, serverOptions)
  }

  use(plugin: (server: this) => void) {
    return plugin(this)
  }

  async connectTransport() {
    // 如果时iframe通信需要先等client端连接再执行server连接
    if (this.isMessageChannel) {
      await (this.nextTransport as MessageChannelServerTransport)?.listen?.()
    }

    return await this.connect(this.nextTransport)
  }

  on(event: SeverEventMapKey, callback: ServerEventCallback) {
    this.server.setRequestHandler(eventMap[event], callback)
  }

  $createMessage(id: string, params: CreateMessageRequest["params"], options?: RequestOptions) {
    return this.server.createMessage({
      $id: id,
      ...params,
    }, options)
  }
}

export const createServer = (serverInfo: Implementation, serverOptions: ServerOptions): NextServer => {
  return new NextServer(serverInfo, serverOptions)
}
