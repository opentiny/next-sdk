# next-sdk 使用指南

## 项目简介

`next-sdk` 是基于 `@modelcontextprotocol/sdk` 和 `@opentiny/next` 的客户端和服务端封装，提供了更友好的 API 和更丰富的功能。

---

## 目录结构与主要模块

- `client/`：客户端相关能力
  - `createClient.ts`：创建客户端实例，提供事件注册、插件机制等核心功能
  - `connectMcpServer.ts`：遥控端连接服务端的插件，支持 stream/sse 两种传输方式
  - `createInMemoryTransport.ts`：内存传输实现，便于本地调试和测试
  - `createMessageChannelTransport.ts`：基于 MessageChannel 的多窗口 iframe 通信的 transport 实现
  - `createProxy.ts`：创建代理对象和孪生 Transport，支持 stream/sse 两种传输方式
  - `index.ts`：导出所有客户端模块

- `server/`：服务端相关能力
  - `createServer.ts`：创建服务端实例，提供事件监听和处理能力
  - `index.ts`：导出所有服务端模块

- `mcp-host/`：多模型能力平台（MCP）相关实现
  - `core/`：核心能力实现
  - `deepseek/`：DeepSeek LLM 接入实现
  - `index.ts`：统一导出 MCP 相关能力

- `utils/`：工具方法
  - `dom.ts`：DOM 相关工具方法
  - `index.ts`：导出所有工具方法

- `type.ts`：类型定义文件
  - 包含客户端、服务端、传输方式等相关类型定义
  - 提供完整的 TypeScript 类型支持

- `index.ts`：根入口文件
  - 统一导出客户端和服务端模块
  - 方便用户引入使用

---

## 1. 客户端能力

### 1.1 NextClient 类

`NextClient` 封装了底层 Client 实例，提供事件注册、插件机制、连接等能力。

#### 创建 NextClient 实例

```ts
import { createClient } from '@opentiny/next-sdk'


// 通过 createClient 创建 NextClient 实例，便于后续扩展和事件注册。
const client = createClient({name: 'next-sdk',version: '1.0.0'})
```

### 1.2 注册插件

```ts
// 通过插件机制扩展 client 能力，plugin函数执行返回的是一个接收 client 实例的函数。
await client.use(plugin({options}))
```

#### 1.2.1 createInMemoryTransport

此插件用于本地或跨 iframe 的消息通道通信。

```ts
import { createInMemoryTransport } from '@opentiny/next-sdk'

// 设置为 InMemory 通信，适合前端多窗口/iframe 场景。
await client.use(createInMemoryTransport())
```

#### 1.2.2 createMessageChannelTransport

此插件用于本地或跨 iframe 的消息通道通信。

```ts
import { createMessageChannelTransport } from '@opentiny/next-sdk'

// 设置为 MessageChannel 通信，适合前端多窗口/iframe 场景。
await client.use(createMessageChannelTransport({ endpoint, globalObject }))
```

#### 1.2.3 createClientProxy

此插件用于通过 stream 或 sse 代理方式与服务端通信。

```ts
import { createClientProxy } from '@opentiny/next-sdk'

// 根据 type 选择 stream 或 sse 方式，自动管理 session 和连接关闭。
await client.use(createClientProxy({
  type: 'stream', // 或 'sse'
  url: 'https://agent-server.com/mcp',
  token: 'your-token',
  sessionId: 'xxx'
}))
```

#### 1.2.4 connectMcpServer

此插件用于遥控器端或者业界通用的 `MCP HOST` 直接连接 MCP 服务端，支持 stream/sse。

```ts
import { connectMcpServer } from 'next-sdk'

// 直接配置服务端地址和鉴权信息，快速建立连接。
await client.use(connectMcpServer({
  type: 'stream', // 或 'sse'
  url: 'https://agent-server.com/mcp?sessionId=xxx',
  token: 'your-token',
}))
```

### 1.3 事件注册

```ts
// 支持注册通知事件（如 toolListChanged、resourceUpdated 等）和请求事件（如 createMessage、listRoots 等）。

// 监听工具变化事件
client.on('toolListChanged', callback)
// 监听资源变化事件
client.on('resourceUpdated', callback)
// 监听日志发送事件
client.on('loggingMessage', callback)
// 监听listRoots
client.on('listRoots', callback)
// 监听创建消息，并返回大模型响应
client.on('createMessage', callback)
```

#### 1.4 连接

```ts
// 建立与服务端的连接，具体传输方式由 插件的 transport 决定。  
await client.connectTransport()
```

---

## 2. 服务端能力

### 2.1 NextServer 类

`NextServer` 封装了底层 McpServer 实例，提供事件注册、插件机制、连接等能力。

#### 创建 NextServer 实例

