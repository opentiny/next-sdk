import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import type { Implementation } from '@modelcontextprotocol/sdk/types.d.ts'
import type { ClientOptions } from '@modelcontextprotocol/sdk/client/index.d.ts'
import {
  ToolListChangedNotificationSchema,
  ResourceUpdatedNotificationSchema,
  PromptListChangedNotificationSchema,
  LoggingMessageNotificationSchema,
  CreateMessageRequestSchema,
  ListRootsRequestSchema
} from '@modelcontextprotocol/sdk/types.js'

const notificationEventMap = {
  toolListChanged: ToolListChangedNotificationSchema,
  resourceUpdated: ResourceUpdatedNotificationSchema,
  promptListChanged: PromptListChangedNotificationSchema,
  loggingMessage: LoggingMessageNotificationSchema
}

const requestEventMap = {
  createMessage: CreateMessageRequestSchema,
  listRoots: ListRootsRequestSchema
}

type ClientEventMapKey = keyof typeof notificationEventMap
type ClientEventCallback = Parameters<Client['setNotificationHandler']>[1]
type ClientRequestMapKey = keyof typeof requestEventMap
type ClientRequestCallback = Parameters<Client['setRequestHandler']>[1]

export class NextClient extends Client {
  nextTransport: any
  isMessageChannel = false

  constructor(clientInfo: Implementation, clientOptions: ClientOptions) {
    super(clientInfo, clientOptions)
  }

  // 注册插件
  use(plugin: (client: this) => any) {
    return plugin(this)
  }

  on(event: ClientEventMapKey, callback: ClientEventCallback): void
  on(event: ClientRequestMapKey, callback: ClientRequestCallback): void

  // 注册事件,包括notification以及requestHandle
  on(event: ClientEventMapKey | ClientRequestMapKey, callback: ClientEventCallback | ClientRequestCallback) {
    if (event in notificationEventMap) {
      this.setNotificationHandler(notificationEventMap[event as ClientEventMapKey], callback as ClientEventCallback)
    } else {
      this.setRequestHandler(requestEventMap[event as ClientRequestMapKey], callback as ClientRequestCallback)
    }
  }

  async connectTransport() {
    return await this.connect(this.nextTransport)
  }
}

export const createClient = (clientInfo: Implementation, clientOptions: ClientOptions) => {
  return new NextClient(clientInfo, clientOptions)
}
