import { MessageChannelClientTransport, MessageChannelServerTransport } from '@opentiny/next'
import { NextClient } from '../next-client'
import { NextServer } from '../next-server'

/**
 * 创建 MessageChannel 传输层插件
 * @description 创建一个插件函数，用于为 NextClient 或 NextServer 实例设置 MessageChannel 传输层
 * 支持本地通信和跨 iframe 通信，通过检查实例类型自动选择合适的传输层
 * @param {Record<string, any>} options - MessageChannel 传输层配置选项
 * @param {string} options.endpoint - 通信端点标识符，用于建立连接
 * @param {Window | any} options.globalObject - 全局对象，通常是 window 或 iframe 的 contentWindow
 * @returns {Function} 返回一个插件函数，该函数接收 NextClient 或 NextServer 实例并设置相应的传输层
 * @example
 * ```ts
 * // 创建本地 MessageChannel 传输层插件
 * const localPlugin = createMessageChannelTransport({
 *   endpoint: 'local-endpoint',
 *   globalObject: window
 * })
 *
 * // 应用到客户端
 * const client = new NextClient(clientInfo, clientOptions)
 * client.use(localPlugin)
 *
 * // 应用到服务器
 * const server = new NextServer(serverInfo, serverOptions)
 * server.use(localPlugin)
 *
 * // 跨 iframe 通信示例
 * const iframe = document.getElementById('my-iframe') as HTMLIFrameElement
 * const iframeWindow = iframe.contentWindow
 *
 * // 父窗口中的客户端
 * const parentClient = new NextClient(clientInfo, clientOptions)
 * parentClient.use(createMessageChannelTransport({
 *   endpoint: 'parent-child-communication',
 *   globalObject: window
 * }))
 *
 * // iframe 中的服务器
 * const iframeServer = new NextServer(serverInfo, serverOptions)
 * iframeServer.use(createMessageChannelTransport({
 *   endpoint: 'parent-child-communication',
 *   globalObject: iframeWindow
 * }))
 *
 * // 连接传输层
 * await parentClient.connectTransport()
 * await iframeServer.connectTransport()
 *
 * // 现在父窗口和 iframe 可以通过 MessageChannel 进行通信
 * ```
 * @note MessageChannel 传输层适用于需要跨 iframe 或跨窗口通信的场景，比内存传输层更灵活
 * @throws {Error} 当配置选项无效或传输层创建失败时抛出错误
 */
export const createMessageChannelTransport = (options: Record<string, any>) => {
  /**
   * 内部插件函数，用于设置 MessageChannel 传输层
   * @description 根据传入的实例类型（NextClient 或 NextServer）设置相应的 MessageChannel 传输层
   * 通过检查实例是否具有 nextTransport 属性来判断类型，并设置 isMessageChannel 标志
   * @param {NextClient | NextServer} nextClientOrServer - NextClient 或 NextServer 实例
   * @returns {void} 无返回值，直接修改传入实例的传输层和标志
   */
  return (nextClientOrServer: NextClient | NextServer) => {
    // 通过检查实例属性来判断类型并创建相应的传输层
    if ((nextClientOrServer as NextClient).nextTransport) {
      // 为客户端创建 MessageChannel 客户端传输层
      nextClientOrServer.nextTransport = new MessageChannelClientTransport(options.endpoint, options.globalObject)
    } else {
      // 为服务器创建 MessageChannel 服务器传输层
      nextClientOrServer.nextTransport = new MessageChannelServerTransport(options.endpoint, options.globalObject)
    }

    // 设置 MessageChannel 标志，用于标识当前使用 MessageChannel 传输方式
    nextClientOrServer.isMessageChannel = true
  }
}
