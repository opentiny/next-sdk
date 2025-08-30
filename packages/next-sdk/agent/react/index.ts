import { Tool, ToolCall } from '../type'
import { PREFIX, FORMAT_INSTRUCTIONS, SUFFIX } from './systemPrompt'
import { generateText, stepCountIs } from 'ai'

const FINAL_ANSWER_TAG = 'Final Answer:'
const ACTION_TAG = '"action":'

export const getSystemPromptMessages = async (tools: Tool[]): Promise<string> => {
  const toolStrings = JSON.stringify(tools)
  const prompt = [PREFIX, toolStrings, FORMAT_INSTRUCTIONS, SUFFIX].join('\n\n')

  return prompt
}

export const organizeToolCalls = async (
  text: string
): Promise<{ toolCalls: ToolCall[]; thought?: string; finalAnswer: string }> => {
  try {
    let thought: string | undefined
    const thoughtActionRegex = /Thought(.*?)(?:Action|Final Answer|$)/gs
    const matches = [...text.matchAll(thoughtActionRegex)]

    if (matches.length > 0) {
      // 取第一个 Thought 作为思考内容，去除首尾的符号
      thought = matches[0][1]?.replace(/^\W|$/, '')?.trim()
    }

    if (text.includes(FINAL_ANSWER_TAG) && !text.includes(ACTION_TAG)) {
      const parts = text.split(FINAL_ANSWER_TAG)
      const output = parts[parts.length - 1].trim()
      return {
        toolCalls: [],
        thought,
        finalAnswer: output
      }
    }

    if (!text.includes(ACTION_TAG)) {
      return {
        toolCalls: [],
        thought,
        finalAnswer: text.trim()
      }
    }

    const toolCalls: ToolCall[] = []

    if (text.includes('```')) {
      const actionBlocks = text
        .trim()
        .split(/```(?:json)?/)
        .filter((block: string) => block.includes(ACTION_TAG))

      actionBlocks.forEach((block: string) => {
        try {
          const { action, action_input } = JSON.parse(block.trim())

          if (!action || typeof action !== 'string') {
            console.error('Invalid tool call: missing or invalid action field')

            return
          }

          toolCalls.push({
            id: `call_${Math.random().toString(36).slice(2)}`,
            type: 'function',
            function: {
              name: action,
              arguments: typeof action_input === 'string' ? action_input : JSON.stringify(action_input || {})
            }
          })
        } catch (error) {
          console.error('Failed to parse tool call JSON:', error)
        }
      })
    }

    return {
      toolCalls: toolCalls,
      thought,
      finalAnswer: text.trim()
    }
  } catch (error) {
    console.error('Failed to organize tool calls:', error)

    return {
      toolCalls: [],
      thought: '',
      finalAnswer: text
    }
  }
}

export const runReActLoop = async ({
  text,
  tools,
  vm,
  chatMethod,
  options,
  system,
  llm
}: {
  text: string
  tools: Tool[]
  vm: any
  chatMethod: any
  options: any
  system: string
  llm: any
}) => {
  const toolCallsResult = []
  const { toolCalls, thought, finalAnswer } = await organizeToolCalls(text)

  for (const toolCall of toolCalls) {
    const tool = tools[toolCall.function.name]
    if (tool) {
      const result = await tool.execute(JSON.parse(toolCall.function.arguments))
      toolCallsResult.push(result)
    }
  }
 
  if (toolCallsResult.length > 0) {
    const lastmessage = options.messages[options.messages.length - 1]
    const message = JSON.parse(JSON.stringify(lastmessage))
    message.role = 'user'
    message.content =
      message.content +
      `\n Observation: ${toolCallsResult.map((item: any) => item.content.map((item: any) => item.text).join('\n')).join('\n')}`
  
    options.messages.push(message)
    debugger
    const { text } = await generateText({
      system: system,
      model: llm,
      tools: tools,
      stopWhen: stepCountIs(options.maxSteps),
      onStepFinish: async (step) => {
        debugger
        await runReActLoop({ text: step.content[0].text, tools, vm, chatMethod, options, system: system, llm: llm })
      },
      ...options
    })

    return text
  } else {
    return finalAnswer
  }
}
