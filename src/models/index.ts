/**
 * 数据模型入口文件
 * 导出所有数据模型接口和类型
 */

// ============== 通用类型 ==============
export * from './common.js';

// ============== 核心实体模型 ==============
export * from './file-metadata.js';
export * from './prompt-content.js';
export * from './prompt-analysis.js';
export * from './processing-log.js';
export * from './analysis-report.js';

// 类型在各自模块中已经通过 export * 导出，这里不需要重复导出

// ============== 常量导出 ==============
export {
  ELEMENT_NAME_MAPPING,
  ANALYSIS_ELEMENT_NAMES,
} from './prompt-analysis.js';

export {
  MIME_TYPE_MAPPING,
  DEFAULT_DISPLAY_OPTIONS,
} from './analysis-report.js';

// 工具函数已通过 export * 导出，这里不需要重复导出

// ============== 版本信息 ==============
export const DATA_MODEL_VERSION = '1.0.0';
export const SCHEMA_VERSION = '2025-09-13';

// ============== 数据关系常量 ==============
/**
 * 数据实体关系映射
 * 定义各实体之间的关联关系
 */
export const ENTITY_RELATIONSHIPS = {
  /** FileMetadata 1:N PromptContent */
  FILE_TO_PROMPTS: 'one_to_many',
  /** PromptContent 1:1 PromptAnalysis */
  PROMPT_TO_ANALYSIS: 'one_to_one',
  /** PromptContent 1:N ProcessingLog */
  PROMPT_TO_LOGS: 'one_to_many',
  /** AnalysisReport N:N PromptContent */
  REPORT_TO_PROMPTS: 'many_to_many',
} as const;

/**
 * 支持的文件扩展名
 */
export const SUPPORTED_FILE_EXTENSIONS = [
  '.md',
  '.txt',
  '.js',
  '.ts',
  '.jsx',
  '.tsx',
  '.py',
  '.java',
  '.cpp',
  '.c',
  '.cs',
  '.php',
  '.rb',
  '.go',
  '.rs',
  '.swift',
  '.kt',
  '.scala',
  '.json',
  '.yaml',
  '.yml',
  '.xml',
  '.toml',
  '.html',
  '.css',
  '.scss',
  '.less',
  '.sh',
  '.bash',
  '.zsh',
  '.fish',
  '.sql',
  '.graphql',
  '.proto',
  '.vue',
  '.svelte',
  '.astro',
  '.dockerfile',
  '.docker-compose.yml',
  '.gitignore',
  '.gitattributes',
  '.env',
  '.env.example',
  'README',
  'CHANGELOG',
  'LICENSE',
] as const;

/**
 * 默认配置常量
 */
export const DEFAULT_CONFIG = {
  /** 最大文件大小 (10MB) */
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
  /** 最大行数 */
  MAX_LINE_COUNT: 50000,
  /** 内容预览最大长度 */
  CONTENT_PREVIEW_LENGTH: 500,
  /** 提示词内容预览最大长度 */
  PROMPT_PREVIEW_LENGTH: 200,
  /** 上下文行数 */
  CONTEXT_LINES: 5,
  /** 默认批处理大小 */
  DEFAULT_BATCH_SIZE: 10,
  /** 默认超时时间(毫秒) */
  DEFAULT_TIMEOUT_MS: 30000,
  /** 最大重试次数 */
  MAX_RETRY_COUNT: 3,
} as const;

/**
 * 质量分级阈值
 */
export const QUALITY_THRESHOLDS = {
  /** 高质量阈值 */
  HIGH_QUALITY: 0.8,
  /** 中等质量阈值 */
  MEDIUM_QUALITY: 0.5,
  /** 低质量阈值 */
  LOW_QUALITY: 0.0,
} as const;

/**
 * 复杂度分级阈值
 */
export const COMPLEXITY_THRESHOLDS = {
  /** 简单 (1-3分) */
  SIMPLE_MAX: 3,
  /** 中等 (4-6分) */
  MODERATE_MAX: 6,
  /** 复杂 (7-10分) */
  COMPLEX_MAX: 10,
} as const;
