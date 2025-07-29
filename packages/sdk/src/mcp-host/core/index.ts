import OpenAI from 'openai'
import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import type {
  ChatCompleteResponse,
  ToolCall,
  ToolResults,
  Message,
  ChatCompleteRequest,
  StreamHandler
} from '../../type'
import { Role } from '../../type'

/**
 * 最大迭代次数常量
 * @description 限制聊天过程中的最大迭代次数，防止无限循环
 * @type {number}
 * @default 3
 */
const MAX_ITERATION = 3

/**
 * MCP 主机类 - 管理 MCP 客户端和大语言模型的交互
 * @description 负责协调多个 MCP 客户端与大语言模型之间的通信，支持工具调用、资源管理和流式响应
 * @example
 * ```ts
 * // 创建 MCP 主机实例
 * const mcpHost = new MCPHost({
 *   llmOption: {
 *     url: 'https://api.openai.com/v1',
 *     apiKey: 'your-api-key',
 *     model: 'gpt-4'
 *   },
 *   mcpClients: [client1, client2, client3]
 * })
 *
 * // 初始化
 * mcpHost.init()
 *
 * // 开始聊天
 * await mcpHost.chatStream('Hello, how can you help me?', {
 *   onData: (data) => console.log('收到数据:', data),
 *   onDone: () => console.log('聊天完成')
 * })
 * ```
 */
export class MCPHost {
  /**
   * 大语言模型配置选项
   * @description 包含 LLM 的连接配置，如 URL、API Key 等
   * @type {any}
   * @protected
   */
  protected llmOption: any

  /**
   * MCP 客户端数组
   * @description 存储所有已连接的 MCP 客户端实例
   * @type {Client[]}
   * @protected
   */
  protected mcpClients: Client[]

  /**
   * 大语言模型实例
   * @description OpenAI 客户端实例，用于与 LLM 进行通信
   * @type {any}
   * @protected
   */
  protected llm: any

  /**
   * MCP 客户端与工具映射表
   * @description 将每个 MCP 客户端与其提供的工具列表进行映射
   * @type {Map<Client, any>}
   * @protected
   */
  protected mcpClientMap: Map<Client, any> = new Map()

  /**
   * 聊天消息历史
   * @description 存储整个对话过程中的所有消息，包括系统消息、用户消息、助手消息和工具消息
   * @type {any[]}
   * @example
   * ```ts
   * // 消息格式示例
   * [
   *   { role: 'system', content: 'You are a helpful assistant...' },
   *   { role: 'user', content: 'Hello' },
   *   { role: 'assistant', content: 'Hi there!' }
   * ]
   * ```
   */
  messages: any[] = []

  /**
   * 工具名称与客户端映射表
   * @description 将工具名称映射到提供该工具的 MCP 客户端
   * @type {Map<string, Client>}
   * @protected
   */
  protected toolClientMap: Map<string, Client> = new Map<string, Client>()

  /**
   * 当前迭代次数
   * @description 跟踪当前聊天会话的迭代次数，用于防止无限循环
   * @type {number}
   * @protected
   * @default MAX_ITERATION
   */
  protected iteration = MAX_ITERATION

  /**
   * 资源缓存映射表
   * @description 缓存已读取的资源，防止重复读取相同的资源
   * @type {Map<string, any>}
   * @protected
   */
  protected resourcesMap: Map<string, any> = new Map()

  /**
   * 构造函数
   * @description 初始化 MCP 主机实例，设置 LLM 配置和 MCP 客户端，并添加系统消息
   * @param {Object} params - 初始化参数
   * @param {any} params.llmOption - 大语言模型配置选项
   * @param {Client[]} params.mcpClients - MCP 客户端数组
   * @example
   * ```ts
   * const mcpHost = new MCPHost({
   *   llmOption: {
   *     url: 'https://api.openai.com/v1',
   *     apiKey: 'your-api-key',
   *     model: 'gpt-4'
   *   },
   *   mcpClients: [client1, client2]
   * })
   * ```
   */
  constructor({ llmOption, mcpClients }: { llmOption: any; mcpClients: Client[] }) {
    this.llmOption = llmOption
    this.mcpClients = mcpClients
    // 添加系统消息，告知 LLM 它可以访问工具
    this.messages.push({ role: Role.SYSTEM, content: 'You are a helpful assistant with access to tools.' })
  }

