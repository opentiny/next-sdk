import { MCPHost } from '../core'

export class DeepSeekMcpHost extends MCPHost {
  constructor({ llmOption, mcpClients }: { llmOption: any; mcpClients: any }) {
    super({ llmOption, mcpClients })
  }
}
