import { createClient, createMessageChannelTransport, createClientProxy } from '@opentiny/next-sdk'
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js'

export const createConsoleClient = async () => {
  // 创建nextClient
  const client = createClient(
    {
      name: 'next-sdk',
      version: '1.0.0'
    },
    {
      capabilities: {
        roots: { listChanged: true },
        sampling: { createMessage: true }
      }
    }
  )

  // 使用createMessageChannelTransport插件建立messageChannel连接
  // await nextClient.use(createMessageChannelTransport({ endpoint: 'endpoint', globalObject: window }))

  // 使用createProxy插件建立sse连接
  const { sessionId, transport } = await client.use(
    createClientProxy({
      type: 'sse',
      url: 'https://www.opentiny.xyz/sse',
      token: '123',
      sessionId: 'sse06a93-e87a-40f6-9212-33f456677214'
    })
  )

  console.log('sessionId', sessionId)
  console.log('transport', transport)

  // 监听工具变化事件
  client.on('toolListChanged', (notification) => {
    console.log('监听工具变化事件', notification)
  })

  // 监听资源变化事件
  client.on('resourceUpdated', (notification) => {
    console.log('监听资源变化事件', notification)
  })

  // 监听日志变化事件
  client.on('loggingMessage', (notification) => {
    console.log('监听日志发送事件', notification)
  })

  // 监听listRoots
  client.on('listRoots', (request) => {
    console.log('监听listRoots', request)
    return {
      roots: [{ name: 'Frontend Repository', uri: 'file:///home/user/projects/frontend?id=' + Math.random() }]
    }
  })

  client.on('createMessage', (request) => {
    console.log('监听创建消息，并返回大模型响应', request)
    return {
      role: 'assistant',
      content: {
        type: 'text',
        text: 'The capital of France is Paris.'
      },
      model: 'claude-3-sonnet-20240307',
      stopReason: 'endTurn'
    }
  })

  await client.connectTransport()

  const callToolButton = document.getElementById('call-tool')
  // 调用工具
  callToolButton?.addEventListener('click', async () => {
    try {
      const result = await client.callTool({ name: 'get-weather', arguments: { value: 'Beijing' } })
      console.log(result)
    } catch (error) {
      console.error(error)
    }
  })

  const longTaskButton = document.getElementById('call-long-task')
  const abortButton = document.getElementById('abort-task')
  longTaskButton?.addEventListener('click', () => {
    const { toolResultPromise, controller } = client.$callTool(
      { name: 'long-task', arguments: { steps: 10 } },
      undefined,
      {
        onprogress: (progress) => {
          console.log('progress', progress)
        }
      }
    )
    console.log('result', toolResultPromise)

    abortButton?.addEventListener('click', () => {
      controller.abort('用户取消')
    })
  })

  const normalTaskButton = document.getElementById('call-normal-task')
  const abortNormalButton = document.getElementById('abort-normal-task')

  normalTaskButton?.addEventListener('click', async () => {
    // 任务 promise
    const { toolResultPromise, controller } = client.$callTool({ name: 'normal-task' })
    console.log('normal-task result', toolResultPromise)
    abortNormalButton?.addEventListener('click', async () => {
      await controller.abort('用户取消普通任务')
    })
  })

  const subscribeResourceButton = document.getElementById('subscribe-resource')
  subscribeResourceButton?.addEventListener('click', async () => {
    // 订阅资源
    const resource = await client.subscribeResource({ uri: 'file:///svgs/vue.svg' })
    console.log('resource', resource)
  })

  const unsubscribeResourceButton = document.getElementById('unsubscribe-resource')
  unsubscribeResourceButton?.addEventListener('click', async () => {
    // 取消订阅资源
    const resource = await client.unsubscribeResource({ uri: 'file:///svgs/vue.svg' })
    console.log('resource', resource)
  })

  const readResourceButton = document.getElementById('read-resource')
  readResourceButton?.addEventListener('click', async () => {
    // 读取资源
    const resourceText = await client.readResource({ uri: 'file:///svgs/vue.svg' })
    console.log('resourceText', resourceText.contents)
  })

  const getPromptButton = document.getElementById('get-prompt')
  // 获取 MCP 提示模板
  getPromptButton?.addEventListener('click', async () => {
    const prompt = await client.getPrompt({ name: 'setting-prompt', arguments: { name: '网络' } })
    console.log('prompt-client', prompt)
  })

  const getCompleteButton = document.getElementById('get-complete')
  // 获取 MCP 提示模板自动完成
  getCompleteButton?.addEventListener('click', async () => {
    const complete = await client.complete({
      ref: { type: 'ref/prompt', name: 'setting-prompt' },
      argument: { name: 'name', value: '网' }
    })
    console.log('complete', complete)
  })

  const setLoggingLevelButton = document.getElementById('set-logging-level')
  // 设置日志级别
  setLoggingLevelButton?.addEventListener('click', async () => {
    const response = await client.setLoggingLevel('error')
    console.log('response', response)
  })

  const listResourcesButton = document.getElementById('list-resources')
  // 获取资源列表
  listResourcesButton?.addEventListener('click', async () => {
    const response = await client.listResources({ cursor: 'first-page' })
    console.log('response', response)
  })

  const pingClientButton = document.getElementById('ping-client')
  // 心跳
  pingClientButton?.addEventListener('click', async () => {
    const response = await client.ping()
    console.log('response', response)
  })
}
