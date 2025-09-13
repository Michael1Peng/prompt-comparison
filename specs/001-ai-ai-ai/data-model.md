# Data Model: AI 提示词分析工作流

**版本**: 1.0.0  
**创建日期**: 2025-09-13  
**状态**: Phase 1 设计

## 数据模型概述

基于功能需求分析，系统需要管理以下核心实体的数据：文件元数据、提示词内容、分析要素、处理日志和分析报告。采用模块化设计，每个实体有独立的数据结构和关系定义。

## 核心实体关系图

```
FileMetadata 1:N → PromptContent
PromptContent 1:1 → PromptAnalysis  
PromptContent 1:N → ProcessingLog
AnalysisReport N:N → PromptContent
```

## 1. 文件元数据 (FileMetadata)

### 用途
记录仓库中所有扫描文件的基本信息和处理状态。

### 数据结构
```typescript
interface FileMetadata {
  // 标识字段
  file_id: string;                    // 唯一标识符 (UUID)
  absolute_path: string;              // 绝对文件路径
  relative_path: string;              // 相对于仓库根目录的路径
  file_name: string;                  // 文件名(含扩展名)
  
  // 文件属性
  file_extension: string;             // 文件扩展名(.js, .md等)
  file_size_bytes: number;            // 文件大小(字节)
  encoding: string;                   // 文件编码(utf-8, gbk等)
  line_count: number;                 // 文件行数
  
  // 时间戳
  created_time: string;               // 文件创建时间(ISO 8601)
  modified_time: string;              // 文件修改时间(ISO 8601)
  scanned_time?: string;              // 扫描时间(ISO 8601)
  
  // 内容特征
  file_hash: string;                  // 文件内容MD5哈希
  content_preview?: string;           // 文件前500字符预览
  
  // 处理状态
  has_prompts: boolean;               // 是否包含提示词
  prompt_count: number;               // 包含的提示词数量
  scan_status: 'pending'|'scanned'|'error'|'skipped';
  error_message?: string;             // 错误信息(如果有)
  
  // 统计信息
  character_count?: number;           // 字符数
  word_count?: number;               // 单词数
  detected_language?: string;         // 检测到的主要语言
}
```

### 验证规则
- `file_id`: 必填，符合UUID格式
- `absolute_path`: 必填，有效的文件系统路径
- `file_size_bytes`: 非负整数
- `line_count`: 正整数
- `prompt_count`: 非负整数，当`has_prompts=true`时应大于0

### 索引策略
- 主键: `file_id`
- 搜索索引: `file_name`, `file_extension`, `relative_path`
- 过滤索引: `has_prompts`, `scan_status`

## 2. 提示词内容 (PromptContent)

### 用途
存储从文件中提取的具体提示词内容及其位置信息。

### 数据结构
```typescript
interface PromptContent {
  // 标识字段
  prompt_id: string;                  // 唯一标识符 (UUID)
  name: string;                       // 提示词名称(用户友好)
  description?: string;               // 提示词描述
  
  // 内容字段
  original_prompt: string;            // 原始提示词完整内容
  content_preview: string;            // 内容预览(前200字符)
  
  // 来源信息
  source_info: SourceInfo;            // 来源文件和位置信息
  
  // 翻译信息(可选)
  translation?: Translation;          // 中文翻译结果
  
  // 分析结果(可选)
  analysis?: PromptAnalysis;          // 15要素分析结果
  
  // 元数据
  metadata: PromptMetadata;           // 提示词元数据
  
  // 处理状态
  processing_status: ProcessingStatus; // 当前处理状态
  created_timestamp: string;          // 创建时间(ISO 8601)
  updated_timestamp: string;          // 最后更新时间(ISO 8601)
}

interface SourceInfo {
  file_id: string;                    // 关联的文件ID
  file_path: string;                  // 文件路径(冗余，便于查询)
  
  // 位置信息
  start_line: number;                 // 起始行号(从1开始)
  end_line: number;                   // 结束行号
  start_column?: number;              // 起始列号(可选)
  end_column?: number;                // 结束列号(可选)
  
  // 上下文信息
  context_before?: string;            // 前置上下文(5行)
  context_after?: string;             // 后置上下文(5行)
  
  // 提取元信息
  extraction_method: string;          // 提取方法(ai_analysis, regex_match等)
  extraction_confidence: number;      // 提取置信度(0-1)
  extraction_timestamp: string;       // 提取时间(ISO 8601)
}

interface Translation {
  translated_prompt?: string;         // 翻译后的完整内容
  translated_description?: string;    // 翻译后的描述
  
  // 翻译元信息
  translation_status: 'pending'|'processing'|'completed'|'failed';
  translation_timestamp?: string;     // 翻译完成时间
  translation_model?: string;         // 使用的翻译模型
  translation_confidence?: number;    // 翻译质量置信度(0-1)
  error_message?: string;             // 翻译错误信息
}

interface PromptMetadata {
  // 内容特征
  character_count: number;            // 字符数
  word_count: number;                 // 单词数
  language: string;                   // 主要语言(en, zh, mixed)
  
  // 分类信息
  category?: string;                  // 分类(code-review, creative-writing等)
  tags: string[];                     // 标签数组
  complexity_score?: number;          // 复杂度评分(1-10)
  
  // 质量指标
  completeness_score?: number;        // 完整性评分(0-1)
  clarity_score?: number;             // 清晰度评分(0-1)
}

type ProcessingStatus = {
  extraction: 'pending'|'completed'|'failed';
  translation: 'pending'|'processing'|'completed'|'failed'|'skipped';
  analysis: 'pending'|'processing'|'completed'|'failed'|'skipped';
};
```

