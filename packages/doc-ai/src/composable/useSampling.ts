import {
  CreateMessageRequestSchema
} from '@modelcontextprotocol/sdk/types.js'
import type { NextClient } from '@opentiny/next-sdk'

const createLLMResponse = (text: string) => ({
  model: 'deepseek-chat',
  role: 'assistant',
  content: {
    type: 'text',
    text
  }
})

const chatToLLM = (mcpHost: any, content: string): Promise<string> => {
  let result = ''
  return new Promise((resolve) => {
    mcpHost.chatStream(content, {
      onData: (data: any) => {
        const { role, content } = data.delta
        if (role === 'assistant') {
          result += content
        }
      },
      onDone: () => {
        resolve(result)
        mcpHost.clearMessages()
      },
      onError: (error: any) => {
        console.error(error)
        resolve('LLM return error')
        mcpHost.clearMessages()
      }
    })
  })
}

// 未经过封装，需要将所有的CreateMessageRequestSchema集中在一起处理
export const useSamplingRaw = (client: NextClient, mcpHost: any) => {
  client.setRequestHandler(CreateMessageRequestSchema, async (request) => {
    const { $id, messages } = request?.params || {}
    const content = messages[0].content.text as string

    if ($id === 'summarize') {
      const resText = await chatToLLM(mcpHost, content)
      return createLLMResponse(resText)
    } else if ($id === 'expand') {
      const resText = await chatToLLM(mcpHost, content)
      return createLLMResponse(resText)
    } else {
      return createLLMResponse(`${content}`)
    }
  })
}

export const useSampling = (client: NextClient, mcpHost: any) => {

  client.onSampling('summarize', async (request) => {
    const content = request.params.messages[0].content.text
    const resText = await chatToLLM(mcpHost, content)
    return createLLMResponse(resText)
  })


  client.onSampling('expand', async (request) => {
    const content = request.params.messages[0].content.text
    const resText = await chatToLLM(mcpHost, content)
    return createLLMResponse(resText)
  })
}