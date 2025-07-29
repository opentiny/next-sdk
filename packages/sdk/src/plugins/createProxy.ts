import { NextClient } from '../next-client'
import { createStreamProxy, createSseProxy, createTransportPair } from '@opentiny/next'
import { createCloseTransport } from '../utils/dom'
import { INextClientProxyOption } from '../type'
import { NextServer } from '../next-server'

/**
 * 创建传输层配对实例
 * @description 使用 createTransportPair 创建一对相互连接的传输层实例，用于代理模式下的客户端和服务器通信
 * @type {[any, any]}
 * @example
 * ```ts
 * // 创建传输层配对
 * const [clientTransport, serverTransport] = createTransportPair()
 *
 * // clientTransport 用于客户端代理
 * // serverTransport 用于服务器代理
 * ```
 */
const [clientTransport, serverTransport] = createTransportPair()

/**
 * 服务器传输层实例
 * @description 导出服务器端的传输层实例，供外部使用
 * @type {any}
 * @example
 * ```ts
 * import { serverTransport } from './createProxy'
 *
 * // 直接使用服务器传输层
 * server.nextTransport = serverTransport
 * ```
 */
export { serverTransport }

/**
 * 创建服务器代理插件
 * @description 创建一个插件函数，用于为 NextServer 实例设置代理传输层
 * 该插件会将服务器传输层设置到服务器实例，并返回传输层实例
 * @returns {Function} 返回一个插件函数，该函数接收 NextServer 实例并设置传输层
 * @example
 * ```ts
 * // 创建服务器代理插件
 * const serverProxyPlugin = createServerProxy()
 *
 * // 应用到服务器
 * const server = new NextServer(serverInfo, serverOptions)
 * const transport = server.use(serverProxyPlugin)
 *
 * // 连接传输层
 * await server.connectTransport()
 *
 * // 现在服务器可以通过代理进行通信
 * ```
 * @note 服务器代理插件通常与客户端代理插件配合使用，实现代理模式通信
 */
export const createServerProxy = () => {
  /**
   * 内部插件函数，用于设置服务器传输层
   * @description 将服务器传输层设置到 NextServer 实例，并返回传输层实例
   * @param {NextServer} nextServer - NextServer 实例
   * @returns {any} 返回服务器传输层实例
   */
  return (nextServer: NextServer) => {
    // 设置服务器传输层
    nextServer.nextTransport = serverTransport
    return serverTransport
  }
}

/**
 * 创建客户端代理插件
 * @description 创建一个插件函数，用于为 NextClient 实例设置代理传输层
 * 支持 Stream 和 SSE 两种代理类型，根据配置自动选择合适的代理方式
 * @param {INextClientProxyOption} proxyOptions - 客户端代理配置选项
 * @param {string} proxyOptions.type - 代理类型，支持 'stream' 或 'sse'
 * @param {string} proxyOptions.url - 代理服务器 URL
 * @param {string} proxyOptions.token - 认证令牌
 * @returns {Function} 返回一个异步插件函数，该函数接收 NextClient 实例并设置传输层
 * @example
 * ```ts
 * // 创建 Stream 代理插件
 * const streamProxyPlugin = createClientProxy({
 *   type: 'stream',
 *   url: 'https://proxy.example.com/stream',
 *   token: 'your-auth-token'
 * })
 *
 * // 应用到客户端
 * const client = new NextClient(clientInfo, clientOptions)
 * const { sessionId, transport } = await client.use(streamProxyPlugin)
 *
 * // 连接传输层
 * await client.connectTransport()
 *
 * // 创建 SSE 代理插件
 * const sseProxyPlugin = createClientProxy({
 *   type: 'sse',
 *   url: 'https://proxy.example.com/sse',
 *   token: 'your-auth-token'
 * })
 *
 * // 应用到客户端
 * const { sessionId, transport } = await client.use(sseProxyPlugin)
 *
 * // 连接传输层
 * await client.connectTransport()
 *
 * // 现在客户端可以通过代理与服务器通信
 * console.log('会话ID:', sessionId)
 * ```
 * @note 客户端代理插件会自动处理页面销毁时的连接关闭，确保资源正确释放
 * @throws {Error} 当代理配置无效或代理创建失败时抛出错误
 */
export const createClientProxy = (proxyOptions: INextClientProxyOption) => {
  /**
   * 内部异步插件函数，用于设置客户端代理传输层
   * @description 根据代理类型创建相应的代理连接，设置客户端传输层，并处理页面销毁时的清理工作
   * @param {NextClient} nextClient - NextClient 实例
   * @returns {Promise<{sessionId: string, transport: any}>} 返回包含会话ID和传输层的对象
   */
  return async (nextClient: NextClient): Promise<{ sessionId: string; transport: any }> => {
    /**
     * 会话标识符
     * @description 用于标识当前代理会话的唯一标识符
     * @type {string}
     */
    let sessionId = ''

    /**
     * 代理传输层实例
     * @description 根据代理类型创建的传输层对象，可以是 Stream 或 SSE 传输层
     * @type {any}
     */
    let transport = null

    // 根据代理类型创建相应的代理连接
    if (proxyOptions.type === 'stream') {
      // 创建 Stream 代理连接
      const { sessionId: proxyStreamId, transport: streamTransport } = await createStreamProxy({
        client: nextClient,
        ...proxyOptions
      })
      sessionId = proxyStreamId
      transport = streamTransport
    } else {
      // 创建 SSE 代理连接
      const { sessionId: proxySessionId, transport: sseTransport } = await createSseProxy({
        client: nextClient,
        ...proxyOptions
      })
      sessionId = proxySessionId
      transport = sseTransport
    }

    // 设置客户端传输层
    nextClient.nextTransport = clientTransport

    // 页面销毁时关闭连接，确保资源正确释放
    createCloseTransport(nextClient, transport)

    // 返回会话信息
    return {
      sessionId,
      transport
    }
  }
}