### 验证规则
- `prompt_id`: 必填，UUID格式
- `name`: 必填，1-200字符
- `original_prompt`: 必填，非空字符串
- `source_info.file_id`: 必填，必须在FileMetadata中存在
- `source_info.start_line`: 必填，正整数
- `source_info.end_line`: 必填，≥start_line
- `extraction_confidence`: 0-1之间的浮点数

## 3. 提示词分析 (PromptAnalysis)

### 用途
存储15个框架要素的AI分析结果。

### 数据结构
```typescript
interface PromptAnalysis {
  // 标识字段
  analysis_id: string;                // 唯一标识符
  prompt_id: string;                  // 关联的提示词ID
  
  // 15个分析要素
  elements: AnalysisElements;         // 要素分析结果
  
  // 分析元信息
  analysis_metadata: AnalysisMetadata;// 分析过程信息
  
  // 质量指标
  quality_metrics: QualityMetrics;    // 分析质量评估
}

interface AnalysisElements {
  // 15个核心要素(使用中文键名)
  所在文件: string;                    // 文件路径信息
  角色能力: string;                    // AI的身份和角色定义
  任务请求: string;                    // 要完成的具体任务
  背景情境: string;                    // 相关背景和使用场景
  指令行动: string;                    // 具体的执行步骤和操作
  输入格式: string;                    // 期望的输入数据格式
  输出规格: string;                    // 期望的输出格式和结构
  示例: string;                       // 输入输出示例
  限制约束: string;                    // 限制条件和规则
  目标期望: string;                    // 预期目标和成功标准
  信息: string;                       // 需要的知识和参考信息
  评估优化: string;                    // 质量评估和优化方向
  调整: string;                       // 可配置的参数和选项
  受众: string;                       // 目标用户和使用对象
  风格要求: string;                    // 语言风格和表达方式
}

interface AnalysisMetadata {
  // 处理信息
  analysis_status: 'pending'|'processing'|'completed'|'failed';
  analysis_timestamp?: string;        // 分析完成时间
  analysis_duration_ms?: number;      // 分析耗时(毫秒)
  
  // AI模型信息
  analysis_model: string;             // 使用的AI模型
  api_provider: string;               // API提供商(qwen, openai等)
  model_version?: string;             // 模型版本
  
  // 重试信息
  retry_count: number;                // 重试次数
  error_message?: string;             // 错误信息(如果失败)
}

interface QualityMetrics {
  // 整体质量
  overall_confidence: number;         // 整体置信度(0-1)
  completeness_score: number;         // 完整性评分(0-1)
  consistency_score?: number;         // 一致性评分(0-1)
  
  // 要素级别质量
  element_confidence: {               // 各要素的置信度
    [K in keyof AnalysisElements]: number;
  };
  
  // 统计信息
  total_elements_found: number;       // 找到内容的要素数量
  average_element_length: number;     // 要素内容平均长度
  analysis_word_count: number;        // 分析结果总词数
}
```

### 验证规则
- `analysis_id`: 必填，UUID格式
- `prompt_id`: 必填，必须在PromptContent中存在
- `elements`: 所有15个要素字段必须存在(可为空字符串)
- `overall_confidence`: 0-1之间的浮点数
- `completeness_score`: 0-1之间的浮点数
- `total_elements_found`: 0-15之间的整数

## 4. 处理日志 (ProcessingLog)

### 用途
记录所有处理操作的详细日志，用于调试和监控。

