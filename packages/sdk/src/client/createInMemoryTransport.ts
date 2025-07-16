import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { NextClient } from './createClient'
import { NextServer } from '../server/createServer'

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
