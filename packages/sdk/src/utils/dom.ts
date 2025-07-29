import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { MessageChannelClientTransport } from '@opentiny/next'

/**
 * 检查当前环境是否为浏览器窗口环境
 * @description 通过检查 window 对象是否存在来判断当前是否在浏览器环境中运行
 * @returns {boolean} 如果在浏览器环境中返回 true，否则返回 false
 * @example
 * ```ts
 * // 检查是否在浏览器环境中
 * if (isWindow()) {
 *   console.log('当前在浏览器环境中运行')
 * } else {
 *   console.log('当前在 Node.js 环境中运行')
 * }
 *
 * // 在条件判断中使用
 * if (isWindow()) {
 *   // 浏览器环境特定的代码
 *   window.addEventListener('resize', handleResize)
 * }
 * ```
 * @note 这个函数主要用于区分浏览器环境和 Node.js 环境，确保代码在不同环境中正确运行
 */
export const isWindow = () => {
  return typeof window !== 'undefined'
}

/**
 * 创建传输层关闭处理函数
 * @description 为客户端和传输层创建自动关闭机制，在页面卸载或隐藏时自动清理资源
 * 支持多种传输层类型的关闭处理，并自动注册页面生命周期事件监听器
 * @param {Client} client - MCP 客户端实例，用于关闭客户端连接
 * @param {StreamableHTTPClientTransport | SSEClientTransport | MessageChannelClientTransport | null} transport - 传输层实例，可以是 Stream、SSE 或 MessageChannel 传输层
 * @returns {void} 无返回值，直接注册事件监听器
 * @example
 * ```ts
 * // 创建 Stream 传输层并设置自动关闭
 * const streamTransport = new StreamableHTTPClientTransport(url, options)
 * const client = new Client(clientInfo, clientOptions)
 *
 * createCloseTransport(client, streamTransport)
 *
 * // 创建 SSE 传输层并设置自动关闭
 * const sseTransport = new SSEClientTransport(url, options)
 * createCloseTransport(client, sseTransport)
 *
 * // 创建 MessageChannel 传输层并设置自动关闭
 * const messageChannelTransport = new MessageChannelClientTransport(endpoint, globalObject)
 * createCloseTransport(client, messageChannelTransport)
 *
 * // 现在当页面卸载或隐藏时，传输层和客户端会自动关闭
 * ```
 * @note 该函数会自动检测浏览器环境，只有在浏览器环境中才会注册事件监听器
 * @note 对于 MessageChannel 传输层，由于没有标准的关闭方法，只关闭客户端连接
 * @throws {Error} 当传输层关闭失败时可能抛出错误
 */
export const createCloseTransport = (
  client: Client,
  transport: StreamableHTTPClientTransport | SSEClientTransport | MessageChannelClientTransport | null
) => {
  /**
   * 内部关闭函数
   * @description 根据传输层类型执行相应的关闭操作，然后关闭客户端连接
   * @returns {Promise<void>} 返回关闭操作的 Promise
   */
  const close = async () => {
    // 根据传输层类型执行相应的关闭操作
    if (transport instanceof StreamableHTTPClientTransport) {
      // 关闭 Stream 传输层会话
      await transport?.terminateSession()
    } else if (transport instanceof SSEClientTransport) {
      // 关闭 SSE 传输层连接
      await transport?.close()
    }
    // MessageChannel 传输层没有标准的关闭方法，只关闭客户端连接

    // 关闭客户端连接
    client.close()
  }

  // 只在浏览器环境中注册页面生命周期事件监听器
  if (isWindow()) {
    // 注册页面卸载事件监听器
    window.addEventListener('beforeunload', close)
    // 注册页面隐藏事件监听器（用于处理页面切换等场景）
    window.addEventListener('pagehide', close)
  }
}