### 数据结构
```typescript
interface ProcessingLog {
  // 标识字段
  log_id: string;                     // 唯一标识符
  session_id: string;                 // 处理会话ID
  
  // 操作信息
  operation_type: OperationType;      // 操作类型
  target_id: string;                  // 目标对象ID(file_id或prompt_id)
  target_type: 'file'|'prompt';      // 目标对象类型
  
  // 时间信息
  start_timestamp: string;            // 开始时间
  end_timestamp?: string;             // 结束时间
  duration_ms?: number;               // 持续时间(毫秒)
  
  // 状态信息
  status: LogStatus;                  // 处理状态
  progress: number;                   // 进度(0-1)
  
  // 结果信息
  result_data?: any;                  // 处理结果数据
  error_info?: ErrorInfo;             // 错误信息
  
  // 性能指标
  metrics?: PerformanceMetrics;       // 性能指标
  
  // 上下文信息
  context: LogContext;                // 执行上下文
}

type OperationType = 
  | 'file_scan'         // 文件扫描
  | 'prompt_extraction' // 提示词提取
  | 'translation'       // 翻译
  | 'analysis'          // 要素分析
  | 'report_generation'; // 报告生成

type LogStatus = 
  | 'pending'     // 待处理
  | 'processing'  // 处理中
  | 'completed'   // 成功完成
  | 'failed'      // 失败
  | 'cancelled'   // 取消
  | 'skipped';    // 跳过

interface ErrorInfo {
  error_code: string;                 // 错误代码
  error_message: string;              // 错误消息
  error_details?: any;                // 详细错误信息
  stack_trace?: string;               // 堆栈跟踪
  retry_count: number;                // 重试次数
  is_recoverable: boolean;            // 是否可恢复
}

interface PerformanceMetrics {
  // 处理统计
  items_processed: number;            // 处理的项目数
  items_succeeded: number;            // 成功的项目数
  items_failed: number;               // 失败的项目数
  
  // 性能指标
  throughput_per_second?: number;     // 处理速度(项/秒)
  memory_usage_mb?: number;           // 内存使用(MB)
  api_calls_count?: number;           // API调用次数
  
  // 网络指标
  network_latency_ms?: number;        // 网络延迟(毫秒)
  data_transferred_bytes?: number;    // 传输数据量(字节)
}

interface LogContext {
  // 系统信息
  cli_version: string;                // CLI工具版本
  node_version: string;               // Node.js版本
  platform: string;                  // 操作系统平台
  
  // 配置信息
  config_used: any;                   // 使用的配置
  api_provider: string;               // API提供商
  
  // 用户信息
  user_id?: string;                   // 用户标识(如果有)
  working_directory: string;          // 工作目录
  
  // 批处理信息
  batch_id?: string;                  // 批处理ID
  batch_size?: number;                // 批大小
  batch_index?: number;               // 在批中的索引
}
```

### 验证规则
- `log_id`: 必填，UUID格式
- `session_id`: 必填，同一次运行使用相同session_id
- `operation_type`: 必填，枚举值之一
- `target_id`: 必填，对应的文件或提示词ID
- `start_timestamp`: 必填，ISO 8601格式
- `progress`: 0-1之间的浮点数

## 5. 分析报告 (AnalysisReport)

### 用途
生成各种格式的分析报告和对比表格。

