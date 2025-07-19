import type { ClientProxyOption } from '@opentiny/next'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'

export interface McpServerInfo {
  /**
   * 代理类型
   */
  type: 'stream' | 'sse'
  /**
   * 代理服务器的 URL
   */
  url: string
  /**
   * 代理服务器的身份验证令牌
   */
  token?: string
}

export interface INextClientProxyOption extends Omit<ClientProxyOption, 'client'> {
  /**
   * 代理类型
   */
  type?: 'stream' | 'sse'
}

// MCP服务器基础配置接口
export interface McpServer {
  url: string // 服务器URL
  headers?: Record<string, string> // 请求头配置
  timeout?: number // 超时时间配置 (TODO)
  customTransport: never // 自定义传输配置占位符
  type: 'sse' | 'stream'
}

// 自定义传输服务器配置接口
export interface CustomTransportMcpServer<T = any> {
  config: T // 自定义配置
  customTransport: Transport | ((config: T) => Transport) // 自定义传输实现或工厂函数
}

// MCP服务器配置映射类型
export type McpServers = Record<string, McpServer | CustomTransportMcpServer>

// MCP服务器配置包装接口
export interface McpServerConfig {
  mcpServers: McpServers // 服务器配置映射
}

// 多服务器配置映射类型
export type McpServersConfig = Record<string, McpServerConfig | any>

// 代理策略枚举
export enum AgentStrategy {
  FUNCTION_CALLING = 'Function Calling', // 函数调用策略
  RE_ACT = 'ReAct' // ReAct策略
}

// MCP客户端配置选项接口
export interface MCPClientOptions {
  agentStrategy?: AgentStrategy // 代理策略选择
  llmConfig: {
    url: string // AI接口地址
    apiKey: string // 模型API密钥
    model: string // 模型名称
    systemPrompt: string // 系统指令
    summarySystemPrompt?: string // 每轮对话的总结指令
  }
  mcpServersConfig: McpServersConfig // MCP服务配置
  maxIterationSteps?: number // 最大执行步骤数
}

// 可用工具接口定义
export interface AvailableTool {
  type: 'function' // 工具类型(目前仅支持函数类型)
  function: {
    name: string // 函数名称
    description?: string // 函数描述
    parameters: {
      // 函数参数定义
      type: 'object' // 参数类型(固定为object)
      properties?: Record<string, unknown> // 参数属性定义
      required?: string[] // 必需参数列表
    }
  }
}

// 工具调用参数接口
export interface CallToolsParams {
  toolCalls: ToolCall[] // 工具调用列表
}

// 聊天请求体接口
export interface ChatBody {
  stream?: boolean // 是否使用流式响应
  model: string // 使用的模型
  messages: Message[] // 消息历史
  tools?: AvailableTool[] // 可用工具列表
}

// 工具调用结果类型
export type ToolResults = Array<{ call: string; result: CallToolResult }>

// 角色枚举
export enum Role {
  FUNCTION = 'function', // 函数角色
  USER = 'user', // 用户角色
  ASSISTANT = 'assistant', // 助手角色
  DEVELOPER = 'developer', // 开发者角色
  SYSTEM = 'system', // 系统角色
  TOOL = 'tool' // 工具角色
}

// 错误响应接口
export type ErrorResponse = {
  code: number // 错误代码
  message: string // 错误信息
  metadata?: Record<string, unknown> // 额外错误信息(如提供者详情、原始错误等)
}

// 函数调用接口
export type FunctionCall = {
  name: string // 函数名称
  arguments: string // 函数参数(JSON字符串)
}

// 工具调用接口
export type ToolCall = {
  id: string // 调用ID
  type: 'function' // 调用类型(目前仅支持function)
  function: FunctionCall // 函数调用信息
}

// 非聊天选择接口
export type NonChatChoice = {
  finish_reason: string | null // 完成原因
  text: string // 响应文本
  error?: ErrorResponse // 错误信息
}

// 非流式选择接口
export type NonStreamingChoice = {
  finish_reason: string | null // 完成原因
  native_finish_reason: string | null // 原生完成原因
  message: {
    content: string | null // 消息内容
    role: Role // 角色
    tool_calls?: ToolCall[] // 工具调用列表
  }
  error?: ErrorResponse // 错误信息
}

// 流式选择接口
export type StreamingChoice = {
  finish_reason: string | null // 完成原因
  native_finish_reason: string | null // 原生完成原因
  delta: {
    // 增量更新信息
    content: string | null // 内容
    role?: Role // 角色
    tool_calls?: ToolCall[] // 工具调用列表
  }
  error?: ErrorResponse // 错误信息
}

