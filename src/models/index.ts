/**
 * Data Models for AI 提示词分析工作流
 * Implements the data model specification from specs/001-ai-ai-ai/data-model.md
 */

// ============================================================================
// Enums
// ============================================================================

export enum ScanStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  SKIPPED = "skipped"
}

export enum Language {
  CHINESE = "zh",
  ENGLISH = "en",
  MIXED = "mixed",
  OTHER = "other"
}

export enum ContentType {
  SYSTEM_PROMPT = "system",
  USER_PROMPT = "user",
  ASSISTANT_PROMPT = "assistant",
  CONVERSATION = "conversation",
  CODE_COMMENT = "code_comment",
  DOCUMENTATION = "documentation",
  CONFIGURATION = "configuration"
}

export enum QualityScore {
  A = "A",  // 优秀 (>= 90% 要素完整)
  B = "B",  // 良好 (>= 70% 要素完整)
  C = "C",  // 中等 (>= 50% 要素完整)
  D = "D",  // 较差 (>= 30% 要素完整)
  F = "F"   // 不合格 (< 30% 要素完整)
}

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  FATAL = "fatal"
}

// ============================================================================
// Core Entity Interfaces
// ============================================================================

/**
 * 表示仓库中可能包含提示词内容的源文件
 */
export interface PromptFile {
  // 标识信息
  filePath: string;           // 相对于仓库根目录的路径
  fileName: string;           // 文件名（不含路径）
  fileExtension: string;      // 文件扩展名（如 .md, .txt, .py）

  // 文件元信息
  fileSize: number;          // 文件大小（字节）
  lastModified: Date;        // 最后修改时间
  encoding: string;          // 文件编码（UTF-8等）

  // 处理状态
  scanStatus: ScanStatus;    // 扫描状态
  scanTimestamp: Date;       // 扫描时间
  errorMessage?: string;     // 错误信息（如果有）
}

/**
 * 表示从文件中识别和提取的提示词文本内容
 */
export interface PromptContent {
  // 关联信息
  contentId: string;         // 唯一标识符
  sourceFile: string;        // 来源文件路径

  // 内容信息
  originalText: string;      // 原始提示词文本
  cleanedText: string;       // 清理后的文本（去除格式等）
  language: Language;        // 主要语言
  contentType: ContentType;  // 内容类型

  // 检测结果
  isPrompt: boolean;         // 是否为提示词
  confidence: number;        // 置信度 (0.0 - 1.0)
  detectionMethod: string;   // 检测方法标识

  // 位置信息
  startPosition?: number;    // 文件中的开始位置
  endPosition?: number;      // 文件中的结束位置
  lineRange?: {              // 行号范围
    start: number;
    end: number;
  };
}

/**
 * 提示词要素的数据结构
 */
export interface ElementData {
  present: boolean;          // 是否存在该要素
  content?: string;          // 要素内容
  confidence: number;        // 置信度 (0.0-1.0)
  extractedText?: string;    // 原文摘录
  position?: {               // 在原文中的位置
    start: number;
    length: number;
  };
}

/**
 * 表示分析后的13个框架要素结构化数据
 */
export interface PromptElements {
  // 关联信息
  elementId: string;         // 唯一标识符
  contentId: string;         // 关联的内容ID

  // 13个标准化要素
  sourceFile: string;        // 所在文件
  roleAbility: ElementData;  // 角色/能力
  taskRequest: ElementData;  // 任务/请求
  contextSituation: ElementData; // 背景/情境
  instructionAction: ElementData; // 指令/行动
  outputSpec: ElementData;   // 输出规格
  examples: ElementData;     // 示例
  constraints: ElementData;  // 限制/约束
  objectives: ElementData;   // 目标/期望
  information: ElementData;  // 信息
  evaluation: ElementData;   // 评估/优化
  adjustment: ElementData;   // 调整
  audience: ElementData;     // 受众

  // 分析元信息
  analysisTimestamp: Date;   // 分析时间
  analysisModel: string;     // 使用的AI模型
  completeness: number;      // 完整性评分 (0-1)
  qualityScore: QualityScore; // 质量评级

  // 索引签名用于动态访问
  [key: string]: any;
}

/**
 * 表示完整的分析结果汇总和统计信息
 */
