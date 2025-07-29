import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import type { Implementation } from '@modelcontextprotocol/sdk/types.d.ts'
import type { ClientOptions } from '@modelcontextprotocol/sdk/client/index.d.ts'
import {
  ToolListChangedNotificationSchema,
  ResourceUpdatedNotificationSchema,
  PromptListChangedNotificationSchema,
  LoggingMessageNotificationSchema,
  CreateMessageRequestSchema,
  ListRootsRequestSchema,
  ElicitRequestSchema,
  CallToolRequest,
  CallToolResultSchema,
  CompatibilityCallToolResultSchema
} from '@modelcontextprotocol/sdk/types.js'
import { RequestOptions } from '@modelcontextprotocol/sdk/shared/protocol.js'

/**
 * 通知事件映射表，用于将事件名称映射到对应的Schema
 */
const notificationEventMap = {
  toolListChanged: ToolListChangedNotificationSchema,
  resourceUpdated: ResourceUpdatedNotificationSchema,
  promptListChanged: PromptListChangedNotificationSchema,
  loggingMessage: LoggingMessageNotificationSchema
}

/**
 * 请求事件映射表，用于将请求名称映射到对应的Schema
 */
const requestEventMap = {
  createMessage: CreateMessageRequestSchema,
  listRoots: ListRootsRequestSchema,
  elicit: ElicitRequestSchema
}

type ClientEventMapKey = keyof typeof notificationEventMap
type ClientEventCallback = Parameters<Client['setNotificationHandler']>[1]
type ClientRequestMapKey = keyof typeof requestEventMap
type ClientRequestCallback = Parameters<Client['setRequestHandler']>[1]

/**
 * NextClient类，继承自MCP Client，提供增强的功能
 * 包括插件系统、OpenAI工具格式转换、采样监听等功能
 */
export class NextClient extends Client {
  /**
   * 传输层对象，用于处理客户端与服务器之间的通信
   */
  nextTransport: any = null

  /**
   * 标识是否使用消息通道传输
   */
  isMessageChannel = false

  /**
   * 采样映射表，用于存储不同ID对应的回调函数
   */
  samplingMap: Map<string, ClientEventCallback | ClientRequestCallback>

  /**
   * 构造函数，初始化NextClient实例
   * @param clientInfo - 客户端实现信息
   * @param clientOptions - 客户端配置选项
   */
  constructor(clientInfo: Implementation, clientOptions: ClientOptions) {
    super(clientInfo, clientOptions)
    this.samplingMap = new Map()
    this.initSamplingListen()
  }

  /**
   * 注册插件，允许扩展客户端功能
   * @param plugin - 插件函数，接收客户端实例作为参数
   * @returns 插件执行的结果
   */
  use(plugin: (client: this) => any) {
    return plugin(this)
  }

  /**
   * 获取OpenAI协议格式的工具列表（FunctionCall格式）
   * 将MCP工具格式转换为OpenAI Function Calling格式
   * @returns Promise<Array> 返回OpenAI格式的工具列表
   */
  async getOpenAITools() {
    const { tools } = await this.listTools()
    const openAITools = tools.map((tool: any) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema
      }
    }))
    return openAITools
  }

  /**
   * 事件监听器重载方法
   * 支持监听通知事件和请求事件
   */
  on(event: ClientEventMapKey, callback: ClientEventCallback): void
  on(event: ClientRequestMapKey, callback: ClientRequestCallback): void

  /**
   * 注册事件监听器，包括通知事件和请求处理事件
   * @param event - 事件名称，可以是通知事件或请求事件
   * @param callback - 事件回调函数
   */
  on(event: ClientEventMapKey | ClientRequestMapKey, callback: ClientEventCallback | ClientRequestCallback) {
    if (event in notificationEventMap) {
      this.setNotificationHandler(notificationEventMap[event as ClientEventMapKey], callback as ClientEventCallback)
    } else {
      this.setRequestHandler(requestEventMap[event as ClientRequestMapKey], callback as ClientRequestCallback)
    }
  }

  /**
   * 初始化采样监听器
   * 设置CreateMessageRequest的处理函数，用于处理采样相关的请求
   */
  initSamplingListen() {
    this.setRequestHandler(CreateMessageRequestSchema, (request, extra) => {
      const { $id: id } = request?.params || {}
      const cb = this.samplingMap.get(id as string) as any

      return cb(request, extra)
    })
  }

  /**
   * 注册采样回调函数
   * @param id - 采样ID，用于标识特定的采样回调
   * @param callback - 采样回调函数
   */
  onSampling(id: string, callback: ClientEventCallback | ClientRequestCallback) {
    this.samplingMap.set(id, callback)
  }

  /**
   * 调用工具，返回一个promise以及abort方法
   * 提供可中断的工具调用功能
   * @param params - 工具调用参数
   * @param resultSchema - 结果Schema，可选参数
   * @param options - 请求选项，可选参数
   * @returns {{ toolResultPromise: Promise<any>, controller: AbortController }} 返回一个包含promise和controller对象
   */
  $callTool(
    params: CallToolRequest['params'],
    resultSchema?: typeof CallToolResultSchema | typeof CompatibilityCallToolResultSchema,
    options?: RequestOptions
  ) {
    const controller = new AbortController()
    const toolResultPromise = this.callTool(params, resultSchema, {
      ...options,
      signal: controller.signal
    })

    return {
      toolResultPromise,
      controller
    }
  }

  /**
   * 连接传输层
   * 使用内部设置的nextTransport进行连接，无需考虑具体连接细节
   * @returns Promise<any> 连接结果
   */
  async connectTransport() {
    return await this.connect(this.nextTransport)
  }
}

/**
 * 创建NextClient实例的工厂函数
 * @param clientInfo - 客户端实现信息
 * @param clientOptions - 客户端配置选项
 * @returns NextClient 返回一个新的NextClient实例
 */
export const createClient = (clientInfo: Implementation, clientOptions: ClientOptions) => {
  return new NextClient(clientInfo, clientOptions)
}