  /**
   * 生成 MCP 客户端工具和资源
   * @description 遍历所有 MCP 客户端，获取其提供的工具列表和资源，并建立映射关系
   * @returns {Promise<void>} 无返回值，直接更新内部映射表
   * @example
   * ```ts
   * // 在聊天开始前调用
   * await mcpHost.generateMcpClient()
   *
   * // 现在可以获取所有可用的工具
   * const tools = await mcpHost.getMcpTools()
   * ```
   * @note 该方法会自动处理资源读取和缓存，避免重复读取相同资源
   */
  async generateMcpClient() {
    // 遍历所有 MCP 客户端
    for (let i = 0; i < this.mcpClients.length; i++) {
      const mcpClient = this.mcpClients[i]

      // 获取客户端提供的工具列表
      const { tools } = await mcpClient.listTools()

      // 建立客户端与工具的映射关系
      this.mcpClientMap.set(mcpClient, tools)
      tools.forEach((tool) => {
        this.toolClientMap.set(tool.name, mcpClient)
      })

      // 初始化资源数组
      let resources: any[] = []

      try {
        // 尝试获取客户端提供的资源列表
        const { resources: mcpResources } = await mcpClient.listResources()
        resources = mcpResources
      } catch (error) {
        // 如果没有注册资源就直接忽略
      }

      // 处理每个资源
      for (const resource of resources) {
        if (!this.resourcesMap.has(resource.uri)) {
          // 读取资源内容
          const resourceText = await mcpClient.readResource({ uri: resource.uri })

          // 构建完整的资源对象并缓存
          const result = { ...resource, content: resourceText.contents }
          this.resourcesMap.set(resource.uri, result)

          // 将资源信息添加到大模型系统提示词中
          this.messages.push({ role: Role.SYSTEM, content: JSON.stringify(result) })
        }
      }
    }
  }

  /**
   * 初始化大语言模型客户端
   * @description 创建 OpenAI 客户端实例，配置连接参数
   * @returns {void} 无返回值，直接设置 llm 属性
   * @example
   * ```ts
   * mcpHost.init()
   *
   * // 现在可以开始聊天
   * await mcpHost.chatStream('Hello', handler)
   * ```
   */
  init() {
    this.llm = new OpenAI({
      baseURL: this.llmOption.url,
      apiKey: this.llmOption.apiKey,
      dangerouslyAllowBrowser: true
    })
  }

  /**
   * 验证聊天请求的格式
   * @description 检查请求消息的格式是否正确，确保包含必要的字段
   * @param {ChatCompleteRequest} request - 聊天请求对象
   * @returns {void} 无返回值，验证失败时抛出错误
   * @throws {Error} 当请求格式不正确时抛出错误
   * @example
   * ```ts
   * try {
   *   mcpHost.validateRequest({
   *     messages: [
   *       { role: 'user', content: 'Hello' }
   *     ]
   *   })
   * } catch (error) {
   *   console.error('请求格式错误:', error.message)
   * }
   * ```
   */
  protected validateRequest(request: ChatCompleteRequest): void {
    // 检查消息数组是否存在且不为空
    if (!request.messages || !Array.isArray(request.messages) || request.messages.length === 0) {
      throw new Error('请求必须包含至少一条消息')
    }

    // 验证每条消息的格式
    for (const message of request.messages) {
      if (!message.role || !message.content) {
        throw new Error('每条消息必须包含角色和内容')
      }
    }
  }

