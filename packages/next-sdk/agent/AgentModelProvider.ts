import { streamText, stepCountIs, generateText } from 'ai'
import { experimental_createMCPClient as createMCPClient, experimental_MCPClientConfig as MCPClientConfig } from 'ai'
import type { ToolSet } from 'ai'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import type { IAgentModelProviderOption, McpServerConfig } from './type'
import { ProviderV2 } from '@ai-sdk/provider'
import { OpenAIProvider } from '@ai-sdk/openai'
import { createOpenAI } from '@ai-sdk/openai'
import { createDeepSeek } from '@ai-sdk/deepseek'
import { getSystemPromptMessages, organizeToolCalls } from './react'

export const AIProviderFactories = {
  ['openai']: createOpenAI,
  ['deepseek']: createDeepSeek
}

type ChatMethodFn = typeof streamText | typeof generateText

/** 一个通用的ai-sdk的agent封装
 * @summary 内部自动管理了 llm, mcpServer, ai-sdk的clients 和 tools
 * @returns 暴露了 chat, chatStream方法
 */
export class AgentModelProvider {
  llm: ProviderV2 | OpenAIProvider
  /**  mcpServers 允许为配置为 McpServerConfig, 或者任意的 MCPTransport
   * 参考: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling#initializing-an-mcp-client */
  mcpServers: McpServerConfig[] = []
  /**  ai-sdk的 mcpClient */
  mcpClients: any[] = []
  /** 所有的tools */
  mcpTools: Array<Record<string, any>> = []
  /**  需要实时过滤掉的tools name*/
  ignoreToolnames: string[] = []
  /** 是否是 ReAct 模型 */
  isReActModel: boolean = false

  constructor({ llmConfig, mcpServers, llm }: IAgentModelProviderOption) {
    // 1、保存 mcpServer
    this.mcpServers = mcpServers || []

    // 2、保存 llm
    if (llm) {
      this.llm = llm
    } else if (llmConfig) {
      let providerFn: (options: any) => ProviderV2 | OpenAIProvider

      if (typeof llmConfig.providerType === 'string') {
        providerFn = AIProviderFactories[llmConfig.providerType]
      } else {
        providerFn = llmConfig.providerType
      }
      this.llm = providerFn({
        apiKey: llmConfig.apiKey,
        baseURL: llmConfig.baseURL
      })
    } else {
      throw new Error('Either llmConfig or llm must be provided')
    }

    // 3、 创建clients,tools
    this.initClientsAndTools()
  }

  /** 创建一个 ai-sdk的 mcpClient, 创建失败则返回 Null */
  async _createOneClient(serverConfig: McpServerConfig) {
    try {
      let transport: MCPClientConfig['transport']
      // transport 一定是 streamableHttp 或者就是： ai-sdk允许的 transport
      if ('type' in serverConfig && serverConfig.type.toLocaleLowerCase() === 'streamablehttp') {
        transport = new StreamableHTTPClientTransport(new URL(serverConfig.url))
      } else {
        transport = serverConfig as MCPClientConfig['transport']
      }

      return createMCPClient({ transport: transport as MCPClientConfig['transport'] })
    } catch (error) {
      console.error(`Failed to create MCP client`, serverConfig, error)
      return null
    }
  }
  /** 创建 ai-sdk的 mcpClient */
  async _createMpcClients() {
    // 使用 Promise.all 并行处理所有 mcpServer 项
    this.mcpClients = await Promise.all(
      this.mcpServers.map(async (server) => {
        const client = await this._createOneClient(server)
        return client
      })
    )
  }
  /** 创建所有 mcpClients 的 tools */
  async _createMpcTools() {
    this.mcpTools = await Promise.all(
      this.mcpClients.map(async (client) => {
        try {
          console.log('开始查询tool：', client)
          const tool = client ? await client?.tools?.() : null
          console.log('查询tool的结果：', tool, client)

          return tool
        } catch (error) {
          return null
        }
      })
    )
  }

  async closeAll() {
    await Promise.all(
      this.mcpClients.map(async (client) => {
        try {
          client.close()
        } catch (error) {}
      })
    )
  }

  async initClientsAndTools() {
    await this._createMpcClients()
    await this._createMpcTools()
  }

  async updateMcpServers(mcpServers: McpServerConfig[]) {
    await this.closeAll()
    this.mcpServers = mcpServers
    await this.initClientsAndTools()
  }

  async insertMcpServer(mcpServer: McpServerConfig) {
    const find = this.mcpServers.find((item) => item.url === mcpServer.url)

    if (!find) {
      this.mcpServers = [...this.mcpServers, mcpServer]
      const client = await this._createOneClient(mcpServer)
      this.mcpClients.push(client)
      this.mcpTools.push(await client?.tools?.())
      return true
    }
    return false
  }

  /** 创建临时允许调用的tools集合 */
  tempMergeTools(extraTool = {}) {
    const toolsResult = this.mcpTools.reduce((acc, curr) => ({ ...acc, ...curr }), {})
    Object.assign(toolsResult, extraTool)

    this.ignoreToolnames.forEach((name) => {
      delete toolsResult[name]
    })

    return toolsResult
  }

  async _chat(
    chatMethod: ChatMethodFn,
    { model, maxSteps = 5, ...options }: Parameters<typeof generateText>[0] & { maxSteps?: number }
  ): Promise<any> {
    if (!this.llm) {
      throw new Error('LLM is not initialized')
    }

    const tools = await this.tempMergeTools(options.tools) as ToolSet
    const systemPrompt = await getSystemPromptMessages(tools)
  
    const stopFunction=(args)=>{
      debugger
    }

    return chatMethod({
      // @ts-ignore  ProviderV2 是所有llm的父类， 在每一个具体的llm 类都有一个选择model的函数用法
      model: this.llm(model),
      system: systemPrompt,
      tools,
      stopWhen:this.isReActModel? stopFunction: stepCountIs(maxSteps),
      onStepFinish: async (step) => {
        const text=step.content[0].text
        const toolCallsResult = []
        const { toolCalls, thought, finalAnswer } = await organizeToolCalls(text)
        
        for (const toolCall of toolCalls) { 
          const tool = tools[toolCall.function.name]
          if (tool) {
           const result = await tool.execute(JSON.parse(toolCall.function.arguments))
           toolCallsResult.push(result)
          }
        }
        console.log('toolCallsResult', toolCallsResult)
        
      },
      ...options
    })
  }

  async chat(options: Parameters<typeof generateText>[0] & { maxSteps?: number }): Promise<any> {
    return this._chat(generateText, options)
  }

  async chatStream(options: Parameters<typeof streamText>[0] & { maxSteps?: number }): Promise<any> {
    return this._chat(streamText, options)
  }
}
