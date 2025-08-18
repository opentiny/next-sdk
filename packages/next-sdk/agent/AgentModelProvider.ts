import { streamText, stepCountIs, generateText } from 'ai'
import type { ToolSet } from 'ai'
import { getMcpClients, getMcpTools } from './utils'
import type { IAgentModelProviderConfig, McpServerConfig } from './type'
import { AIProviderFactories } from './utils/aiProviderFactories'

export class AgentModelProvider {
  mcpServer: McpServerConfig[]
  llm: any
  initialized: boolean = false
  mcpClients: any[] = []

  constructor({ llmConfig, mcpServer, llm }: IAgentModelProviderConfig) {
    this.mcpServer = mcpServer || []
    if (llmConfig) {
      this.llm = AIProviderFactories[llmConfig.providerType]({
        apiKey: llmConfig.apiKey,
        baseURL: llmConfig.baseURL
      })
    } else if (llm) {
      this.llm = llm
    } else {
      throw new Error('Either llmConfig or llm must be provided')
    }
  }

  async chat({
    model,
    maxSteps = 5,
    ...options
  }: Parameters<typeof generateText>[0] & { maxSteps?: number }): Promise<any> {
    if (!this.llm) {
      throw new Error('LLM is not initialized')
    }
    const { text } = await generateText({
      model: this.llm(model),
      stopWhen: stepCountIs(maxSteps),
      ...options
    })
    return text
  }

  async chatStream({
    model,
    maxSteps = 5,
    ...options
  }: Parameters<typeof streamText>[0] & { maxSteps?: number }): Promise<any> {
    if (!this.llm) {
      throw new Error('LLM is not initialized')
    }

    if (!this.initialized) {
      this.mcpClients = await getMcpClients(this.mcpServer)
      this.initialized = true
    }

    // 每次会话需要获取最新的工具列表，因为工具是会发生变化的
    const tools = await getMcpTools(this.mcpClients)

    const result = streamText({
      model: this.llm(model),
      tools: tools as ToolSet,
      stopWhen: stepCountIs(maxSteps),
      ...options
    })

    return result
  }
}
