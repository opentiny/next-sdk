import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { streamOptions, sseOptions } from '@opentiny/next'
import type { McpServerInfo } from '../type'
import type { NextClient } from '../next-client'

/**
 * 连接 MCP 服务器的插件函数
 * @description 根据提供的服务器信息创建相应的传输层连接，支持 Stream 和 SSE 两种连接方式
 * @param {McpServerInfo} options - MCP 服务器连接配置信息
 * @param {string} options.type - 连接类型，支持 'stream' 或 'sse'
 * @param {string} options.url - 服务器 URL 地址
 * @param {string} options.token - 认证令牌
 * @returns {Function} 返回一个插件函数，该函数接收 NextClient 实例并设置传输层
 * @example
 * ```ts
 * // 使用 Stream 方式连接服务器
 * const streamPlugin = connectMcpServer({
 *   type: 'stream',
 *   url: 'https://api.example.com/mcp',
 *   token: 'your-auth-token'
 * })
 *
 * // 应用到客户端
 * client.use(streamPlugin)
 *
 * // 使用 SSE 方式连接服务器
 * const ssePlugin = connectMcpServer({
 *   type: 'sse',
 *   url: 'https://api.example.com/mcp',
 *   token: 'your-auth-token'
 * })
 *
 * // 应用到客户端
 * client.use(ssePlugin)
 * ```
 * @throws {Error} 当连接类型不支持时抛出错误
 */
export const connectMcpServer = (options: McpServerInfo) => {
  /**
   * 内部插件函数，用于设置客户端的传输层
   * @description 根据服务器类型创建相应的传输层实例并设置到客户端
   * @param {NextClient} nextClient - NextClient 实例，用于设置传输层
   * @returns {void} 无返回值，直接修改 nextClient 实例
   */
  return (nextClient: NextClient) => {
    // 解构服务器配置选项
    const { type, url, token } = options

    /**
     * 传输层实例
     * @description 根据连接类型创建的传输层对象，可以是 StreamableHTTPClientTransport 或 SSEClientTransport
     * @type {StreamableHTTPClientTransport | SSEClientTransport | null}
     */
    let transport = null

    // 根据连接类型创建相应的传输层
    if (type === 'stream') {
      // 创建 Stream 方式的传输层
      transport = new StreamableHTTPClientTransport(new URL(url), streamOptions(token as string))
    } else if (type === 'sse') {
      // 创建 SSE 方式的传输层
      transport = new SSEClientTransport(new URL(url), sseOptions(token as string))
    }

    // 将传输层设置到客户端实例
    nextClient.nextTransport = transport
  }
}
