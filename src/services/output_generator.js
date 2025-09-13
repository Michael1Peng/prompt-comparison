/**
 * AI提示词文件发现和汇总工具 - 输出生成服务
 * 生成符合ScanResult格式的JSON输出文件
 */

import fs from 'fs-extra';
import path from 'path';
import { ScanResult, OutputWrapper, DEFAULT_OUTPUT_PATH } from '../models/data_models.js';

export class OutputGenerator {
  constructor(options = {}) {
    this.defaultOutputPath = options.outputPath || DEFAULT_OUTPUT_PATH;
    this.prettyPrint = options.prettyPrint !== false; // 默认开启格式化输出
  }

  /**
   * 生成输出文件
   * @param {Array} promptFiles - PromptFile对象数组
   * @param {string} outputPath - 输出文件路径（可选）
   * @param {Object} scanMetadata - 扫描元数据（可选）
   * @returns {Promise<Object>} 生成的输出对象
   */
  async generateOutput(promptFiles, outputPath = null, scanMetadata = {}) {
    try {
      // 使用提供的路径或默认路径
      const finalOutputPath = outputPath || this.defaultOutputPath;
      
      // 创建ScanResult对象
      const scanResult = this._createScanResult(promptFiles, scanMetadata);
      
      // 创建输出包装器
      const outputWrapper = new OutputWrapper(scanResult);
      
      // 写入输出文件
      await this._writeOutputFile(outputWrapper, finalOutputPath);
      
      console.log(`输出生成完成: ${finalOutputPath}`);
      console.log(`总文件数: ${scanResult.totalFiles}, 提示词文件数: ${scanResult.promptFiles.length}`);
      
      return outputWrapper.toJSON();
      
    } catch (error) {
      throw new Error(`输出生成失败: ${error.message}`);
    }
  }

  /**
   * 创建ScanResult对象
   * @param {Array} promptFiles - PromptFile对象数组
   * @param {Object} scanMetadata - 扫描元数据
   * @returns {ScanResult} ScanResult对象
   */
  _createScanResult(promptFiles, scanMetadata = {}) {
    const scanResult = new ScanResult({
      totalFiles: scanMetadata.totalScannedFiles || promptFiles.length,
      promptFiles: promptFiles || [],
      scanTimestamp: scanMetadata.startTime || new Date().toISOString(),
      scanDuration: scanMetadata.duration || null
    });

    // 验证创建的对象
    if (!scanResult.isValid()) {
      throw new Error('创建的ScanResult对象无效');
    }

    return scanResult;
  }

  /**
   * 写入输出文件
   * @param {OutputWrapper} outputWrapper - 输出包装器对象
   * @param {string} outputPath - 输出文件路径
   * @returns {Promise<void>}
   */
  async _writeOutputFile(outputWrapper, outputPath) {
    try {
      // 确保输出目录存在
      const outputDir = path.dirname(outputPath);
      await fs.ensureDir(outputDir);
      
      // 生成JSON字符串
      const jsonContent = this.prettyPrint 
        ? JSON.stringify(outputWrapper.toJSON(), null, 2)
        : JSON.stringify(outputWrapper.toJSON());
      
      // 写入文件
      await fs.writeFile(outputPath, jsonContent, 'utf-8');
      
    } catch (error) {
      throw new Error(`写入输出文件失败: ${error.message}`);
    }
  }

  /**
   * 读取并解析输出文件
   * @param {string} outputPath - 输出文件路径
   * @returns {Promise<Object>} 解析的输出对象
   */
  async readOutputFile(outputPath = null) {
    try {
      const finalOutputPath = outputPath || this.defaultOutputPath;
      
      if (!await fs.pathExists(finalOutputPath)) {
        throw new Error(`输出文件不存在: ${finalOutputPath}`);
      }
      
      const content = await fs.readFile(finalOutputPath, 'utf-8');
      const data = JSON.parse(content);
      
      // 验证数据格式
      if (!data.scanResult) {
        throw new Error('输出文件格式无效：缺少scanResult字段');
      }
      
      return data;
      
    } catch (error) {
      throw new Error(`读取输出文件失败: ${error.message}`);
    }
  }

  /**
   * 生成输出统计信息
   * @param {Array} promptFiles - PromptFile对象数组
   * @returns {Object} 统计信息
   */
  generateStats(promptFiles) {
    const stats = {
      totalPromptFiles: promptFiles.length,
      categoryCounts: {},
      languageCounts: {},
      averageConfidence: 0,
      highConfidenceFiles: 0 // confidence > 0.8
    };

    if (promptFiles.length === 0) {
      return stats;
    }

    let totalConfidence = 0;

    promptFiles.forEach(file => {
      // 统计分类
      const category = file.category || 'unknown';
      stats.categoryCounts[category] = (stats.categoryCounts[category] || 0) + 1;

      // 统计语言
      const language = file.language || 'unknown';
      stats.languageCounts[language] = (stats.languageCounts[language] || 0) + 1;

      // 统计置信度
      if (typeof file.confidence === 'number') {
        totalConfidence += file.confidence;
        if (file.confidence > 0.8) {
          stats.highConfidenceFiles++;
        }
      }
    });

    // 计算平均置信度
    stats.averageConfidence = totalConfidence / promptFiles.length;

    return stats;
  }

  /**
   * 设置输出格式选项
   * @param {Object} options - 格式选项
   */
  setFormatOptions(options = {}) {
    if (options.hasOwnProperty('prettyPrint')) {
      this.prettyPrint = options.prettyPrint;
    }
    if (options.outputPath) {
      this.defaultOutputPath = options.outputPath;
    }
  }

  /**
   * 获取当前配置
   * @returns {Object} 当前配置
   */
  getConfig() {
    return {
      defaultOutputPath: this.defaultOutputPath,
      prettyPrint: this.prettyPrint
    };
  }
}