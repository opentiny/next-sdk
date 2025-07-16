import OpenAI from 'openai'
import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import type { ChatCompleteResponse, ToolCall, ToolResults, Message, ChatCompleteRequest } from '../../type'
import { Role } from '../../type'

const MAX_ITERATION = 3

export class MCPHost {
  protected llmOption: any
  protected mcpClients: Client[]
  protected llm: any
  protected mcpClientMap: Map<string, any> = new Map()
  messages: any[] = []
  protected toolClientMap: Map<string, Client> = new Map<string, Client>()
  // 用于流式输出的 TransformStream
  protected transformStream = new TransformStream()
  protected iteration = MAX_ITERATION // 最大迭代次数

  constructor({ llmOption, mcpClients }: { llmOption: any; mcpClients: Client[] }) {
    this.llmOption = llmOption
    this.mcpClients = mcpClients
    this.messages.push({ role: Role.SYSTEM, content: 'You are a helpful assistant with access to tools.' })
  }

  async generateMcpClient() {
    for (let i = 0; i < this.mcpClients.length; i++) {
      const mcpClient = this.mcpClients[i]
      const { tools } = await mcpClient.listTools()
      this.mcpClientMap.set(mcpClient.name, tools)
      tools.forEach((tool) => {
        this.toolClientMap.set(tool.name, mcpClient)
      })
    }
  }

  init() {
    this.llm = new OpenAI({
      baseURL: this.llmOption.url,
      apiKey: this.llmOption.apiKey,
      dangerouslyAllowBrowser: true
    })
  }

  protected validateRequest(request: ChatCompleteRequest): void {
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

  async getMcpTools() {
    const tools = []
    for (const [, value] of this.mcpClientMap.entries()) {
      tools.push(...value)
    }
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

  async doLLMChart() {
    const openAITools = await this.getMcpTools()
    const completion = await this.llm.chat.completions.create({
      messages: this.messages,
      model: this.llmOption.model,
      tools: openAITools,
      stream: true
    })
    return completion
  }

  /**
   * 解析 LLM 回复，提取工具调用和最终回复内容
   * @param response LLM 回复对象
   * @returns [工具调用数组, 回复内容]
   */
  protected async parseToolCalls(response: ChatCompleteResponse): Promise<[ToolCall[], string]> {
    // 用 Map 以 id 归集每个 tool_call，支持多工具并发调用
    // 每次 chunk 到来时，增量合并 arguments，保证每个工具的参数完整
    // 最终返回所有工具调用的数组
    const toolCallMap: Map<string, ToolCall> = new Map()
    let content: string = ''
    let lastToolCallId: string = ''

    for await (const chunk of response) {
      const delta = chunk.choices[0].delta
      const toolResults = delta?.tool_calls
      const contentDelta = delta?.content
      if (contentDelta) {
        content += contentDelta
      }
      if (toolResults && toolResults.length > 0) {
        const toolCallDelta = toolResults[0]
        if (toolCallDelta.id) {
          lastToolCallId = toolCallDelta.id
          // 新的 tool_call
          toolCallMap.set(lastToolCallId, {
            id: toolCallDelta.id,
            type: toolCallDelta.type,
            function: {
              name: toolCallDelta.function?.name || '',
              arguments: toolCallDelta.function?.arguments || ''
            }
          })
        }

        // 如果已存在，合并 arguments
        if (toolCallMap.has(lastToolCallId)) {
          const prev = toolCallMap.get(lastToolCallId)
          // 拼接 arguments（增量式）
          prev.function.arguments += toolCallDelta.function?.arguments || ''
        }
      }
    }

    // 返回所有 tool_call 组成的数组，以及 content
    return [Array.from(toolCallMap.values()), content]
  }

  /**
   * 执行工具调用
   * @param toolCalls 工具调用请求列表
   * @returns 工具调用结果和消息
   */
  protected async callTools(toolCalls: ToolCall[]): Promise<{ toolResults: ToolResults; toolCallMessages: Message[] }> {
    try {
      const toolResults: ToolResults = []
      const toolCallMessages: Message[] = []

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

        // 真正调用工具
        const callToolResult = (await client.callTool({
          name: toolName,
          arguments: toolArgs
        })) as CallToolResult
        const callToolContent = this.getToolCallMessage(callToolResult)
        const message: Message = {
          role: Role.TOOL,
          tool_call_id: toolCall.id,
          content: callToolContent
        }

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
   * 向流式输出写入消息增量（如工具调用过程）
   * @param messageDeltaContent 增量内容
   * @param role 角色
   * @param extra 附加信息
   */
  protected async writeMessageDelta(
    messageDeltaContent: string,
    role: string = 'assistant',
    extra?: any
  ): Promise<void> {
    // 获取 TransformStream 的可写入流的写入器
    const writer = this.transformStream.writable.getWriter()

    try {
      // 等待写入器准备就绪
      await writer.ready

      // 构造消息增量对象,包含角色、内容和额外信息
      const messageDelta = {
        choices: [
          {
            delta: {
              role, // 消息角色(assistant/user等)
              content: messageDeltaContent, // 消息内容
              extra // 额外信息(工具调用等)
            }
          }
        ]
      }

      // 将消息增量对象转换为SSE格式的数据
      // 1. 使用 TextEncoder 将字符串转换为 UTF-8 编码的字节
      // 2. 添加 'data: ' 前缀和换行符,符合 SSE 规范
      await writer.write(new TextEncoder().encode('data: ' + JSON.stringify(messageDelta) + '\n\n'))
    } finally {
      // 释放写入器锁,允许其他代码获取写入器
      writer.releaseLock()
    }
  }

  /**
   * 解析工具调用结果，拼接为字符串
   * @param toolCallResult 工具调用结果
   * @returns 拼接后的字符串
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

  async chatStream(message: string | { messages: Message[]; options: any }) {
    await this.generateMcpClient()
    if (typeof message === 'string') {
      this.messages.push({ role: Role.USER, content: message })
    } else {
      this.messages.push(message.messages[message.messages.length - 1])
    }

    this.iteration = MAX_ITERATION
    this.processSteamToolCallsAndResponses().catch((error) => {
      console.error('Chat failed:', error)
      this.transformStream.writable.abort(error)
    })

    return this.transformStream.readable
  }

  /**
   * 聊天迭代主流程，支持多轮工具调用和最终回复
   */
  protected async processSteamToolCallsAndResponses(): Promise<void> {
    try {
      const toolsCallResults: ToolResults = []

      while (this.iteration > 0) {
        // 请求 LLM 生成回复
        const response: Response | Error = await this.doLLMChart()

        // 解析工具调用和最终回复
        const [tool_calls, content] = await this.parseToolCalls(response as ChatCompleteResponse)

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
          const { toolResults, toolCallMessages } = await this.callTools(tool_calls)
          toolsCallResults.push(...toolResults)
          toolCallMessages.forEach((m) => this.messages.push(m))
          this.iteration--
        } else {
          // 没有工具调用，直接回复
          this.messages.push({ role: Role.ASSISTANT, content })
          this.iteration = 0
        }
      }
    } catch (error) {
      console.error('Chat iteration failed:', error)
      throw error
    }
  }
}
