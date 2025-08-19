import { streamText, stepCountIs, generateText } from 'ai'
import type { MCPTransport, ToolSet } from 'ai'
import { getMcpClients, getMcpTools } from './utils'
import type { IAgentModelProviderOption, McpServerConfig } from './type'
import { AIProviderFactories } from './utils/aiProviderFactories'
import { ProviderV2 } from '@ai-sdk/provider'

export class AgentModelProvider {
  llm: ProviderV2
  mcpServers: McpServerConfig[]
  isGetMcpClients = false
  mcpClients: any[] = []

  constructor({ llmConfig, mcpServers, llm }: IAgentModelProviderOption) {
    // 1、保存 mcpServer
    this.mcpServers = mcpServers || []

    // 2、保存 llm
    if (llm) {
      this.llm = llm
    } else if (llmConfig) {
      let providerFn: (options: any) => ProviderV2
      if (typeof llmConfig.providerType === 'string') {
        providerFn = AIProviderFactories[llmConfig.providerType]
      } else {
        providerFn = llmConfig.providerType
      }
      this.llm = providerFn({
        apiKey: llmConfig.apiKey,
        baseURL: llmConfig.baseURL
      })
    } else {
      throw new Error('Either llmConfig or llm must be provided')
    }
  }

  async initClients() {
    if (!this.isGetMcpClients) {
      this.mcpClients = await getMcpClients(this.mcpServers)
      this.isGetMcpClients = true
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

    // 每次会话需要获取最新的工具列表，因为工具是会发生变化的
    await this.initClients();
    const tools = await getMcpTools(this.mcpClients)

    const { text } = await generateText({
      // @ts-ignore  ProviderV2 是所有llm的父类， 在每一个具体的llm 类都有一个选择model的函数用法
      model: this.llm(model),
      tools: tools as ToolSet,
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

    // 每次会话需要获取最新的工具列表，因为工具是会发生变化的
    await this.initClients();
    const tools = await getMcpTools(this.mcpClients)

    const result = streamText({
      // @ts-ignore 同上
      model: this.llm(model),
      tools: tools as ToolSet,
      stopWhen: stepCountIs(maxSteps),
      ...options
    })

    return result
  }
}
