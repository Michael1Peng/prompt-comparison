/**
 * 提示词内容模型
 * 存储从文件中提取的具体提示词内容及其位置信息
 */

import {
  UUID,
  Timestamp,
  FilePath,
  Language,
  ProcessingStatus,
  TranslationStatus,
  ConfidenceScore,
  Score,
  ValidationResult,
} from './common.js';

/**
 * 来源信息接口
 */
export interface SourceInfo {
  /** 关联的文件ID */
  file_id: UUID;
  /** 文件路径(冗余，便于查询) */
  file_path: FilePath;

  // ============== 位置信息 ==============
  /** 起始行号(从1开始) */
  start_line: number;
  /** 结束行号 */
  end_line: number;
  /** 起始列号(可选) */
  start_column?: number;
  /** 结束列号(可选) */
  end_column?: number;

  // ============== 上下文信息 ==============
  /** 前置上下文(5行) */
  context_before?: string;
  /** 后置上下文(5行) */
  context_after?: string;

  // ============== 提取元信息 ==============
  /** 提取方法(ai_analysis, regex_match等) */
  extraction_method: string;
  /** 提取置信度(0-1) */
  extraction_confidence: ConfidenceScore;
  /** 提取时间(ISO 8601) */
  extraction_timestamp: Timestamp;
}

/**
 * 翻译信息接口
 */
export interface Translation {
  /** 翻译后的完整内容 */
  translated_prompt?: string;
  /** 翻译后的描述 */
  translated_description?: string;

  // ============== 翻译元信息 ==============
  /** 翻译状态 */
  translation_status: TranslationStatus;
  /** 翻译完成时间 */
  translation_timestamp?: Timestamp;
  /** 使用的翻译模型 */
  translation_model?: string;
  /** 翻译质量置信度(0-1) */
  translation_confidence?: ConfidenceScore;
  /** 翻译错误信息 */
  error_message?: string;
}

/**
 * 提示词元数据接口
 */
export interface PromptMetadata {
  // ============== 内容特征 ==============
  /** 字符数 */
  character_count: number;
  /** 单词数 */
  word_count: number;
  /** 主要语言(en, zh, mixed) */
  language: Language;

  // ============== 分类信息 ==============
  /** 分类(code-review, creative-writing等) */
  category?: string;
  /** 标签数组 */
  tags: string[];
  /** 复杂度评分(1-10) */
  complexity_score?: number;

  // ============== 质量指标 ==============
  /** 完整性评分(0-1) */
  completeness_score?: Score;
  /** 清晰度评分(0-1) */
  clarity_score?: Score;
}

/**
 * 提示词内容主接口
 */
export interface PromptContent {
  // ============== 标识字段 ==============
  /** 唯一标识符 (UUID) */
  prompt_id: UUID;
  /** 提示词名称(用户友好) */
  name: string;
  /** 提示词描述 */
  description?: string;

  // ============== 内容字段 ==============
  /** 原始提示词完整内容 */
  original_prompt: string;
  /** 内容预览(前200字符) */
  content_preview: string;

  // ============== 来源信息 ==============
  /** 来源文件和位置信息 */
  source_info: SourceInfo;

  // ============== 翻译信息(可选) ==============
  /** 中文翻译结果 */
  translation?: Translation;

  // ============== 分析结果(可选) ==============
  /** 15要素分析结果 */
  analysis?: any; // 实际类型在 prompt-analysis.ts 中定义

  // ============== 元数据 ==============
  /** 提示词元数据 */
  metadata: PromptMetadata;

  // ============== 处理状态 ==============
  /** 当前处理状态 */
  processing_status: ProcessingStatus;
  /** 创建时间(ISO 8601) */
  created_timestamp: Timestamp;
  /** 最后更新时间(ISO 8601) */
  updated_timestamp: Timestamp;
}

// PromptAnalysis类型定义在 prompt-analysis.ts 中，避免循环依赖

/**
 * 创建提示词内容参数
 */
