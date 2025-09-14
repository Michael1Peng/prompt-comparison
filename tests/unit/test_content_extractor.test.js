import pkg from '@jest/globals';
const { describe, test, expect, beforeEach, afterEach } = pkg;
import fs from 'fs-extra';
import path from 'path';
import { ContentExtractor } from '../../src/services/content_extractor.js';

describe('ContentExtractor Service Unit Tests', () => {
  const testDir = path.join(process.cwd(), 'temp_test_content_extractor_unit');
  
  beforeEach(async () => {
    await fs.ensureDir(testDir);
    process.chdir(testDir);
  });

  afterEach(async () => {
    process.chdir('/home/michael/ubuntu-repos/Michael1Peng/prompt-comparison.spec-kit');
    await fs.remove(testDir);
  });

  test('正常情况: 处理提示词文件数组，使用AI提取具体提示词内容和位置信息', async () => {
    // 创建模拟的提示词文件数据（来自第一步工具）
    const mockPromptFiles = [
      {
        filePath: 'docs/system-prompt.md',
        fileName: 'system-prompt.md',
        content: 'You are a helpful AI assistant. Please help me with coding tasks.\n\nGenerate clean, well-documented code.',
        isPrompt: true,
        confidence: 0.95,
        language: null,
        category: 'code-generation'
      },
      {
        filePath: 'examples/tutorial.md',
        fileName: 'tutorial.md',
        content: 'Write a Python function that calculates fibonacci numbers.\n\nMake sure to include error handling and comments.',
        isPrompt: true,
        confidence: 0.88,
        language: 'python',
        category: 'tutorial'
      }
    ];

    // 创建ContentExtractor实例
    const extractor = new ContentExtractor({
      concurrencyLimit: 3,
      model: 'gpt-5',
      temperature: 0.1
    });

    // 验证配置
    const config = extractor.getConfig();
    expect(config.concurrencyLimit).toBe(3);
    expect(config.model).toBe('gpt-5');
    expect(config.temperature).toBe(0.1);

    // 测试extractPromptDetails方法（核心功能）
    try {
      const result = await extractor.extractPromptDetails(mockPromptFiles);
      
      // TDD: 这应该失败，因为服务还没有实现
      expect(true).toBe(false); // 强制失败

    } catch (error) {
      // 验证抛出正确的"尚未实现"错误
      expect(error.message).toContain('尚未实现');
      expect(error.message).toContain('ContentExtractor.extractPromptDetails()');
    }

    // 如果实现了，应该验证以下内容（当前会失败）:
    // expect(Array.isArray(result)).toBe(true);
    // expect(result.length).toBeGreaterThan(0);
    // 
    // const firstDetail = result[0];
    // expect(firstDetail).toHaveProperty('promptId');
    // expect(firstDetail).toHaveProperty('sourceFile');
    // expect(firstDetail).toHaveProperty('content');
    // expect(firstDetail).toHaveProperty('startLine');
    // expect(firstDetail).toHaveProperty('endLine');
    // 
    // expect(typeof firstDetail.promptId).toBe('string');
    // expect(firstDetail.promptId).toMatch(/^prompt_\d+$/);
    // expect(typeof firstDetail.startLine).toBe('number');
    // expect(typeof firstDetail.endLine).toBe('number');
    // expect(firstDetail.endLine).toBeGreaterThanOrEqual(firstDetail.startLine);
  });

  test('边界情况: 处理空数组和无效输入，返回空结果或抛出适当错误', async () => {
    const extractor = new ContentExtractor();

    // 测试空数组输入
    try {
      const result = await extractor.extractPromptDetails([]);
      
      // TDD: 这应该失败，因为服务还没有实现
      expect(true).toBe(false); // 强制失败

    } catch (error) {
      // 验证抛出正确的"尚未实现"错误
      expect(error.message).toContain('尚未实现');
      expect(error.message).toContain('ContentExtractor.extractPromptDetails()');
    }

    // 测试私有方法（边界情况的一部分）
    const mockPromptFile = {
      filePath: 'test.md',
      fileName: 'test.md',
      content: 'Test content',
      isPrompt: true,
      confidence: 0.9
    };

    try {
      const result = await extractor._extractFromFile(mockPromptFile);
      
      // TDD: 这应该失败，因为私有方法还没有实现
      expect(true).toBe(false); // 强制失败

    } catch (error) {
      // 验证抛出正确的"尚未实现"错误
      expect(error.message).toContain('尚未实现');
      expect(error.message).toContain('ContentExtractor._extractFromFile()');
    }

    // 验证配置获取仍然工作（已实现的部分）
    const config = extractor.getConfig();
    expect(config).toHaveProperty('concurrencyLimit');
    expect(config).toHaveProperty('model');
    expect(config).toHaveProperty('temperature');
    expect(config.concurrencyLimit).toBe(5); // 默认值
    expect(config.model).toBe('gpt-5'); // 默认值
    expect(config.temperature).toBe(0.1); // 默认值

    // 如果实现了，边界情况应该验证以下内容（当前会失败）:
    // - 空数组输入应该返回空数组
    // - 无效的promptFiles应该被跳过
    // - API调用失败时应该记录错误并继续处理其他文件
    // - 并发限制应该生效
    // 
    // expect(result).toEqual([]); // 空输入返回空数组
    // expect(extractor.concurrencyLimit).toBe(5);
  });
});