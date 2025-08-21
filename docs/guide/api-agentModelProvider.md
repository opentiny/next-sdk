# AgentModelProvider 类

```typescript
import { AgentModelProvider } from '@opentiny/next-sdk'
```

本文统一使用 `llm` 术语，来指代所有的在线大语言模式或本地部署的大语言模型。

`AgentModelProvider 类`是对 `ai-sdk Provider` 一个简单封装，通过它可以直接跟 `llm` 进行对话，以及 Mcp 工具的调用,达到简化代码的目的。当然你也可以直接使用 `ai-sdk` 进行 `llm`的访问。

## 初始化实例

`AgentModelProvider` 是一个 Class, 它的构造函数入参为：

```typescript
/** 代理模型提供器的大语言配置对象 */
export interface IAgentModelProviderLlmConfig {
  apiKey: string
  baseURL: string
  /** 支持内置的常用模型，或者传入一个ai-sdk官方的Provider工厂函数
   * @example
   * import { createOpenAI } from '@ai-sdk/openai'
   */
  providerType: 'openai' | 'deepseek' | ((options: any) => ProviderV2)
}

export interface IAgentModelProviderOption {
  /** ai-sdk官方的Provider实例，不能与 llmConfig 同时传入
   * @example
   * import { openai } from '@ai-sdk/openai'
   */
  llm?: ProviderV2
  /** 代理模型提供器的大语言配置对象, 不能与 llm 同时传入 */
  llmConfig?: IAgentModelProviderLlmConfig
  /** Mcp Server的配置对象的集合 */
  mcpServers?: McpServerConfig[]
}
```

其中 `llm` 与 `llmConfig` 都是定义如何连接大模型，使用其中之一即可

1. 通过 `llm` 来定义连接

```typescript
import { openAI } from '@ai-sdk/openai'

const webAgent = new AgentModelProvider({
  llm: openAI
})
```

这种形式可以隐藏`apiKey`等敏感信息，通常是由环境变量来提供。 如何设置环境变量，请参考`ai-sdk Provider`的相关文档页面

2. 通过 `llmConfig` 来定义连接

```typescript
const webAgent = new AgentModelProvider({
  llmConfig: {
    apiKey: 'sk-xxx',
    baseURL: 'https://xxxxx',
    providerType: 'deepseek'
  }
})
```

在 `llmConfig.providerType` 中，指定了 `ai-sdk Provider`的函数类型，它内置了常用的`openai`与 `deepseek` 两种类型。 如果需要连接其它的 `llm` 模型，传入自定义的 `Provider` 函数。

```typescript
import { createAnthropic } from '@ai-sdk/anthropic'

const webAgent = new AgentModelProvider({
  llmConfig: {
    apiKey: 'sk-xxx',
    baseURL: 'https://xxxxx',
    providerType: createAnthropic
  }
})
```

> [!NOTE]
> 该方法会在前端暴露敏感信息，请做好敏感信息的处理。

3. 通过 `mcpServers` 来设置对话中的 Mcp Tools

```typescript
/** Mcp Server的配置对象 */
export type McpServerConfig = { type: 'streamableHttp' | 'sse'; url: string } | { tranport: MCPTransport }

const webAgent = new AgentModelProvider({
  llmConfig: {
    apiKey: 'sk-xxx',
    baseURL: 'https://xxxxx',
    providerType: createAnthropic
  },
  mcpServers: [{ type: 'streamableHttp', url: 'https://xxxx' }]
})
```

如上配置后，在每次对话时，都会通过上述的`Transport` 向 `McpServer` 询问所有的工具列表，并在对话时自动带上这些工具。

如果指定了多个 `McpServerConfig` 对象，会给每一个 `McpServer`都建立连接，并查询工具后进行合并后，再进入对话。

如果需要自定义 Mcp 连接，请参考 [ai-sdk的初始化Mcp Client](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling#initializing-an-mcp-client)

## 使用 `AgentModelProvider` 的实例

初始化 `AgentModelProvider` 对象后，可以通过对象实例进行对话, 它暴露了 `chat` 和 `chatStream` 两个方法。

```typescript
const webAgent = new AgentModelProvider({
  llmConfig: {
    apiKey: 'sk-xxx',
    baseURL: 'https://xxxxx',
    providerType: 'deepseek'
  },
  mcpServers: [{ type: 'streamableHttp', url: 'https://xxxx' }]
})

const generateTextResult = webAgent.chat({
    model: 'deepseek-ai/DeepSeek-V3',
    messages:[
        { role: 'system', content: '你是xxx' },
        { role: 'user', content: '1+1 等于多少？' },
    ],
    // .......
})

const streamTextResult = webAgent.chatStream({
    model: 'deepseek-ai/DeepSeek-V3',
    messages:[
        { role: 'system', content: '你是xxx' },
        { role: 'user', content: '1+1 等于多少？' },
    ],
    // .......
})

```

> [!TIP]
> 以上2个函数的入参以及返回结果， 都是与 `ai-sdk` 全部兼容的，请参考 [ai-sdk core 文档](https://ai-sdk.dev/docs/ai-sdk-core) 了解详细的情况。
