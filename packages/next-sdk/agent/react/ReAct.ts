// engines/react-engine.ts
import { generateText, stepCountIs } from 'ai';
import { openai } from '@ai-sdk/openai';
import { ReActStep, ReActResult, ToolDefinition } from '../type';
import de from 'zod/v4/locales/de.cjs';

export class ReActEngine {
  private maxSteps: number;
  private model: any;
  private availableTools: Map<string, any>;

  constructor({maxSteps, tools, model}:any) {
    this.maxSteps = maxSteps;
    this.model = model;
    this.availableTools = new Map();
    this.registerTools(tools);
  }

  private registerTools(tools:ToolDefinition[]) {
    // 注册所有可用工具
    for (const tool in tools) {
      this.availableTools.set(tool.name, tool);
    }
  }

  async execute(question: string): Promise<ReActResult> {
    const steps: ReActStep[] = [];
    let context = '';
    let currentStep = 0;
debugger
    while (currentStep < this.maxSteps) {
      console.log(`执行第 ${currentStep + 1} 步...`);

      const step = await this.generateStep(question, context);
      steps.push(step);

      // 如果有最终答案，直接返回
      if (step.finalAnswer) {
        return {
          finalAnswer: step.finalAnswer,
          steps,
          usage: { totalSteps: currentStep + 1 }
        };
      }

      // 执行动作并获取观察结果
      try {
        const observation = await this.executeAction(step.action, step.actionInput);
        step.observation = observation;
        
        // 更新上下文
        context += this.buildContextStep(step);
        
        console.log(`步骤 ${currentStep + 1} 完成:`, {
          thought: step.thought,
          action: step.action,
          observation: step.observation
        });

      } catch (error) {
        step.observation = `执行错误: ${error.message}`;
        context += this.buildContextStep(step);
        
        console.error(`步骤 ${currentStep + 1} 执行失败:`, error);
      }

      currentStep++;
    }

    return {
      finalAnswer: '达到最大步数限制，未能找到完整答案',
      steps,
      usage: { totalSteps: currentStep }
    };
  }

  private async generateStep(question: string, context: string): Promise<ReActStep> {
    const prompt = this.buildPrompt(question, context);

    try {
      const { text } = await generateText({
        model: this.model,
        prompt,
        tools: Object.fromEntries(this.availableTools),
        onStepFinish:stepCountIs(1)
      });

      return this.parseResponse(text);
    } catch (error) {
      console.error('生成步骤时出错:', error);
      return {
        thought: '无法生成有效的思考步骤',
        action: '',
        actionInput: {},
        observation: ''
      };
    }
  }

  private buildPrompt(question: string, context: string): string {
    return `
你是一个ReAct代理，使用思考-行动-观察的模式来解决问题。

当前问题: ${question}

${context ? `之前的执行上下文:\n${context}\n` : ''}

请生成下一步：

思考: <你的推理过程，分析当前情况，决定下一步行动>
动作: <工具名称，可选值: ${Array.from(this.availableTools.keys()).join(', ')}>
输入: <JSON格式的输入参数>

如果你认为已经收集到足够信息可以给出最终答案，使用：
思考: <你的推理过程>
最终答案: <完整的最终答案>

请严格按照上述格式响应，不要添加额外内容。
`.trim();
  }

  private parseResponse(response: string): ReActStep {
    const thoughtMatch = response.match(/思考:\s*(.+?)(?=动作:|最终答案:|$)/s);
    const actionMatch = response.match(/动作:\s*(.+)/);
    const actionInputMatch = response.match(/输入:\s*(\{.*\})/s);
    const finalAnswerMatch = response.match(/最终答案:\s*(.+)/);

    return {
      thought: thoughtMatch ? thoughtMatch[1].trim() : '未提供思考过程',
      action: actionMatch ? actionMatch[1].trim() : '',
      actionInput: actionInputMatch ? this.parseJsonSafe(actionInputMatch[1]) : {},
      observation: '',
      finalAnswer: finalAnswerMatch ? finalAnswerMatch[1].trim() : undefined
    };
  }

  private parseJsonSafe(jsonString: string): any {
    try {
      // 清理可能的格式问题
      const cleaned = jsonString.replace(/(\w+):/g, '"$1":').replace(/'/g, '"');
      return JSON.parse(cleaned);
    } catch {
      try {
        // 如果标准JSON解析失败，尝试更宽松的解析
        return JSON.parse(jsonString.replace(/(\w+):/g, '"$1":'));
      } catch {
        return { rawInput: jsonString };
      }
    }
  }

  private async executeAction(action: string, input: Record<string, any>): Promise<string> {
    if (!action || !this.availableTools.has(action)) {
      return `未知或未指定的动作: ${action}`;
    }

    try {
      const tool = this.availableTools.get(action);
      return await tool.fn(input);
    } catch (error) {
      return `执行动作时出错: ${error.message}`;
    }
  }

  private buildContextStep(step: ReActStep): string {
    return `
思考: ${step.thought}
动作: ${step.action}
输入: ${JSON.stringify(step.actionInput)}
观察: ${step.observation}

`.trim();
  }
}