/**
 * AI提示词文件发现和汇总工具 - 数据模型
 * 基于测试用例中实际使用的数据结构
 */

/**
 * 提示词文件对象
 * 表示一个被AI识别为包含提示词的文件
 */
export class PromptFile {
  constructor({
    filePath,
    fileName,
    content,
    isPrompt,
    confidence,
    language = null,
    category = null
  }) {
    this.filePath = filePath;       // 文件完整路径
    this.fileName = fileName;       // 文件名
    this.content = content;         // 文件内容
    this.isPrompt = isPrompt;       // 是否为提示词文件
    this.confidence = confidence;   // AI判断的置信度 (0.0-1.0)
    this.language = language;       // 提示词相关的编程语言
    this.category = category;       // 提示词类别 (如 'code-generation', 'tutorial')
  }

  /**
   * 验证PromptFile对象的有效性
   */
  isValid() {
    return (
      typeof this.filePath === 'string' &&
      typeof this.fileName === 'string' &&
      typeof this.content === 'string' &&
      typeof this.isPrompt === 'boolean' &&
      typeof this.confidence === 'number' &&
      this.confidence >= 0 &&
      this.confidence <= 1
    );
  }

  /**
   * 转换为JSON对象
   */
  toJSON() {
    return {
      filePath: this.filePath,
      fileName: this.fileName,
      content: this.content,
      isPrompt: this.isPrompt,
      confidence: this.confidence,
      language: this.language,
      category: this.category
    };
  }

  /**
   * 从JSON对象创建PromptFile实例
   */
  static fromJSON(json) {
    return new PromptFile(json);
  }
}

/**
 * 扫描结果对象
 * 包含完整的扫描结果信息
 */
export class ScanResult {
  constructor({
    totalFiles,
    promptFiles,
    scanTimestamp = null,
    scanDuration = null
  }) {
    this.totalFiles = totalFiles;           // 总扫描文件数
    this.promptFiles = promptFiles || [];   // PromptFile对象数组
    this.scanTimestamp = scanTimestamp || new Date().toISOString();  // ISO格式时间戳
    this.scanDuration = scanDuration;       // 扫描耗时(毫秒)
  }

  /**
   * 验证ScanResult对象的有效性
   */
  isValid() {
    return (
      typeof this.totalFiles === 'number' &&
      this.totalFiles >= 0 &&
      Array.isArray(this.promptFiles) &&
      this.promptFiles.every(file => file instanceof PromptFile || file.hasOwnProperty('isPrompt')) &&
      typeof this.scanTimestamp === 'string' &&
      (this.scanDuration === null || typeof this.scanDuration === 'number')
    );
  }

  /**
   * 转换为JSON对象
   */
  toJSON() {
    return {
      totalFiles: this.totalFiles,
      promptFiles: this.promptFiles.map(file => 
        file instanceof PromptFile ? file.toJSON() : file
      ),
      scanTimestamp: this.scanTimestamp,
      scanDuration: this.scanDuration
    };
  }

  /**
   * 从JSON对象创建ScanResult实例
   */
  static fromJSON(json) {
    const promptFiles = json.promptFiles.map(fileData => 
      fileData instanceof PromptFile ? fileData : PromptFile.fromJSON(fileData)
    );
    
    return new ScanResult({
      totalFiles: json.totalFiles,
      promptFiles: promptFiles,
      scanTimestamp: json.scanTimestamp,
      scanDuration: json.scanDuration
    });
  }
}

/**
 * 输出包装器对象
 * 符合测试中期望的最终JSON输出格式
 */
export class OutputWrapper {
  constructor(scanResult) {
    this.scanResult = scanResult instanceof ScanResult ? scanResult : new ScanResult(scanResult);
  }

  /**
   * 转换为JSON对象
   */
  toJSON() {
    return {
      scanResult: this.scanResult.toJSON()
    };
  }

