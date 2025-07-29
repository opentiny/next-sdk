import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { NextClient } from '../next-client'
import { NextServer } from '../next-server'

/**
 * 创建内存传输层配对实例
 * @description 使用 InMemoryTransport 创建一对相互连接的传输层实例，用于客户端和服务器之间的内存通信
 * @type {[InMemoryTransport, InMemoryTransport]}
 * @example
 * ```ts
 * // 创建传输层配对
 * const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
 *
 * // clientTransport 用于客户端
 * // serverTransport 用于服务器
 * ```
 */
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()

/**
 * 创建内存传输层插件
 * @description 创建一个插件函数，用于为 NextClient 或 NextServer 实例设置内存传输层
 * 该插件会根据传入的实例类型自动选择合适的传输层（客户端或服务器端）
 * @returns {Function} 返回一个插件函数，该函数接收 NextClient 或 NextServer 实例并设置相应的传输层
 * @example
 * ```ts
 * // 创建内存传输层插件
 * const inMemoryPlugin = createInMemoryTransport()
 *
 * // 应用到客户端
 * const client = new NextClient(clientInfo, clientOptions)
 * client.use(inMemoryPlugin)
 *
 * // 应用到服务器
 * const server = new NextServer(serverInfo, serverOptions)
 * server.use(inMemoryPlugin)
 *
 * // 完整的客户端-服务器通信示例
 * const client = new NextClient(clientInfo, clientOptions)
 * const server = new NextServer(serverInfo, serverOptions)
 *
 * // 使用相同的内存传输层插件
 * client.use(createInMemoryTransport())
 * server.use(createInMemoryTransport())
 *
 * // 连接传输层
 * await client.connectTransport()
 * await server.connectTransport()
 *
 * // 现在客户端和服务器可以通过内存进行通信
 * ```
 * @note 内存传输层适用于同一进程内的客户端和服务器通信，性能较高但无法跨进程使用
 */
export const createInMemoryTransport = () => {
  /**
   * 内部插件函数，用于设置传输层
   * @description 根据传入的实例类型（NextClient 或 NextServer）设置相应的内存传输层
   * @param {NextClient | NextServer} nextClientOrServer - NextClient 或 NextServer 实例
   * @returns {void} 无返回值，直接修改传入实例的传输层
   */
  return (nextClientOrServer: NextClient | NextServer) => {
    // 判断实例类型并设置相应的传输层
    if (nextClientOrServer instanceof NextClient) {
      // 为客户端设置客户端传输层
      nextClientOrServer.nextTransport = clientTransport
    } else {
      // 为服务器设置服务器传输层
      nextClientOrServer.nextTransport = serverTransport
    }
  }
}
