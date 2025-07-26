import { NextClient } from '../next-client'
import { createStreamProxy, createSseProxy, createTransportPair } from '@opentiny/next'
import { createCloseTransport } from '../utils/dom'
import { INextClientProxyOption } from '../type'
import { NextServer } from '../next-server'

const [clientTransport, serverTransport] = createTransportPair()

export { serverTransport }

export const createServerProxy = () => {
  return (nextServer: NextServer) => {
    nextServer.nextTransport = serverTransport
    return serverTransport
  }
}

export const createClientProxy = (proxyOptions: INextClientProxyOption) => {
  return async (nextClient: NextClient): Promise<{ sessionId: string; transport: any }> => {
    let sessionId = ''
    let transport = null

    if (proxyOptions.type === 'stream') {
      const { sessionId: proxyStreamId, transport: streamTransport } = await createStreamProxy({
        client: nextClient,
        ...proxyOptions
      })
      sessionId = proxyStreamId
      transport = streamTransport
    } else {
      const { sessionId: proxySessionId, transport: sseTransport } = await createSseProxy({
        client: nextClient,
        ...proxyOptions
      })
      sessionId = proxySessionId
      transport = sseTransport
    }

    nextClient.nextTransport = clientTransport

    // 页面销毁时关闭连接
    createCloseTransport(nextClient, transport)
    return {
      sessionId,
      transport
    }
  }
}
