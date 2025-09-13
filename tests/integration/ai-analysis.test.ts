/**
 * AI分析集成测试
 * 测试提示词分析15要素完整流程
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PromptAnalyzer } from '@/services/prompt-analyzer';

describe('AI分析集成测试', () => {
  let promptAnalyzer: PromptAnalyzer;

  const mockPrompts = [
    {
      promptId: 'integration-001',
      name: '代码审查专家',
      content: `你是一个资深的代码审查专家，具有10年以上的软件开发经验。

## 任务
请对提供的代码进行全面审查，重点关注以下方面：
1. 代码质量和可读性
2. 性能优化机会
3. 安全漏洞检测
4. 最佳实践遵循

## 输入格式
代码片段（支持多种编程语言）

## 输出格式
请按以下结构返回审查结果：
- 质量评分：1-10分
- 发现的问题：具体描述
- 改进建议：可行的优化方案
- 安全评估：潜在风险说明

## 示例
输入：function add(a, b) { return a + b; }
输出：评分9分，代码简洁清晰，建议添加参数类型验证

请保持专业客观的态度。`,
      sourceInfo: {
        filePath: '/prompts/code-review.md',
        startLine: 1,
        endLine: 25
      }
    }
  ];

  beforeEach(() => {
    promptAnalyzer = new PromptAnalyzer();
  });

  it('应该完成15要素分析完整流程', async () => {
    const result = await promptAnalyzer.analyzePrompt({
      prompt: mockPrompts[0],
      options: {
        aiProvider: 'qwen',
        analysisDepth: 'detailed',
        language: 'zh'
      }
    });

    // 验证15个要素都存在
    expect(result.elements).toMatchObject({
      所在文件: expect.any(String),
      角色能力: expect.stringContaining('代码审查专家'),
      任务请求: expect.stringContaining('代码进行全面审查'),
      背景情境: expect.any(String),
      指令行动: expect.stringContaining('代码质量'),
      输入格式: expect.stringContaining('代码片段'),
      输出规格: expect.stringContaining('质量评分'),
      示例: expect.stringContaining('function add'),
      限制约束: expect.any(String),
      目标期望: expect.any(String),
      信息: expect.any(String),
      评估优化: expect.any(String),
      调整: expect.any(String),
      受众: expect.any(String),
      风格要求: expect.stringContaining('专业客观')
    });

    expect(result.qualityMetrics.elementsFound).toBe(15);
  });
});