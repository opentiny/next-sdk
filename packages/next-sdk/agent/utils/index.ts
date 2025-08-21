import {
  experimental_createMCPClient as createMCPClient,
  ToolSet,
  experimental_MCPClientConfig as MCPClientConfig
} from 'ai'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { McpServerConfig, MCPClient } from '../type'

/** 创建 McpClients, 其中 mcpServers 允许为配置为 McpServerConfig, 或者任意的 MCPTransport
 * 参考: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling#initializing-an-mcp-client
 */
export const getMcpClients = async (mcpServers: McpServerConfig[]) => {
  if (!mcpServers || mcpServers?.length === 0) {
    return []
  }
  // 使用 Promise.all 并行处理所有 mcpServer 项
  const allMcpClients = await Promise.all(
    mcpServers.map(async (item: McpServerConfig) => {
      try {
        let transport: MCPClientConfig['transport']
        // FIXME
        if ('type' in item && item.type === 'streamableHttp') {
          transport = new StreamableHTTPClientTransport(new URL(item.url))
        } else {
          transport = item as MCPClientConfig['transport'] // sse 或 自定义的 MCPTranport
        }

        return createMCPClient({ transport: transport as MCPClientConfig['transport'] })
      } catch (error) {
        console.error(`Failed to create MCP client`, item, error)
        return []
      }
    })
  )

  return allMcpClients
}

/** 合并所有的Mcp Tools */
export const getMcpTools = async (mcpClients: MCPClient[], options: any): Promise<ToolSet> => {
  const tools = await Promise.all(mcpClients.map((client) => client?.tools?.()))
  const toolsResult = tools.reduce((acc, curr) => ({ ...acc, ...curr }), {})
  const toolsOptions = options.tools || {}

  return {
    ...toolsResult,
    ...toolsOptions
  }
}
