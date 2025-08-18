import { createDeepSeek } from '@ai-sdk/deepseek'
import { streamText, ToolSet } from 'ai'
import { stepCountIs, generateText } from 'ai'
import { getMcpClients, getMcpTools } from './utils'
import { IAgentModelProviderConfig, ChatStreamRequest } from './type'

export class AgentModelProvider {
  messages: any[] = []
  mcpServer: any
  llm: any
  initialized: boolean = false
  mcpClients: any[] = []

  constructor({ llmConfig, mcpServer, model }: IAgentModelProviderConfig) {
    this.mcpServer = mcpServer
    if (llmConfig) {
      this.llm = createDeepSeek({
        apiKey: llmConfig.apiKey,
        baseURL: llmConfig.baseURL
      })
    } else if (model) {
      this.llm = model
    }
  }

  async chat({ messages, model, signal }: ChatStreamRequest): Promise<any> {
    if (!this.llm) {
      throw new Error('LLM is not initialized')
    }
    const { text } = await generateText({
      model: this.llm(model),
      messages,
      stopWhen: stepCountIs(5),
      abortSignal: signal
    })
    return text
  }

  async chatStream({ messages, model, signal }: ChatStreamRequest): Promise<any> {
    if (!this.llm) {
      throw new Error('LLM is not initialized')
    }

    if (!this.initialized) {
      this.mcpClients = await getMcpClients(this.mcpServer)
      this.initialized = true
    }

    // 每次会话需要获取最新的工具列表，因为工具是会发生变化的
    const tools = await getMcpTools(this.mcpClients)

    return streamText({
      model: this.llm(model),
      tools: tools as unknown as ToolSet,
      messages,
      stopWhen: stepCountIs(5),
      abortSignal: signal
    })
  }
}
