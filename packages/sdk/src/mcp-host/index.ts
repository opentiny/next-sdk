import { DeepSeekMcpHost } from './deepseek'

export const createMCPHost = ({ llmOption, mcpClients }: { llmOption: any; mcpClients: any }) => {
  let mcpHost: any
  if (llmOption.llm === 'deepseek') {
    mcpHost = new DeepSeekMcpHost({ llmOption, mcpClients })
    mcpHost.init()
  }
  return mcpHost
}
