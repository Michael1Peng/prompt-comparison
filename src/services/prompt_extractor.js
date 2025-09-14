/**
 * AI提示词深度分析和提取工具 - 提取服务
 * 读取第一步输出，分析文件，提取具体提示词内容
 */

import fs from 'fs-extra';
import path from 'path';
import OpenAI from 'openai';
import pLimit from 'p-limit';
import { PromptDetail, PromptList } from '../models/prompt_models.js';

export class PromptExtractor {
  constructor(options = {}) {
    // OpenAI配置
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY环境变量未设置');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_API_BASE || undefined
    });
    
    // 并发控制
    this.concurrencyLimit = options.concurrencyLimit || 5;
    this.limit = pLimit(this.concurrencyLimit);
    
    // GPT模型设置
    this.model = options.model || 'gpt-5';
    
    // 路径配置
    this.inputPath = options.inputPath || 'analysis/prompt-files.json';
    this.outputPath = options.outputPath || 'analysis/prompt-list.json';
  }

  /**
   * 主流程：执行提示词提取
   */
  async extract() {
    try {
      console.log('开始提示词提取...');
      
      // 1. 读取输入文件
      const inputData = await this.readInputFile();
      
      // 2. 初始化PromptList
      const promptList = new PromptList({
        totalFiles: inputData.scanResult.totalFiles,
        totalPrompts: 0,
        processingStats: {
          successfulFiles: 0,
          failedFiles: 0,
          errors: []
        },
        analysisTime: new Date().toISOString(),
        prompts: []
      });
      
      // 3. 并发处理文件
      const promptFiles = inputData.scanResult.promptFiles;
      const processingPromises = promptFiles.map(file => 
        this.limit(() => this.processFile(file, promptList))
      );
      
      await Promise.all(processingPromises);
      
      // 4. 生成输出文件
      await this.generateOutput(promptList);
      
      console.log(`提取完成: ${promptList.totalPrompts}个提示词`);
      console.log(`成功: ${promptList.processingStats.successfulFiles}, 失败: ${promptList.processingStats.failedFiles}`);
      
      return promptList;
      
    } catch (error) {
      throw new Error(`提示词提取失败: ${error.message}`);
    }
  }

  /**
   * 读取输入文件
   */
  async readInputFile() {
    const exists = await fs.pathExists(this.inputPath);
    if (!exists) {
      throw new Error(`输入文件不存在: ${this.inputPath}`);
    }
    
    const data = await fs.readJson(this.inputPath);
    
    if (!data.scanResult || !data.scanResult.promptFiles) {
      throw new Error('输入文件格式无效');
    }
    
    return data;
  }

  /**
   * 处理单个文件
   */
  async processFile(fileInfo, promptList) {
    try {
      console.log(`处理文件: ${fileInfo.filePath}`);
      
      // 读取文件内容
      const content = fileInfo.content || await this.readFileContent(fileInfo.filePath);
      
      // 分析提示词
      const prompts = await this.analyzePrompts(content, fileInfo.filePath);
      
      // 添加到列表
      for (const promptData of prompts) {
        const promptId = promptList.generateNextPromptId();
        const promptDetail = new PromptDetail({
          promptId,
          sourceFile: fileInfo.filePath,
          content: promptData.content,
          startLine: promptData.startLine,
          endLine: promptData.endLine
        });
        
        promptList.addPrompt(promptDetail);
      }
      
      promptList.markFileSuccess();
      
    } catch (error) {
      console.warn(`处理文件失败 ${fileInfo.filePath}: ${error.message}`);
      promptList.addError(fileInfo.filePath, error.message);
    }
  }

  /**
   * 读取文件内容
   */
  async readFileContent(filePath) {
    try {
      const exists = await fs.pathExists(filePath);
      if (!exists) {
        throw new Error('文件不存在');
      }
      
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
      
    } catch (error) {
      throw new Error(`读取文件失败: ${error.message}`);
    }
  }

  /**
   * 使用AI分析提示词内容
   */
  async analyzePrompts(content, filePath) {
    try {
      const systemPrompt = `你是一个专业的AI提示词识别专家。你的任务是分析给定的文件内容，识别其中的独立提示词块。

提示词的特征：
1. 明确的角色定义（如"你是..."、"You are..."）
2. 任务描述或指令（如"帮我..."、"Generate..."、"Create..."）
3. 系统提示或用户请求
4. 代码生成、问答、创作等AI相关请求

请识别文件中的所有独立提示词块，并返回JSON格式：
{
  "prompts": [
    {
      "content": "提示词完整内容",
      "startLine": 起始行号,
      "endLine": 结束行号
    }
  ]
}

注意：
- 每个独立的提示词应该分开识别
- 行号从1开始计数
- 如果没有找到提示词，返回空数组`;

      const userPrompt = `分析以下文件内容，识别其中的AI提示词：

文件路径: ${filePath}
文件内容:
${content}`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content);
      
      // 如果没有找到提示词，返回空数组
      if (!result.prompts || result.prompts.length === 0) {
        return [];
      }

      // 验证并修正行号
      const lines = content.split('\n');
      const validatedPrompts = result.prompts.map(prompt => {
        // 确保行号在有效范围内
        const startLine = Math.max(1, Math.min(prompt.startLine, lines.length));
        const endLine = Math.max(startLine, Math.min(prompt.endLine, lines.length));
        
        // 如果AI没有返回具体内容，尝试从原文件提取
        let promptContent = prompt.content;
        if (!promptContent && startLine && endLine) {
          promptContent = lines.slice(startLine - 1, endLine).join('\n');
        }
        
        return {
          content: promptContent,
          startLine: startLine,
          endLine: endLine
        };
      });

      return validatedPrompts;
      
    } catch (error) {
      console.warn(`AI分析失败: ${error.message}`);
      // 如果AI分析失败，返回简单的启发式结果
      return this.fallbackAnalysis(content);
    }
  }

  /**
   * 备用分析方法（当AI失败时）
   */
  fallbackAnalysis(content) {
    // 处理空内容
    if (!content || content.trim() === '') {
      return [];
    }
    
    const lines = content.split('\n');
    const prompts = [];
    
    // 简单的启发式规则
    const promptPatterns = [
      /you are/i,
      /你是/,
      /generate/i,
      /create/i,
      /help me/i,
      /帮我/,
      /system prompt/i,
      /user prompt/i
    ];
    
    let inPrompt = false;
    let currentPrompt = {
      content: '',
      startLine: 0,
      endLine: 0
    };
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const hasPromptPattern = promptPatterns.some(pattern => pattern.test(line));
      
      if (hasPromptPattern && !inPrompt) {
        // 开始新的提示词
        inPrompt = true;
        currentPrompt = {
          content: line,
          startLine: i + 1,
          endLine: i + 1
        };
      } else if (inPrompt) {
        // 继续当前提示词
        if (line.trim() === '' && currentPrompt.content) {
          // 空行可能表示提示词结束
          prompts.push({ ...currentPrompt });
          inPrompt = false;
        } else if (line.trim()) {
          currentPrompt.content += '\n' + line;
          currentPrompt.endLine = i + 1;
        }
      }
    }
    
    // 处理最后一个提示词
    if (inPrompt && currentPrompt.content) {
      prompts.push(currentPrompt);
    }
    
    // 如果没有找到，返回整个文件作为一个提示词（如果文件较短且有内容）
    if (prompts.length === 0 && lines.length <= 50 && lines.length > 1) {
      prompts.push({
        content: content,
        startLine: 1,
        endLine: lines.length
      });
    }
    
    return prompts;
  }

  /**
   * 定位行号
   */
  locateLineNumbers(content, promptContent) {
    // 这个方法将在T009中实现
    const lines = content.split('\n');
    return {
      startLine: 1,
      endLine: Math.min(5, lines.length)
    };
  }

  /**
   * 生成输出文件
   */
  async generateOutput(promptList) {
    try {
      // 确保输出目录存在
      const outputDir = path.dirname(this.outputPath);
      await fs.ensureDir(outputDir);
      
      // 写入JSON文件
      await fs.writeJson(this.outputPath, promptList.toJSON(), { spaces: 2 });
      
      console.log(`输出已保存到: ${this.outputPath}`);
      
    } catch (error) {
      throw new Error(`生成输出失败: ${error.message}`);
    }
  }
}