```ts
import { createServer } from '@opentiny/next-sdk'

// 通过 createServer 创建 NextServer 实例。
const server = createServer({name: 'next-sdk', version: '1.0.0'})
```

### 2.2 注册插件

```ts
// 通过插件机制扩展 server 能力，plugin函数执行返回的是一个接收 server 实例的函数。
await server.use(plugin({options}))
```

#### 2.2.1 createInMemoryTransport

此插件用于本地或跨 iframe 的消息通道通信。

```ts
import { createInMemoryTransport } from '@opentiny/next-sdk'

// 设置为 InMemory 通信，适合前端多窗口/iframe 场景。
await server.use(createInMemoryTransport())
```

#### 2.2.2 createMessageChannelTransport

此插件用于本地或跨 iframe 的消息通道通信。

```ts
import { createMessageChannelTransport } from '@opentiny/next-sdk'

// 设置为 MessageChannel 通信，适合前端多窗口/iframe 场景。
await server.use(createMessageChannelTransport({ endpoint, globalObject }))
```

#### 2.2.3 createServerProxy

此插件用于通过 stream 或 sse 代理方式与客户端通信。

```ts
import { createServerProxy } from '@opentiny/next-sdk'

// 根据 type 选择 stream 或 sse 方式，自动管理 session 和连接关闭。
await server.use(createServerProxy()) 
```

### 2.3 事件注册

```ts
// 注册服务端请求事件（如 subscribe、unsubscribe、listResources 等）。

// 监听订阅资源
server.on('subscribe', callback)
// 监听取消订阅资源
server.on('unsubscribe', callback)
// 监听设置日志级别
server.on('setLogLevel', callback)
// 监听ping
server.on('ping', callback)
```

### 2.4 连接

```ts
// 建立服务端监听，支持 messageChannel 等多种传输方式。
await server.connectTransport()
```

---

## 3. 典型用法示例 -- （前端工程MCP 服务端、agent-server代理服务器、遥控端）

### 3.1 前端工程（App.vue）通过 createProxy 代理 stream 方式连接agent-server代理服务器

```ts
import { createClient, createClientProxy } from '@opentiny/next-sdk'

const nextClient = createClient({name: 'next-sdk',version: '1.0.0'})

const { sessionId, transport } = await nextClient.use(createClientProxy({
  type: 'stream',
  url: 'https://agent-server.com/mcp',
  sessionId: 'xxx',
  token: 'your-token'
}))

await client.connectTransport()
```

### 3.2 MCP 服务端（子路由页面）定义工具或者监听请求

```ts
import { createServer,createServerProxy } from '@opentiny/next-sdk'

const server = createServer({name: 'next-sdk',version: '1.0.0'})

server.use(createServerProxy())

server.tool('get-weather', 'Get the weather of a city', { value: z.string() }, async ({ value }) => {
    return { content: [{ type: 'text', text: `The weather of ${value} is sunny` }] }
})

server.on('subscribe', callback)

await server.connectTransport()
```

### 3.3 远程遥控端（可以是手机、平板、电脑等）通过 connectMcpServer 连接agent-server代理服务器

```ts
import { createClient, connectMcpServer } from '@opentiny/next-sdk'

const client = createClient({name: 'next-sdk',version: '1.0.0'})

await client.use(connectMcpServer({
  type: 'stream',
  url: 'https://agent-server.com/mcp?sessionId=xxx',
  token: 'your-token'
}))

await client.connectTransport()
```

## 4. 典型用法示例 -- （前端工程MCP 服务端、iframe 帮助文档遥控端）

### 4.1 iframe 帮助文档遥控端通过 messageChannel 连接前端工程

```ts
import { createClient, createMessageChannelTransport } from '@opentiny/next-sdk'

const client = createClient({name: 'next-sdk',version: '1.0.0'})

client.use(createMessageChannelTransport({
  endpoint: 'endpoint',
  globalObject: window.parent
}))

await client.connectTransport()
```

### 4.2 前端工程通过 messageChannel 连接 iframe 帮助文档遥控端，并定义工具或者监听请求

```ts
import { createServer, createMessageChannelTransport } from '@opentiny/next-sdk'

const server = createServer({name: 'next-sdk',version: '1.0.0'})

server.use(createMessageChannelTransport({
  endpoint: 'endpoint',
  globalObject: window
}))

server.tool('get-weather', 'Get the weather of a city', { value: z.string() }, async ({ value }) => {
    return { content: [{ type: 'text', text: `The weather of ${value} is sunny` }] }
})

server.on('subscribe', callback)

await server.connectTransport()
```

---

## 5. 其他说明

- 所有通信方式均支持插件机制，便于灵活扩展。
- 支持多种事件注册，覆盖通知和请求两大类。
- 传输方式可根据实际场景选择（如 messageChannel 适合前端多窗口，stream/sse 适合前后端通信）。

---
