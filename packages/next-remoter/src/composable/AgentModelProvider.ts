import type { ChatCompletionResponse } from '@opentiny/tiny-robot-kit'
import type { ChatCompletionRequest } from '@opentiny/tiny-robot-kit'
import type { StreamHandler } from '@opentiny/tiny-robot-kit'
import { BaseModelProvider } from '@opentiny/tiny-robot-kit'
import type { AIModelConfig } from '@opentiny/tiny-robot-kit'
import { reactive, Ref } from 'vue'
import { AgentModelProvider } from '@opentiny/next-sdk'

const onToolCallChain = (part: any, handler: StreamHandler, lastToolCall: any, isFirstToolCall: boolean) => {
  if (part.type == 'tool-input-start') {
    const infoItem = reactive({
      id: part.id,
      title: part.toolName,
      content: ` \n\n 正在调用工具${part.toolName}，参数：`
    })
    lastToolCall.items.push(infoItem)
    if (isFirstToolCall) {
      handler.onMessage && handler.onMessage(lastToolCall)
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

export class CustomAgentModelProvider extends BaseModelProvider {
  transport: any
  agent: AgentModelProvider
  constructor(config: AIModelConfig, sessionId: Ref<string>, agentRoot: Ref<string>) {
    super(config)
    this.agent = new AgentModelProvider({
      llmConfig: {
        apiKey: 'sk-trial',
        baseURL: 'https://agent.opentiny.design/api/v1/ai',
        providerType: 'deepseek'
      },
      mcpServers: [
        {
          type: 'streamableHttp',
          url: `${agentRoot.value}mcp?sessionId=${sessionId.value}`
        }
      ]
    })
  }

  /** 同步请求不需要实现 */
  chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    throw new Error('Method not implemented.')
  }

  async chatStream(request: ChatCompletionRequest, handler: StreamHandler): Promise<void> {
    const content = reactive({
      type: 'markdown',
      content: ''
    })

    let isFirstToolCall = true
    const lastToolCall = {
      type: 'chain',
      items: []
    }

    const result = await this.agent.chatStream({
      messages: request.messages,
      model: 'deepseek-ai/DeepSeek-V3',
      abortSignal: request.options?.signal
    })

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
