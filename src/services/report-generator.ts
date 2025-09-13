/**
 * ReportGenerator 服务
 * 负责生成提示词分析报告、对比表格和各种格式导出
 */

import { writeFile, mkdir } from 'fs/promises';
import { /* join, */ dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';

import {
  AnalysisReport,
  ReportSummary,
  ReportStatistics,
  ComparisonTable,
  TableRow,
  // TableColumn,
  TableCell,
  ReportInsight,
  OutputFormat,
  GenerationMetadata,
  // createDefaultReportSummary,
  // createEmptyTableCell,
  generateTableId,
  // validateAnalysisReport,
  MIME_TYPE_MAPPING,
  DEFAULT_DISPLAY_OPTIONS
} from '@/models/analysis-report.js';
import { AnalysisElements } from '@/models/prompt-analysis.js';
import { /* UUID, */ ReportType, OutputFormatType, TableType } from '@/models/common.js';

// ============== 输入接口 ==============

/**
 * 分析后的提示词数据
 */
export interface AnalyzedPromptData {
  promptId: string;
  name: string;
  description?: string;
  originalContent: string;
  translatedContent?: string;
  sourceInfo: {
    filePath: string;
    fileName: string;
    startLine: number;
    endLine: number;
  };
  analysis: AnalysisElements;
  qualityMetrics?: {
    overallConfidence: number;
    completenessScore: number;
    elementCount: number;
  };
}

/**
 * 摘要报告选项
 */
export interface SummaryReportOptions {
  reportType?: 'summary' | 'detailed' | 'executive';
  includeStatistics?: boolean;
  includeInsights?: boolean;
  includeQualityAnalysis?: boolean;
  groupBy?: 'category' | 'language' | 'file_type';
  sortBy?: 'name' | 'quality' | 'complexity';
}

/**
 * 对比表格选项
 */
export interface ComparisonTableOptions {
  tableType?: TableType;
  includedElements?: Array<keyof AnalysisElements>;
  maxPromptsPerTable?: number;
  showEmptyElements?: boolean;
  highlightDifferences?: boolean;
  includeQualityScores?: boolean;
}

/**
 * 导出选项
 */
export interface ExportOptions {
  outputFormat: OutputFormatType;
  outputPath: string;
  templateStyle?: 'default' | 'compact' | 'detailed';
  includeMetadata?: boolean;
  customCSS?: string;
}

/**
 * 统计信息选项
 */
export interface StatisticsOptions {
  includeElementCoverage?: boolean;
  includeQualityDistribution?: boolean;
  includeComplexityAnalysis?: boolean;
  includeLanguageDistribution?: boolean;
}

// ============== 输入参数接口 ==============

export interface GenerateSummaryReportParams {
  prompts: AnalyzedPromptData[];
  options?: SummaryReportOptions;
}

export interface GenerateComparisonTableParams {
  prompts: AnalyzedPromptData[];
  options?: ComparisonTableOptions;
}

export interface ExportToFormatParams {
  report: AnalysisReport;
  options: ExportOptions;
}

export interface GenerateStatisticsParams {
  prompts: AnalyzedPromptData[];
  options?: StatisticsOptions;
}

// ============== 输出接口 ==============

/**
 * 报告生成结果
 */
export interface ReportGenerationResult {
  reportId: string;
  reportType: ReportType;
  generatedAt: string;
  summary: ReportSummary;
  sections: Array<{ type: string; content: any }>;
  statistics: ReportStatistics;
  comparisonTables?: ComparisonTable[];
  insights?: ReportInsight[];
  availableFormats?: OutputFormat[];
  metadata: GenerationMetadata;
}

/**
 * 导出结果
 */
export interface ExportResult {
  success: boolean;
  outputPath: string;
  format: OutputFormatType;
  fileSize: number;
  generationTime: number;
  error?: string;
}

/**
 * ReportGenerator 服务类
 */
export class ReportGenerator {
  // private generatedReports: Map<string, AnalysisReport> = new Map();

  constructor() {
    // 初始化报告生成器
  }

  /**
   * 生成提示词分析摘要报告
   */
  async generateSummaryReport(params: GenerateSummaryReportParams): Promise<ReportGenerationResult> {
    const { prompts, options = {} } = params;
    const startTime = Date.now();

    const {
      reportType = 'summary',
      includeStatistics = true,
      includeInsights = true,
      // includeQualityAnalysis = true,
      // groupBy = 'category',
      // sortBy = 'name'
    } = options;

    // 验证输入
    if (!prompts || prompts.length === 0) {
      const error = new Error('INSUFFICIENT_DATA') as any;
      error.code = 'INSUFFICIENT_DATA';
      throw error;
    }

    const reportId = uuidv4();
    const generationTime = new Date().toISOString();

    // 生成摘要信息
    const summary = this.generateSummary(prompts);

    // 生成统计信息
    const statistics = includeStatistics ? this.generateStatisticsInternal(prompts) : this.createEmptyStatistics();

    // 生成对比表格
    const comparisonTables = await this.generateAllComparisonTables(prompts);

    // 生成洞察
    const insights = includeInsights ? this.generateInsights(prompts) : [];

    // 生成可用格式
    const availableFormats: OutputFormat[] = [
      {
        format_type: 'html',
        file_path: '',
        mime_type: MIME_TYPE_MAPPING.html,
        is_primary: true
      },
      {
        format_type: 'markdown',
        file_path: '',
        mime_type: MIME_TYPE_MAPPING.markdown,
        is_primary: false
      },
      {
        format_type: 'csv',
        file_path: '',
        mime_type: MIME_TYPE_MAPPING.csv,
        is_primary: false
      }
    ];

    // 生成元数据
    const processingTime = Date.now() - startTime;
    const metadata: GenerationMetadata = {
      generated_timestamp: generationTime,
      generation_duration_ms: processingTime,
      generator_version: '1.0.0',
      generation_config: options,
      data_version: '1.0.0',
      total_data_points: prompts.length,
      processed_prompts: prompts.length
    };

    // 生成报告章节
    const sections = [
      {
        sectionId: uuidv4(),
        title: '执行摘要',
        content: `共分析了 ${prompts.length} 个提示词，平均质量评分 ${(summary.average_complexity / 10 * 100).toFixed(1)}%`,
        type: 'summary' as const,
        order: 1
      },
      {
        sectionId: uuidv4(),
        title: '统计概览',
        content: JSON.stringify(statistics, null, 2),
        type: 'statistics' as const,
        order: 2
      },
      ...insights.map((insight, index) => ({
        sectionId: insight.insight_id,
        title: insight.title,
        content: insight.description,
        type: 'insight' as const,
        order: 3 + index
      }))
    ];

    const result: ReportGenerationResult = {
      reportId,
      reportType: reportType as ReportType,
      generatedAt: generationTime,
      summary: {
        ...summary
        // averageConfidence: prompts.reduce((acc, p) => acc + (p.qualityMetrics?.overallConfidence || 0), 0) / prompts.length,
        // averageCompleteness: prompts.reduce((acc, p) => acc + (p.qualityMetrics?.completenessScore || 0), 0) / prompts.length,
        // highQualityPrompts: prompts.filter(p => (p.qualityMetrics?.overallConfidence || 0) > 0.8).length,
        // topMissingElements: this.findTopMissingElements(prompts)
      },
      sections,
      statistics,
      comparisonTables,
      insights,
      availableFormats,
      metadata
    };

    return result;
  }

  /**
   * 生成提示词要素对比表格
   */
  async generateComparisonTable(params: any): Promise<any> {
    const { prompts, options = {}, tableOptions = {} } = params;
    const finalOptions = { ...options, ...tableOptions };

    const {
      tableType = 'element_comparison',
      layout = 'elements_as_rows',
      includedElements,
      maxPromptsPerTable = 4,
      // showEmptyElements = true,
      showEmptyCells = true,
      // highlightDifferences = true,
      highlightMissing = true,
      includeQualityScores = true,
      tableTitle = '提示词要素对比分析'
    } = finalOptions;

    // 验证输入
    if (!prompts || prompts.length === 0) {
      const error = new Error('INSUFFICIENT_DATA') as any;
      error.code = 'INSUFFICIENT_DATA';
      throw error;
    }

    if (maxPromptsPerTable <= 0 || maxPromptsPerTable > 10) {
      const error = new Error('INVALID_TABLE_SIZE') as any;
      error.code = 'INVALID_TABLE_SIZE';
      throw error;
    }

    const tableId = generateTableId('report', tableType);
    
    // 限制提示词数量
    const limitedPrompts = prompts.slice(0, maxPromptsPerTable);

    // 定义要包含的分析要素
    const elementsToInclude: Array<keyof AnalysisElements> = includedElements || [
      '所在文件', '角色能力', '任务请求', '背景情境', '指令行动', 
      '输入格式', '输出规格', '示例', '限制约束', '目标期望'
    ];

    // 生成列定义 - 使用契约期望的格式
    const columns: any[] = [
      {
        key: 'element',
        label: '分析要素',
        type: 'text',
        width: 150,
        sortable: false,
        // 保留原有字段以保持兼容性
        column_id: 'element',
        column_title: '分析要素',
        column_type: 'text'
      }
    ];

    limitedPrompts.forEach((prompt: AnalyzedPromptData, index: number) => {
      columns.push({
        key: `prompt_${index}`,
        label: prompt.name || `提示词 ${index + 1}`,
        type: 'text',
        width: 300,
        sortable: false,
        // 保留原有字段以保持兼容性
        column_id: `prompt_${index}`,
        column_title: prompt.name || `提示词 ${index + 1}`,
        column_type: 'text'
      });
    });

    // 生成行数据
    const rows: TableRow[] = [];

    if (layout === 'prompts_as_rows') {
      // 提示词作为行
      limitedPrompts.forEach((prompt: AnalyzedPromptData, index: number) => {
        const cells: Record<string, TableCell> = {
          name: {
            value: prompt.name || `Prompt ${index + 1}`,
            formatted_value: prompt.name || `Prompt ${index + 1}`,
            is_empty: false
          }
        };

        // 添加每个要素作为列
        elementsToInclude.forEach(element => {
          const elementContent = prompt.analysis[element] || '';
          const isEmpty = !elementContent || elementContent.trim().length === 0;

          cells[element] = {
            value: elementContent,
            formatted_value: isEmpty ? '-' : elementContent,
            is_empty: isEmpty,
            confidence: prompt.qualityMetrics?.overallConfidence || 0
          };
        });

        rows.push({
          row_id: `prompt_${index}`,
          row_title: prompt.name || `Prompt ${index + 1}`,
          cells
        });
      });
    } else {
      // 要素作为行（默认）
      // 基本信息行
      rows.push({
        row_id: 'basic_info',
        row_title: '基本信息',
        cells: this.generateBasicInfoCells(limitedPrompts)
      });

      // 要素分析行
      elementsToInclude.forEach(element => {
        const cells: Record<string, TableCell> = {
          element: {
            value: element,
            formatted_value: element,
            is_empty: false
          }
        };

        limitedPrompts.forEach((prompt: AnalyzedPromptData, index: number) => {
          const elementContent = prompt.analysis[element] || '';
          const isEmpty = !elementContent || elementContent.trim().length === 0;

          cells[`prompt_${index}`] = {
            value: elementContent,
            formatted_value: isEmpty ? '-' : elementContent,
            is_empty: isEmpty,
            confidence: prompt.qualityMetrics?.overallConfidence || 0
          };
        });

        rows.push({
          row_id: element,
          row_title: element,
          cells
        });
      });

      // 质量评分行
      if (includeQualityScores) {
        rows.push({
          row_id: 'quality_scores',
          row_title: '质量评分',
          cells: this.generateQualityCells(limitedPrompts)
        });
      }
    }

    const comparisonTable: ComparisonTable = {
      table_id: tableId,
      table_title: tableTitle,
      table_type: tableType,
      rows,
      columns,
      display_options: {
        ...DEFAULT_DISPLAY_OPTIONS,
        show_empty_cells: showEmptyCells,
        highlight_missing: highlightMissing,
        sort_by: DEFAULT_DISPLAY_OPTIONS.sort_by || 'name',
        filter_by: DEFAULT_DISPLAY_OPTIONS.filter_by || {}
      },
      generated_timestamp: new Date().toISOString(),
      format: 'html'
    };

    // 返回契约期望的格式
    return {
      tableId,
      title: comparisonTable.table_title,
      generatedAt: new Date().toISOString(),
      tableData: {
        ...comparisonTable,
        headers: comparisonTable.columns, // 添加headers字段以匹配契约
        rows: comparisonTable.rows
      },
      metadata: {
        generated_timestamp: new Date().toISOString(),
        processing_time_ms: Date.now() - Date.now(), // 占位符
        total_prompts: limitedPrompts.length,
        included_elements: elementsToInclude.length
      }
    } as any; // 临时使用any，后续需要定义正确的返回类型
  }

  /**
   * 将报告导出为指定格式
   */
  async exportToFormat(params: any): Promise<ExportResult> {
    const { report, options = {} } = params;
    const startTime = Date.now();

    const {
      outputFormat,
      outputPath,
      templateStyle = 'default',
      // includeMetadata = true,
      customCSS
    } = options;

    try {
      // 验证输出格式
      if (!['html', 'markdown', 'csv', 'json'].includes(outputFormat)) {
        const error = new Error('UNSUPPORTED_FORMAT') as any;
        error.code = 'UNSUPPORTED_FORMAT';
        throw error;
      }

      // 确保输出目录存在
      await mkdir(dirname(outputPath), { recursive: true });

      let content: string;
      let actualOutputPath = outputPath;

      switch (outputFormat) {
        case 'html':
          content = this.generateHTMLReport(report, templateStyle, customCSS);
          if (!actualOutputPath.endsWith('.html')) {
            actualOutputPath += '.html';
          }
          break;

        case 'markdown':
          content = this.generateMarkdownReport(report);
          if (!actualOutputPath.endsWith('.md')) {
            actualOutputPath += '.md';
          }
          break;

        case 'csv':
          content = this.generateCSVReport(report);
          if (!actualOutputPath.endsWith('.csv')) {
            actualOutputPath += '.csv';
          }
          break;

        case 'json':
          content = JSON.stringify(report, null, 2);
          if (!actualOutputPath.endsWith('.json')) {
            actualOutputPath += '.json';
          }
          break;

        default:
          throw new Error('UNSUPPORTED_FORMAT');
      }

      // 写入文件
      await writeFile(actualOutputPath, content, 'utf-8');

      const processingTime = Date.now() - startTime;
      const fileSize = Buffer.byteLength(content, 'utf-8');

      return {
        // 契约期望的字段
        // exportId: uuidv4(),
        // exportedAt: new Date().toISOString(),
        success: true,
        format: outputFormat,
        // filePath: actualOutputPath,
        // processingTime,
        
        // 额外字段
        outputPath: actualOutputPath,
        // mimeType: MIME_TYPE_MAPPING[outputFormat as keyof typeof MIME_TYPE_MAPPING],
        fileSize,
        generationTime: processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      return {
        success: false,
        outputPath: '',
        format: outputFormat,
        fileSize: 0,
        generationTime: processingTime,
        error: error instanceof Error ? error.message : 'Unknown export error'
      };
    }
  }

  /**
   * 生成提示词分析统计信息
   */
  async generateStatistics(params: any): Promise<any> {
    const { prompts, options = {} } = params;
    if (!prompts || !Array.isArray(prompts)) {
      const error = new Error('INVALID_PROMPTS_ARRAY') as any;
      error.code = 'INVALID_PROMPTS_ARRAY';
      throw error;
    }
    
    const internalStats = this.generateStatisticsInternal(prompts);
    
    // 转换为契约期望的格式
    return {
      statisticsId: uuidv4(),
      generatedAt: new Date().toISOString(),
      basicStatistics: options.includeBasic !== false ? {
        totalPrompts: prompts.length,
        totalFiles: new Set(prompts.map(p => p.sourceInfo.filePath)).size,
        averageConfidence: prompts.reduce((sum, p) => sum + (p.qualityMetrics?.overallConfidence || 0), 0) / prompts.length
      } : undefined,
      elementStatistics: options.includeElements !== false ? internalStats.element_coverage : undefined,
      qualityStatistics: options.includeQuality !== false ? internalStats.quality_metrics : undefined,
      correlations: [] // 占位符
    };
  }

  // ============== 私有辅助方法 ==============

  private generateSummary(prompts: AnalyzedPromptData[]): ReportSummary {
    const uniqueFiles = new Set(prompts.map(p => p.sourceInfo.filePath));
    const languages = new Set<string>();
    const categories = new Set<string>();
    const fileTypes = new Set<string>();

    let totalComplexity = 0;
    const languageCount: Record<string, number> = {};
    const categoryCount: Record<string, number> = {};
    const fileTypeCount: Record<string, number> = {};

    prompts.forEach(prompt => {
      // 语言分析
      const language = this.detectLanguage(prompt.originalContent);
      languages.add(language);
      languageCount[language] = (languageCount[language] || 0) + 1;

      // 分类分析
      const category = this.inferCategory(prompt);
      categories.add(category);
      categoryCount[category] = (categoryCount[category] || 0) + 1;

      // 文件类型分析
      const fileExt = prompt.sourceInfo.fileName.split('.').pop() || 'unknown';
      fileTypes.add(fileExt);
      fileTypeCount[fileExt] = (fileTypeCount[fileExt] || 0) + 1;

      // 复杂度分析
      totalComplexity += this.calculateComplexity(prompt);
    });

    // const analysisRate = prompts.filter(p => p.analysis).length / prompts.length;

    // 计算额外的统计信息
    // const highQuality = prompts.filter(p => p.qualityMetrics?.overallConfidence && p.qualityMetrics.overallConfidence > 0.8).length;
    // const avgConfidence = prompts.reduce((sum, p) => sum + (p.qualityMetrics?.overallConfidence || 0), 0) / prompts.length;
    
    // 查找缺失最多的要素
    const elementMissing: Record<string, number> = {};
    prompts.forEach(prompt => {
      if (prompt.analysis) {
        Object.entries(prompt.analysis).forEach(([key, value]) => {
          if (!value || value.trim().length === 0) {
            elementMissing[key] = (elementMissing[key] || 0) + 1;
          }
        });
      }
    });
    
    // const topMissing = Object.entries(elementMissing)
    //   .sort((a, b) => b[1] - a[1])
    //   .slice(0, 3)
    //   .map(([element, count]) => ({ element, missingCount: count }));
    
    return {
      total_prompts: prompts.length,
      total_files: uniqueFiles.size,
      analysis_coverage: prompts.filter(p => p.analysis).length / prompts.length,
      average_complexity: totalComplexity / prompts.length,
      language_distribution: languageCount,
      category_distribution: categoryCount,
      file_type_distribution: {} // Add empty file type distribution
    };
  }

  private generateStatisticsInternal(prompts: AnalyzedPromptData[]): ReportStatistics {
    const elementCoverage: Record<keyof AnalysisElements, number> = {} as any;
    const elementAvgLength: Record<keyof AnalysisElements, number> = {} as any;

    // 计算要素覆盖率
    const elementNames: Array<keyof AnalysisElements> = [
      '所在文件', '角色能力', '任务请求', '背景情境', '指令行动',
      '输入格式', '输出规格', '示例', '限制约束', '目标期望',
      '信息', '评估优化', '调整', '受众', '风格要求'
    ];

    elementNames.forEach(element => {
      const withContent = prompts.filter(p => 
        p.analysis[element] && p.analysis[element].trim().length > 0
      );
      
      elementCoverage[element] = withContent.length / prompts.length;
      
      const totalLength = withContent.reduce((sum, p) => 
        sum + (p.analysis[element]?.length || 0), 0
      );
      
      elementAvgLength[element] = withContent.length > 0 ? totalLength / withContent.length : 0;
    });

    // 质量分布
    let highQuality = 0, mediumQuality = 0, lowQuality = 0;
    prompts.forEach(prompt => {
      const quality = prompt.qualityMetrics?.completenessScore || 0;
      if (quality > 0.8) highQuality++;
      else if (quality >= 0.5) mediumQuality++;
      else lowQuality++;
    });

    // 复杂度分布
    let simple = 0, moderate = 0, complex = 0;
    prompts.forEach(prompt => {
      const complexity = this.calculateComplexity(prompt);
      if (complexity <= 3) simple++;
      else if (complexity <= 6) moderate++;
      else complex++;
    });

    return {
      element_coverage: elementCoverage,
      element_avg_length: elementAvgLength,
      quality_metrics: {
        high_quality_prompts: highQuality,
        medium_quality_prompts: mediumQuality,
        low_quality_prompts: lowQuality
      },
      complexity_distribution: {
        simple,
        moderate,
        complex
      }
    };
  }

  private async generateAllComparisonTables(prompts: AnalyzedPromptData[]): Promise<ComparisonTable[]> {
    const tables: ComparisonTable[] = [];
    
    // 每4个提示词生成一个表格
    for (let i = 0; i < prompts.length; i += 4) {
      const batch = prompts.slice(i, i + 4);
      const table = await this.generateComparisonTable({
        prompts: batch,
        options: { maxPromptsPerTable: 4 }
      });
      tables.push(table);
    }

    return tables;
  }

  private generateInsights(prompts: AnalyzedPromptData[]): ReportInsight[] {
    const insights: ReportInsight[] = [];

    // 分析常见模式
    const commonRoles = this.findCommonPatterns(prompts, '角色能力');
    if (commonRoles.length > 0) {
      insights.push({
        insight_id: uuidv4(),
        insight_type: 'pattern',
        title: '常见角色模式',
        description: `发现 ${commonRoles.length} 种常见的AI角色定义模式`,
        confidence_score: 0.8,
        affected_prompts: prompts.map(p => p.promptId).slice(0, 5),
        supporting_data: commonRoles
      });
    }

    // 质量问题检测
    const lowQualityPrompts = prompts.filter(p => 
      (p.qualityMetrics?.completenessScore || 0) < 0.5
    );
    
    if (lowQualityPrompts.length > 0) {
      insights.push({
        insight_id: uuidv4(),
        insight_type: 'anomaly',
        title: '低质量提示词检测',
        description: `发现 ${lowQualityPrompts.length} 个可能需要改进的提示词`,
        confidence_score: 0.9,
        affected_prompts: lowQualityPrompts.map(p => p.promptId),
        supporting_data: { count: lowQualityPrompts.length },
        recommended_actions: ['审查要素完整性', '增加具体示例', '明确输出要求']
      });
    }

    return insights;
  }

  private generateBasicInfoCells(prompts: AnalyzedPromptData[]): Record<string, TableCell> {
    const cells: Record<string, TableCell> = {
      element: {
        value: '提示词名称',
        formatted_value: '提示词名称',
        is_empty: false
      }
    };

    prompts.forEach((prompt, index) => {
      cells[`prompt_${index}`] = {
        value: prompt.name,
        formatted_value: prompt.name,
        is_empty: false
      };
    });

    return cells;
  }

  private generateQualityCells(prompts: AnalyzedPromptData[]): Record<string, TableCell> {
    const cells: Record<string, TableCell> = {
      element: {
        value: '完整性评分',
        formatted_value: '完整性评分',
        is_empty: false
      }
    };

    prompts.forEach((prompt, index) => {
      const score = prompt.qualityMetrics?.completenessScore || 0;
      cells[`prompt_${index}`] = {
        value: score,
        formatted_value: `${(score * 100).toFixed(1)}%`,
        is_empty: false,
        confidence: score
      };
    });

    return cells;
  }

  private createEmptyStatistics(): ReportStatistics {
    return {
      element_coverage: {} as any,
      element_avg_length: {} as any,
      quality_metrics: {
        high_quality_prompts: 0,
        medium_quality_prompts: 0,
        low_quality_prompts: 0
      },
      complexity_distribution: {
        simple: 0,
        moderate: 0,
        complex: 0
      }
    };
  }

  // 格式化方法
  private generateHTMLReport(report: AnalysisReport, _style: string, customCSS?: string): string {
    const css = customCSS || this.getDefaultCSS();
    
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.report_name}</title>
    <style>${css}</style>
</head>
<body>
    <div class="container">
        <header>
            <h1>${report.report_name}</h1>
            <p>生成时间: ${report.generation_metadata.generated_timestamp}</p>
        </header>
        
        <section class="summary">
            <h2>摘要信息</h2>
            <p>总提示词数: ${report.summary.total_prompts}</p>
            <p>总文件数: ${report.summary.total_files}</p>
            <p>分析覆盖率: ${(report.summary.analysis_coverage * 100).toFixed(1)}%</p>
        </section>

        <section class="tables">
            <h2>对比表格</h2>
            ${report.comparison_tables.map(table => this.generateHTMLTable(table)).join('')}
        </section>
    </div>
</body>
</html>`;
  }

  private generateMarkdownReport(report: AnalysisReport): string {
    return `# ${report.report_name}

## 摘要信息
- 总提示词数: ${report.summary.total_prompts}
- 总文件数: ${report.summary.total_files}
- 分析覆盖率: ${(report.summary.analysis_coverage * 100).toFixed(1)}%

## 对比表格

${report.comparison_tables.map(table => this.generateMarkdownTable(table)).join('\n\n')}

---
生成时间: ${report.generation_metadata.generated_timestamp}
`;
  }

  private generateCSVReport(report: AnalysisReport): string {
    if (report.comparison_tables.length === 0) {
      return 'Report Name,Generated Time,Total Prompts,Total Files\n' +
             `${report.report_name},${report.generation_metadata.generated_timestamp},${report.summary.total_prompts},${report.summary.total_files}`;
    }

    // 使用第一个表格生成CSV
    const table = report.comparison_tables[0];
    if (!table) return '';
    const headers = table.columns.map(col => col.column_title).join(',');
    const rows = table.rows.map(row => 
      table.columns.map(col => {
        const cell = row.cells[col.column_id];
        return `"${(cell?.formatted_value || '').replace(/"/g, '""')}"`;
      }).join(',')
    ).join('\n');

    return `${headers}\n${rows}`;
  }

  private generateHTMLTable(table: ComparisonTable): string {
    const headers = table.columns.map(col => `<th>${col.column_title}</th>`).join('');
    const rows = table.rows.map(row => {
      const cells = table.columns.map(col => {
        const cell = row.cells[col.column_id];
        const content = cell?.formatted_value || '';
        const className = cell?.is_empty ? 'empty-cell' : '';
        return `<td class="${className}">${content}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    return `
<div class="table-container">
    <h3>${table.table_title}</h3>
    <table class="comparison-table">
        <thead><tr>${headers}</tr></thead>
        <tbody>${rows}</tbody>
    </table>
</div>`;
  }

  private generateMarkdownTable(table: ComparisonTable): string {
    const headers = '| ' + table.columns.map(col => col.column_title).join(' | ') + ' |';
    const separator = '| ' + table.columns.map(() => '---').join(' | ') + ' |';
    const rows = table.rows.map(row => {
      const cells = table.columns.map(col => {
        const cell = row.cells[col.column_id];
        return (cell?.formatted_value || '').replace(/\|/g, '\\|');
      });
      return '| ' + cells.join(' | ') + ' |';
    }).join('\n');

    return `### ${table.table_title}\n\n${headers}\n${separator}\n${rows}`;
  }

  private getDefaultCSS(): string {
    return `
body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
.container { max-width: 1200px; margin: 0 auto; }
.comparison-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
.comparison-table th, .comparison-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
.comparison-table th { background-color: #f2f2f2; }
.empty-cell { color: #999; font-style: italic; }
.table-container { margin: 20px 0; }
`;
  }

  // 辅助分析方法
  private detectLanguage(content: string): string {
    const chineseChars = (content.match(/[\u4e00-\u9fff]/g) || []).length;
    const totalChars = content.length;
    return chineseChars / totalChars > 0.3 ? 'zh' : 'en';
  }

  private inferCategory(prompt: AnalyzedPromptData): string {
    const content = prompt.originalContent.toLowerCase();
    if (content.includes('code') || content.includes('代码')) return 'code-review';
    if (content.includes('translate') || content.includes('翻译')) return 'translation';
    if (content.includes('write') || content.includes('写作')) return 'writing';
    if (content.includes('document') || content.includes('文档') || content.includes('doc')) return 'documentation';
    if (content.includes('test') || content.includes('测试')) return 'testing';
    if (content.includes('debug') || content.includes('调试')) return 'debugging';
    return 'general';
  }

  private calculateComplexity(prompt: AnalyzedPromptData): number {
    let complexity = 1;
    
    // 基于内容长度
    if (prompt.originalContent.length > 1000) complexity += 2;
    else if (prompt.originalContent.length > 500) complexity += 1;
    
    // 基于分析要素数量
    const elementCount = Object.values(prompt.analysis).filter(v => v && v.trim().length > 0).length;
    complexity += Math.floor(elementCount / 3);
    
    return Math.min(complexity, 10);
  }

  // private findTopMissingElements(prompts: AnalyzedPromptData[]): string[] {
  //   const elementMissingCount: Record<string, number> = {};
  //   const elements = [
  //     '所在文件', '角色能力', '任务请求', '背景情境', '指令行动',
  //     '输入格式', '输出规格', '示例', '限制约束', '目标期望',
  //     '信息', '评估优化', '调整', '受众', '风格要求'
  //   ];

  //   prompts.forEach(prompt => {
  //     elements.forEach(element => {
  //       const key = element as keyof AnalysisElements;
  //       if (!prompt.analysis[key] || prompt.analysis[key].trim().length === 0) {
  //         elementMissingCount[element] = (elementMissingCount[element] || 0) + 1;
  //       }
  //     });
  //   });

  //   // 排序并返回前5个最常缺失的要素
  //   return Object.entries(elementMissingCount)
  //     .sort((a, b) => b[1] - a[1])
  //     .slice(0, 5)
  //     .map(([element]) => element);
  // }

  private findCommonPatterns(prompts: AnalyzedPromptData[], element: keyof AnalysisElements): string[] {
    const patterns: Record<string, number> = {};
    
    prompts.forEach(prompt => {
      const content = prompt.analysis[element];
      if (content && content.trim().length > 0) {
        // 简单的模式识别
        const words = content.split(/\s+/).filter(word => word.length > 2);
        words.forEach(word => {
          patterns[word] = (patterns[word] || 0) + 1;
        });
      }
    });

    return Object.entries(patterns)
      .filter(([_, count]) => count >= 2)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 5)
      .map(([pattern]) => pattern);
  }
}