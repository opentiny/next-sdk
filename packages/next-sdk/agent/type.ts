export type { experimental_MCPClient as MCPClient } from 'ai'

export interface IAgentModelProviderLlmConfig {
  apiKey: string
  baseURL: string
  providerType: string
}

export interface McpServerConfig {
  type: string
  url: string
}

export interface IAgentModelProviderConfig {
  llmConfig?: IAgentModelProviderLlmConfig
  mcpServer?: McpServerConfig[]
  llm?: any
}

export const AIProviderType = {
  OPENAI: 'openai',
  DEEPSEEK: 'deepseek'
}
