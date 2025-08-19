import { createOpenAI } from '@ai-sdk/openai'
import { createDeepSeek } from '@ai-sdk/deepseek'

export const AIProviderFactories = {
  ['openai']: createOpenAI,
  ['deepseek']: createDeepSeek
}