  /**
   * 获取所有 MCP 工具列表
   * @description 收集所有 MCP 客户端提供的工具，并转换为 OpenAI 工具格式
   * @returns {Promise<any[]>} 返回 OpenAI 格式的工具数组
   * @example
   *
   * const tools = await mcpHost.getMcpTools()
   * console.log('可用工具:', tools)
   *
   * // 工具格式示例
   * [
   *   {
   *     type: 'function',
   *     function: {
   *       name: 'tool_name',
   *       description: '工具描述',
   *       parameters: { ... }
   *     }
   *   }
   * ]
   * ```
   */
  async getMcpTools() {
    const tools = []
    // 收集所有客户端的工具
    for (const [, value] of this.mcpClientMap.entries()) {
      tools.push(...value)
    }

    // 转换为 OpenAI 工具格式
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
   * 执行大语言模型聊天请求
   * @description 向 LLM 发送聊天请求，包含消息历史和可用工具
   * @returns {Promise<any>} 返回 LLM 的流式响应
   * @example
   *
   * const response = await mcpHost.doLLMChart()
   *
   * // 处理流式响应
   * for await (const chunk of response) {
   *   console.log('收到数据块:', chunk)
   * }
   *
   */
  async doLLMChart() {
    // 获取可用的工具列表
    const openAITools = await this.getMcpTools()

    // 构建请求参数
    const params: {
      messages: any[]
      model: any
      stream: boolean
      tools?: any[]
    } = {
      messages: this.messages,
      model: this.llmOption.model,
      stream: true
    }

    // 如果有可用工具，添加到请求中
    if (openAITools.length > 0) {
      params.tools = openAITools
    }

    // 发送聊天请求
    const completion = await this.llm.chat.completions.create(params)
    return completion
  }

  /**
   * 解析 LLM 回复，提取工具调用和最终回复内容
   * @description 处理流式响应，解析工具调用和文本内容，支持多工具并发调用
   * @param {ChatCompleteResponse} response - LLM 流式响应对象
   * @param {StreamHandler} handler - 流式处理处理器
   * @returns {Promise<[ToolCall[], string]>} 返回工具调用数组和回复内容
   * @example
   *
   * const response = await mcpHost.doLLMChart()
   * const [toolCalls, content] = await mcpHost.parseToolCalls(response, {
   *   onData: (data) => console.log('流式数据:', data)
   * })
   *
   * console.log('工具调用:', toolCalls)
   * console.log('回复内容:', content)
   *
   */
  protected async parseToolCalls(
    response: ChatCompleteResponse,
    handler: StreamHandler
  ): Promise<[ToolCall[], string]> {
    // 用 Map 以 id 归集每个 tool_call，支持多工具并发调用
    // 每次 chunk 到来时，增量合并 arguments，保证每个工具的参数完整
    // 最终返回所有工具调用的数组
    const toolCallMap: Map<string, ToolCall> = new Map()
    let content: string = ''
    let lastToolCallId: string = ''

    // 处理流式响应
    for await (const chunk of response as any) {
      const delta = chunk.choices[0].delta
      const toolResults = delta?.tool_calls
      const contentDelta = delta?.content

      // 处理文本内容
      if (contentDelta) {
        content += contentDelta
        handler.onData({
          delta: {
            role: 'assistant',
            content: contentDelta
          }
        })
      }

      // 处理工具调用
      if (toolResults && toolResults.length > 0) {
        const toolCallDelta = toolResults[0]
        if (toolCallDelta.id) {
          lastToolCallId = toolCallDelta.id
          // 新的 tool_call

          const toolCall = {
            id: toolCallDelta.id,
            type: toolCallDelta.type,
            function: {
              name: toolCallDelta.function?.name || '',
              arguments: toolCallDelta.function?.arguments || ''
            }
          }
          toolCallMap.set(lastToolCallId, toolCall)

          handler.onData({
            delta: {
              role: Role.ASSISTANT,
              content: `\n\n正在调用工具：${toolCall.function.name}\n\n参数：`
            }
          })
        }

        // 如果已存在，合并 arguments
        if (toolCallMap.has(lastToolCallId)) {
          const prev = toolCallMap.get(lastToolCallId)

          if (prev) {
            // 拼接 arguments（增量式）
            prev.function.arguments += toolCallDelta.function?.arguments || ''
            handler.onData({
              delta: {
                role: Role.ASSISTANT,
                content: `${toolCallDelta.function?.arguments}`
              }
            })
          }
        }
      }
    }

    // 发送结束标记
    handler.onData({
      delta: {
        role: 'assistant',
        content: `\n\n`
      }
    })

    // 返回所有 tool_call 组成的数组，以及 content
    return [Array.from(toolCallMap.values()), content]
  }

  /**
   * 执行工具调用
   * @description 根据工具调用请求执行相应的工具，并返回结果
   * @param {ToolCall[]} toolCalls - 工具调用请求列表
   * @param {StreamHandler} handler - 流式处理处理器
   * @returns {Promise<{toolResults: ToolResults, toolCallMessages: Message[]}>} 返回工具调用结果和消息
   * @example
   * ```ts
   * const toolCalls = [
   *   {
   *     id: 'call_1',
   *     type: 'function',
   *     function: {
   *       name: 'get_weather',
   *       arguments: '{"city": "Beijing"}'
   *     }
   *   }
   * ]
   *
   * const { toolResults, toolCallMessages } = await mcpHost.callTools(toolCalls, handler)
   * console.log('工具调用结果:', toolResults)
   * console.log('工具消息:', toolCallMessages)
   * ```
   */
  protected async callTools(
    toolCalls: ToolCall[],
    handler: StreamHandler
  ): Promise<{ toolResults: ToolResults; toolCallMessages: Message[] }> {
    try {
      const toolResults: ToolResults = []
      const toolCallMessages: Message[] = []

      // 遍历所有工具调用
      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name
        const client = this.toolClientMap.get(toolName)

        if (!client) {
          continue
        }

        let toolArgs = {}

        try {
          // 工具参数解析
          toolArgs =
            typeof toolCall.function.arguments === 'string'
              ? JSON.parse(toolCall.function.arguments)
              : toolCall.function.arguments
        } catch (_error) {
          console.error(`Failed to parse tool arguments for ${toolName}:`, _error)
          toolArgs = {}
        }

        // 发送工具调用开始事件
        const beforeToolCall = {
          id: toolCall.id,
          type: toolCall.type,
          function: {
            name: toolCall.function?.name || '',
            arguments: toolCall.function?.arguments || ''
          }
        }

        handler.onData({
          delta: {
            role: Role.TOOL,
            toolCall: beforeToolCall
          }
        })

        // 真正调用工具
        const callToolResult = (await client.callTool({
          name: toolName,
          arguments: toolArgs
        })) as CallToolResult

        // 解析工具调用结果
        const callToolContent = this.getToolCallMessage(callToolResult)
        const message: Message = {
          role: Role.TOOL,
          tool_call_id: toolCall.id,
          content: callToolContent
        }

        // 发送工具调用完成事件
        const toolCallMessage = {
          id: toolCall.id,
          type: toolCall.type,
          callToolContent: callToolContent,
          function: {
            name: toolCall.function?.name || '',
            arguments: toolCall.function?.arguments || ''
          }
        }

        handler.onData({
          delta: {
            role: Role.TOOL,
            toolCall: toolCallMessage
          }
        })

        // 保存结果
        toolCallMessages.push(message)
        toolResults.push({
          call: toolName,
          result: callToolResult
        })
      }

      return { toolResults, toolCallMessages }
    } catch (error) {
      console.error('Error calling tools:', error)
      return { toolResults: [], toolCallMessages: [{ role: Role.ASSISTANT, content: 'call tools failed!' }] }
    }
  }

