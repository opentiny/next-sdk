import { createServer, messageChannel } from '@opentiny/next-sdk'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { completable } from '@modelcontextprotocol/sdk/server/completable.js'

const updateToolButton = document.getElementById('update-tool')
const updateResourceButton = document.getElementById('update-resource')

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const createConsoleServer = async () => {
  const server = createServer(
    {
      name: 'next-sdk',
      version: '1.0.0'
    },
    {
      capabilities: {
        logging: {},
        resources: { subscribe: true, listChanged: true }
      }
    }
  )

  // await server.use(messageChannel({ endpoint: 'endpoint', globalObject: window }))

  // 监听订阅资源
  server.on('subscribe', (request) => {
    console.log('监听订阅资源', request)
    // 这里不能返回 contents 字段，否则会被 zod 校验报错
    // 正确做法是只做处理或返回协议允许的内容
    return {}
  })

  // 监听取消订阅资源
  server.on('unsubscribe', (request) => {
    console.log('监听取消订阅资源', request)
    return {}
  })

  server.on('setLevel', (request) => {
    console.log('监听设置日志级别', request)
    return {}
  })

  server.on('ping', (request) => {
    console.log('监听ping', request)
    return {}
  })

  // 监听获取资源列表 这里会和 server.resource 造成重复监听
  // nextServer.on('listResources', (request) => {
  //   console.log('listResources111', request)
  //   return {
  //     resources: [{ name: 'Test', uri: 'test://example' }],
  //     nextCursor: 'next-page'
  //   }
  // })

  const tool = server.tool('get-weather', 'Get the weather of a city', { value: z.string() }, async ({ value }) => {
    return { content: [{ type: 'text', text: `The weather of ${value} is sunny` }] }
  })

  // 资源订阅
  const serverResource = await server.resource(
    'svgs',
    new ResourceTemplate('file:///svgs/{name}.svg', {
      list: () => {
        return {
          resources: [{ name: 'Test', uri: 'test://example' }],
          nextCursor: 'next-page'
        }
      },
      complete: {
        name: () => ['vue', 'vite'] // 这里定义了自动完成的数据
      }
    }),
    async (uri, { name }) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'image/svg+xml',
          text: 'xxxx' + name
        }
      ]
    })
  )

  // 资源订阅
  await server.resource(
    'svgs1',
    new ResourceTemplate('file:///svgs1/{name}.svg', {
      list: undefined,
      complete: {
        name: () => ['vue', 'vite'] // 这里定义了自动完成的数据
      }
    }),
    async (uri, { name }) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'image/svg+xml',
          text: 'xxxx1' + name
        }
      ]
    })
  )

  // 更新资源
  updateResourceButton?.addEventListener('click', async () => {
    await server.server.sendResourceUpdated({ uri: 'file:///svgs/vue.svg', add: true })

    serverResource.update({
      template: new ResourceTemplate('file:///svgs/{name}.svg', {
        list: undefined,
        complete: {
          name: () => ['vue', 'vite'] // 这里定义了自动完成的数据
        }
      }),
      callback: async (uri, { name }) => ({
        contents: [
          {
            uri: uri.href,
            mimeType: 'image/svg+xml',
            text: 'xxxx' + name
          }
        ]
      })
    })
  })

  // 长任务工具
  server.registerTool(
    'long-task',
    {
      title: 'long-task',
      inputSchema: {
        steps: z.number().describe('任务步骤')
      }
    },
    async ({ steps }, { sendNotification, _meta, signal, requestId }) => {
      for (let i = 0; i < steps; i++) {
        // progressToken 是一个从0开始自增的数字，每次调用工具，progressToken 都会自增1
        const progressToken = _meta?.progressToken
        console.log('progressToken', progressToken)
        if (progressToken || progressToken === 0) {
          await sendNotification({
            method: 'notifications/progress',
            params: {
              progressToken,
              progress: i,
              total: steps,
              requestId, // 额外增加的 requestId，告诉客户端真正的请求 ID
              message: `服务端 - 长时间任务进行中...`
            }
          })
        }
        if (signal.aborted) {
          server.server.sendLoggingMessage({ level: 'error', data: '服务端 - 长时间任务已终止' })
          break
        }
        await sleep(1000)
      }

      await server.server.sendLoggingMessage({ level: 'info', data: '服务端 - 长时间任务已结束' })
      return { content: [{ type: 'text', text: 'DONE' }] }
    }
  )

  // 更新工具
  updateToolButton?.addEventListener('click', async () => {
    tool.update({
      paramsSchema: {
        value: z.string()
      },
      callback: async ({ value }: { value: string }) => {
        return { content: [{ type: 'text', text: `The weather of ${value} is rainy` }] }
      }
    })
  })

  const pingServerButton = document.getElementById('ping-server')
  const listRootsButton = document.getElementById('list-roots')
  const samplingButton = document.getElementById('sampling')
  const updatePromptButton = document.getElementById('update-prompt')
  const sendLoggingMessageButton = document.getElementById('send-logging-message')

  sendLoggingMessageButton?.addEventListener('click', async () => {
    await server.server.sendLoggingMessage({ level: 'info', data: '服务端 - 发送日志' })
  })

  // 设置 MCP Prompt 提示
  const prompt = server.prompt(
    'setting-prompt',
    {
      name: completable(
        z.string().describe('配置名称: 如基础、网络、高级等'),
        // 这里定义了自动完成的数据
        (text) => ['基础', '网络', '高级'].filter((value) => value.startsWith(text))
      )
    },
    async ({ name }) => {
      console.log('arguments', name)
      return {
        messages: [
          {
            role: 'assistant',
            content: {
              type: 'text',
              text: `请根据实际情况配置${name}`
            }
          }
        ]
      }
    }
  )

  // 更新提示资源更新
  updatePromptButton?.addEventListener('click', async () => {
    prompt.update({
      argsSchema: {
        name: completable(
          z.string().describe('配置名称: 如基础、网络、高级等'),
          // 这里定义了自动完成的数据
          (text) => ['基础xxx', '网络xxx', '高级xxx'].filter((value) => value.startsWith(text))
        )
      },
      callback: async ({ name }) => ({
        messages: [
          {
            role: 'assistant',
            content: {
              type: 'text',
              text: `请根据实际情况配置${name}!`
            }
          }
        ]
      })
    })
  })

  pingServerButton?.addEventListener('click', async () => {
    const response = await server.server.ping()
    console.log('ping', response)
  })
  // 获取 Roots 根目录
  listRootsButton?.addEventListener('click', async () => {
    const response = await server.server.listRoots()
    console.log('listRoots', response)
  })

  // 请求 Sampling 大模型
  samplingButton?.addEventListener('click', async () => {
    const sampling = await server.server.createMessage({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: 'What is the capital of France?'
          }
        }
      ],
      modelPreferences: {
        hints: [
          {
            name: 'claude-3-sonnet'
          }
        ],
        intelligencePriority: 0.8,
        speedPriority: 0.5
      },
      systemPrompt: 'You are a helpful assistant.',
      maxTokens: 100
    })

    console.log('sampling', sampling)
  })

  await server.connectTransport()
}
