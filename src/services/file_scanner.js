/**
 * AI提示词文件发现和汇总工具 - 文件扫描服务
 * 支持.gitignore规则的文件扫描功能
 */

import fs from 'fs-extra';
import path from 'path';
import ignore from 'ignore';
import { SUPPORTED_FILE_EXTENSIONS } from '../models/data_models.js';

export class FileScanner {
  constructor() {
    this.supportedExtensions = SUPPORTED_FILE_EXTENSIONS;
  }

  /**
   * 扫描指定目录下的文件
   * @param {string} targetDir - 目标扫描目录
   * @returns {Promise<string[]>} 文件路径列表
   */
  async scanFiles(targetDir) {
    try {
      // 确保目录存在
      if (!await fs.pathExists(targetDir)) {
        throw new Error(`目录不存在: ${targetDir}`);
      }

      // 加载.gitignore规则
      const ignoreFilter = await this._loadGitIgnoreFilter(targetDir);
      
      // 递归扫描目录
      const allFiles = await this._scanDirectory(targetDir, targetDir, ignoreFilter);
      
      // 过滤文本文件
      const textFiles = [];
      for (const filePath of allFiles) {
        if (await this._isTextFile(filePath)) {
          textFiles.push(filePath);
        }
      }

      return textFiles;
    } catch (error) {
      throw new Error(`文件扫描失败: ${error.message}`);
    }
  }

  /**
   * 递归扫描目录
   * @param {string} currentDir - 当前目录
   * @param {string} rootDir - 根目录
   * @param {Function} ignoreFilter - gitignore过滤器
   * @returns {Promise<string[]>} 文件路径列表
   */
  async _scanDirectory(currentDir, rootDir, ignoreFilter) {
    const files = [];
    const items = await fs.readdir(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const relativePath = path.relative(rootDir, fullPath);
      
      // 检查是否应该被忽略
      if (this._shouldIgnoreFile(relativePath, ignoreFilter)) {
        continue;
      }

      const stats = await fs.stat(fullPath);
      
      if (stats.isDirectory()) {
        // 递归扫描子目录
        const subFiles = await this._scanDirectory(fullPath, rootDir, ignoreFilter);
        files.push(...subFiles);
      } else if (stats.isFile()) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * 加载.gitignore过滤器
   * @param {string} targetDir - 目标目录
   * @returns {Promise<Function>} ignore过滤器函数
   */
  async _loadGitIgnoreFilter(targetDir) {
    const gitignorePath = path.join(targetDir, '.gitignore');
    
    try {
      if (await fs.pathExists(gitignorePath)) {
        const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
        const ig = ignore().add(gitignoreContent);
        return (relativePath) => ig.ignores(relativePath);
      }
    } catch (error) {
      // .gitignore读取失败，返回不忽略任何文件的过滤器
      console.warn(`警告: 无法读取.gitignore文件: ${error.message}`);
    }
    
    // 返回不忽略任何文件的过滤器
    return () => false;
  }

  /**
   * 检查文件是否应该被忽略
   * @param {string} relativePath - 相对路径
   * @param {Function} ignoreFilter - gitignore过滤器
   * @returns {boolean} 是否应该被忽略
   */
  _shouldIgnoreFile(relativePath, ignoreFilter) {
    // 忽略.git目录
    if (relativePath.startsWith('.git/') || relativePath === '.git') {
      return true;
    }
    
    // 应用.gitignore规则
    return ignoreFilter(relativePath);
  }

  /**
   * 检查文件是否为文本文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<boolean>} 是否为文本文件
   */
  async _isTextFile(filePath) {
    try {
      // 首先检查文件扩展名
      const ext = path.extname(filePath).toLowerCase();
      if (!this.supportedExtensions.includes(ext)) {
        return false;
      }

      // 检查文件大小（跳过过大的文件，避免内存问题）
      const stats = await fs.stat(filePath);
      if (stats.size > 1024 * 1024) { // 1MB限制
        return false;
      }

      // 尝试读取文件开头部分检查是否为文本（简化版本）
      const bytesToRead = Math.min(512, stats.size);
      const buffer = await fs.readFile(filePath, { encoding: null, flag: 'r' });
      
      // 只检查前面的字节
      const checkBytes = Math.min(bytesToRead, buffer.length);
      
      // 检查是否包含NULL字节（二进制文件的标志）
      for (let i = 0; i < checkBytes; i++) {
        if (buffer[i] === 0) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      // 文件读取失败，假设不是文本文件
      return false;
    }
  }

  /**
   * 获取支持的文件扩展名列表
   * @returns {string[]} 支持的扩展名
   */
  getSupportedExtensions() {
    return [...this.supportedExtensions];
  }
}