  /**
   * 解析工具调用结果，拼接为字符串
   * @description 将工具调用的结果内容转换为字符串格式，支持多种内容类型
   * @param {CallToolResult} toolCallResult - 工具调用结果
   * @returns {string} 拼接后的字符串
   * @example
   * ```ts
   * const result = await client.callTool({ name: 'get_weather', arguments: {} })
   * const message = mcpHost.getToolCallMessage(result)
   * console.log('工具调用消息:', message)
   * ```
   */
  protected getToolCallMessage(toolCallResult: CallToolResult): string {
    let str = ''
    // 遍历内容数组，按类型拼接
    if (toolCallResult.content?.length) {
      toolCallResult.content.forEach((item) => {
        switch (item.type) {
          case 'text':
            str += item.text
            break
          case 'image':
          case 'audio':
          case 'resource':
            str += item.data
            break
        }
      })
    }
    return str
  }

  /**
   * 开始流式聊天
   * @description 处理用户输入，执行多轮工具调用和回复生成
   * @param {string | {messages: Message[], options: any}} message - 用户消息或消息对象
   * @param {StreamHandler} handler - 流式处理处理器
   * @returns {Promise<string>} 返回处理结果
   * @example
   * ```ts
   * // 使用字符串消息
   * await mcpHost.chatStream('What is the weather in Beijing?', {
   *   onData: (data) => console.log('收到数据:', data),
   *   onDone: () => console.log('聊天完成')
   * })
   *
   * // 使用消息对象
   * await mcpHost.chatStream({
   *   messages: [{ role: 'user', content: 'Hello' }],
   *   options: { ... }
   * }, handler)
   * ```
   */
  async chatStream(message: string | { messages: Message[]; options: any }, handler: StreamHandler) {
    // 生成 MCP 客户端工具和资源
    await this.generateMcpClient()

    // 添加用户消息到历史记录
    if (typeof message === 'string') {
      this.messages.push({ role: Role.USER, content: message })
    } else {
      this.messages.push(message.messages[message.messages.length - 1])
    }

    // 重置迭代次数
    this.iteration = MAX_ITERATION

    // 执行聊天流程
    await this.processSteamToolCallsAndResponses(handler).catch((error) => {
      console.error('Chat failed:', error)
    })

    return 'ok'
  }

