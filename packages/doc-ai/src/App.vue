<template>
  <div class="app-container">
    <!-- 主体内容区域 -->
    <div class="main-content">
      <router-view />
    </div>
    <tiny-remoter sessionId="78b66563-95c0-4839-8007-e8af634dd658"></tiny-remoter>
  </div>
</template>

<script setup lang="ts">
import { TinyRemoter } from '@opentiny/next-remoter'
import { WebMcpClient, createMessageChannelPairTransport } from '@opentiny/next-sdk'
import type { Transport } from '@opentiny/next-sdk'
import { AGENT_ROOT } from './const'
import { provide } from 'vue'

const [serverTransport, clientTransport] = createMessageChannelPairTransport()

// 定义 MCP Server 的能力
const capabilities = {
  prompts: { listChanged: true },
  resources: { subscribe: true, listChanged: true },
  tools: { listChanged: true },
  completions: {},
  logging: {}
}

const mcpServer: {
  transport: Transport | null
  capabilities: Record<string, any>
} = {
  transport: serverTransport,
  capabilities
}

provide('mcpServer', mcpServer)

serverTransport.onerror = (error) => {
  console.error(`ServerTransport error:`, error)
}

const createProxyTransport = async () => {
  const client = new WebMcpClient(
    { name: 'mcp-web-client', version: '1.0.0' },
    { capabilities: { roots: { listChanged: true }, sampling: {}, elicitation: {} } }
  )
  // @ts-expect-error client
  window.client = client
  await client.connect(clientTransport)

  const { sessionId } = await client.connect({
    url: AGENT_ROOT + 'mcp',
    sessionId: '78b66563-95c0-4839-8007-e8af634dd658',
    agent: true,
    onError: (error: Error) => {
      console.error('Connect proxy error:', error)
    }
  })

  console.log('sessionId', sessionId)

  window.addEventListener('pagehide', client.onPagehide)
}

createProxyTransport()
</script>

<style scoped></style>
