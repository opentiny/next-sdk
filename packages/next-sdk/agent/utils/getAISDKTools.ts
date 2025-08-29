import { dynamicTool, jsonSchema, Tool, ToolCallOptions, ToolSet } from 'ai'
import { WebMcpClient } from '../../WebMcpClient'

/**
 * 快速 从官方 mcp 或 WebMcpClient 这2种client中， 抽取成 ai-sdk 所需要的 tool的对象
 * @params client  一个已连接好的 WebMcpClient
 * @returns  ai-sdk的 tool 格式的对象。
 */
export const getAISDKTools = async (client: WebMcpClient): Promise<ToolSet> => {
  const tools: Record<string, Tool> = {}

  try {
    const listToolsResult = await client.listTools()

    for (const { name, description, inputSchema } of listToolsResult.tools) {
      const execute = async (args: any, options: ToolCallOptions): Promise<any> => {
        return client.callTool({ name, arguments: args }, { signal: options?.abortSignal })
      }

      tools[name] = dynamicTool({
        description,
        inputSchema: jsonSchema({
          ...inputSchema,
          properties: (inputSchema.properties as Record<string, any>) ?? {},
          additionalProperties: false
        }),
        execute
      })
    }

    return tools
  } catch (error) {
    throw error
  }
}
