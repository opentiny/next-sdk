export type { experimental_MCPClient as MCPClient } from 'ai'
import type { ProviderV2 } from '@ai-sdk/provider'
import type { MCPTransport } from 'ai'

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

/** Mcp Server的配置对象 */
export type McpServerConfig = { type: 'streamableHttp' | 'sse'; url: string } | { transport: MCPTransport }

/** */
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


export type FunctionDescription = {
  description?: string
  name: string
  parameters: object // JSON Schema object
}

export type Tool = {
  type: 'function'
  function: FunctionDescription
}

export type FunctionCall = {
  name: string
  arguments: string
}

export type ToolCall = {
  id: string
  type: 'function'
  function: FunctionCall
}

// types/react.ts
export interface ReActStep {
  thought: string;
  action: string;
  actionInput: Record<string, any>;
  observation: string;
  finalAnswer?: string;
}

export interface ReActResult {
  finalAnswer: string;
  steps: ReActStep[];
  usage?: {
    totalSteps: number;
    totalTokens?: number;
  };
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (input: any) => Promise<string>;
}