/**
 * 提示词分析模型
 * 存储15个框架要素的AI分析结果
 */

import {
  UUID,
  Timestamp,
  AnalysisStatus,
  ConfidenceScore,
  Score,
  ValidationResult,
} from './common.js';

/**
 * 15个分析要素接口
 * 使用中文键名以匹配业务需求
 */
export interface AnalysisElements {
  /** 文件路径信息 */
  所在文件: string;
  /** AI的身份和角色定义 */
  角色能力: string;
  /** 要完成的具体任务 */
  任务请求: string;
  /** 相关背景和使用场景 */
  背景情境: string;
  /** 具体的执行步骤和操作 */
  指令行动: string;
  /** 期望的输入数据格式 */
  输入格式: string;
  /** 期望的输出格式和结构 */
  输出规格: string;
  /** 输入输出示例 */
  示例: string;
  /** 限制条件和规则 */
  限制约束: string;
  /** 预期目标和成功标准 */
  目标期望: string;
  /** 需要的知识和参考信息 */
  信息: string;
  /** 质量评估和优化方向 */
  评估优化: string;
  /** 可配置的参数和选项 */
  调整: string;
  /** 目标用户和使用对象 */
  受众: string;
  /** 语言风格和表达方式 */
  风格要求: string;
}

/**
 * 分析元数据接口
 */
export interface AnalysisMetadata {
  // ============== 处理信息 ==============
  /** 分析状态 */
  analysis_status: AnalysisStatus;
  /** 分析完成时间 */
  analysis_timestamp?: Timestamp;
  /** 分析耗时(毫秒) */
  analysis_duration_ms?: number;

  // ============== AI模型信息 ==============
  /** 使用的AI模型 */
  analysis_model: string;
  /** API提供商(qwen, openai等) */
  api_provider: string;
  /** 模型版本 */
  model_version?: string;

  // ============== 重试信息 ==============
  /** 重试次数 */
  retry_count: number;
  /** 错误信息(如果失败) */
  error_message?: string;
}

/**
 * 质量指标接口
 */
export interface QualityMetrics {
  // ============== 整体质量 ==============
  /** 整体置信度(0-1) */
  overall_confidence: ConfidenceScore;
  /** 完整性评分(0-1) */
  completeness_score: Score;
  /** 一致性评分(0-1) */
  consistency_score?: Score;

  // ============== 要素级别质量 ==============
  /** 各要素的置信度 */
  element_confidence: {
    [K in keyof AnalysisElements]: ConfidenceScore;
  };

  // ============== 统计信息 ==============
  /** 找到内容的要素数量 */
  total_elements_found: number;
  /** 要素内容平均长度 */
  average_element_length: number;
  /** 分析结果总词数 */
  analysis_word_count: number;
}

/**
 * 提示词分析主接口
 */
export interface PromptAnalysis {
  // ============== 标识字段 ==============
  /** 唯一标识符 */
  analysis_id: UUID;
  /** 关联的提示词ID */
  prompt_id: UUID;

  // ============== 15个分析要素 ==============
  /** 要素分析结果 */
  elements: AnalysisElements;

  // ============== 分析元信息 ==============
  /** 分析过程信息 */
  analysis_metadata: AnalysisMetadata;

  // ============== 质量指标 ==============
  /** 分析质量评估 */
  quality_metrics: QualityMetrics;
}

/**
 * 创建分析参数
 */
export interface CreateAnalysisParams {
  prompt_id: UUID;
  elements: AnalysisElements;
  analysis_model: string;
  api_provider: string;
  model_version?: string;
  analysis_duration_ms?: number;
}

/**
 * 更新分析参数
 */
export interface UpdateAnalysisParams {
  elements?: Partial<AnalysisElements>;
  analysis_metadata?: Partial<AnalysisMetadata>;
  quality_metrics?: Partial<QualityMetrics>;
}

/**
 * 分析查询条件
 */
export interface PromptAnalysisQuery {
  analysis_ids?: UUID[];
  prompt_ids?: UUID[];
  analysis_status?: AnalysisStatus[];
  api_providers?: string[];
  analysis_models?: string[];

  // 质量过滤
  min_overall_confidence?: ConfidenceScore;
  max_overall_confidence?: ConfidenceScore;
  min_completeness_score?: Score;
  max_completeness_score?: Score;
  min_elements_found?: number;
  max_elements_found?: number;

  // 时间过滤
  analyzed_after?: Timestamp;
  analyzed_before?: Timestamp;

  // 要素内容搜索
  element_content_contains?: string;
  specific_element_has_content?: keyof AnalysisElements;
}

/**
 * 分析统计信息
 */
export interface PromptAnalysisStatistics {
  total_analyses: number;

  // 状态分布
  status_distribution: Record<AnalysisStatus, number>;

  // 模型使用分布
  model_distribution: Record<string, number>;
  api_provider_distribution: Record<string, number>;

  // 质量统计
  quality_statistics: {
    average_overall_confidence: ConfidenceScore;
    average_completeness_score: Score;
    average_elements_found: number;
    high_confidence_analyses: number; // overall_confidence > 0.8
    medium_confidence_analyses: number; // 0.5 <= overall_confidence <= 0.8
    low_confidence_analyses: number; // overall_confidence < 0.5
  };

  // 要素覆盖率统计
  element_coverage: {
    [K in keyof AnalysisElements]: {
      total_with_content: number;
      coverage_percentage: number;
      average_length: number;
      average_confidence: ConfidenceScore;
    };
  };

  // 性能统计
  performance_statistics: {
    average_analysis_duration_ms: number;
    min_analysis_duration_ms: number;
    max_analysis_duration_ms: number;
    average_retry_count: number;
    success_rate: number;
  };
}

