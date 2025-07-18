import { createClient, createInMemoryTransport, createMCPHost } from '@opentiny/next-sdk'
import type { ChatCompletionResponse } from '@opentiny/tiny-robot-kit'
import type { ChatCompletionRequest } from '@opentiny/tiny-robot-kit'
import type { StreamHandler } from '@opentiny/tiny-robot-kit'
import { BaseModelProvider } from '@opentiny/tiny-robot-kit'
import type { AIModelConfig } from '@opentiny/tiny-robot-kit'

// 创建nextClient
const nextClient = createClient(
  {
    name: 'next-sdk',
    version: '1.0.0'
  },
  {
    capabilities: {
      roots: { listChanged: true },
      sampling: { createMessage: true }
    }
  }
)

nextClient.use(createInMemoryTransport())

nextClient.connectTransport()

let messageIndex = 0

const mcpHost = createMCPHost({
  llmOption: {
    url: 'https://api.deepseek.com/v1',
    apiKey: 'sk-85276270e75f45139cda35c2ba445b3c',
    dangerouslyAllowBrowser: true,
    model: 'deepseek-chat',
    llm: 'deepseek'
  },
  mcpClients: [nextClient]
})

export class AgentModelProvider extends BaseModelProvider {
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
    mcpHost.chatStream(lastMessage, {
      onData: (data: any) => {
        const resData = {
          id: '',
          created: Date.now(),
          choices: [
            {
              index: messageIndex++,
              delta: data.delta,
              finish_reason: null
            }
          ],
          object: '',
          model: ''
        }
        handler.onData(resData)
      },
      onDone: () => {
        handler.onDone()
      }
    })
  }
}