// 响应使用情况统计
export type ResponseUsage = {
  prompt_tokens: number // 提示词token数(包括图片和工具)
  completion_tokens: number // 生成的token数
  total_tokens: number // 总token数
}

// 聊天完成响应接口
export type ChatCompleteResponse = {
  id: string // 响应ID
  choices: (NonStreamingChoice | StreamingChoice | NonChatChoice)[] // 选择列表
  created: number // 创建时间戳
  model: string // 使用的模型
  object: 'chat.completion' | 'chat.completion.chunk' // 响应对象类型
  system_fingerprint?: string // 系统指纹
  usage?: ResponseUsage // 使用情况统计
}

// 文本内容接口
export type TextContent = {
  type: 'text' // 内容类型
  text: string // 文本内容
}

// 图片内容部分接口
export type ImageContentPart = {
  type: 'image_url' // 内容类型
  image_url: {
    url: string // 图片URL或base64编码数据
    detail?: string // 细节级别(默认"auto")
  }
}

// 内容部分类型
export type ContentPart = TextContent | ImageContentPart

/**
 * 消息角色类型
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool'

// 消息接口
export type Message = {
  role: MessageRole // 角色类型
  content: string | ContentPart[] // 消息内容
  name?: string // 名称
  tool_call_id?: string // 工具调用ID
}

// 函数描述接口
export type FunctionDescription = {
  description?: string // 函数描述
  name: string // 函数名称
  parameters: object // 参数Schema对象
}

// 工具接口
export type Tool = {
  type: 'function' // 工具类型
  function: FunctionDescription // 函数描述
}

// 工具选择类型
export type ToolChoice =
  | 'none' // 不使用工具
  | 'auto' // 自动选择工具
  | {
      type: 'function' // 指定函数类型
      function: {
        name: string // 函数名称
      }
    }

// 聊天完成请求接口
export type ChatCompleteRequest = {
  messages?: Message[] // 消息历史
  prompt?: string // 提示词
  model?: string // 模型名称
  response_format?: { type: 'json_object' } // 响应格式
  stop?: string | string[] // 停止词
  stream?: boolean // 是否启用流式响应
  max_tokens?: number // 最大token数
  temperature?: number // 温度参数
  tools?: Tool[] // 可用工具列表
  tool_choice?: ToolChoice // 工具选择
  seed?: number // 随机种子
  top_p?: number // 核采样参数
  top_k?: number // Top-K采样参数
  frequency_penalty?: number // 频率惩罚参数
  presence_penalty?: number // 存在惩罚参数
  repetition_penalty?: number // 重复惩罚参数
  logit_bias?: Record<number, number> // logit偏置
  top_logprobs?: number // Top logprobs数量
  min_p?: number // 最小概率阈值
  top_a?: number // Top-A采样参数
  prediction?: { type: 'content'; content: string } // 预测配置
  transforms?: string[] // 转换配置
  models?: string[] // 模型列表
  route?: 'fallback' // 路由配置
}

// 聊天选项接口
export interface IChatOptions {
  toolCallResponse?: boolean // 是否返回工具调用响应
}

// 聊天提示创建参数接口
export interface ChatCreatePromptArgs {
  suffix?: string // 工具列表后的后缀
  prefix?: string // 工具列表前的前缀
  humanMessageTemplate?: string // 人类消息模板
  formatInstructions?: string // 格式化指令模板
  inputVariables?: string[] // 输入变量列表
}

/**
 * 流式聊天完成响应增量
 */
export interface ChatCompletionStreamResponseDelta {
  content?: string
  role?: MessageRole
  toolCall?: ToolCall
}

/**
 * 流式聊天完成响应
 */
export interface ChatCompletionStreamResponse {
  delta: ChatCompletionStreamResponseDelta
}

/**
 * 错误类型
 */
export enum ErrorType {
  NETWORK_ERROR = 'network_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  SERVER_ERROR = 'server_error',
  MODEL_ERROR = 'model_error',
  TIMEOUT_ERROR = 'timeout_error',
  UNKNOWN_ERROR = 'unknown_error'
}

/**
 * AI适配器错误
 */
export interface AIAdapterError {
  type: ErrorType
  message: string
  statusCode?: number
  originalError?: object
}

/**
 * 流式响应处理器
 */
export interface StreamHandler {
  onData: (data: ChatCompletionStreamResponse) => void
  onError: (error: AIAdapterError) => void
  onMessage?: (msgObj: { type: string; [extra: string]: unknown }) => void
  onDone: () => void
}
