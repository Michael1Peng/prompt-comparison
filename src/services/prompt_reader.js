/**
 * AI提示词文件深度分析和提取工具 - 提示词读取服务
 * 读取第一步工具输出的JSON文件，解析提示词文件列表
 */

import fs from 'fs-extra';
import path from 'path';

export class PromptReader {
  constructor(options = {}) {
    this.defaultInputPath = options.inputPath || './analysis/prompt-files.json';
  }

  /**
   * 读取第一步工具输出的JSON文件
   * @param {string} inputPath - 输入文件路径（可选）
   * @returns {Promise<Object[]>} 提示词文件对象数组
   */
  async readPromptFiles(inputPath = null) {
    try {
      // 使用提供的路径或默认路径
      const finalInputPath = inputPath || this.defaultInputPath;
      
      // 检查文件是否存在
      if (!await fs.pathExists(finalInputPath)) {
        throw new Error(`输入文件不存在: ${finalInputPath}`);
      }
      
      // 读取并解析JSON文件
      const jsonData = await fs.readJson(finalInputPath);
      
      // 验证输入文件格式
      if (!this._validateInputFormat(jsonData)) {
        throw new Error(`输入文件格式无效: ${finalInputPath}`);
      }
      
      // 提取promptFiles数组
      const promptFiles = jsonData.scanResult.promptFiles || [];
      
      return promptFiles;
      
    } catch (error) {
      // 如果是JSON解析错误
      if (error.code === 'ENOENT') {
        throw new Error(`输入文件不存在: ${inputPath || this.defaultInputPath}`);
      } else if (error.message.includes('JSON')) {
        throw new Error(`输入文件JSON格式错误: ${error.message}`);
      } else {
        throw error;
      }
    }
  }

  /**
   * 验证输入文件格式
   * @param {Object} data - 解析的JSON数据
   * @returns {boolean} 格式是否有效
   */
  _validateInputFormat(data) {
    try {
      // 检查是否有scanResult字段
      if (!data || typeof data !== 'object') {
        return false;
      }
      
      if (!data.hasOwnProperty('scanResult')) {
        return false;
      }
      
      const scanResult = data.scanResult;
      
      // 检查scanResult的基本结构
      if (!scanResult || typeof scanResult !== 'object') {
        return false;
      }
      
      // 检查必需的字段
      if (!scanResult.hasOwnProperty('promptFiles')) {
        return false;
      }
      
      // 检查promptFiles是否为数组
      if (!Array.isArray(scanResult.promptFiles)) {
        return false;
      }
      
      // 检查数组中的每个元素是否有基本的提示词文件字段
      for (const file of scanResult.promptFiles) {
        if (!file || typeof file !== 'object') {
          return false;
        }
        
        // 检查必需的字段
        const requiredFields = ['filePath', 'fileName', 'content', 'isPrompt', 'confidence'];
        for (const field of requiredFields) {
          if (!file.hasOwnProperty(field)) {
            return false;
          }
        }
        
        // 检查字段类型
        if (typeof file.filePath !== 'string' || 
            typeof file.fileName !== 'string' || 
            typeof file.content !== 'string' || 
            typeof file.isPrompt !== 'boolean' || 
            typeof file.confidence !== 'number') {
          return false;
        }
        
        // 检查confidence的范围
        if (file.confidence < 0 || file.confidence > 1) {
          return false;
        }
      }
      
      return true;
      
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取当前配置
   * @returns {Object} 配置信息
   */
  getConfig() {
    return {
      defaultInputPath: this.defaultInputPath
    };
  }
}