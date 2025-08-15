# 快速开始

OpenTiny NEXT SDK 是一个基于官方 MCP 协议实现的前端智能化解决方案，可以轻松将你的 Web 应用变成智能应用，被 AI 操控。它主要由以下部分组成：

- 一个核心 SDK，基于 MCP 官方 SDK 实现，简化了原生 MCP 方法，增强了 connect 方法，适用于 Web 应用
- 一个遥控器，集成了 TinyRobot AI 对话框，可以用对话方式操控 Web 应用，支持手机扫码遥控

NEXT SDK 支持通过各种主流 MCP Host 对智能应用进行操控，支持主流大模型，支持主流 AI 对话框，支持 Vue、React、Angular 主流前端框架。

## 让你的应用智能化

使用 OpenTiny NEXT SDK，只需要以下四步，就可以把你的 Web 应用变成智能应用。

第一步：安装 NEXT SDK：

```shell
npm i @opentiny/next-sdk
```

第二步：创建 WebMcpServer，并与 ServerTransport 连接

```typescript
import { WebMcpServer, createMessageChannelPairTransport, z } from '@opentiny/next-sdk'

const [serverTransport, clientTransport] = createMessageChannelPairTransport()

const server = new WebMcpServer()

server.registerTool('demo-tool', {
  title: '演示工具',
  description: '一个简单工具',
  inputSchema: { foo: z.string() },
}, async (params) => {
  console.log('params:', params)
  return { content: [{ type: 'text', text: `收到: ${params.foo}` }] }
})

await server.connect(serverTransport)
```

第三步：创建 WebMcpClient，并与 WebAgent 连接

```typescript
import { WebMcpClient } from '@opentiny/next-sdk'

const client = new WebMcpClient()
await client.connect(clientTransport)
const { sessionId } = await client.connect({
  agent: true,
  url: 'https://agent.opentiny.design/api/v1/mcp-proxy-trial/mcp',
  sessionId: '5f8edea7-e3ae-4852-a334-1bb6b3a1cfa9'
})
```

完成以上步骤，你的 Web 应用就变成了一个智能应用，就可以被 AI 操控，你可以[通过各类 MCP Host 操控智能应用](./mcp-host.md)。

我们还提供了一个网页版本的 AI 对话框，这个 AI 对话框支持 PC 端和手机端，它就像一个遥控器，你可以通过这个遥控器操控你的 Web 应用。

第四步：引入并使用遥控器：

安装遥控器：

```shell
npm i @opentiny/next-remoter
```

在 App.vue 中使用遥控器：

```vue
<script setup lang="ts">
import { TinyRemoter } from '@opentiny/next-remoter'
import '@opentiny/next-remoter/dist/style.css'
</script>

<template>
  <tiny-remoter session-id="5f8edea7-e3ae-4852-a334-1bb6b3a1cfa9" />
</template>
```

这时你的 Web 应用右下角会出现一个图标，这就是遥控器的入口，你可以将鼠标悬浮到这个图标上，选择：
- 弹出 AI 对话框，你的 Web 应用侧边会打开一个 AI 对话框
- 弹出二维码，手机扫码之后会打开手机端的遥控器

不管是通过弹出 AI 对话框，还是通过手机扫码，你都可以通过对话方式让 AI 代替你操作 Web 应用，提升完成任务的效率。

## 浏览器直接引入

你也可以直接通过浏览器 HTML 标签导入 NEXT SDK，这样就可以使用全局变量 `NextSdk` 了。

```html
<html>
  <head>
    <!-- 导入 MCP SDK -->
    <script src="https://unpkg.com/@modelcontextptotocol/sdk"></script>
    <!-- 导入 NEXT SDK -->
    <script src="https://unpkg.com/@opentiny/next-sdk"></script>
  </head>
  <body>
    <script>
      // NEXT SDK 使用示例代码
    </script>
  </body>
</html>
```