/**
 * 要素名称的英文映射
 * 用于国际化和API接口
 */
export const ELEMENT_NAME_MAPPING: Record<keyof AnalysisElements, string> = {
  所在文件: 'file_location',
  角色能力: 'role_capability',
  任务请求: 'task_request',
  背景情境: 'background_context',
  指令行动: 'instruction_action',
  输入格式: 'input_format',
  输出规格: 'output_specification',
  示例: 'examples',
  限制约束: 'constraints',
  目标期望: 'goals_expectations',
  信息: 'information',
  评估优化: 'evaluation_optimization',
  调整: 'adjustments',
  受众: 'audience',
  风格要求: 'style_requirements',
};

/**
 * 要素名称列表
 */
export const ANALYSIS_ELEMENT_NAMES = Object.keys(
  ELEMENT_NAME_MAPPING
) as Array<keyof AnalysisElements>;

/**
 * 验证提示词分析
 */
export function validatePromptAnalysis(
  analysis: Partial<PromptAnalysis>
): ValidationResult {
  const errors: Array<{ field: string; message: string; code: string }> = [];
  const warnings: Array<{ field: string; message: string; code: string }> = [];

  // 必填字段验证
  if (!analysis.analysis_id) {
    errors.push({
      field: 'analysis_id',
      message: 'analysis_id is required',
      code: 'REQUIRED',
    });
  }

  if (!analysis.prompt_id) {
    errors.push({
      field: 'prompt_id',
      message: 'prompt_id is required',
      code: 'REQUIRED',
    });
  }

  // 要素验证
  if (!analysis.elements) {
    errors.push({
      field: 'elements',
      message: 'elements is required',
      code: 'REQUIRED',
    });
  } else {
    // 检查所有15个要素是否都存在
    for (const elementName of ANALYSIS_ELEMENT_NAMES) {
      if (!(elementName in analysis.elements)) {
        errors.push({
          field: `elements.${elementName}`,
          message: `Element ${elementName} is missing`,
          code: 'MISSING_ELEMENT',
        });
      }
    }
  }

  // 质量指标验证
  if (analysis.quality_metrics) {
    if (
      analysis.quality_metrics.overall_confidence !== undefined &&
      (analysis.quality_metrics.overall_confidence < 0 ||
        analysis.quality_metrics.overall_confidence > 1)
    ) {
      errors.push({
        field: 'quality_metrics.overall_confidence',
        message: 'overall_confidence must be between 0 and 1',
        code: 'INVALID_RANGE',
      });
    }

    if (
      analysis.quality_metrics.completeness_score !== undefined &&
      (analysis.quality_metrics.completeness_score < 0 ||
        analysis.quality_metrics.completeness_score > 1)
    ) {
      errors.push({
        field: 'quality_metrics.completeness_score',
        message: 'completeness_score must be between 0 and 1',
        code: 'INVALID_RANGE',
      });
    }

    if (
      analysis.quality_metrics.total_elements_found !== undefined &&
      (analysis.quality_metrics.total_elements_found < 0 ||
        analysis.quality_metrics.total_elements_found > 15)
    ) {
      errors.push({
        field: 'quality_metrics.total_elements_found',
        message: 'total_elements_found must be between 0 and 15',
        code: 'INVALID_RANGE',
      });
    }

    // 验证要素级别置信度
    if (analysis.quality_metrics.element_confidence) {
      for (const [elementName, confidence] of Object.entries(
        analysis.quality_metrics.element_confidence
      )) {
        if (confidence < 0 || confidence > 1) {
          errors.push({
            field: `quality_metrics.element_confidence.${elementName}`,
            message: 'Element confidence must be between 0 and 1',
            code: 'INVALID_RANGE',
          });
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 创建默认的分析要素
 */
export function createDefaultAnalysisElements(): AnalysisElements {
  const elements: AnalysisElements = {} as AnalysisElements;

  for (const elementName of ANALYSIS_ELEMENT_NAMES) {
    elements[elementName] = '';
  }

  return elements;
}

/**
 * 计算要素覆盖率
 */
export function calculateElementCoverage(elements: AnalysisElements): number {
  const totalElements = ANALYSIS_ELEMENT_NAMES.length;
  const filledElements = ANALYSIS_ELEMENT_NAMES.filter(
    name => elements[name] && elements[name].trim().length > 0
  ).length;

  return filledElements / totalElements;
}

/**
 * 生成默认的质量指标
 */
export function generateDefaultQualityMetrics(
  elements: AnalysisElements
): QualityMetrics {
  const elementConfidence: QualityMetrics['element_confidence'] =
    {} as QualityMetrics['element_confidence'];

  // 为每个要素设置默认置信度
  for (const elementName of ANALYSIS_ELEMENT_NAMES) {
    const hasContent =
      elements[elementName] && elements[elementName].trim().length > 0;
    elementConfidence[elementName] = hasContent ? 0.8 : 0.0;
  }

  const totalElementsFound = ANALYSIS_ELEMENT_NAMES.filter(
    name => elements[name] && elements[name].trim().length > 0
  ).length;

  const totalWordCount = ANALYSIS_ELEMENT_NAMES.reduce(
    (total, name) =>
      total + (elements[name] ? elements[name].split(/\s+/).length : 0),
    0
  );

  const averageElementLength =
    totalElementsFound > 0 ? totalWordCount / totalElementsFound : 0;

  return {
    overall_confidence: totalElementsFound / ANALYSIS_ELEMENT_NAMES.length,
    completeness_score: calculateElementCoverage(elements),
    element_confidence: elementConfidence,
    total_elements_found: totalElementsFound,
    average_element_length: averageElementLength,
    analysis_word_count: totalWordCount,
  };
}
