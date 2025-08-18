import { AIProviderType } from '../type'
import { createOpenAI } from '@ai-sdk/openai'
import { createDeepSeek } from '@ai-sdk/deepseek'

export const AIProviderFactories = {
  [AIProviderType.OPENAI]: createOpenAI,
  [AIProviderType.DEEPSEEK]: createDeepSeek
}
