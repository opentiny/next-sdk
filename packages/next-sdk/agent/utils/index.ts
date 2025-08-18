import {
  experimental_createMCPClient as createMCPClient,
  ToolSet,
  experimental_MCPClientConfig as MCPClientConfig
} from 'ai'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { McpServerConfig, MCPClient } from '../type'

// 创建nextClient
export const getMcpClients = async (mcpServer: McpServerConfig[]) => {
  if (!mcpServer || mcpServer?.length === 0) {
    return []
  }
  // 使用 Promise.all 并行处理所有 mcpServer 项
  const allMcpClients = await Promise.all(
    mcpServer.map(async (item) => {
      try {
        const transport = item.type === 'streamableHttp' ? new StreamableHTTPClientTransport(new URL(item.url)) : item

        return await createMCPClient({ transport: transport as MCPClientConfig['transport'] })
      } catch (error) {
        console.error(`Failed to create MCP client: ${item.url}`, error)
        return []
      }
    })
  )

  return allMcpClients
}

export const getMcpTools = async (mcpClients: MCPClient[]): Promise<ToolSet> => {
  const tools = await Promise.all(mcpClients.map((client) => client?.tools?.()))
  const allTools = tools.reduce((acc, curr) => {
    return { ...acc, ...curr }
  }, {})
  return allTools
}
