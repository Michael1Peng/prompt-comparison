/**
 * AI提示词文件发现和汇总工具 - AI分析服务
 * 使用GPT-5 API识别文件中的提示词内容
 */

import OpenAI from 'openai';
import fs from 'fs-extra';
import path from 'path';
import pLimit from 'p-limit';
import { PromptFile, PROMPT_CATEGORIES } from '../models/data_models.js';

export class AIAnalyzer {
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
      console.log(`使用自定义API Base URL: ${process.env.OPENAI_API_BASE}`);
    }
    
    this.openai = new OpenAI(openaiConfig);
    
    // 配置并发限制（默认5个并发请求）
    this.concurrencyLimit = options.concurrencyLimit || 5;
    this.limit = pLimit(this.concurrencyLimit);
    
    // GPT模型设置
    this.model = options.model || 'gpt-4o';
    this.temperature = options.temperature || 0.1;
    
    // 错误统计
    this.errorCount = 0;
    this.maxErrors = options.maxErrors || 5;
  }

  /**
   * 分析文件列表，识别其中的提示词文件
   * @param {string[]} filePaths - 文件路径列表
   * @returns {Promise<PromptFile[]>} 提示词文件对象数组
   */
  async analyzeFiles(filePaths) {
    try {
      console.log(`开始分析 ${filePaths.length} 个文件...`);
      this.errorCount = 0; // 重置错误计数
      
      // 先测试API连接（使用第一个文件进行测试）
      if (filePaths.length > 0) {
        await this._testAPIConnection(filePaths[0]);
      }
      
      // 使用并发限制处理文件
      const analysisPromises = filePaths.map(filePath => 
        this.limit(() => this._analyzeFileContent(filePath))
      );
      
      // 等待所有文件分析完成
      const analysisResults = await Promise.all(analysisPromises);
      
      // 检查是否有太多失败
      if (this.errorCount > this.maxErrors) {
        throw new Error(`分析失败次数过多 (${this.errorCount})，请检查API密钥或网络连接。`);
      }
      
      // 过滤出被识别为提示词的文件
      const promptFiles = analysisResults
        .filter(result => result && result.isPrompt)
        .map(result => new PromptFile(result));
      
      console.log(`分析完成: 发现 ${promptFiles.length} 个提示词文件`);
      return promptFiles;
      
    } catch (error) {
      throw new Error(`AI分析失败: ${error.message}`);
    }
  }

  /**
   * 分析单个文件内容
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object|null>} 分析结果对象或null
   */
  async _analyzeFileContent(filePath) {
    try {
      // 读取文件内容
      const content = await fs.readFile(filePath, 'utf-8');
      
      // 调用GPT API进行分析
      const analysisResult = await this._callOpenAIAPI(content, filePath);
      
      if (analysisResult && analysisResult.isPrompt) {
        return this._createPromptFileObject(filePath, content, analysisResult);
      }
      
      return null;
      
    } catch (error) {
      this.errorCount++;
      console.warn(`警告: 分析文件 ${filePath} 失败: ${error.message}`);
      
      // 如果是API密钥问题，立即抛出错误
      if (error.message.includes('401') || error.message.includes('Incorrect API key')) {
        throw new Error(`OpenAI API密钥无效: ${error.message}`);
      }
      
      return null;
    }
  }

  /**
   * 测试API连接
   * @param {string} testFilePath - 测试用文件路径
   * @returns {Promise<void>}
   */
  async _testAPIConnection(testFilePath) {
    try {
      // 读取少量内容进行测试
      const content = await fs.readFile(testFilePath, 'utf-8');
      const testContent = content.substring(0, 100); // 只取前100字符
      
      // 简单的测试调用
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'user', content: 'This is a test. Please respond with "OK".' }
        ],
        temperature: 0.1,
        max_tokens: 10
      });
      
      if (!response.choices || !response.choices[0]) {
        throw new Error('API响应格式异常');
      }
      
    } catch (error) {
      if (error.message.includes('401') || error.message.includes('Incorrect API key')) {
        throw new Error(`OpenAI API密钥无效，请检查OPENAI_API_KEY环境变量: ${error.message}`);
      }
      throw new Error(`API连接测试失败: ${error.message}`);
    }
  }

  /**
   * 调用OpenAI API进行提示词识别
   * @param {string} content - 文件内容
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object>} API响应结果
   */
  async _callOpenAIAPI(content, filePath) {
    const systemPrompt = `你是一个专业的AI提示词识别专家。你的任务是分析给定的文件内容，判断其是否为AI提示词文件。

提示词文件的特征：
1. 包含明确的请求或指令（如"请帮我..."、"如何..."、"写一个..."）
2. 向AI系统描述具体任务或问题
3. 包含代码生成、问答、创作等AI相关请求
4. 具有明确的输入输出期望

请分析文件内容并返回JSON格式结果：
{
  "isPrompt": boolean,
  "confidence": number (0.0-1.0),
  "language": string|null,
  "category": string,
  "reasoning": string
}

categories: ${PROMPT_CATEGORIES.join(', ')}`;

    const userPrompt = `文件路径: ${filePath}
文件内容:
${content}

请分析这个文件是否包含AI提示词内容。`;

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

      const content_text = response.choices[0].message.content;
      return JSON.parse(content_text);
      
    } catch (error) {
      throw new Error(`OpenAI API调用失败: ${error.message}`);
    }
  }

  /**
   * 创建PromptFile对象
   * @param {string} filePath - 文件路径
   * @param {string} content - 文件内容
   * @param {Object} analysisResult - AI分析结果
   * @returns {Object} PromptFile对象数据
   */
_createPromptFileObject(filePath, content, analysisResult) {
    return {
      filePath,
      fileName: path.basename(filePath),
      content,
      isPrompt: analysisResult.isPrompt,
      confidence: analysisResult.confidence,
      language: analysisResult.language,
      category: analysisResult.category || 'unknown'
    };
  }


  /**
   * 设置并发限制
   * @param {number} limit - 并发数限制
   */
  setConcurrencyLimit(limit) {
    this.concurrencyLimit = limit;
    this.limit = pLimit(limit);
  }

  /**
   * 获取当前配置信息
   * @returns {Object} 配置信息
   */
  getConfig() {
    return {
      model: this.model,
      concurrencyLimit: this.concurrencyLimit,
      temperature: this.temperature
    };
  }
}