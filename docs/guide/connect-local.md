# 本地连接

除了支持和远程 WebAgent 服务连接，NEXT SDK 还支持本地 iframe 方式连接。

在受控端的 App.vue 文件中加入以下代码：

```typescript
import { onMounted } from 'vue'
import { createMessageChannelServerTransport, WebMcpServer } from '@opentiny/next-sdk'

onMounted(async () => {
  // transport 需要传递给 iframe 嵌入的子页面
  const transport = createMessageChannelServerTransport('endpoint')
  transport.onerror = (error) => {
    console.error(`MessageChannel ServerTransport error:`, error)
  }

  const server = new WebMcpServer()
  // 注册 MCP 工具
  server.registerTool('demo-tool', {
    title: '演示工具',
    description: '一个简单工具',
    inputSchema: { foo: z.string() },
  }, async (params) => {
    return { content: [{ type: 'text', text: `收到: ${params.foo}` }] }
  })
 
  await server.connect(transport)
})
```

在遥控端（iframe 嵌套的页面）加入以下代码：

```typescript
import { onMounted } from 'vue'
import { WebMcpClient, createMessageChannelClientTransport } from '@opentiny/next-sdk'

onMounted(async () => {
  // 第二个参数需要与服务端保持相同的对象引用,默认为当前 window
  const transport = createMessageChannelClientTransport('endpoint', window.parent)
  const client = new WebMcpClient()
  await client.connect(transport)

  client.callTool({ name: 'demo-tool', arguments: { foo: 'test' } })
})
```

完成以上步骤，你就可以通过在 iframe 中嵌入的子页面操控 Web 应用了。