  /**
   * 从JSON对象创建OutputWrapper实例
   */
  static fromJSON(json) {
    const scanResult = json.scanResult instanceof ScanResult 
      ? json.scanResult 
      : ScanResult.fromJSON(json.scanResult);
    
    return new OutputWrapper(scanResult);
  }
}

// 导出常量定义
export const SUPPORTED_FILE_EXTENSIONS = [
  '.md', '.txt', '.js', '.py', '.json', '.yaml', '.yml', '.ts'
];

export const PROMPT_CATEGORIES = [
  'code-generation',
  'tutorial', 
  'configuration',
  'documentation',
  'unknown'
];

export const DEFAULT_OUTPUT_PATH = './analysis/prompt-files.json';

/**
 * 提示词详情对象
 * 表示从文件中提取的具体提示词内容和位置信息
 */
export class PromptDetail {
  constructor({
    promptId,
    sourceFile,
    content,
    startLine,
    endLine
  }) {
    this.promptId = promptId;       // 提示词唯一标识符 (prompt_001, prompt_002...)
    this.sourceFile = sourceFile;   // 来源文件路径
    this.content = content;         // 提示词完整内容（保持原始格式）
    this.startLine = startLine;     // 在文件中的起始行号 (0-based, 包含上下文)
    this.endLine = endLine;         // 在文件中的结束行号 (0-based, 包含上下文)
  }

  /**
   * 验证PromptDetail对象的有效性
   */
  isValid() {
    return (
      typeof this.promptId === 'string' &&
      this.promptId.length > 0 &&
      typeof this.sourceFile === 'string' &&
      this.sourceFile.length > 0 &&
      typeof this.content === 'string' &&
      this.content.length > 0 &&
      typeof this.startLine === 'number' &&
      typeof this.endLine === 'number' &&
      this.startLine >= 0 &&
      this.endLine >= 0 &&
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
 * 提示词列表对象
 * 包含提取的所有提示词详情和处理统计信息
 */
export class PromptList {
  constructor({
    totalFiles,
    totalPrompts,
    prompts = [],
    analysisTime = null,
    processingStats = {}
  }) {
    this.totalFiles = totalFiles;                         // 处理的文件总数
    this.totalPrompts = totalPrompts;                     // 发现的提示词总数
    this.prompts = prompts;                               // PromptDetail对象数组
    this.analysisTime = analysisTime || new Date().toISOString(); // 分析时间戳 (ISO格式)
    this.processingStats = {                              // 简单处理统计信息
      successFiles: processingStats.successFiles || 0,   // 成功处理的文件数
      failedFiles: processingStats.failedFiles || 0      // 处理失败的文件数
    };
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
      Array.isArray(this.prompts) &&
      this.prompts.every(prompt => prompt instanceof PromptDetail || prompt.hasOwnProperty('promptId')) &&
      typeof this.analysisTime === 'string' &&
      typeof this.processingStats === 'object' &&
      typeof this.processingStats.successFiles === 'number' &&
      typeof this.processingStats.failedFiles === 'number' &&
      this.processingStats.successFiles >= 0 &&
      this.processingStats.failedFiles >= 0
    );
  }

  /**
   * 转换为JSON对象
   */
  toJSON() {
    return {
      totalFiles: this.totalFiles,
      totalPrompts: this.totalPrompts,
      prompts: this.prompts.map(prompt => 
        prompt instanceof PromptDetail ? prompt.toJSON() : prompt
      ),
      analysisTime: this.analysisTime,
      processingStats: this.processingStats
    };
  }

  /**
   * 从JSON对象创建PromptList实例
   */
  static fromJSON(json) {
    const prompts = json.prompts.map(promptData => 
      promptData instanceof PromptDetail ? promptData : PromptDetail.fromJSON(promptData)
    );
    
    return new PromptList({
      totalFiles: json.totalFiles,
      totalPrompts: json.totalPrompts,
      prompts: prompts,
      analysisTime: json.analysisTime,
      processingStats: json.processingStats
    });
  }
}

// 新增常量定义
export const DEFAULT_PROMPT_LIST_OUTPUT_PATH = './analysis/prompt-list.json';