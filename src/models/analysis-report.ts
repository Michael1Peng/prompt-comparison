/**
 * 分析报告模型
 * 生成各种格式的分析报告和对比表格
 */

import {
  UUID,
  Timestamp,
  ReportType,
  OutputFormatType,
  TableType,
  ColumnType,
  InsightType,
  ConfidenceScore,
  ValidationResult,
} from './common.js';
import { AnalysisElements } from './prompt-analysis.js';

/**
 * 报告摘要接口
 */
export interface ReportSummary {
  /** 提示词总数 */
  total_prompts: number;
  /** 文件总数 */
  total_files: number;
  /** 分析覆盖率(0-1) */
  analysis_coverage: number;
  /** 平均复杂度 */
  average_complexity: number;

  // ============== 分布信息 ==============
  /** 语言分布 */
  language_distribution: Record<string, number>;
  /** 分类分布 */
  category_distribution: Record<string, number>;
  /** 文件类型分布 */
  file_type_distribution: Record<string, number>;
}

/**
 * 报告统计信息接口
 */
export interface ReportStatistics {
  // ============== 要素统计 ==============
  /** 要素覆盖率 */
  element_coverage: Record<keyof AnalysisElements, number>;
  /** 要素平均长度 */
  element_avg_length: Record<keyof AnalysisElements, number>;

  // ============== 质量统计 ==============
  quality_metrics: {
    /** 高质量提示词数量(>0.8) */
    high_quality_prompts: number;
    /** 中等质量提示词数量(0.5-0.8) */
    medium_quality_prompts: number;
    /** 低质量提示词数量(<0.5) */
    low_quality_prompts: number;
  };

  // ============== 复杂度统计 ==============
  complexity_distribution: {
    /** 简单(1-3分) */
    simple: number;
    /** 中等(4-6分) */
    moderate: number;
    /** 复杂(7-10分) */
    complex: number;
  };
}

/**
 * 表格单元格接口
 */
export interface TableCell {
  /** 单元格值 */
  value: any;
  /** 格式化后的显示值 */
  formatted_value?: string;
  /** 置信度 */
  confidence?: ConfidenceScore;
  /** 是否为空 */
  is_empty: boolean;
  /** 工具提示 */
  tooltip?: string;
}

/**
 * 表格行接口
 */
export interface TableRow {
  /** 行ID(通常是prompt_id) */
  row_id: string;
  /** 行标题(提示词名称) */
  row_title: string;
  /** 单元格数据 */
  cells: Record<string, TableCell>;
}

/**
 * 表格列接口
 */
export interface TableColumn {
  /** 列ID */
  column_id: string;
  /** 列标题 */
  column_title: string;
  /** 列数据类型 */
  column_type: ColumnType;
  /** 列宽(像素) */
  width?: number;
  /** 是否可排序 */
  sortable: boolean;
}

/**
 * 对比表格接口
 */
export interface ComparisonTable {
  /** 表格ID */
  table_id: string;
  /** 表格标题 */
  table_title: string;
  /** 表格类型 */
  table_type: TableType;

  // ============== 数据结构 ==============
  /** 表格行数据 */
  rows: TableRow[];
  /** 表格列定义 */
  columns: TableColumn[];

  // ============== 格式选项 ==============
  display_options: {
    /** 显示空单元格 */
    show_empty_cells: boolean;
    /** 高亮缺失要素 */
    highlight_missing: boolean;
    /** 排序字段 */
    sort_by?: string;
    /** 过滤条件 */
    filter_by?: any;
  };

  // ============== 生成信息 ==============
  /** 生成时间 */
  generated_timestamp: Timestamp;
  /** 输出格式 */
  format: 'html' | 'markdown' | 'csv';
}

/**
 * 报告洞察接口
 */
export interface ReportInsight {
  /** 洞察ID */
  insight_id: string;
  /** 洞察类型 */
  insight_type: InsightType;

  /** 标题 */
  title: string;
  /** 详细描述 */
  description: string;
  /** 置信度(0-1) */
  confidence_score: ConfidenceScore;

  // ============== 相关数据 ==============
  /** 相关的提示词ID */
  affected_prompts: string[];
  /** 支撑数据 */
  supporting_data: any;

  // ============== 建议行动 ==============
  /** 建议行动 */
  recommended_actions?: string[];
}

/**
 * 生成元数据接口
 */
export interface GenerationMetadata {
  /** 生成时间 */
  generated_timestamp: Timestamp;
  /** 生成耗时 */
  generation_duration_ms: number;
  /** 生成器版本 */
  generator_version: string;

