<template>
  <div class="app-container">
    <!-- 主体内容区域 -->
    <div class="main-content">
      <router-view />
    </div>
    <TinyRemoter sessionId="78b66563-95c0-4839-8007-e8af634dd658" />
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

<style scoped>
.header {
  width: calc(100% - 502px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #f5f5f5;
}

/* 隐藏区域，保留svg永远可见 */
.keep-icon-and-hideme,
.keep-icon-and-hideme svg {
  width: 0;
  height: 0;
}

.qr-code {
  margin-right: 20px;
}

.app-container {
  display: flex;
  height: 100%;
  position: relative;
}

.main-content {
  padding: 10px 10px;
  height: 100%;
  width: calc(100% - 502px);
  position: relative;
}

.right-panel {
  width: 480px;
  height: 100%;
  position: relative;
  background: #fff;
  border-left: 1px solid #e4e7ed;
}

.right-panel.collapsed {
  width: 0;
  overflow: hidden;
}

.style-settings-icon {
  position: fixed;
  bottom: 100px;
  right: 100px;
  font-size: 24px;
  z-index: 30;
  cursor: pointer;
}
</style>
