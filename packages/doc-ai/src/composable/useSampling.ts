import {
  CreateMessageRequestSchema
} from '@modelcontextprotocol/sdk/types.js'
import type { NextClient } from '@opentiny/next-sdk'

const createLLMRes = (text: string) => ({
  model: 'deepseek-chat',
  role: 'assistant',
  content: {
    type: 'text',
    text
  }
})

// 未经过封装，需要将所有的CreateMessageRequestSchema集中在一起处理
export const useSamplingRaw = (client: NextClient) => {
  client.setRequestHandler(CreateMessageRequestSchema, (request) => {
    const { $id, messages } = request?.params || {}
    const content = messages[0].content.text?.split('\n\n')[1]
    // Mock LLM return
    if ($id === 'summarize') {
      return createLLMRes(`raw-概要：${content}`)
    } else if ($id === 'expand') {
      return createLLMRes(`raw-扩写：${content}`)
    } else {
      return createLLMRes(`${content}`)
    }
  })
}

export const useSampling = (client: NextClient) => {
  client.onSampling('summarize', (request) => {
    const content = request.params.messages[0].content.text?.split('\n\n')[1]
    return createLLMRes(`概要：${content}`)
  })


  client.onSampling('expand', (request) => {
    const content = request.params.messages[0].content.text?.split('\n\n')[1]
    return createLLMRes(`扩写：${content}`)
  })
}