  /**
   * 清空消息历史
   * @description 清除所有聊天消息历史，重置对话状态
   * @returns {void} 无返回值，直接清空消息数组
   * @example
   * ```ts
   * // 清空消息历史
   * mcpHost.clearMessages()
   *
   * // 现在可以开始新的对话
   * await mcpHost.chatStream('Hello', handler)
   * ```
   */
  public clearMessages() {
    this.messages = []
  }

  /**
   * 聊天迭代主流程，支持多轮工具调用和最终回复
   * @description 处理完整的聊天流程，包括 LLM 回复生成、工具调用和最终回复
   * @param {StreamHandler} handler - 流式处理处理器
   * @returns {Promise<void>} 无返回值，处理完成后调用 handler.onDone()
   * @example
   * ```ts
   * await mcpHost.processSteamToolCallsAndResponses({
   *   onData: (data) => console.log('流式数据:', data),
   *   onDone: () => console.log('处理完成')
   * })
   * ```
   */
  protected async processSteamToolCallsAndResponses(handler: StreamHandler): Promise<void> {
    try {
      const toolsCallResults: ToolResults = []

      // 迭代处理，直到达到最大迭代次数或没有工具调用
      while (this.iteration > 0) {
        // 请求 LLM 生成回复
        const response: Response | Error = await this.doLLMChart()

        // 解析工具调用和最终回复
        const [tool_calls, content] = await this.parseToolCalls(response as any, handler)

        // 如果有工具调用
        if (tool_calls.length) {
          // 构造带 tool_calls 的 assistant 消息，符合 OpenAI Function Calling 协议
          const assistantMsg = {
            role: Role.ASSISTANT,
            content: `调用工具:${tool_calls.map((t) => t.function.name).join(',')}`,
            tool_calls: tool_calls.map((tc) => ({
              id: tc.id,
              type: tc.type,
              function: tc.function
            }))
          }
          // 1. 先把带 tool_calls 的 assistant 消息 push 进去
          this.messages.push(assistantMsg)
          // 2. 再 push tool 消息
          const { toolResults, toolCallMessages } = await this.callTools(tool_calls, handler)
          toolsCallResults.push(...toolResults)
          toolCallMessages.forEach((m) => this.messages.push(m))
          this.iteration--
        } else {
          // 没有工具调用，直接回复
          this.messages.push({ role: Role.ASSISTANT, content })
          this.iteration = 0
        }
      }

      // 通知处理完成
      handler.onDone()
    } catch (error) {
      console.error('Chat iteration failed:', error)
      throw error
    }
  }
}
