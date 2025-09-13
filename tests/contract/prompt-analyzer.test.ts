/**
 * PromptAnalyzer 契约测试
 * 基于 contracts/prompt-analyzer.json 定义的API契约
 * 
 * 测试目标：
 * - analyzePrompt: 分析单个提示词的框架要素
 * - analyzeBatch: 批量分析多个提示词
 * - validateAnalysis: 验证分析结果的完整性和质量
 * - retryAnalysis: 重新分析失败或低质量的提示词
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PromptAnalyzer } from '@/services/prompt-analyzer';

describe('PromptAnalyzer 契约测试', () => {
  let promptAnalyzer: PromptAnalyzer;

  beforeEach(() => {
    // 创建PromptAnalyzer实例 (预期此时会失败，因为还未实现)
    promptAnalyzer = new PromptAnalyzer();
  });

  describe('analyzePrompt', () => {
    it('应该分析单个提示词的15个框架要素', async () => {
      // 测试提示词
      const promptInput = {
        promptId: 'test-prompt-001',
        name: '代码审查助手',
        content: `你是一个专业的代码审查专家。请分析以下JavaScript代码并提供改进建议。

## 任务要求
1. 检查代码质量
2. 识别潜在bug
3. 提供优化建议

## 输入格式
请提供要审查的JavaScript代码片段

## 输出格式
请按以下格式返回：
- 代码质量评分 (1-10)
- 发现的问题列表
- 改进建议

## 示例
输入：function add(a, b) { return a + b; }
输出：评分9分，无明显问题，建议添加类型注解

请保持专业和建设性的语调。`,
        sourceInfo: {
          filePath: '/test/prompts/code-review.md',
          startLine: 1,
          endLine: 20,
          context: '# Code Review Prompts'
        },
        metadata: {
          language: 'zh',
          category: 'code-review',
          tags: ['javascript', 'review', 'quality'],
          complexity: 7
        }
      };

      const analysisOptions = {
        aiProvider: 'qwen' as const,
        model: 'qwen-plus',
        language: 'zh' as const,
        analysisDepth: 'standard' as const,
        includeConfidence: true,
        enableRetry: true,
        retryCount: 2,
        timeout: 45000,
        temperature: 0.3
      };

      // 执行分析
      const result = await promptAnalyzer.analyzePrompt({
        prompt: promptInput,
        options: analysisOptions
      });

      // 验证输出契约
      expect(result).toMatchObject({
        analysisId: expect.any(String),
        promptId: 'test-prompt-001',
        analysisTimestamp: expect.any(String),
        status: expect.stringMatching(/^(completed|failed|partial)$/),
        elements: expect.any(Object),
        qualityMetrics: expect.any(Object),
        metadata: expect.any(Object)
      });

      // 验证15个分析要素
      expect(result.elements).toMatchObject({
        所在文件: expect.any(String),
        角色能力: expect.any(String),
        任务请求: expect.any(String),
        背景情境: expect.any(String),
        指令行动: expect.any(String),
        输入格式: expect.any(String),
        输出规格: expect.any(String),
        示例: expect.any(String),
        限制约束: expect.any(String),
        目标期望: expect.any(String),
        信息: expect.any(String),
        评估优化: expect.any(String),
        调整: expect.any(String),
        受众: expect.any(String),
        风格要求: expect.any(String)
      });

      // 验证质量指标
      expect(result.qualityMetrics).toMatchObject({
        overallConfidence: expect.any(Number),
        completenessScore: expect.any(Number),
        elementsFound: expect.any(Number),
        averageElementLength: expect.any(Number),
        totalAnalysisWords: expect.any(Number)
      });

      // 验证置信度范围
      expect(result.qualityMetrics.overallConfidence).toBeGreaterThanOrEqual(0);
      expect(result.qualityMetrics.overallConfidence).toBeLessThanOrEqual(1);
      expect(result.qualityMetrics.completenessScore).toBeGreaterThanOrEqual(0);
      expect(result.qualityMetrics.completenessScore).toBeLessThanOrEqual(1);
      expect(result.qualityMetrics.elementsFound).toBeGreaterThanOrEqual(0);
      expect(result.qualityMetrics.elementsFound).toBeLessThanOrEqual(15);

      // 验证分析元数据
      expect(result.metadata).toMatchObject({
        processingTime: expect.any(Number),
        modelUsed: 'qwen-plus',
        apiProvider: 'qwen',
        tokenUsage: expect.objectContaining({
          inputTokens: expect.any(Number),
          outputTokens: expect.any(Number),
          totalTokens: expect.any(Number)
        }),
        retryCount: expect.any(Number)
      });
    });

    it('应该处理AI API不可用错误', async () => {
      const invalidPrompt = {
        promptId: 'invalid-001',
        content: 'test content'
      };

      const invalidOptions = {
        aiProvider: 'invalid' as any,
        model: 'non-existent-model'
      };

      await expect(promptAnalyzer.analyzePrompt({
        prompt: invalidPrompt,
        options: invalidOptions
      })).rejects.toThrow('AI_API_UNAVAILABLE');
    });

    it('应该处理分析超时', async () => {
      const promptInput = {
        promptId: 'timeout-test',
        content: 'A very long prompt that might timeout...'
      };

      const timeoutOptions = {
        timeout: 1 // 1ms 极短超时
      };

      await expect(promptAnalyzer.analyzePrompt({
        prompt: promptInput,
        options: timeoutOptions
      })).rejects.toThrow('ANALYSIS_TIMEOUT');
    });

    it('应该处理过长提示词', async () => {
      const longContent = 'a'.repeat(1000000); // 1MB 内容
      const longPrompt = {
        promptId: 'long-prompt',
        content: longContent
      };

      await expect(promptAnalyzer.analyzePrompt({
        prompt: longPrompt
      })).rejects.toThrow('PROMPT_TOO_LONG');
    });

    it('应该处理无效提示词格式', async () => {
      const invalidPrompt = {
        promptId: '', // 空ID
        content: '' // 空内容
      };

      await expect(promptAnalyzer.analyzePrompt({
        prompt: invalidPrompt
      })).rejects.toThrow('INVALID_PROMPT_FORMAT');
    });
  });

  describe('analyzeBatch', () => {
    it('应该批量分析多个提示词', async () => {
      const prompts = [
        {
          promptId: 'batch-001',
          name: '翻译助手',
          content: '你是一个专业的翻译助手，请将以下中文翻译成英文。保持原意不变，语言流畅自然。'
        },
        {
          promptId: 'batch-002', 
          name: '文档助手',
          content: '你是一个技术文档编写专家。请根据提供的API接口信息，编写详细的使用文档。'
        },
        {
          promptId: 'batch-003',
          name: '代码生成器',
          content: '你是一个代码生成助手。请根据需求描述，生成对应的TypeScript代码实现。'
        }
      ];

      const batchOptions = {
        aiProvider: 'qwen' as const,
        model: 'qwen-plus',
        batchSize: 2,
        concurrency: 2,
        stopOnError: false,
        progressCallback: true,
        language: 'zh' as const,
        analysisDepth: 'standard' as const
      };

      // 执行批量分析
      const result = await promptAnalyzer.analyzeBatch({
        prompts,
        options: batchOptions
      });

      // 验证批量分析结果
      expect(result).toMatchObject({
        batchId: expect.any(String),
        startTime: expect.any(String),
        endTime: expect.any(String),
        totalDuration: expect.any(Number),
        totalPrompts: 3,
        successCount: expect.any(Number),
        failureCount: expect.any(Number),
        results: expect.any(Array),
        errors: expect.any(Array),
        statistics: expect.any(Object)
      });

      // 验证结果数量
      expect(result.results.length + result.errors.length).toBe(3);
      expect(result.successCount + result.failureCount).toBe(3);

      // 验证成功的分析结果
      if (result.results.length > 0) {
        const successResult = result.results[0];
        expect(successResult).toMatchObject({
          analysisId: expect.any(String),
          promptId: expect.any(String),
          analysisTimestamp: expect.any(String),
          status: 'completed',
          elements: expect.any(Object)
        });
      }

      // 验证统计信息
      expect(result.statistics).toMatchObject({
        averageProcessingTime: expect.any(Number),
        averageConfidence: expect.any(Number),
        averageCompleteness: expect.any(Number),
        totalTokensUsed: expect.any(Number),
        totalApiCalls: expect.any(Number),
        estimatedCost: expect.any(Number)
      });
    });

    it('应该处理批处理大小超出限制', async () => {
      const manyPrompts = new Array(100).fill(null).map((_, i) => ({
        promptId: `prompt-${i}`,
        content: `Test prompt ${i}`
      }));

      const invalidBatchOptions = {
        batchSize: 50 // 超出最大限制
      };

      await expect(promptAnalyzer.analyzeBatch({
        prompts: manyPrompts,
        options: invalidBatchOptions
      })).rejects.toThrow('BATCH_SIZE_EXCEEDED');
    });

    it('应该处理部分批处理失败', async () => {
      const mixedPrompts = [
        { promptId: 'valid-1', content: 'Valid prompt content' },
        { promptId: '', content: '' }, // 无效提示词
        { promptId: 'valid-2', content: 'Another valid prompt' }
      ];

      const result = await promptAnalyzer.analyzeBatch({
        prompts: mixedPrompts,
        options: { stopOnError: false }
      });

      expect(result.successCount).toBeGreaterThan(0);
      expect(result.failureCount).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateAnalysis', () => {
    it('应该验证分析结果的完整性和质量', async () => {
      // 模拟分析结果
      const analysisResult = {
        analysisId: 'test-analysis-001',
        promptId: 'test-prompt-001',
        analysisTimestamp: new Date().toISOString(),
        status: 'completed' as const,
        elements: {
          所在文件: '/test/prompt.md',
          角色能力: '专业的代码审查专家',
          任务请求: '分析JavaScript代码并提供改进建议',
          背景情境: '代码质量检查场景',
          指令行动: '1. 检查代码质量 2. 识别潜在bug 3. 提供优化建议',
          输入格式: 'JavaScript代码片段',
          输出规格: '评分、问题列表、改进建议',
          示例: '输入：function add(a, b) { return a + b; }',
          限制约束: '保持专业和建设性语调',
          目标期望: '提高代码质量',
          信息: '代码审查最佳实践',
          评估优化: '根据代码质量标准评估',
          调整: '可调整检查严格程度',
          受众: '开发者',
          风格要求: '专业、建设性'
        },
        qualityMetrics: {
          overallConfidence: 0.85,
          completenessScore: 0.9,
          elementsFound: 15,
          averageElementLength: 25,
          totalAnalysisWords: 150
        },
        metadata: {
          processingTime: 2500,
          modelUsed: 'qwen-plus',
          apiProvider: 'qwen'
        }
      };

      const validationRules = {
        minConfidence: 0.6,
        minCompleteness: 0.7,
        requiredElements: ['角色能力', '任务请求', '输出规格'],
        minElementLength: 10,
        maxEmptyElements: 5
      };

      // 执行验证
      const result = await promptAnalyzer.validateAnalysis({
        analysisResult,
        validationRules
      });

      // 验证结果
      expect(result).toMatchObject({
        isValid: expect.any(Boolean),
        validationScore: expect.any(Number),
        violations: expect.any(Array),
        recommendations: expect.any(Array)
      });

      expect(result.validationScore).toBeGreaterThanOrEqual(0);
      expect(result.validationScore).toBeLessThanOrEqual(1);

      // 如果有违规，应该有详细信息
      if (result.violations.length > 0) {
        const violation = result.violations[0];
        expect(violation).toMatchObject({
          rule: expect.any(String),
          message: expect.any(String),
          severity: expect.stringMatching(/^(error|warning|info)$/)
        });
      }
    });

    it('应该检测低质量分析结果', async () => {
      const lowQualityResult = {
        analysisId: 'low-quality-001',
        promptId: 'test-prompt',
        analysisTimestamp: new Date().toISOString(),
        status: 'completed' as const,
        elements: {
          所在文件: '',
          角色能力: '',
          任务请求: 'unclear task',
          背景情境: '',
          指令行动: '',
          输入格式: '',
          输出规格: '',
          示例: '',
          限制约束: '',
          目标期望: '',
          信息: '',
          评估优化: '',
          调整: '',
          受众: '',
          风格要求: ''
        },
        qualityMetrics: {
          overallConfidence: 0.3,
          completenessScore: 0.2,
          elementsFound: 1
        }
      };

      const result = await promptAnalyzer.validateAnalysis({
        analysisResult: lowQualityResult
      });

      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('retryAnalysis', () => {
    it('应该重新分析失败或低质量的提示词', async () => {
      const promptId = 'retry-test-001';
      const retryOptions = {
        retryReason: 'Low confidence score',
        useAlternativeModel: true,
        adjustedSettings: {
          aiProvider: 'qwen' as const,
          model: 'qwen-coder-plus',
          temperature: 0.1, // 降低随机性
          timeout: 60000 // 增加超时时间
        }
      };

      // 执行重试分析
      const result = await promptAnalyzer.retryAnalysis({
        promptId,
        retryOptions
      });

      // 验证重试结果
      expect(result).toMatchObject({
        analysisId: expect.any(String),
        promptId: promptId,
        analysisTimestamp: expect.any(String),
        status: expect.stringMatching(/^(completed|failed|partial)$/),
        elements: expect.any(Object),
        qualityMetrics: expect.any(Object),
        metadata: expect.any(Object)
      });

      // 验证使用了调整后的设置
      expect(result.metadata.modelUsed).toBe('qwen-coder-plus');
    });

    it('应该记录重试原因和次数', async () => {
      const result = await promptAnalyzer.retryAnalysis({
        promptId: 'retry-tracking-test',
        retryOptions: {
          retryReason: 'API timeout during initial analysis'
        }
      });

      expect(result.metadata).toHaveProperty('retryCount');
      expect(result.metadata.retryCount).toBeGreaterThan(0);
    });
  });

  describe('15个要素分析验证', () => {
    it('应该正确识别角色能力要素', async () => {
      const promptWithRole = {
        promptId: 'role-test',
        content: '你是一个资深的Python开发专家，具有10年以上的编程经验。'
      };

      const result = await promptAnalyzer.analyzePrompt({
        prompt: promptWithRole
      });

      expect(result.elements.角色能力).toContain('Python开发专家');
      expect(result.elements.角色能力).toContain('10年');
    });

    it('应该正确识别任务请求要素', async () => {
      const promptWithTask = {
        promptId: 'task-test', 
        content: '请帮我优化这段SQL查询语句，提高查询性能。'
      };

      const result = await promptAnalyzer.analyzePrompt({
        prompt: promptWithTask
      });

      expect(result.elements.任务请求).toContain('优化');
      expect(result.elements.任务请求).toContain('SQL查询');
    });

    it('应该正确识别背景情境要素', async () => {
      const promptWithContext = {
        promptId: 'context-test',
        content: '在微服务架构环境下，我们需要设计一个高可用的用户认证系统。'
      };

      const result = await promptAnalyzer.analyzePrompt({
        prompt: promptWithContext
      });

      expect(result.elements.背景情境).toContain('微服务架构');
      expect(result.elements.背景情境).toContain('用户认证系统');
    });
  });

  describe('错误处理契约', () => {
    it('所有方法都应该返回正确的错误格式', async () => {
      const errorTests = [
        {
          method: 'analyzePrompt',
          input: { prompt: { promptId: '', content: '' } },
          expectedError: 'INVALID_PROMPT_FORMAT'
        },
        {
          method: 'analyzeBatch', 
          input: { prompts: [], options: { batchSize: 100 } },
          expectedError: 'BATCH_SIZE_EXCEEDED'
        }
      ];

      for (const test of errorTests) {
        try {
          await (promptAnalyzer as any)[test.method](test.input);
        } catch (error) {
          expect(error).toHaveProperty('code');
          expect(error).toHaveProperty('message');
          expect(error.code).toBe(test.expectedError);
        }
      }
    });
  });

  describe('性能契约', () => {
    it('单个提示词分析应该在合理时间内完成', async () => {
      const prompt = {
        promptId: 'perf-test',
        content: '测试性能的简单提示词'
      };

      const startTime = Date.now();
      await promptAnalyzer.analyzePrompt({ prompt });
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(60000); // 60秒内完成
    });

    it('批量分析应该支持并发处理', async () => {
      const prompts = new Array(10).fill(null).map((_, i) => ({
        promptId: `concurrent-${i}`,
        content: `Concurrent test prompt ${i}`
      }));

      const startTime = Date.now();
      await promptAnalyzer.analyzeBatch({
        prompts,
        options: { concurrency: 5 }
      });
      const duration = Date.now() - startTime;

      // 并发处理应该比串行处理快
      expect(duration).toBeLessThan(prompts.length * 5000); // 假设单个分析5秒内
    });
  });
});