### 数据结构
```typescript
interface AnalysisReport {
  // 标识字段
  report_id: string;                  // 唯一标识符
  report_name: string;                // 报告名称
  report_type: ReportType;            // 报告类型
  
  // 数据来源
  source_collection_id: string;       // 源数据集合ID
  included_prompt_ids: string[];      // 包含的提示词ID列表
  
  // 报告内容
  summary: ReportSummary;             // 摘要信息
  statistics: ReportStatistics;       // 统计数据
  comparison_tables: ComparisonTable[];// 对比表格
  insights: ReportInsight[];          // 洞察和建议
  
  // 生成信息
  generation_metadata: GenerationMetadata;// 生成元数据
  
  // 输出格式
  output_formats: OutputFormat[];     // 可用的输出格式
}

type ReportType = 
  | 'summary'           // 汇总报告
  | 'comparison'        // 对比分析
  | 'element_analysis'  // 要素分析
  | 'trend_analysis';   // 趋势分析

interface ReportSummary {
  total_prompts: number;              // 提示词总数
  total_files: number;                // 文件总数
  analysis_coverage: number;          // 分析覆盖率(0-1)
  average_complexity: number;         // 平均复杂度
  
  // 分布信息
  language_distribution: Record<string, number>;    // 语言分布
  category_distribution: Record<string, number>;    // 分类分布
  file_type_distribution: Record<string, number>;   // 文件类型分布
}

interface ReportStatistics {
  // 要素统计
  element_coverage: Record<keyof AnalysisElements, number>;  // 要素覆盖率
  element_avg_length: Record<keyof AnalysisElements, number>; // 要素平均长度
  
  // 质量统计
  quality_metrics: {
    high_quality_prompts: number;     // 高质量提示词数量(>0.8)
    medium_quality_prompts: number;   // 中等质量提示词数量(0.5-0.8)
    low_quality_prompts: number;      // 低质量提示词数量(<0.5)
  };
  
  // 复杂度统计
  complexity_distribution: {
    simple: number;                   // 简单(1-3分)
    moderate: number;                 // 中等(4-6分)
    complex: number;                  // 复杂(7-10分)
  };
}

interface ComparisonTable {
  table_id: string;                   // 表格ID
  table_title: string;                // 表格标题
  table_type: 'element_comparison'|'quality_comparison'|'custom';
  
  // 数据结构
  rows: TableRow[];                   // 表格行数据
  columns: TableColumn[];             // 表格列定义
  
  // 格式选项
  display_options: {
    show_empty_cells: boolean;        // 显示空单元格
    highlight_missing: boolean;       // 高亮缺失要素
    sort_by?: string;                 // 排序字段
    filter_by?: any;                  // 过滤条件
  };
  
  // 生成信息
  generated_timestamp: string;        // 生成时间
  format: 'html'|'markdown'|'csv';   // 输出格式
}

interface TableRow {
  row_id: string;                     // 行ID(通常是prompt_id)
  row_title: string;                  // 行标题(提示词名称)
  cells: Record<string, TableCell>;   // 单元格数据
}

interface TableColumn {
  column_id: string;                  // 列ID
  column_title: string;               // 列标题
  column_type: 'text'|'number'|'boolean'|'enum';
  width?: number;                     // 列宽(像素)
  sortable: boolean;                  // 是否可排序
}

interface TableCell {
  value: any;                         // 单元格值
  formatted_value?: string;           // 格式化后的显示值
  confidence?: number;                // 置信度
  is_empty: boolean;                  // 是否为空
  tooltip?: string;                   // 工具提示
}

interface ReportInsight {
  insight_id: string;                 // 洞察ID
  insight_type: 'pattern'|'anomaly'|'trend'|'recommendation';
  
  title: string;                      // 标题
  description: string;                // 详细描述
  confidence_score: number;           // 置信度(0-1)
  
  // 相关数据
  affected_prompts: string[];         // 相关的提示词ID
  supporting_data: any;               // 支撑数据
  
  // 建议行动
  recommended_actions?: string[];     // 建议行动
}

interface GenerationMetadata {
  generated_timestamp: string;        // 生成时间
  generation_duration_ms: number;     // 生成耗时
  generator_version: string;          // 生成器版本
  
  // 配置信息
  generation_config: any;             // 生成配置
  data_version: string;               // 数据版本
  
  // 统计信息
  total_data_points: number;          // 数据点总数
  processed_prompts: number;          // 处理的提示词数量
}

interface OutputFormat {
  format_type: 'html'|'markdown'|'csv'|'json'|'pdf';
  file_path: string;                  // 输出文件路径
  file_size_bytes?: number;           // 文件大小
  mime_type: string;                  // MIME类型
  is_primary: boolean;                // 是否为主要格式
}
```

## 6. 数据关系和约束

### 主键和外键关系
```sql
-- 主键关系
FileMetadata.file_id (PK)
PromptContent.prompt_id (PK)
PromptAnalysis.analysis_id (PK)
ProcessingLog.log_id (PK)
AnalysisReport.report_id (PK)

-- 外键关系
PromptContent.source_info.file_id → FileMetadata.file_id
PromptAnalysis.prompt_id → PromptContent.prompt_id
ProcessingLog.target_id → FileMetadata.file_id | PromptContent.prompt_id
AnalysisReport.included_prompt_ids[] → PromptContent.prompt_id[]
```

### 数据完整性约束
1. **引用完整性**: 所有外键必须有效
2. **状态一致性**: 处理状态必须符合状态转换规则
3. **时间戳一致性**: updated_timestamp >= created_timestamp
4. **数值范围**: 置信度、评分等必须在有效范围内
5. **枚举值**: 状态字段必须是预定义的枚举值之一

### 数据生命周期
```
文件扫描 → FileMetadata创建
提示词提取 → PromptContent创建 + SourceInfo关联
AI翻译 → Translation数据更新
AI分析 → PromptAnalysis创建
报告生成 → AnalysisReport创建 + 输出文件
```

## 7. 性能考虑

### 存储优化
- 大文本字段使用压缩存储
- 分离热数据和冷数据(metadata vs content)
- 使用适当的索引策略

### 查询优化
- 为常用查询字段建立索引
- 使用复合索引优化复杂查询
- 实现数据预聚合提高统计查询性能

### 并发控制
- 读写分离架构
- 乐观锁控制并发更新
- 批量操作优化

这个数据模型设计为AI提示词分析工作流提供了完整、可扩展的数据基础，支持从文件扫描到报告生成的完整数据生命周期管理。