  // ============== 配置信息 ==============
  /** 生成配置 */
  generation_config: any;
  /** 数据版本 */
  data_version: string;

  // ============== 统计信息 ==============
  /** 数据点总数 */
  total_data_points: number;
  /** 处理的提示词数量 */
  processed_prompts: number;
}

/**
 * 输出格式接口
 */
export interface OutputFormat {
  /** 格式类型 */
  format_type: OutputFormatType;
  /** 输出文件路径 */
  file_path: string;
  /** 文件大小 */
  file_size_bytes?: number;
  /** MIME类型 */
  mime_type: string;
  /** 是否为主要格式 */
  is_primary: boolean;
}

/**
 * 分析报告主接口
 */
export interface AnalysisReport {
  // ============== 标识字段 ==============
  /** 唯一标识符 */
  report_id: UUID;
  /** 报告名称 */
  report_name: string;
  /** 报告类型 */
  report_type: ReportType;

  // ============== 数据来源 ==============
  /** 源数据集合ID */
  source_collection_id: string;
  /** 包含的提示词ID列表 */
  included_prompt_ids: string[];

  // ============== 报告内容 ==============
  /** 摘要信息 */
  summary: ReportSummary;
  /** 统计数据 */
  statistics: ReportStatistics;
  /** 对比表格 */
  comparison_tables: ComparisonTable[];
  /** 洞察和建议 */
  insights: ReportInsight[];

  // ============== 生成信息 ==============
  /** 生成元数据 */
  generation_metadata: GenerationMetadata;

  // ============== 输出格式 ==============
  /** 可用的输出格式 */
  output_formats: OutputFormat[];
}

/**
 * 创建报告参数
 */
export interface CreateAnalysisReportParams {
  report_name: string;
  report_type: ReportType;
  source_collection_id: string;
  included_prompt_ids: string[];
  generation_config?: any;
}

/**
 * 更新报告参数
 */
export interface UpdateAnalysisReportParams {
  report_name?: string;
  summary?: Partial<ReportSummary>;
  statistics?: Partial<ReportStatistics>;
  comparison_tables?: ComparisonTable[];
  insights?: ReportInsight[];
  output_formats?: OutputFormat[];
}

/**
 * 报告查询条件
 */
export interface AnalysisReportQuery {
  report_ids?: UUID[];
  report_types?: ReportType[];
  report_names?: string[];
  source_collection_ids?: string[];

  // 内容过滤
  min_prompts?: number;
  max_prompts?: number;
  min_coverage?: number;
  max_coverage?: number;

  // 时间过滤
  generated_after?: Timestamp;
  generated_before?: Timestamp;

  // 输出格式过滤
  has_format?: OutputFormatType[];

  // 文本搜索
  name_contains?: string;
  description_contains?: string;
}

/**
 * 报告统计信息
 */
export interface AnalysisReportStatistics {
  total_reports: number;

  // 类型分布
  type_distribution: Record<ReportType, number>;

  // 格式分布
  format_distribution: Record<OutputFormatType, number>;

  // 质量统计
  quality_statistics: {
    average_coverage: number;
    average_prompts_per_report: number;
    average_generation_time_ms: number;
  };

  // 时间分布
  time_distribution: {
    reports_by_day: Record<string, number>;
    reports_by_week: Record<string, number>;
    reports_by_month: Record<string, number>;
  };
}

/**
 * MIME类型映射
 */
export const MIME_TYPE_MAPPING: Record<OutputFormatType, string> = {
  html: 'text/html',
  markdown: 'text/markdown',
  csv: 'text/csv',
  json: 'application/json',
  pdf: 'application/pdf',
};

/**
 * 默认显示选项
 */
export const DEFAULT_DISPLAY_OPTIONS = {
  show_empty_cells: true,
  highlight_missing: true,
  sort_by: undefined,
  filter_by: undefined,
};

/**
 * 验证分析报告
 */
