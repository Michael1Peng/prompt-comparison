/**
 * 通用类型定义
 * 包含所有数据模型中共用的基础类型和枚举
 */

// ============== 基础类型 ==============

/** UUID字符串类型 */
export type UUID = string;

/** ISO 8601时间戳类型 */
export type Timestamp = string;

/** 置信度评分 (0-1之间) */
export type ConfidenceScore = number;

/** 评分 (0-1之间) */
export type Score = number;

/** 文件路径 */
export type FilePath = string;

// ============== 枚举类型 ==============

/** 扫描状态 */
export type ScanStatus = 'pending' | 'scanned' | 'error' | 'skipped';

/** 翻译状态 */
export type TranslationStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

/** 分析状态 */
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

/** 处理状态 */
export interface ProcessingStatus {
  extraction: 'pending' | 'completed' | 'failed';
  translation: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  analysis: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
}

/** 操作类型 */
export type OperationType =
  | 'file_scan' // 文件扫描
  | 'prompt_extraction' // 提示词提取
  | 'translation' // 翻译
  | 'analysis' // 要素分析
  | 'report_generation'; // 报告生成

/** 日志状态 */
export type LogStatus =
  | 'pending' // 待处理
  | 'processing' // 处理中
  | 'completed' // 成功完成
  | 'failed' // 失败
  | 'cancelled' // 取消
  | 'skipped'; // 跳过

/** 报告类型 */
export type ReportType =
  | 'summary' // 汇总报告
  | 'comparison' // 对比分析
  | 'element_analysis' // 要素分析
  | 'trend_analysis'; // 趋势分析

/** 输出格式 */
export type OutputFormatType = 'html' | 'markdown' | 'csv' | 'json' | 'pdf';

/** 表格类型 */
export type TableType = 'element_comparison' | 'quality_comparison' | 'custom';

/** 列数据类型 */
export type ColumnType = 'text' | 'number' | 'boolean' | 'enum';

/** 洞察类型 */
export type InsightType = 'pattern' | 'anomaly' | 'trend' | 'recommendation';

// ============== 语言和编码 ==============

/** 支持的语言 */
export type Language = 'en' | 'zh' | 'mixed' | string;

/** 文件编码 */
export type FileEncoding = 'utf-8' | 'gbk' | 'ascii' | string;

// ============== 验证规则相关 ==============

/** 验证结果 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/** 验证错误 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

/** 验证警告 */
export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  value?: any;
}

// ============== 通用配置 ==============

/** 分页配置 */
export interface PaginationConfig {
  page: number;
  pageSize: number;
  total?: number;
}

/** 排序配置 */
export interface SortConfig {
  field: string;
  order: 'asc' | 'desc';
}

/** 过滤配置 */
export interface FilterConfig {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'like';
  value: any;
}

/** 查询配置 */
export interface QueryConfig {
  pagination?: PaginationConfig;
  sort?: SortConfig[];
  filters?: FilterConfig[];
}

// ============== 工具函数类型守卫 ==============

/** 检查是否为有效的UUID */
export function isValidUUID(value: string): value is UUID {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/** 检查是否为有效的置信度分数 */
export function isValidConfidenceScore(
  value: number
): value is ConfidenceScore {
  return typeof value === 'number' && value >= 0 && value <= 1;
}

/** 检查是否为有效的ISO时间戳 */
export function isValidTimestamp(value: string): value is Timestamp {
  return !isNaN(Date.parse(value));
}

/** 检查是否为有效的分数 */
export function isValidScore(value: number): value is Score {
  return typeof value === 'number' && value >= 0 && value <= 1;
}
