/**
 * 处理日志模型
 * 记录所有处理操作的详细日志，用于调试和监控
 */

import {
  UUID,
  Timestamp,
  OperationType,
  LogStatus,
  ValidationResult,
} from './common.js';

/**
 * 错误信息接口
 */
export interface ErrorInfo {
  /** 错误代码 */
  error_code: string;
  /** 错误消息 */
  error_message: string;
  /** 详细错误信息 */
  error_details?: any;
  /** 堆栈跟踪 */
  stack_trace?: string;
  /** 重试次数 */
  retry_count: number;
  /** 是否可恢复 */
  is_recoverable: boolean;
}

/**
 * 性能指标接口
 */
export interface PerformanceMetrics {
  // ============== 处理统计 ==============
  /** 处理的项目数 */
  items_processed: number;
  /** 成功的项目数 */
  items_succeeded: number;
  /** 失败的项目数 */
  items_failed: number;

  // ============== 性能指标 ==============
  /** 处理速度(项/秒) */
  throughput_per_second?: number;
  /** 内存使用(MB) */
  memory_usage_mb?: number;
  /** API调用次数 */
  api_calls_count?: number;

  // ============== 网络指标 ==============
  /** 网络延迟(毫秒) */
  network_latency_ms?: number;
  /** 传输数据量(字节) */
  data_transferred_bytes?: number;
}

/**
 * 日志上下文接口
 */
export interface LogContext {
  // ============== 系统信息 ==============
  /** CLI工具版本 */
  cli_version: string;
  /** Node.js版本 */
  node_version: string;
  /** 操作系统平台 */
  platform: string;

  // ============== 配置信息 ==============
  /** 使用的配置 */
  config_used: any;
  /** API提供商 */
  api_provider: string;

  // ============== 用户信息 ==============
  /** 用户标识(如果有) */
  user_id?: string;
  /** 工作目录 */
  working_directory: string;

  // ============== 批处理信息 ==============
  /** 批处理ID */
  batch_id?: string;
  /** 批大小 */
  batch_size?: number;
  /** 在批中的索引 */
  batch_index?: number;
}

/**
 * 处理日志主接口
 */
export interface ProcessingLog {
  // ============== 标识字段 ==============
  /** 唯一标识符 */
  log_id: UUID;
  /** 处理会话ID */
  session_id: string;

  // ============== 操作信息 ==============
  /** 操作类型 */
  operation_type: OperationType;
  /** 目标对象ID(file_id或prompt_id) */
  target_id: string;
  /** 目标对象类型 */
  target_type: 'file' | 'prompt';

  // ============== 时间信息 ==============
  /** 开始时间 */
  start_timestamp: Timestamp;
  /** 结束时间 */
  end_timestamp?: Timestamp;
  /** 持续时间(毫秒) */
  duration_ms?: number;

  // ============== 状态信息 ==============
  /** 处理状态 */
  status: LogStatus;
  /** 进度(0-1) */
  progress: number;

  // ============== 结果信息 ==============
  /** 处理结果数据 */
  result_data?: any;
  /** 错误信息 */
  error_info?: ErrorInfo;

  // ============== 性能指标 ==============
  /** 性能指标 */
  metrics?: PerformanceMetrics;

  // ============== 上下文信息 ==============
  /** 执行上下文 */
  context: LogContext;
}

/**
 * 创建日志参数
 */
export interface CreateProcessingLogParams {
  session_id: string;
  operation_type: OperationType;
  target_id: string;
  target_type: 'file' | 'prompt';
  context: LogContext;
  initial_progress?: number;
}

/**
 * 更新日志参数
 */
export interface UpdateProcessingLogParams {
  status?: LogStatus;
  progress?: number;
  end_timestamp?: Timestamp;
  duration_ms?: number;
  result_data?: any;
  error_info?: ErrorInfo;
  metrics?: PerformanceMetrics;
}

/**
 * 日志查询条件
 */
export interface ProcessingLogQuery {
  log_ids?: UUID[];
  session_ids?: string[];
  operation_types?: OperationType[];
  target_ids?: string[];
  target_types?: Array<'file' | 'prompt'>;
  statuses?: LogStatus[];

  // 时间范围过滤
  started_after?: Timestamp;
  started_before?: Timestamp;
  ended_after?: Timestamp;
  ended_before?: Timestamp;

  // 性能过滤
  min_duration_ms?: number;
  max_duration_ms?: number;
  min_progress?: number;
  max_progress?: number;

  // 上下文过滤
  cli_versions?: string[];
  api_providers?: string[];
  platforms?: string[];
  batch_ids?: string[];

  // 错误过滤
  has_errors?: boolean;
  error_codes?: string[];
  is_recoverable?: boolean;
}

/**
 * 日志统计信息
 */
export interface ProcessingLogStatistics {
  total_logs: number;

  // 状态分布
  status_distribution: Record<LogStatus, number>;

  // 操作类型分布
  operation_type_distribution: Record<OperationType, number>;

  // 目标类型分布
  target_type_distribution: Record<'file' | 'prompt', number>;

  // 性能统计
  performance_statistics: {
    average_duration_ms: number;
    min_duration_ms: number;
    max_duration_ms: number;
    total_items_processed: number;
    total_items_succeeded: number;
    total_items_failed: number;
    overall_success_rate: number;
  };

  // 错误统计
  error_statistics: {
    total_errors: number;
    recoverable_errors: number;
    non_recoverable_errors: number;
    error_code_distribution: Record<string, number>;
    average_retry_count: number;
  };

