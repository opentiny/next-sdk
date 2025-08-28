import type { ChatCompletionResponse } from '@opentiny/tiny-robot-kit'
import type { ChatCompletionRequest } from '@opentiny/tiny-robot-kit'
import type { StreamHandler } from '@opentiny/tiny-robot-kit'
import { BaseModelProvider } from '@opentiny/tiny-robot-kit'
import type { AIModelConfig } from '@opentiny/tiny-robot-kit'
import { reactive, Ref } from 'vue'
import { AgentModelProvider } from '@opentiny/next-sdk'

const onToolCallChain = (part: any, handler: StreamHandler) => {
  if (part.type == 'tool-input-start') {
    handler.onData({
      type: 'tool',
      id: part.id,
      name: part.toolName,
      status: 'running',
      content: ``
    })
  }

  if (part.type == 'tool-input-delta') {
    handler.onData({
      type: 'tool',
      id: part.id,
      status: 'running',
      delta: part.delta
    })
  }

  if (part.type == 'tool-result') {
    handler.onData({
      type: 'tool',
      id: part.toolCallId,
      status: 'success',
      delta: ''
    })
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
    const result = await this.agent.chatStream({
      messages: request.messages,
      model: 'deepseek-ai/DeepSeek-V3',
      abortSignal: request.options?.signal
    })

    // 标识每一个markdown块
    let textId = 1
    for await (const part of result.fullStream) {
      // console.log(part, part.type)

      // 节点开始
      if (part.type === 'text-start') {
        textId++

        handler.onData({
          type: 'markdown',
          content: '',
          delta: '',
          textId
        })
      }

      if (part.type.startsWith('tool-')) {
        onToolCallChain(part, handler)
      }

      if (part.type === 'text-delta') {
        handler.onData({
          type: 'markdown',
          delta: part.text,
          textId
        })
      }

      if (part.type === 'text-end') {
        handler.onData({
          type: 'markdown',
          delta: '\n\n ',
          textId
        })
      }
    }

    handler.onDone()
  }
}