export interface CreatePromptContentParams {
  name: string;
  description?: string;
  original_prompt: string;
  source_info: Omit<SourceInfo, 'extraction_timestamp'>;
  metadata?: Partial<PromptMetadata>;
}

/**
 * 更新提示词内容参数
 */
export interface UpdatePromptContentParams {
  name?: string;
  description?: string;
  translation?: Translation;
  processing_status?: Partial<ProcessingStatus>;
  metadata?: Partial<PromptMetadata>;
}

/**
 * 提示词内容查询条件
 */
export interface PromptContentQuery {
  prompt_ids?: UUID[];
  file_ids?: UUID[];
  names?: string[];
  languages?: Language[];
  categories?: string[];
  tags?: string[];

  // 处理状态过滤
  extraction_status?: ProcessingStatus['extraction'][];
  translation_status?: ProcessingStatus['translation'][];
  analysis_status?: ProcessingStatus['analysis'][];

  // 质量分数过滤
  min_completeness_score?: Score;
  max_completeness_score?: Score;
  min_clarity_score?: Score;
  max_clarity_score?: Score;
  min_complexity_score?: number;
  max_complexity_score?: number;

  // 内容过滤
  min_character_count?: number;
  max_character_count?: number;
  min_word_count?: number;
  max_word_count?: number;

  // 时间过滤
  created_after?: Timestamp;
  created_before?: Timestamp;
  updated_after?: Timestamp;
  updated_before?: Timestamp;

  // 文本搜索
  content_contains?: string;
  name_contains?: string;
  description_contains?: string;
}

/**
 * 提示词内容统计信息
 */
export interface PromptContentStatistics {
  total_prompts: number;

  // 处理状态分布
  extraction_status_distribution: Record<
    ProcessingStatus['extraction'],
    number
  >;
  translation_status_distribution: Record<
    ProcessingStatus['translation'],
    number
  >;
  analysis_status_distribution: Record<ProcessingStatus['analysis'], number>;

  // 语言分布
  language_distribution: Record<Language, number>;

  // 分类分布
  category_distribution: Record<string, number>;

  // 质量统计
  quality_statistics: {
    average_completeness_score: Score;
    average_clarity_score: Score;
    average_complexity_score: number;
    high_quality_prompts: number; // completeness_score > 0.8
    medium_quality_prompts: number; // 0.5 <= completeness_score <= 0.8
    low_quality_prompts: number; // completeness_score < 0.5
  };

  // 内容统计
  content_statistics: {
    total_characters: number;
    average_characters: number;
    min_characters: number;
    max_characters: number;
    total_words: number;
    average_words: number;
    min_words: number;
    max_words: number;
  };
}

/**
 * 验证提示词内容
 */
