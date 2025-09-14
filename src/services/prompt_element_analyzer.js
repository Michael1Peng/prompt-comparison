/**
 * AI提示词框架要素拆分服务
 * 使用OpenAI GPT API将提示词拆分为13个标准框架要素
 */

import OpenAI from 'openai';
import pLimit from 'p-limit';
import { PromptElement, ElementAnalysisOutput, ELEMENT_KEYS, ELEMENT_NAMES } from '../models/element_models.js';

export class PromptElementAnalyzer {
  constructor(options = {}) {
    // 初始化OpenAI客户端
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY环境变量未设置');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_API_BASE || undefined
    });
    
    // 并发控制（默认5个）
    this.concurrencyLimit = options.concurrencyLimit || 5;
    this.limit = pLimit(this.concurrencyLimit);
    
    // GPT模型设置
    this.model = options.model || 'gpt-3.5-turbo';
  }

  /**
   * 分析提示词列表，拆分为框架要素
   * @param {Array} prompts - 提示词列表
   * @returns {Promise<ElementAnalysisOutput>} 要素分析结果
   */
  async analyzeElements(prompts) {
    const startTime = Date.now();
    console.log(`开始分析 ${prompts.length} 个提示词...`);
    
    // 创建输出对象
    const output = new ElementAnalysisOutput({
      totalPrompts: prompts.length,
      analysisTime: new Date().toISOString(),
      prompts: []
    });
    
    // 如果没有提示词，直接返回
    if (prompts.length === 0) {
      return output;
    }
    
    // 并发处理每个提示词
    const analysisPromises = prompts.map(prompt => 
      this.limit(() => this.analyzeSinglePrompt(prompt))
    );
    
    // 等待所有分析完成
    const results = await Promise.all(analysisPromises);
    
    // 添加结果到输出
    results.forEach(result => {
      if (result) {
        output.addPromptElement(result);
      }
    });
    
    const duration = Date.now() - startTime;
    console.log(`分析完成，耗时 ${(duration / 1000).toFixed(2)} 秒`);
    
    return output;
  }

  /**
   * 分析单个提示词
   * @param {Object} prompt - 提示词对象
   * @returns {Promise<PromptElement>} 要素分析结果
   */
  async analyzeSinglePrompt(prompt) {
    try {
      console.log(`分析提示词: ${prompt.promptId}`);
      
      // 调用AI API进行要素拆分
      const elements = await this.callAIForElements(prompt.content);
      
      // 创建PromptElement对象
      const promptElement = new PromptElement({
        promptId: prompt.promptId,
        sourceFile: prompt.sourceFile,
        originalContent: prompt.content,
        elements: {
          ...elements,
          source_file: prompt.sourceFile // 确保source_file字段
        }
      });
      
      return promptElement;
      
    } catch (error) {
      console.error(`分析提示词 ${prompt.promptId} 失败:`, error.message);
      
      // 返回一个包含空要素的结果
      return new PromptElement({
        promptId: prompt.promptId,
        sourceFile: prompt.sourceFile,
        originalContent: prompt.content,
        elements: this.getEmptyElements(prompt.sourceFile)
      });
    }
  }

  /**
   * 调用AI API进行要素拆分
   * @param {string} content - 提示词内容
   * @returns {Promise<Object>} 13个要素的对象
   */
  async callAIForElements(content) {
    const systemPrompt = `你是一个专业的AI提示词分析专家。你的任务是将给定的提示词拆分为13个标准框架要素。

13个框架要素说明：
1. source_file: 所在文件（保留原值）
2. role_capability: 角色/能力定义（如"你是..."的描述）
3. task_request: 任务/请求说明（要做什么）
4. background_context: 背景/情境信息
5. instruction_action: 指令/行动步骤（具体的操作步骤）
6. output_specification: 输出规格要求（输出格式、结构等）
7. examples: 示例内容
8. constraints_limitations: 限制/约束条件
9. goals_expectations: 目标/期望结果
10. information: 相关信息资源
11. evaluation_optimization: 评估/优化标准
12. adjustments: 调整机制
13. audience: 目标受众

要求：
- 将提示词内容准确拆分到对应的要素中
- 每个要素提取相关内容，没有的要素返回空字符串
- 确保内容不重复，每部分内容只归类到最合适的要素
- 返回JSON格式，包含所有13个要素字段

返回格式示例：
{
  "role_capability": "你是一个AI助手...",
  "task_request": "帮助用户生成代码...",
  "background_context": "",
  "instruction_action": "1. 分析需求 2. 编写代码...",
  "output_specification": "输出Python代码...",
  "examples": "",
  "constraints_limitations": "使用Python 3.8+...",
  "goals_expectations": "生成高质量代码...",
  "information": "",
  "evaluation_optimization": "",
  "adjustments": "",
  "audience": "开发者"
}`;

    const userPrompt = `请分析以下提示词，将其拆分为13个框架要素：

${content}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content);
      
      // 确保所有要素都存在
      return this.normalizeElements(result);
      
    } catch (error) {
      console.error('AI API调用失败:', error.message);
      throw error;
    }
  }

  /**
   * 规范化要素，确保所有字段都存在
   * @param {Object} elements - AI返回的要素对象
   * @returns {Object} 规范化的要素对象
   */
  normalizeElements(elements) {
    const normalized = {};
    
    // 确保所有要素都存在，缺失的设为空字符串
    ELEMENT_KEYS.forEach(key => {
      if (key !== 'source_file') { // source_file会在上层设置
        normalized[key] = elements[key] || '';
        // 确保是字符串
        if (typeof normalized[key] !== 'string') {
          normalized[key] = String(normalized[key] || '');
        }
      }
    });
    
    return normalized;
  }

  /**
   * 获取空的要素对象
   * @param {string} sourceFile - 源文件路径
   * @returns {Object} 包含所有空要素的对象
   */
  getEmptyElements(sourceFile) {
    const elements = {};
    ELEMENT_KEYS.forEach(key => {
      elements[key] = key === 'source_file' ? sourceFile : '';
    });
    return elements;
  }
}

// 导出默认实例创建函数
export function createAnalyzer(options) {
  return new PromptElementAnalyzer(options);
}