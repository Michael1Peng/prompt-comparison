/**
 * AI提示词文件深度分析和提取工具 - 内容提取服务
 * 使用AI API深度分析文件内容，提取具体提示词并记录位置信息
 */

import OpenAI from 'openai';
import fs from 'fs-extra';
import pLimit from 'p-limit';
import { PromptDetail } from '../models/data_models.js';

export class ContentExtractor {
  constructor(options = {}) {
    // 初始化OpenAI客户端
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY环境变量未设置');
    }
    
    // 验证API密钥格式
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
      throw new Error('OPENAI_API_KEY格式无效。请确保使用有效的OpenAI API密钥。');
    }
    
    // 构建OpenAI客户端配置
    const openaiConfig = {
      apiKey: apiKey
    };
    
    // 如果设置了自定义API Base URL，则使用它
    if (process.env.OPENAI_API_BASE) {
      openaiConfig.baseURL = process.env.OPENAI_API_BASE;
    }
    
    this.openai = new OpenAI(openaiConfig);
    
    // 配置选项
    this.concurrencyLimit = options.concurrencyLimit || 5;
    this.model = options.model || 'gpt-5';
    this.temperature = options.temperature || 0.1;
    
    // 初始化并发限制
    this.limit = pLimit(this.concurrencyLimit);
    
    // 错误统计
    this.errorCount = 0;
    this.maxErrors = options.maxErrors || 5;
  }

  /**
   * 提取文件列表中的具体提示词内容
   * @param {Object[]} promptFiles - 提示词文件对象数组
   * @returns {Promise<Object[]>} PromptDetail对象数组
   */
  async extractPromptDetails(promptFiles) {
    try {
      // 处理空输入
      if (!Array.isArray(promptFiles) || promptFiles.length === 0) {
        return [];
      }
      
      console.log(`开始处理 ${promptFiles.length} 个提示词文件...`);
      this.errorCount = 0; // 重置错误计数
      
      // 使用并发限制处理文件
      const extractionPromises = promptFiles.map(promptFile => 
        this.limit(() => this._extractFromFile(promptFile))
      );
      
      // 等待所有文件处理完成
      const extractionResults = await Promise.all(extractionPromises);
      
      // 检查是否有太多失败
      if (this.errorCount > this.maxErrors) {
        throw new Error(`提取失败次数过多 (${this.errorCount})，请检查API密钥或网络连接。`);
      }
      
      // 拍平结果数组并过滤null值
      const promptDetails = extractionResults
        .filter(result => result !== null)
        .flat();
      
      console.log(`提取完成: 发现 ${promptDetails.length} 个提示词详情`);
      return promptDetails;
      
    } catch (error) {
      throw new Error(`提示词内容提取失败: ${error.message}`);
    }
  }

  /**
   * 提取单个文件中的提示词详情
   * @param {Object} promptFile - 提示词文件对象
   * @returns {Promise<Object[]>} 该文件中的PromptDetail对象数组
   */
  async _extractFromFile(promptFile) {
    try {
      // 验证输入
      if (!promptFile || !promptFile.filePath || !promptFile.content) {
        console.warn(`跳过无效的提示词文件: ${promptFile?.filePath || 'unknown'}`);
        return null;
      }
      
      // 调用AI API分析文件内容
      const promptInfoList = await this._callOpenAIAPI(promptFile.content, promptFile.filePath);
      
      if (!Array.isArray(promptInfoList) || promptInfoList.length === 0) {
        console.warn(`文件 ${promptFile.filePath} 中未找到具体的提示词`);
        return null;
      }
      
      // 为每个识别的提示词创建PromptDetail对象
      const promptDetails = [];
      for (let i = 0; i < promptInfoList.length; i++) {
        const promptInfo = promptInfoList[i];
        
        // 计算行号位置
        const lineInfo = this._calculateLineNumbers(promptFile.content, promptInfo);
        
        // 生成唯一ID
        const promptId = `prompt_${String(i + 1).padStart(3, '0')}`;
        
        // 创建PromptDetail对象
        const promptDetail = new PromptDetail({
          promptId: promptId,
          sourceFile: promptFile.filePath,
          content: promptInfo.content || promptInfo.text || '',
          startLine: lineInfo.startLine,
          endLine: lineInfo.endLine
        });
        
        // 验证创建的对象
        if (promptDetail.isValid()) {
          promptDetails.push(promptDetail);
        } else {
          console.warn(`跳过无效的提示词详情: ${promptId} in ${promptFile.filePath}`);
        }
      }
      
      return promptDetails;
      
    } catch (error) {
      this.errorCount++;
      console.warn(`处理文件 ${promptFile.filePath} 失败: ${error.message}`);
      
      // 如果是API密钥问题，立即抛出错误
      if (error.message.includes('401') || error.message.includes('Incorrect API key')) {
        throw new Error(`OpenAI API密钥无效: ${error.message}`);
      }
      
      return null;
    }
  }

  /**
   * 调用OpenAI API进行提示词边界识别
   * @param {string} content - 文件内容
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object[]>} AI识别的提示词列表
   */
  async _callOpenAIAPI(content, filePath) {
    const systemPrompt = `你是一个专业的AI提示词内容提取专家。你的任务是深度分析给定的文件内容，识别并提取其中的具体提示词内容和边界。

提示词识别原则：
1. AI自动识别提示词的逻辑边界，不按段落机械分割
2. 每个提示词应该是语义完整的、可独立使用的指令或问题
3. 保持原始格式，包含markdown、换行符等格式信息
4. 支持单文件多提示词场景

请分析文件内容并返回JSON格式结果，包含发现的所有提示词：
{
  "prompts": [
    {
      "content": "提示词完整内容（保持原始格式）",
      "description": "提示词简要描述",
      "startText": "提示词开始的前10个字符（用于定位）",
      "endText": "提示词结束的后10个字符（用于定位）"
    }
  ]
}

如果没有发现独立的提示词内容，返回空数组。`;

    const userPrompt = `文件路径: ${filePath}
文件内容:
${content}

请深度分析这个文件，提取其中的具体提示词内容。`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: this.temperature,
        response_format: { type: 'json_object' }
      });

      const responseContent = response.choices[0].message.content;
      const result = JSON.parse(responseContent);
      
      // 验证响应格式
      if (!result.prompts || !Array.isArray(result.prompts)) {
        console.warn(`API响应格式异常: ${filePath}`);
        return [];
      }
      
      return result.prompts;
      
    } catch (error) {
      throw new Error(`OpenAI API调用失败: ${error.message}`);
    }
  }

  /**
   * 计算提示词在文件中的行号位置
   * @param {string} content - 文件完整内容
   * @param {Object} promptInfo - AI识别的提示词信息
   * @returns {Object} 包含startLine和endLine的位置信息
   */
  _calculateLineNumbers(content, promptInfo) {
    try {
      // 如果没有有效的定位信息，返回默认值
      if (!promptInfo.startText && !promptInfo.endText) {
        return { startLine: 0, endLine: 0 };
      }
      
      // 将文件内容按行分割
      const lines = content.split('\n');
      
      let startLine = 0;
      let endLine = 0;
      
      // 尝试使用startText定位开始位置
      if (promptInfo.startText) {
        const startText = promptInfo.startText.trim();
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(startText)) {
            startLine = i;
            break;
          }
        }
      }
      
      // 尝试使用endText定位结束位置
      if (promptInfo.endText) {
        const endText = promptInfo.endText.trim();
        for (let i = startLine; i < lines.length; i++) {
          if (lines[i].includes(endText)) {
            endLine = i;
            break;
          }
        }
        
        // 如果没找到结束位置，默认为开始位置
        if (endLine < startLine) {
          endLine = startLine;
        }
      } else {
        // 如果没有结束文本，尝试根据提示词内容长度估算
        const promptContent = promptInfo.content || '';
        const promptLines = promptContent.split('\n').length;
        endLine = Math.max(startLine, startLine + promptLines - 1);
      }
      
      // 确保行号不超出文件范围
      endLine = Math.min(endLine, lines.length - 1);
      
      return { 
        startLine: Math.max(0, startLine), 
        endLine: Math.max(startLine, endLine) 
      };
      
    } catch (error) {
      console.warn(`计算行号位置失败: ${error.message}`);
      return { startLine: 0, endLine: 0 };
    }
  }

  /**
   * 获取当前配置
   * @returns {Object} 配置信息
   */
  getConfig() {
    return {
      concurrencyLimit: this.concurrencyLimit,
      model: this.model,
      temperature: this.temperature
    };
  }
}