export function validatePromptContent(
  content: Partial<PromptContent>
): ValidationResult {
  const errors: Array<{ field: string; message: string; code: string }> = [];
  const warnings: Array<{ field: string; message: string; code: string }> = [];

  // 必填字段验证
  if (!content.prompt_id) {
    errors.push({
      field: 'prompt_id',
      message: 'prompt_id is required',
      code: 'REQUIRED',
    });
  }

  if (!content.name) {
    errors.push({
      field: 'name',
      message: 'name is required',
      code: 'REQUIRED',
    });
  } else if (content.name.length < 1 || content.name.length > 200) {
    errors.push({
      field: 'name',
      message: 'name must be 1-200 characters',
      code: 'INVALID_LENGTH',
    });
  }

  if (!content.original_prompt) {
    errors.push({
      field: 'original_prompt',
      message: 'original_prompt is required',
      code: 'REQUIRED',
    });
  } else if (content.original_prompt.trim().length === 0) {
    errors.push({
      field: 'original_prompt',
      message: 'original_prompt cannot be empty',
      code: 'EMPTY_CONTENT',
    });
  }

  // 来源信息验证
  if (!content.source_info) {
    errors.push({
      field: 'source_info',
      message: 'source_info is required',
      code: 'REQUIRED',
    });
  } else {
    if (!content.source_info.file_id) {
      errors.push({
        field: 'source_info.file_id',
        message: 'source_info.file_id is required',
        code: 'REQUIRED',
      });
    }

    if (
      !content.source_info.start_line ||
      content.source_info.start_line <= 0
    ) {
      errors.push({
        field: 'source_info.start_line',
        message: 'start_line must be positive integer',
        code: 'INVALID_RANGE',
      });
    }

    if (!content.source_info.end_line || content.source_info.end_line <= 0) {
      errors.push({
        field: 'source_info.end_line',
        message: 'end_line must be positive integer',
        code: 'INVALID_RANGE',
      });
    }

    if (
      content.source_info.start_line &&
      content.source_info.end_line &&
      content.source_info.end_line < content.source_info.start_line
    ) {
      errors.push({
        field: 'source_info.end_line',
        message: 'end_line must be >= start_line',
        code: 'INVALID_RANGE',
      });
    }

    if (
      content.source_info.extraction_confidence !== undefined &&
      (content.source_info.extraction_confidence < 0 ||
        content.source_info.extraction_confidence > 1)
    ) {
      errors.push({
        field: 'source_info.extraction_confidence',
        message: 'extraction_confidence must be between 0 and 1',
        code: 'INVALID_RANGE',
      });
    }
  }

  // 元数据验证
  if (content.metadata) {
    if (
      content.metadata.character_count !== undefined &&
      content.metadata.character_count < 0
    ) {
      errors.push({
        field: 'metadata.character_count',
        message: 'character_count must be non-negative',
        code: 'INVALID_RANGE',
      });
    }

    if (
      content.metadata.word_count !== undefined &&
      content.metadata.word_count < 0
    ) {
      errors.push({
        field: 'metadata.word_count',
        message: 'word_count must be non-negative',
        code: 'INVALID_RANGE',
      });
    }

    if (
      content.metadata.complexity_score !== undefined &&
      (content.metadata.complexity_score < 1 ||
        content.metadata.complexity_score > 10)
    ) {
      errors.push({
        field: 'metadata.complexity_score',
        message: 'complexity_score must be between 1 and 10',
        code: 'INVALID_RANGE',
      });
    }

    if (
      content.metadata.completeness_score !== undefined &&
      (content.metadata.completeness_score < 0 ||
        content.metadata.completeness_score > 1)
    ) {
      errors.push({
        field: 'metadata.completeness_score',
        message: 'completeness_score must be between 0 and 1',
        code: 'INVALID_RANGE',
      });
    }

    if (
      content.metadata.clarity_score !== undefined &&
      (content.metadata.clarity_score < 0 || content.metadata.clarity_score > 1)
    ) {
      errors.push({
        field: 'metadata.clarity_score',
        message: 'clarity_score must be between 0 and 1',
        code: 'INVALID_RANGE',
      });
    }
  }

  // 时间戳验证
  if (content.created_timestamp && content.updated_timestamp) {
    const createdDate = new Date(content.created_timestamp);
    const updatedDate = new Date(content.updated_timestamp);

    if (updatedDate < createdDate) {
      errors.push({
        field: 'updated_timestamp',
        message: 'updated_timestamp cannot be earlier than created_timestamp',
        code: 'INVALID_TIMESTAMP',
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
 * 创建默认的提示词元数据
 */
export function createDefaultPromptMetadata(
  original_prompt: string
): PromptMetadata {
  return {
    character_count: original_prompt.length,
    word_count: original_prompt.split(/\s+/).length,
    language: 'mixed', // 需要通过语言检测确定
    tags: [],
  };
}

/**
 * 生成内容预览
 */
export function generateContentPreview(
  original_prompt: string,
  maxLength = 200
): string {
  if (original_prompt.length <= maxLength) {
    return original_prompt;
  }

  return original_prompt.substring(0, maxLength) + '...';
}
