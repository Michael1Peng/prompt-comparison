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
    // 这个方法将在T007中实现
    // 现在返回模拟数据以便测试
    return [{
      content: content.substring(0, 100),
      startLine: 1,
      endLine: 5
    }];
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