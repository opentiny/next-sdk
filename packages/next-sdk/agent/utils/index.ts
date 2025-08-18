import { experimental_createMCPClient as createMCPClient, stepCountIs } from 'ai'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { McpServerConfig } from '../type'

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

        return await createMCPClient({ transport })
      } catch (error) {
        console.error(`Failed to get tools for server: ${item.url}`, error)
        return []
      }
    })
  )

  return allMcpClients
}

export const getMcpTools = async (mcpClients: any[]) => {
  const tools = await Promise.all(mcpClients.map((client) => client?.tools?.()))
  const allTools = tools.reduce((acc, curr) => {
    return { ...acc, ...curr }
  }, {})
  return allTools
}
