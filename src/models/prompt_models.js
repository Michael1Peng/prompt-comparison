/**
 * AI提示词深度分析和提取工具 - 数据模型
 * 定义PromptDetail和PromptList数据结构
 */

/**
 * 提示词详细信息类
 * 表示一个独立的提示词内容块
 */
export class PromptDetail {
  constructor({
    promptId,
    sourceFile,
    content,
    startLine,
    endLine
  }) {
    this.promptId = promptId;       // 唯一标识符 (格式: "prompt_001")
    this.sourceFile = sourceFile;   // 来源文件路径
    this.content = content;         // 提示词完整内容
    this.startLine = startLine;     // 起始行号 (1-based)
    this.endLine = endLine;         // 结束行号 (1-based)
  }

  /**
   * 验证PromptDetail对象的有效性
   */
  isValid() {
    return (
      typeof this.promptId === 'string' &&
      Boolean(this.promptId.match(/^prompt_\d{3}$/)) &&
      typeof this.sourceFile === 'string' &&
      typeof this.content === 'string' &&
      typeof this.startLine === 'number' &&
      typeof this.endLine === 'number' &&
      this.startLine > 0 &&
      this.endLine >= this.startLine
    );
  }

  /**
   * 转换为JSON对象
   */
  toJSON() {
    return {
      promptId: this.promptId,
      sourceFile: this.sourceFile,
      content: this.content,
      startLine: this.startLine,
      endLine: this.endLine
    };
  }

  /**
   * 从JSON对象创建PromptDetail实例
   */
  static fromJSON(json) {
    return new PromptDetail(json);
  }
}

/**
 * 提示词列表汇总类
 * 包含所有提取的提示词和统计信息
 */
export class PromptList {
  constructor({
    totalFiles,
    totalPrompts,
    processingStats,
    analysisTime,
    prompts = []
  }) {
    this.totalFiles = totalFiles;           // 处理的文件总数
    this.totalPrompts = totalPrompts;       // 提取的提示词总数
    this.processingStats = processingStats || {
      successfulFiles: 0,
      failedFiles: 0,
      errors: []
    };
    this.analysisTime = analysisTime || new Date().toISOString();
    this.prompts = prompts.map(p => 
      p instanceof PromptDetail ? p : new PromptDetail(p)
    );
  }

  /**
   * 添加提示词到列表
   */
  addPrompt(promptDetail) {
    if (!(promptDetail instanceof PromptDetail)) {
      promptDetail = new PromptDetail(promptDetail);
    }
    
    if (!promptDetail.isValid()) {
      throw new Error('Invalid PromptDetail object');
    }
    
    this.prompts.push(promptDetail);
    this.totalPrompts = this.prompts.length;
  }

  /**
   * 添加错误记录
   */
  addError(file, errorMessage) {
    this.processingStats.errors.push({
      file,
      error: errorMessage
    });
    this.processingStats.failedFiles++;
  }

  /**
   * 标记文件处理成功
   */
  markFileSuccess() {
    this.processingStats.successfulFiles++;
  }

  /**
   * 验证PromptList对象的有效性
   */
  isValid() {
    return (
      typeof this.totalFiles === 'number' &&
      this.totalFiles >= 0 &&
      typeof this.totalPrompts === 'number' &&
      this.totalPrompts >= 0 &&
      this.processingStats &&
      typeof this.processingStats.successfulFiles === 'number' &&
      typeof this.processingStats.failedFiles === 'number' &&
      Array.isArray(this.processingStats.errors) &&
      typeof this.analysisTime === 'string' &&
      Array.isArray(this.prompts) &&
      this.prompts.every(p => p instanceof PromptDetail && p.isValid())
    );
  }

  /**
   * 转换为JSON对象
   */
  toJSON() {
    return {
      totalFiles: this.totalFiles,
      totalPrompts: this.totalPrompts,
      processingStats: this.processingStats,
      analysisTime: this.analysisTime,
      prompts: this.prompts.map(p => p.toJSON())
    };
  }

  /**
   * 从JSON对象创建PromptList实例
   */
  static fromJSON(json) {
    return new PromptList(json);
  }

  /**
   * 生成下一个提示词ID
   */
  generateNextPromptId() {
    const currentMax = this.prompts.reduce((max, p) => {
      const match = p.promptId.match(/^prompt_(\d{3})$/);
      if (match) {
        const num = parseInt(match[1]);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    
    return `prompt_${String(currentMax + 1).padStart(3, '0')}`;
  }
}

// 导出常量
export const PROMPT_ID_FORMAT = /^prompt_\d{3}$/;