export interface AnalysisReport {
  // 报告基本信息
  reportId: string;          // 报告唯一标识
  projectPath: string;       // 分析的项目路径
  createdAt: Date;           // 创建时间
  version: string;           // 工具版本

  // 扫描统计
  scanSummary: {
    totalFiles: number;      // 总文件数
    scannedFiles: number;    // 已扫描文件数
    promptFiles: number;     // 包含提示词的文件数
    failedFiles: number;     // 失败文件数
    skippedFiles: number;    // 跳过文件数
  };

  // 内容统计
  contentSummary: {
    totalPrompts: number;    // 总提示词数
    byLanguage: Record<Language, number>; // 按语言分布
    byType: Record<ContentType, number>;  // 按类型分布
    avgConfidence: number;   // 平均置信度
  };

  // 要素统计
  elementSummary: {
    avgCompleteness: number; // 平均完整性
    qualityDistribution: Record<QualityScore, number>; // 质量分布
    elementFrequency: Record<string, number>; // 各要素出现频率
    topMissingElements: string[]; // 最常缺失的要素
  };

  // 性能统计
  performance: {
    processingTime: number;  // 处理总时间（毫秒）
    apiCallsCount: number;   // API调用次数
    totalTokens: number;     // 消耗token总数
    avgTimePerFile: number;  // 平均每文件处理时间
  };

  // 详细结果
  files: PromptFile[];       // 所有文件信息
  contents: PromptContent[]; // 所有内容信息
  elements: PromptElements[]; // 所有要素信息
}

/**
 * 记录详细的处理过程和错误信息
 */
export interface ProcessingLog {
  logId: string;             // 日志唯一标识
  timestamp: Date;           // 时间戳
  level: LogLevel;           // 日志级别
  source: string;            // 来源模块
  message: string;           // 日志消息

  // 上下文信息
  filePath?: string;         // 相关文件路径
  contentId?: string;        // 相关内容ID
  errorCode?: string;        // 错误代码
  stackTrace?: string;       // 错误堆栈

  // 性能信息
  duration?: number;         // 操作耗时
  memoryUsage?: number;      // 内存使用量
  apiResponse?: {            // API响应信息
    model: string;
    tokens: number;
    latency: number;
  };
}

// ============================================================================
// Configuration Interfaces
// ============================================================================

/**
 * 文件扫描配置选项
 */
export interface ScanOptions {
  recursive?: boolean;        // 是否递归扫描子目录
  followSymlinks?: boolean;   // 是否跟随符号链接
  excludePatterns?: string[]; // 排除模式
  includePatterns?: string[]; // 包含模式
  maxDepth?: number;         // 最大深度
  maxFileSize?: number;      // 最大文件大小（字节）
}

/**
 * 提示词检测配置选项
 */
export interface DetectionOptions {
  confidenceThreshold?: number;  // 置信度阈值
  model?: string;               // AI模型名称
  maxRetries?: number;          // 最大重试次数
  batchSize?: number;           // 批处理大小
  timeout?: number;             // 超时时间（毫秒）
}

/**
 * 要素分析配置选项
 */
export interface AnalysisOptions {
  model?: string;               // AI模型名称
  temperature?: number;         // 温度参数
  maxTokens?: number;           // 最大token数
  enableCache?: boolean;        // 是否启用缓存
  qualityThreshold?: number;    // 质量阈值
}

/**
 * 报告生成配置选项
 */
export interface ReportOptions {
  format?: 'json' | 'csv' | 'html'; // 输出格式
  outputPath?: string;              // 输出路径
  includeDetails?: boolean;         // 是否包含详细信息
  compress?: boolean;               // 是否压缩
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * 文件扫描错误
 */
export class FileScannedError extends Error {
  constructor(
    public readonly filePath: string,
    public readonly code: string,
    message: string,
    public readonly cause?: Error
  ) {
    super(message || '');
    this.name = 'FileScannedError';
  }
}

/**
 * API调用错误
 */
export class ApiCallError extends Error {
  constructor(
    public readonly endpoint: string,
    public readonly statusCode?: number,
    message?: string,
    public readonly cause?: Error
  ) {
    super(message ?? 'API call failed');
    this.name = 'ApiCallError';
  }
}

/**
 * 数据验证错误
 */
export class ValidationError extends Error {
  constructor(
    public readonly field: string,
    public readonly value: any,
    message: string
  ) {
    super(message || '');
    this.name = 'ValidationError';
  }
}