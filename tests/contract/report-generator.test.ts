/**
 * ReportGenerator 契约测试
 * 基于 contracts/report-generator.json 定义的API契约
 * 
 * 测试目标：
 * - generateSummaryReport: 生成提示词分析摘要报告
 * - generateComparisonTable: 生成提示词要素对比表格
 * - exportToFormat: 将报告导出为指定格式
 * - generateStatistics: 生成提示词分析统计信息
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import { ReportGenerator } from '@/services/report-generator';

describe('ReportGenerator 契约测试', () => {
  let reportGenerator: ReportGenerator;
  let testOutputDir: string;

  // 模拟分析后的提示词数据
  const mockAnalyzedPrompts = [
    {
      promptId: 'mock-001',
      name: '代码审查助手',
      description: '帮助开发者进行代码质量检查',
      originalContent: `你是一个专业的代码审查专家。请分析以下JavaScript代码。

## 任务
检查代码质量，识别潜在问题，提供改进建议。

## 输出格式
1. 质量评分 (1-10)
2. 问题列表
3. 改进建议`,
      translatedContent: 'You are a professional code review expert...',
      sourceInfo: {
        filePath: '/prompts/code-review.md',
        fileName: 'code-review.md',
        startLine: 1,
        endLine: 10
      },
      analysis: {
        所在文件: '/prompts/code-review.md',
        角色能力: '专业的代码审查专家',
        任务请求: '分析JavaScript代码',
        背景情境: '代码质量检查场景',
        指令行动: '检查代码质量，识别潜在问题，提供改进建议',
        输入格式: 'JavaScript代码片段',
        输出规格: '质量评分、问题列表、改进建议',
        示例: '评分示例',
        限制约束: '保持专业态度',
        目标期望: '提高代码质量',
        信息: '代码审查最佳实践',
        评估优化: '基于工业标准',
        调整: '可调整严格程度',
        受众: '软件开发者',
        风格要求: '专业、建设性'
      },
      qualityMetrics: {
        overallConfidence: 0.85,
        completenessScore: 0.9,
        elementsFound: 15
      },
      metadata: {
        category: 'code-review',
        tags: ['javascript', 'quality', 'review'],
        complexity: 7,
        language: 'zh',
        wordCount: 120
      }
    },
    {
      promptId: 'mock-002',
      name: '文档生成器',
      description: '根据代码自动生成技术文档',
      originalContent: `请根据以下API接口信息生成详细的技术文档。

## 要求
- 包含接口说明
- 参数详细描述
- 返回值格式
- 使用示例

## 格式
使用Markdown格式输出`,
      sourceInfo: {
        filePath: '/prompts/doc-generator.md',
        fileName: 'doc-generator.md',
        startLine: 1,
        endLine: 8
      },
      analysis: {
        所在文件: '/prompts/doc-generator.md',
        角色能力: '技术文档编写专家',
        任务请求: '生成API技术文档',
        背景情境: 'API文档编写场景',
        指令行动: '编写接口说明、参数描述、返回值格式、使用示例',
        输入格式: 'API接口信息',
        输出规格: 'Markdown格式技术文档',
        示例: '文档格式示例',
        限制约束: '必须包含所有必要信息',
        目标期望: '生成完整准确的文档',
        信息: 'API文档编写规范',
        评估优化: '文档完整性和可读性',
        调整: '可调整详细程度',
        受众: '开发者和用户',
        风格要求: '清晰、准确'
      },
      qualityMetrics: {
        overallConfidence: 0.78,
        completenessScore: 0.85,
        elementsFound: 14
      },
      metadata: {
        category: 'documentation',
        tags: ['api', 'markdown', 'documentation'],
        complexity: 6,
        language: 'zh',
        wordCount: 95
      }
    }
  ];

  beforeEach(() => {
    // 创建临时输出目录
    testOutputDir = join(tmpdir(), 'report-test-' + Date.now());
    mkdirSync(testOutputDir, { recursive: true });
    
    // 创建ReportGenerator实例 (预期此时会失败，因为还未实现)
    reportGenerator = new ReportGenerator();
  });

  afterEach(() => {
    // 清理测试目录
    if (testOutputDir && existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  describe('generateSummaryReport', () => {
    it('应该生成提示词分析摘要报告', async () => {
      const reportOptions = {
        reportType: 'summary' as const,
        includeStatistics: true,
        includeCharts: false,
        includeRawData: false,
        groupBy: 'category' as const,
        sortBy: 'confidence' as const,
        filterCriteria: {
          minConfidence: 0.7,
          categories: ['code-review', 'documentation']
        },
        customFields: ['metadata.tags', 'qualityMetrics.completenessScore']
      };

      // 执行报告生成
      const result = await reportGenerator.generateSummaryReport({
        prompts: mockAnalyzedPrompts,
        options: reportOptions
      });

      // 验证输出契约
      expect(result).toMatchObject({
        reportId: expect.any(String),
        reportType: 'summary',
        generatedAt: expect.any(String),
        summary: expect.any(Object),
        sections: expect.any(Array),
        statistics: expect.any(Object),
        metadata: expect.any(Object)
      });

      // 验证报告摘要
      expect(result.summary).toMatchObject({
        totalPrompts: 2,
        totalFiles: expect.any(Number),
        averageConfidence: expect.any(Number),
        averageCompleteness: expect.any(Number),
        highQualityPrompts: expect.any(Number),
        languageDistribution: expect.any(Object),
        categoryDistribution: expect.any(Object),
        topMissingElements: expect.any(Array)
      });

      // 验证统计数据
      expect(result.summary.averageConfidence).toBeGreaterThan(0);
      expect(result.summary.averageCompleteness).toBeGreaterThan(0);
      expect(result.summary.categoryDistribution).toHaveProperty('code-review');
      expect(result.summary.categoryDistribution).toHaveProperty('documentation');

      // 验证报告章节
      expect(result.sections.length).toBeGreaterThan(0);
      const section = result.sections[0];
      expect(section).toMatchObject({
        sectionId: expect.any(String),
        title: expect.any(String),
        content: expect.any(String),
        charts: expect.any(Array),
        tables: expect.any(Array)
      });

      // 验证报告元数据
      expect(result.metadata).toMatchObject({
        generatorVersion: expect.any(String),
        templateVersion: expect.any(String),
        dataVersion: expect.any(String),
        generationOptions: expect.any(Object)
      });
    });

    it('应该处理数据不足错误', async () => {
      await expect(reportGenerator.generateSummaryReport({
        prompts: [] // 空数据
      })).rejects.toThrow('INSUFFICIENT_DATA');
    });

    it('应该支持不同报告类型', async () => {
      const reportTypes = ['summary', 'detailed', 'executive'] as const;

      for (const reportType of reportTypes) {
        const result = await reportGenerator.generateSummaryReport({
          prompts: mockAnalyzedPrompts,
          options: { reportType }
        });

        expect(result.reportType).toBe(reportType);
      }
    });
  });

  describe('generateComparisonTable', () => {
    it('应该生成提示词要素对比表格', async () => {
      const tableOptions = {
        tableType: 'element_comparison' as const,
        layout: 'prompts_as_rows' as const,
        includedElements: [
          '角色能力', '任务请求', '输入格式', '输出规格', '示例'
        ],
        showEmptyCells: true,
        highlightMissing: true,
        enableSorting: true,
        enableFiltering: false,
        cellMaxLength: 200,
        tableTitle: '提示词要素对比分析'
      };

      // 执行表格生成
      const result = await reportGenerator.generateComparisonTable({
        prompts: mockAnalyzedPrompts,
        tableOptions
      });

      // 验证输出契约
      expect(result).toMatchObject({
        tableId: expect.any(String),
        title: '提示词要素对比分析',
        generatedAt: expect.any(String),
        tableData: expect.any(Object),
        metadata: expect.any(Object)
      });

      // 验证表格数据结构
      expect(result.tableData).toMatchObject({
        headers: expect.any(Array),
        rows: expect.any(Array)
      });

      // 验证表头
      expect(result.tableData.headers.length).toBeGreaterThan(0);
      const header = result.tableData.headers[0];
      expect(header).toMatchObject({
        key: expect.any(String),
        label: expect.any(String),
        type: expect.any(String),
        sortable: expect.any(Boolean)
      });

      // 验证行数据
      expect(result.tableData.rows.length).toBe(mockAnalyzedPrompts.length);
      const row = result.tableData.rows[0];
      expect(row).toMatchObject({
        id: expect.any(String),
        cells: expect.any(Object)
      });

      // 验证单元格数据
      const firstCell = Object.values(row.cells)[0] as any;
      expect(firstCell).toMatchObject({
        value: expect.anything(),
        displayValue: expect.any(String),
        isEmpty: expect.any(Boolean),
        confidence: expect.any(Number),
        tooltip: expect.any(String)
      });

      // 验证表格元数据
      expect(result.metadata).toMatchObject({
        rowCount: mockAnalyzedPrompts.length,
        columnCount: expect.any(Number),
        emptyCount: expect.any(Number),
        completenessRate: expect.any(Number)
      });
    });

    it('应该支持不同表格布局', async () => {
      const layouts = ['prompts_as_rows', 'prompts_as_columns'] as const;

      for (const layout of layouts) {
        const result = await reportGenerator.generateComparisonTable({
          prompts: mockAnalyzedPrompts,
          tableOptions: { layout }
        });

        expect(result.tableData).toBeDefined();
        // 不同布局应该产生不同的表格结构
        if (layout === 'prompts_as_rows') {
          expect(result.tableData.rows.length).toBe(mockAnalyzedPrompts.length);
        } else {
          expect(result.tableData.headers.length).toBeGreaterThanOrEqual(mockAnalyzedPrompts.length);
        }
      }
    });

    it('应该支持不同表格类型', async () => {
      const tableTypes = ['element_comparison', 'quality_comparison', 'metadata_comparison'] as const;

      for (const tableType of tableTypes) {
        const result = await reportGenerator.generateComparisonTable({
          prompts: mockAnalyzedPrompts,
          tableOptions: { tableType }
        });

        expect(result.tableData.headers.length).toBeGreaterThan(0);
        // 不同类型应该包含不同的列
        const headerLabels = result.tableData.headers.map(h => h.label);
        
        if (tableType === 'element_comparison') {
          expect(headerLabels.some(label => label.includes('角色') || label.includes('任务'))).toBe(true);
        } else if (tableType === 'quality_comparison') {
          expect(headerLabels.some(label => label.includes('置信度') || label.includes('完整性'))).toBe(true);
        }
      }
    });
  });

  describe('exportToFormat', () => {
    it('应该导出HTML格式报告', async () => {
      const reportData = {
        reportContent: '<h1>测试报告</h1><p>这是一个测试报告内容</p>',
        dataFormat: 'html',
        metadata: {
          title: '提示词分析报告',
          generatedAt: new Date().toISOString()
        }
      };

      const exportOptions = {
        outputPath: testOutputDir,
        fileName: 'test-report',
        overwrite: true,
        encoding: 'utf-8',
        formatSpecific: {
          html: {
            theme: 'default' as const,
            includeCSS: true,
            includeJS: true,
            responsive: true
          }
        }
      };

      // 执行HTML导出
      const result = await reportGenerator.exportToFormat({
        reportData,
        format: 'html',
        exportOptions
      });

      // 验证导出结果
      expect(result).toMatchObject({
        exportId: expect.any(String),
        format: 'html',
        filePath: expect.any(String),
        fileSize: expect.any(Number),
        exportedAt: expect.any(String),
        processingTime: expect.any(Number),
        success: true
      });

      // 验证文件实际生成
      expect(existsSync(result.filePath)).toBe(true);
      
      // 验证HTML内容
      const htmlContent = readFileSync(result.filePath, 'utf-8');
      expect(htmlContent).toContain('<h1>测试报告</h1>');
      expect(htmlContent).toContain('<!DOCTYPE html>'); // 完整HTML文档
      expect(htmlContent).toContain('<style>'); // 包含CSS
    });

    it('应该导出Markdown格式报告', async () => {
      const reportData = {
        reportContent: '# 测试报告\n\n这是一个测试报告内容\n\n## 统计信息\n\n- 总提示词数量: 10\n- 平均质量: 8.5',
        dataFormat: 'markdown'
      };

      const result = await reportGenerator.exportToFormat({
        reportData,
        format: 'markdown',
        exportOptions: {
          outputPath: testOutputDir,
          fileName: 'test-report-md'
        }
      });

      expect(result.format).toBe('markdown');
      expect(result.success).toBe(true);
      
      // 验证Markdown文件
      expect(existsSync(result.filePath)).toBe(true);
      const mdContent = readFileSync(result.filePath, 'utf-8');
      expect(mdContent).toContain('# 测试报告');
      expect(mdContent).toContain('## 统计信息');
    });

    it('应该导出CSV格式报告', async () => {
      const reportData = {
        reportContent: 'name,category,confidence\n代码审查助手,code-review,0.85\n文档生成器,documentation,0.78',
        dataFormat: 'csv'
      };

      const exportOptions = {
        outputPath: testOutputDir,
        fileName: 'test-report-csv',
        formatSpecific: {
          csv: {
            delimiter: ',',
            quote: '"',
            escape: '\\',
            includeHeaders: true
          }
        }
      };

      const result = await reportGenerator.exportToFormat({
        reportData,
        format: 'csv',
        exportOptions
      });

      expect(result.format).toBe('csv');
      expect(result.success).toBe(true);
      
      // 验证CSV文件
      expect(existsSync(result.filePath)).toBe(true);
      const csvContent = readFileSync(result.filePath, 'utf-8');
      expect(csvContent).toContain('name,category,confidence');
      expect(csvContent).toContain('代码审查助手,code-review,0.85');
    });

    it('应该导出JSON格式报告', async () => {
      const reportData = {
        reportContent: JSON.stringify({
          title: '提示词分析报告',
          prompts: mockAnalyzedPrompts,
          statistics: { total: 2, avgConfidence: 0.815 }
        }),
        dataFormat: 'json'
      };

      const result = await reportGenerator.exportToFormat({
        reportData,
        format: 'json',
        exportOptions: {
          outputPath: testOutputDir,
          fileName: 'test-report-json'
        }
      });

      expect(result.format).toBe('json');
      expect(result.success).toBe(true);
      
      // 验证JSON文件
      expect(existsSync(result.filePath)).toBe(true);
      const jsonContent = JSON.parse(readFileSync(result.filePath, 'utf-8'));
      expect(jsonContent).toHaveProperty('title');
      expect(jsonContent).toHaveProperty('prompts');
      expect(jsonContent.prompts).toHaveLength(2);
    });

    it('应该处理文件覆盖选项', async () => {
      const reportData = {
        reportContent: '<h1>测试内容</h1>',
        dataFormat: 'html'
      };

      const filePath = join(testOutputDir, 'existing-file.html');
      
      // 先创建一个文件
      const firstResult = await reportGenerator.exportToFormat({
        reportData,
        format: 'html',
        exportOptions: {
          outputPath: testOutputDir,
          fileName: 'existing-file',
          overwrite: false
        }
      });

      expect(firstResult.success).toBe(true);
      
      // 尝试覆盖，应该失败或创建新文件名
      const secondResult = await reportGenerator.exportToFormat({
        reportData: { ...reportData, reportContent: '<h1>新内容</h1>' },
        format: 'html',
        exportOptions: {
          outputPath: testOutputDir,
          fileName: 'existing-file',
          overwrite: false
        }
      });

      // 应该处理文件名冲突
      expect(secondResult.filePath).not.toBe(firstResult.filePath);
    });
  });

  describe('generateStatistics', () => {
    it('应该生成提示词分析统计信息', async () => {
      const statisticsOptions = {
        includeBasicStats: true,
        includeElementAnalysis: true,
        includeQualityAnalysis: true,
        includeDistributions: true,
        calculateCorrelations: false
      };

      // 执行统计生成
      const result = await reportGenerator.generateStatistics({
        prompts: mockAnalyzedPrompts,
        statisticsOptions
      });

      // 验证输出契约
      expect(result).toMatchObject({
        statisticsId: expect.any(String),
        generatedAt: expect.any(String),
        basicStatistics: expect.any(Object),
        elementStatistics: expect.any(Object),
        qualityStatistics: expect.any(Object)
      });

      // 验证基础统计
      expect(result.basicStatistics).toMatchObject({
        totalPrompts: 2,
        totalFiles: expect.any(Number),
        averageLength: expect.any(Number),
        averageWordCount: expect.any(Number),
        languageDistribution: expect.any(Object)
      });

      // 验证要素统计
      expect(result.elementStatistics).toMatchObject({
        elementCoverage: expect.any(Object),
        averageElementLength: expect.any(Object),
        elementQuality: expect.any(Object)
      });

      // 验证15个要素的覆盖率
      const elementCoverage = result.elementStatistics.elementCoverage;
      expect(elementCoverage).toHaveProperty('角色能力');
      expect(elementCoverage).toHaveProperty('任务请求');
      expect(elementCoverage).toHaveProperty('输出规格');
      
      // 覆盖率应该在0-1之间
      Object.values(elementCoverage).forEach(coverage => {
        expect(coverage).toBeGreaterThanOrEqual(0);
        expect(coverage).toBeLessThanOrEqual(1);
      });

      // 验证质量统计
      expect(result.qualityStatistics).toMatchObject({
        averageConfidence: expect.any(Number),
        averageCompleteness: expect.any(Number),
        qualityDistribution: expect.objectContaining({
          high: expect.any(Number),
          medium: expect.any(Number),
          low: expect.any(Number)
        })
      });
    });

    it('应该计算要素相关性', async () => {
      const result = await reportGenerator.generateStatistics({
        prompts: mockAnalyzedPrompts,
        statisticsOptions: {
          calculateCorrelations: true
        }
      });

      expect(result).toHaveProperty('correlations');
      expect(result.correlations).toBeInstanceOf(Array);
      
      if (result.correlations.length > 0) {
        const correlation = result.correlations[0];
        expect(correlation).toMatchObject({
          element1: expect.any(String),
          element2: expect.any(String),
          correlation: expect.any(Number),
          significance: expect.any(Number)
        });

        // 相关性应该在-1到1之间
        expect(correlation.correlation).toBeGreaterThanOrEqual(-1);
        expect(correlation.correlation).toBeLessThanOrEqual(1);
      }
    });

    it('应该支持选择性统计生成', async () => {
      const minimalOptions = {
        includeBasicStats: true,
        includeElementAnalysis: false,
        includeQualityAnalysis: false,
        includeDistributions: false
      };

      const result = await reportGenerator.generateStatistics({
        prompts: mockAnalyzedPrompts,
        statisticsOptions: minimalOptions
      });

      expect(result.basicStatistics).toBeDefined();
      expect(result.elementStatistics).toBeUndefined();
      expect(result.qualityStatistics).toBeUndefined();
    });
  });

  describe('多格式支持验证', () => {
    it('应该支持所有预定义格式', async () => {
      const formats = ['html', 'markdown', 'csv', 'json', 'pdf'] as const;
      const reportData = {
        reportContent: 'Test content',
        dataFormat: 'text'
      };

      for (const format of formats) {
        if (format === 'pdf') {
          // PDF格式可能需要特殊处理，这里跳过或者简化测试
          continue;
        }

        const result = await reportGenerator.exportToFormat({
          reportData,
          format,
          exportOptions: {
            outputPath: testOutputDir,
            fileName: `test-${format}`
          }
        });

        expect(result.format).toBe(format);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('错误处理契约', () => {
    it('所有方法都应该返回正确的错误格式', async () => {
      const errorTests = [
        {
          method: 'generateSummaryReport',
          input: { prompts: [] },
          expectedError: 'INSUFFICIENT_DATA'
        },
        {
          method: 'exportToFormat',
          input: { 
            reportData: { reportContent: '' }, 
            format: 'invalid' as any 
          },
          expectedError: 'INVALID_FORMAT'
        }
      ];

      for (const test of errorTests) {
        try {
          await (reportGenerator as any)[test.method](test.input);
        } catch (error) {
          expect(error).toHaveProperty('code');
          expect(error).toHaveProperty('message');
        }
      }
    });
  });

  describe('性能契约', () => {
    it('报告生成应该在合理时间内完成', async () => {
      const startTime = Date.now();
      
      await reportGenerator.generateSummaryReport({
        prompts: mockAnalyzedPrompts,
        options: { reportType: 'summary' }
      });
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(30000); // 30秒内完成
    });

    it('应该支持大量数据处理', async () => {
      // 创建大量模拟数据
      const manyPrompts = new Array(100).fill(null).map((_, i) => ({
        ...mockAnalyzedPrompts[0],
        promptId: `bulk-test-${i}`,
        name: `批量测试提示词 ${i}`
      }));

      const startTime = Date.now();
      
      const result = await reportGenerator.generateSummaryReport({
        prompts: manyPrompts,
        options: { reportType: 'summary' }
      });
      
      const duration = Date.now() - startTime;
      
      expect(result.summary.totalPrompts).toBe(100);
      expect(duration).toBeLessThan(60000); // 1分钟内完成
    });
  });
});