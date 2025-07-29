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

/**
 * 事件映射表，定义了服务器支持的所有事件类型及其对应的请求模式
 * @description 这个映射表用于将事件名称映射到对应的请求验证模式
 * @type {Record<string, any>}
 */
const eventMap = {
  subscribe: SubscribeRequestSchema,
  unsubscribe: UnsubscribeRequestSchema,
  listResources: ListResourcesRequestSchema,
  createMessage: CreateMessageRequestSchema,
  listRoots: ListRootsRequestSchema,
  setLevel: SetLevelRequestSchema,
  ping: PingRequestSchema
}

/**
 * 服务器事件映射键的类型定义
 * @description 定义了服务器支持的事件类型的联合类型
 * @type {keyof typeof eventMap}
 */
type SeverEventMapKey = keyof typeof eventMap

/**
 * 服务器事件回调函数的类型定义
 * @description 定义了事件处理回调函数的参数类型
 * @type {Parameters<McpServer['server']['setRequestHandler']>[1]}
 */
type ServerEventCallback = Parameters<McpServer['server']['setRequestHandler']>[1]

/**
 * NextServer 类 - 扩展了 MCP 服务器的功能
 * @description 提供了额外的插件系统和传输层管理功能
 * @extends {McpServer}
 * @example
 * ```ts
 * // 创建服务器实例
 * const server = new NextServer(serverInfo, serverOptions)
 *
 * // 使用插件
 * server.use(createMessageChannelTransport({
 *   endpoint: 'endpoint',
 *   globalObject: window
 * }))
 *
 * // 连接传输层
 * await server.connectTransport()
 * ```
 */
class NextServer extends McpServer {
  /**
   * 传输层实例
   * @description 存储当前使用的传输层对象，可以是 MessageChannel 或其他传输方式
   * @type {any}
   */
  nextTransport: any

  /**
   * 是否为 MessageChannel 传输方式的标志
   * @description 用于判断当前是否使用 MessageChannel 进行通信
   * @type {boolean}
   * @default false
   */
  isMessageChannel = false

  /**
   * 构造函数
   * @description 初始化 NextServer 实例，继承自 McpServer
   * @param {Implementation} serverInfo - 服务器实现信息
   * @param {ServerOptions} serverOptions - 服务器配置选项
   */
  constructor(serverInfo: Implementation, serverOptions: ServerOptions) {
    super(serverInfo, serverOptions)
  }

  /**
   * 使用插件，用于扩展服务端功能
   * @description 插件系统允许通过函数形式扩展服务器功能，插件函数会接收当前服务器实例作为参数
   * @param {Function} plugin - 插件函数，接收当前server实例作为参数
   * @returns {any} 返回插件函数的执行结果
   * @example
   * ```ts
   * // 使用 MessageChannel 插件建立通信
   * server.use(createMessageChannelTransport({
   *   endpoint: 'endpoint',
   *   globalObject: window
   * }))
   *
   * // 使用自定义插件
   * server.use((server) => {
   *   // 自定义逻辑
   *   console.log('插件已加载')
   * })
   * ```
   */
  use(plugin: (server: this) => void) {
    return plugin(this)
  }

  /**
   * 连接传输层
   * @description 建立与客户端的连接，内部会自动处理连接逻辑。如果是 MessageChannel 传输方式，会先等待客户端连接
   * @returns {Promise<void>} 连接完成的 Promise
   * @example
   * ```ts
   * // 连接传输层
   * await server.connectTransport()
   *
   * // 连接成功后可以开始处理请求
   * server.on('createMessage', (request) => {
   *   // 处理消息创建请求
   * })
   * ```
   */
  async connectTransport() {
    // 如果时iframe通信需要先等client端连接再执行server连接
    if (this.isMessageChannel) {
      await (this.nextTransport as MessageChannelServerTransport)?.listen?.()
    }

    return await this.connect(this.nextTransport)
  }

  /**
   * 注册事件处理器
   * @description 为指定的事件类型注册回调函数，当该类型的事件发生时会被调用
   * @param {SeverEventMapKey} event - 事件类型，必须是预定义的事件类型之一
   * @param {ServerEventCallback} callback - 事件处理回调函数
   * @example
   * ```ts
   * // 注册消息创建事件处理器
   * server.on('createMessage', (request) => {
   *   console.log('收到消息创建请求:', request)
   *   return { success: true }
   * })
   *
   * // 注册订阅事件处理器
   * server.on('subscribe', (request) => {
   *   console.log('收到订阅请求:', request)
   *   return { subscribed: true }
   * })
   * ```
   */
  on(event: SeverEventMapKey, callback: ServerEventCallback) {
    this.server.setRequestHandler(eventMap[event], callback)
  }

  /**
   * 创建消息的便捷方法
   * @description 提供了一个简化的接口来创建消息，自动处理消息 ID 和参数合并
   * @param {string} id - 消息的唯一标识符
   * @param {CreateMessageRequest['params']} params - 消息参数
   * @param {RequestOptions} [options] - 可选的请求选项
   * @returns {Promise<any>} 返回创建消息的结果
   * @example
   * ```ts
   * // 创建简单消息
   * const result = await server.$createMessage('msg-1', {
   *   content: 'Hello World',
   *   role: 'user'
   * })
   *
   * // 创建带选项的消息
   * const result = await server.$createMessage('msg-2', {
   *   content: 'Complex message',
   *   role: 'assistant'
   * }, {
   *   timeout: 5000
   * })
   * ```
   */
  $createMessage(id: string, params: CreateMessageRequest['params'], options?: RequestOptions) {
    return this.server.createMessage(
      {
        $id: id,
        ...params
      },
      options
    )
  }
}

/**
 * 创建 NextServer 实例的工厂函数
 * @description 提供了一个便捷的方式来创建 NextServer 实例，封装了实例化过程
 * @param {Implementation} serverInfo - 服务器实现信息，包含服务器的基本配置
 * @param {ServerOptions} serverOptions - 服务器选项，包含各种配置参数
 * @returns {NextServer} 返回新创建的 NextServer 实例
 * @example
 * ```ts
 * // 创建服务器实例
 * const server = createServer({
 *   name: 'my-server',
 *   version: '1.0.0'
 * }, {
 *   capabilities: {
 *     // 服务器能力配置
 *   }
 * })
 *
 * // 使用服务器
 * server.use(createMessageChannelTransport({
 *   endpoint: 'endpoint',
 *   globalObject: window
 * }))
 *
 * await server.connectTransport()
 * ```
 */
const createServer = (serverInfo: Implementation, serverOptions: ServerOptions): NextServer => {
  return new NextServer(serverInfo, serverOptions)
}

export { createServer, NextServer }
