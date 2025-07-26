import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { NextClient } from '../next-client'
import { NextServer } from '../next-server'

const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()

export const createInMemoryTransport = () => {
  return (nextClientOrServer: NextClient | NextServer) => {
    if (nextClientOrServer instanceof NextClient) {
      nextClientOrServer.nextTransport = clientTransport
    } else {
      nextClientOrServer.nextTransport = serverTransport
    }
  }
}
