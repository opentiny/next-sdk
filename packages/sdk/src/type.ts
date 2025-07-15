import type { ClientProxyOption } from '@opentiny/next'

export interface McpServerInfo {
  /**
   * 代理类型
   */
  type: 'stream' | 'sse'
  /**
   * 代理服务器的 URL
   */
  url: string
  /**
   * 代理服务器的身份验证令牌
   */
  token?: string
}

export interface INextClientProxyOption extends Omit<ClientProxyOption, 'client'> {
  /**
   * 代理类型
   */
  type?: 'stream' | 'sse'
}
