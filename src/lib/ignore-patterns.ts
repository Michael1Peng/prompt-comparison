/**
 * .gitignore规则解析库
 * 处理文件忽略模式
 */

import { promises as fs } from 'fs';
import { join, relative, sep } from 'path';
import ignore from 'ignore';

export interface IgnoreOptions {
  respectGitignore?: boolean;
  additionalIgnoreFiles?: string[];
  defaultPatterns?: string[];
  includePatterns?: string[];
}

/**
 * 忽略规则管理器
 */
export class IgnoreManager {
  private ig = ignore();
  private includePatterns: string[] = [];
  
  constructor(private rootPath: string, private options: IgnoreOptions = {}) {
    // 添加默认忽略模式
    const defaultPatterns = options.defaultPatterns || [
      'node_modules/**',
      '.git/**',
      '*.log',
      '.DS_Store',
      'Thumbs.db',
      '*.swp',
      '*.swo',
      '*~',
      '.idea/**',
      '.vscode/**',
      '*.sublime-*',
      'dist/**',
      'build/**',
      'coverage/**',
      '.nyc_output/**'
    ];
    
    this.ig.add(defaultPatterns);
    
    // 设置包含模式
    if (options.includePatterns) {
      this.includePatterns = options.includePatterns;
    }
  }
  
  /**
   * 初始化忽略规则
   */
  async init(): Promise<void> {
    // 加载.gitignore
    if (this.options.respectGitignore !== false) {
      await this.loadGitignore();
    }
    
    // 加载额外的忽略文件
    if (this.options.additionalIgnoreFiles) {
      for (const file of this.options.additionalIgnoreFiles) {
        await this.loadIgnoreFile(file);
      }
    }
  }
  
  /**
   * 检查文件是否应该被忽略
   */
  isIgnored(filePath: string): boolean {
    // 计算相对路径
    const relativePath = this.getRelativePath(filePath);
    
    // 如果有包含模式，先检查是否匹配
    if (this.includePatterns.length > 0) {
      const isIncluded = this.includePatterns.some(pattern => 
        this.matchPattern(relativePath, pattern)
      );
      
      if (!isIncluded) {
        return true; // 不在包含列表中，忽略
      }
    }
    
    // 检查忽略规则
    return this.ig.ignores(relativePath);
  }
  
  /**
   * 过滤文件列表
   */
  filter(filePaths: string[]): string[] {
    return filePaths.filter(filePath => !this.isIgnored(filePath));
  }
  
  /**
   * 添加忽略模式
   */
  addPattern(pattern: string | string[]): void {
    this.ig.add(pattern);
  }
  
  /**
   * 添加包含模式
   */
  addIncludePattern(pattern: string | string[]): void {
    if (Array.isArray(pattern)) {
      this.includePatterns.push(...pattern);
    } else {
      this.includePatterns.push(pattern);
    }
  }
  
  /**
   * 加载.gitignore文件
   */
  private async loadGitignore(): Promise<void> {
    const gitignorePath = join(this.rootPath, '.gitignore');
    await this.loadIgnoreFile(gitignorePath);
    
    // 递归查找父目录的.gitignore
    await this.loadParentGitignores();
  }
  
  /**
   * 加载父目录的.gitignore文件
   */
  private async loadParentGitignores(): Promise<void> {
    let currentPath = this.rootPath;
    const visited = new Set<string>();
    
    while (true) {
      const parentPath = join(currentPath, '..');
      
      // 到达根目录或已访问过
      if (parentPath === currentPath || visited.has(parentPath)) {
        break;
      }
      
      visited.add(parentPath);
      
      // 检查是否是git仓库根目录
      try {
        await fs.access(join(parentPath, '.git'));
        const gitignorePath = join(parentPath, '.gitignore');
        await this.loadIgnoreFile(gitignorePath);
        break; // 找到git根目录，停止查找
      } catch {
        // 继续向上查找
      }
      
      currentPath = parentPath;
    }
  }
  
  /**
   * 加载忽略文件
   */
  private async loadIgnoreFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const patterns = this.parseIgnoreFile(content);
      this.ig.add(patterns);
    } catch (error) {
      // 文件不存在或无法读取，忽略错误
    }
  }
  
  /**
   * 解析忽略文件内容
   */
  private parseIgnoreFile(content: string): string[] {
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#')); // 移除空行和注释
  }
  
  /**
   * 获取相对路径
   */
  private getRelativePath(filePath: string): string {
    const relativePath = relative(this.rootPath, filePath);
    // 统一使用正斜杠
    return relativePath.split(sep).join('/');
  }
  
  /**
   * 匹配模式
   */
  private matchPattern(path: string, pattern: string): boolean {
    // 简单的通配符匹配
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
      .replace(/\//g, '\\/');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }
  
  /**
   * 获取所有忽略模式
   */
  getPatterns(): string[] {
    // 注意：ignore库不提供获取模式的API，这里返回空数组
    // 实际使用中可以维护一个模式列表
    return [];
  }
  
  /**
   * 清除所有规则
   */
  clear(): void {
    this.ig = ignore();
    this.includePatterns = [];
  }
}

/**
 * 创建忽略管理器的便捷函数
 */
export async function createIgnoreManager(
  rootPath: string,
  options?: IgnoreOptions
): Promise<IgnoreManager> {
  const manager = new IgnoreManager(rootPath, options);
  await manager.init();
  return manager;
}

/**
 * 检查单个文件是否被忽略
 */
export async function isFileIgnored(
  filePath: string,
  rootPath: string,
  options?: IgnoreOptions
): Promise<boolean> {
  const manager = await createIgnoreManager(rootPath, options);
  return manager.isIgnored(filePath);
}

/**
 * 过滤文件列表
 */
export async function filterIgnoredFiles(
  filePaths: string[],
  rootPath: string,
  options?: IgnoreOptions
): Promise<string[]> {
  const manager = await createIgnoreManager(rootPath, options);
  return manager.filter(filePaths);
}