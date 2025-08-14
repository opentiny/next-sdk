import type { ChatCompletionResponse } from '@opentiny/tiny-robot-kit'
import type { ChatCompletionRequest } from '@opentiny/tiny-robot-kit'
import type { StreamHandler } from '@opentiny/tiny-robot-kit'
import { BaseModelProvider } from '@opentiny/tiny-robot-kit'
import type { AIModelConfig } from '@opentiny/tiny-robot-kit'
import { reactive } from 'vue'
import { createDeepSeek } from '@ai-sdk/deepseek'
import { streamText } from 'ai'
import { experimental_createMCPClient as createMCPClient, stepCountIs } from 'ai'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { AGENT_ROOT } from '../const'
import { globalConversation } from './utils'

let mcpClient: any

const deepseek = createDeepSeek({
  apiKey: 'sk-trial',
  baseURL: 'https://agent.opentiny.design/api/v1/ai'
})

// 创建nextClient
const createMcpClient = async (sessionId: string) => {
  if (!sessionId) {
    console.error('sessionId is required when create mcpClient')
    return
  }

  const url = new URL(AGENT_ROOT + 'mcp?sessionId=' + sessionId)

  try {
    mcpClient = await createMCPClient({
      transport: new StreamableHTTPClientTransport(url)
    })
  } catch (error) {
    console.error('create mcpClient error', error)
  }
}

const onToolCallChain = (part: any, handler: StreamHandler, lastToolCall: any, isFirstToolCall: boolean) => {
  if (part.type == 'tool-input-start') {
    const infoItem = reactive({
      id: part.id,
      title: part.toolName,
      content: ` \n\n 正在调用工具${part.toolName}，参数：`
    })
    lastToolCall.items.push(infoItem)
    if (isFirstToolCall) {
      handler.onMessage(lastToolCall)
    }
  }

  if (part.type == 'tool-input-delta') {
    const find = lastToolCall.items.find((item: any) => item.id === part.id)
    if (find) {
      find.content += part.delta
    }
  }

  if (part.type == 'tool-result') {
    const find = lastToolCall.items.find((item: any) => item.id === part.toolCallId)
    if (find) {
      find.content += `\n\n 工具调用成功 \n\n  `
    }
  }
}

export class AgentModelProvider extends BaseModelProvider {
  transport: any
  constructor(config: AIModelConfig) {
    super(config)
  }

  /** 同步请示不需要实现 */
  chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    throw new Error('Method not implemented.')
  }

  async chatStream(request: ChatCompletionRequest, handler: StreamHandler): Promise<void> {
    // 验证请求的messages属性，必须是数组，且每个消息必须有role\content属性
    const lastMessage = request.messages[request.messages.length - 1].content

    if (!mcpClient) {
      await createMcpClient(globalConversation.sessionId)
    }

    // 每次会话需要获取最新的工具列表，因为工具是会发生变化的
    const tools = (await mcpClient?.tools?.()) || []

    const lastToolCall = {
      type: 'chain',
      items: []
    }

    const result = streamText({
      model: deepseek('deepseek-ai/DeepSeek-V3'),
      tools,
      prompt: lastMessage,
      stopWhen: stepCountIs(5)
    })

    const content = reactive({
      type: 'markdown',
      content: ''
    })

    let isFirstToolCall = true

    for await (const part of result.fullStream) {
      console.log(part, part.type)

      // 节点开始
      if (part.type === 'text-start') {
        handler.onMessage(content)
      }

      if (part.type.startsWith('tool-')) {
        onToolCallChain(part, handler, lastToolCall, isFirstToolCall)
        isFirstToolCall = false
      }

      if (part.type === 'text-delta') {
        content.content += part.text
      }

      if (part.type === 'text-end') {
        content.content += '\n\n '
      }
    }

    handler.onDone()
  }
}
