/**
 * 报告生成集成测试
 * 测试分析→报告→输出完整流程
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ReportGenerator } from '@/services/report-generator';

describe('报告生成集成测试', () => {
  let reportGenerator: ReportGenerator;

  const mockAnalyzedPrompts = [
    {
      promptId: 'report-001',
      name: '代码审查助手',
      analysis: {
        角色能力: '专业代码审查专家',
        任务请求: '进行代码质量审查',
        输出规格: '结构化审查报告'
      },
      qualityMetrics: {
        overallConfidence: 0.85,
        completenessScore: 0.9
      }
    }
  ];

  beforeEach(() => {
    reportGenerator = new ReportGenerator();
  });

  it('应该生成对比表格完整流程', async () => {
    const result = await reportGenerator.generateComparisonTable({
      prompts: mockAnalyzedPrompts,
      tableOptions: {
        tableType: 'element_comparison',
        layout: 'prompts_as_rows'
      }
    });

    expect(result.tableData.headers.length).toBeGreaterThan(0);
    expect(result.tableData.rows.length).toBe(1);
  });
});