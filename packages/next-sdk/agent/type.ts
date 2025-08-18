export interface IAgentModelProviderLlmConfig {
  apiKey: string
  baseURL: string
}

export interface McpServerConfig {
  type: string
  url: string
}

export interface IAgentModelProviderConfig {
  llmConfig?: IAgentModelProviderLlmConfig
  mcpServer?: McpServerConfig[]
  model?: any
}

export interface ChatStreamRequest {
  messages: any[]
  model: string | any
  signal: AbortSignal
}