  // 时间分布统计
  time_distribution: {
    logs_by_hour: Record<string, number>; // "YYYY-MM-DD:HH" -> count
    logs_by_day: Record<string, number>; // "YYYY-MM-DD" -> count
    logs_by_week: Record<string, number>; // "YYYY-WW" -> count
  };

  // 系统统计
  system_statistics: {
    cli_version_distribution: Record<string, number>;
    platform_distribution: Record<string, number>;
    api_provider_distribution: Record<string, number>;
  };
}

/**
 * 批处理日志摘要
 */
export interface BatchLogSummary {
  batch_id: string;
  session_id: string;
  operation_type: OperationType;

  // 时间信息
  batch_start_time: Timestamp;
  batch_end_time?: Timestamp;
  total_duration_ms?: number;

  // 统计信息
  total_items: number;
  completed_items: number;
  failed_items: number;
  cancelled_items: number;
  success_rate: number;

  // 性能信息
  average_item_duration_ms: number;
  throughput_per_second: number;

  // 错误信息
  error_count: number;
  most_common_errors: Array<{
    error_code: string;
    count: number;
    sample_message: string;
  }>;

  // 相关日志
  log_ids: UUID[];
}

/**
 * 验证处理日志
 */
export function validateProcessingLog(
  log: Partial<ProcessingLog>
): ValidationResult {
  const errors: Array<{ field: string; message: string; code: string }> = [];
  const warnings: Array<{ field: string; message: string; code: string }> = [];

  // 必填字段验证
  if (!log.log_id) {
    errors.push({
      field: 'log_id',
      message: 'log_id is required',
      code: 'REQUIRED',
    });
  }

  if (!log.session_id) {
    errors.push({
      field: 'session_id',
      message: 'session_id is required',
      code: 'REQUIRED',
    });
  }

  if (!log.operation_type) {
    errors.push({
      field: 'operation_type',
      message: 'operation_type is required',
      code: 'REQUIRED',
    });
  }

  if (!log.target_id) {
    errors.push({
      field: 'target_id',
      message: 'target_id is required',
      code: 'REQUIRED',
    });
  }

  if (!log.target_type) {
    errors.push({
      field: 'target_type',
      message: 'target_type is required',
      code: 'REQUIRED',
    });
  }

  if (!log.start_timestamp) {
    errors.push({
      field: 'start_timestamp',
      message: 'start_timestamp is required',
      code: 'REQUIRED',
    });
  }

  // 进度验证
  if (log.progress !== undefined && (log.progress < 0 || log.progress > 1)) {
    errors.push({
      field: 'progress',
      message: 'progress must be between 0 and 1',
      code: 'INVALID_RANGE',
    });
  }

  // 时间逻辑验证
  if (log.start_timestamp && log.end_timestamp) {
    const startDate = new Date(log.start_timestamp);
    const endDate = new Date(log.end_timestamp);

    if (endDate < startDate) {
      errors.push({
        field: 'end_timestamp',
        message: 'end_timestamp cannot be earlier than start_timestamp',
        code: 'INVALID_TIMESTAMP',
      });
    }

    // 验证持续时间一致性
    if (log.duration_ms !== undefined) {
      const calculatedDuration = endDate.getTime() - startDate.getTime();
      const tolerance = 1000; // 1秒容差

      if (Math.abs(calculatedDuration - log.duration_ms) > tolerance) {
        warnings.push({
          field: 'duration_ms',
          message: 'duration_ms does not match calculated duration',
          code: 'INCONSISTENT_DURATION',
        });
      }
    }
  }

  // 状态逻辑验证
  if (log.status === 'completed' && log.progress !== 1) {
    warnings.push({
      field: 'progress',
      message: 'progress should be 1.0 when status is completed',
      code: 'INCONSISTENT_PROGRESS',
    });
  }

  if (log.status === 'failed' && !log.error_info) {
    warnings.push({
      field: 'error_info',
      message: 'error_info should be provided when status is failed',
      code: 'MISSING_ERROR_INFO',
    });
  }

  // 性能指标验证
  if (log.metrics) {
    if (log.metrics.items_processed < 0) {
      errors.push({
        field: 'metrics.items_processed',
        message: 'items_processed cannot be negative',
        code: 'INVALID_RANGE',
      });
    }

    if (log.metrics.items_succeeded < 0) {
      errors.push({
        field: 'metrics.items_succeeded',
        message: 'items_succeeded cannot be negative',
        code: 'INVALID_RANGE',
      });
    }

    if (log.metrics.items_failed < 0) {
      errors.push({
        field: 'metrics.items_failed',
        message: 'items_failed cannot be negative',
        code: 'INVALID_RANGE',
      });
    }

    if (
      log.metrics.items_succeeded + log.metrics.items_failed >
      log.metrics.items_processed
    ) {
      errors.push({
        field: 'metrics',
        message: 'succeeded + failed cannot exceed total processed',
        code: 'INCONSISTENT_METRICS',
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
 * 生成会话ID
 */
export function generateSessionId(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '');
  const random = Math.random().toString(36).substring(2, 8);
  return `session_${timestamp}_${random}`;
}

/**
 * 计算持续时间
 */
export function calculateDuration(
  startTime: Timestamp,
  endTime?: Timestamp
): number | undefined {
  if (!endTime) return undefined;

  const start = new Date(startTime);
  const end = new Date(endTime);

  return end.getTime() - start.getTime();
}

/**
 * 创建默认的上下文信息
 */
export function createDefaultLogContext(workingDirectory: string): LogContext {
  return {
    cli_version: '1.0.0', // 从package.json获取
    node_version: process.version,
    platform: process.platform,
    config_used: {},
    api_provider: 'qwen',
    working_directory: workingDirectory,
  };
}
