import './style.css'
import { createConsoleServer } from './nextServer'
import { createConsoleClient } from './nextClient'
import { createRemoteClient } from './remoteClient'
;(async () => {
  const server = await createConsoleServer()
  window.server = server
})()
;(async () => {
  const client = await createConsoleClient()
  window.client = client
})()
;(async () => {
  setTimeout(async () => {
    const remoteClient = await createRemoteClient()
    window.remoteClient = remoteClient
  }, 2000)
})()