export function validateAnalysisReport(
  report: Partial<AnalysisReport>
): ValidationResult {
  const errors: Array<{ field: string; message: string; code: string }> = [];
  const warnings: Array<{ field: string; message: string; code: string }> = [];

  // 必填字段验证
  if (!report.report_id) {
    errors.push({
      field: 'report_id',
      message: 'report_id is required',
      code: 'REQUIRED',
    });
  }

  if (!report.report_name) {
    errors.push({
      field: 'report_name',
      message: 'report_name is required',
      code: 'REQUIRED',
    });
  }

  if (!report.report_type) {
    errors.push({
      field: 'report_type',
      message: 'report_type is required',
      code: 'REQUIRED',
    });
  }

  if (!report.source_collection_id) {
    errors.push({
      field: 'source_collection_id',
      message: 'source_collection_id is required',
      code: 'REQUIRED',
    });
  }

  if (!report.included_prompt_ids || report.included_prompt_ids.length === 0) {
    errors.push({
      field: 'included_prompt_ids',
      message: 'at least one prompt_id is required',
      code: 'EMPTY_ARRAY',
    });
  }

  // 摘要验证
  if (report.summary) {
    if (report.summary.total_prompts < 0) {
      errors.push({
        field: 'summary.total_prompts',
        message: 'total_prompts cannot be negative',
        code: 'INVALID_RANGE',
      });
    }

    if (report.summary.total_files < 0) {
      errors.push({
        field: 'summary.total_files',
        message: 'total_files cannot be negative',
        code: 'INVALID_RANGE',
      });
    }

    if (
      report.summary.analysis_coverage < 0 ||
      report.summary.analysis_coverage > 1
    ) {
      errors.push({
        field: 'summary.analysis_coverage',
        message: 'analysis_coverage must be between 0 and 1',
        code: 'INVALID_RANGE',
      });
    }

    // 逻辑一致性检查
    if (
      report.included_prompt_ids &&
      report.summary.total_prompts !== report.included_prompt_ids.length
    ) {
      warnings.push({
        field: 'summary.total_prompts',
        message: 'total_prompts should match included_prompt_ids length',
        code: 'INCONSISTENT_COUNT',
      });
    }
  }

  // 表格验证
  if (report.comparison_tables) {
    for (let i = 0; i < report.comparison_tables.length; i++) {
      const table = report.comparison_tables[i];

      if (!table?.table_id) {
        errors.push({
          field: `comparison_tables[${i}].table_id`,
          message: 'table_id is required',
          code: 'REQUIRED',
        });
      }

      if (!table?.table_title) {
        errors.push({
          field: `comparison_tables[${i}].table_title`,
          message: 'table_title is required',
          code: 'REQUIRED',
        });
      }

      // 检查列和行的一致性
      if (table?.rows && table?.columns) {
        for (let j = 0; j < table.rows.length; j++) {
          const row = table.rows[j];
          if (row) {
            const missingColumns = table.columns.filter(
              col => !(col.column_id in row.cells)
            );

            if (missingColumns.length > 0) {
              warnings.push({
                field: `comparison_tables[${i}].rows[${j}].cells`,
                message: `Missing cells for columns: ${missingColumns.map(c => c.column_id).join(', ')}`,
                code: 'MISSING_CELLS',
              });
            }
          }
        }
      }
    }
  }

  // 洞察验证
  if (report.insights) {
    for (let i = 0; i < report.insights.length; i++) {
      const insight = report.insights[i];

      if (
        insight &&
        (insight.confidence_score < 0 || insight.confidence_score > 1)
      ) {
        errors.push({
          field: `insights[${i}].confidence_score`,
          message: 'confidence_score must be between 0 and 1',
          code: 'INVALID_RANGE',
        });
      }
    }
  }

  // 输出格式验证
  if (report.output_formats) {
    const primaryFormats = report.output_formats.filter(f => f.is_primary);
    if (primaryFormats.length === 0) {
      warnings.push({
        field: 'output_formats',
        message: 'at least one format should be marked as primary',
        code: 'NO_PRIMARY_FORMAT',
      });
    } else if (primaryFormats.length > 1) {
      warnings.push({
        field: 'output_formats',
        message: 'only one format should be marked as primary',
        code: 'MULTIPLE_PRIMARY_FORMATS',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 创建默认的报告摘要
 */
export function createDefaultReportSummary(promptIds: string[]): ReportSummary {
  return {
    total_prompts: promptIds.length,
    total_files: 0, // 需要从实际数据计算
    analysis_coverage: 0,
    average_complexity: 0,
    language_distribution: {},
    category_distribution: {},
    file_type_distribution: {},
  };
}

/**
 * 创建空的表格单元格
 */
export function createEmptyTableCell(): TableCell {
  return {
    value: '',
    formatted_value: '',
    is_empty: true,
  };
}

/**
 * 生成表格ID
 */
export function generateTableId(
  reportId: string,
  tableType: TableType
): string {
  const timestamp = Date.now();
  return `${reportId}_${tableType}_${timestamp}`;
}
