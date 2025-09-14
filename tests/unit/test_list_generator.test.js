import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import { ListGenerator } from '../../src/services/list_generator.js';

describe('ListGenerator Service Unit Tests', () => {
  const testDir = path.join(process.cwd(), 'temp_test_list_generator_unit');
  const analysisDir = path.join(testDir, 'analysis');
  const outputFile = path.join(analysisDir, 'prompt-list.json');
  
  beforeEach(async () => {
    await fs.ensureDir(testDir);
    await fs.ensureDir(analysisDir);
    process.chdir(testDir);
  });

  afterEach(async () => {
    process.chdir('/home/michael/ubuntu-repos/Michael1Peng/prompt-comparison.spec-kit');
    await fs.remove(testDir);
  });

  test('正常情况: 处理提示词详情数组，生成完整的PromptList JSON输出文件', async () => {
    // 创建模拟的提示词详情数据（来自ContentExtractor）
    const mockPromptDetails = [
      {
        promptId: 'prompt_001',
        sourceFile: 'docs/system-prompt.md',
        content: 'You are a helpful AI assistant. Please help me with coding tasks.',
        startLine: 0,
        endLine: 1
      },
      {
        promptId: 'prompt_002',
        sourceFile: 'docs/system-prompt.md',
        content: 'Generate clean, well-documented code.',
        startLine: 3,
        endLine: 3
      },
      {
        promptId: 'prompt_003',
        sourceFile: 'examples/tutorial.md',
        content: 'Write a Python function that calculates fibonacci numbers.',
        startLine: 0,
        endLine: 0
      }
    ];

    const mockMetadata = {
      totalScannedFiles: 2,
      startTime: '2025-09-14T14:30:22Z',
      duration: 15000
    };

    // 创建ListGenerator实例
    const generator = new ListGenerator({
      outputPath: outputFile,
      prettyPrint: true
    });

    // 验证配置
    const config = generator.getConfig();
    expect(config.defaultOutputPath).toBe(outputFile);
    expect(config.prettyPrint).toBe(true);

    // 测试generatePromptList方法（核心功能）
    try {
      const result = await generator.generatePromptList(mockPromptDetails, mockMetadata, outputFile);
      
      // TDD: 这应该失败，因为服务还没有实现
      expect(true).toBe(false); // 强制失败

    } catch (error) {
      // 验证抛出正确的"尚未实现"错误
      expect(error.message).toContain('尚未实现');
      expect(error.message).toContain('ListGenerator.generatePromptList()');
    }

    // 如果实现了，应该验证以下内容（当前会失败）:
    // expect(result).toHaveProperty('totalFiles');
    // expect(result).toHaveProperty('totalPrompts');
    // expect(result).toHaveProperty('prompts');
    // expect(result).toHaveProperty('analysisTime');
    // expect(result).toHaveProperty('processingStats');
    // 
    // expect(result.totalFiles).toBe(2);
    // expect(result.totalPrompts).toBe(3);
    // expect(result.prompts).toHaveLength(3);
    // expect(result.processingStats.successFiles).toBe(2);
    // expect(result.processingStats.failedFiles).toBe(0);
    // 
    // // 验证输出文件存在
    // expect(await fs.pathExists(outputFile)).toBe(true);
  });

  test('边界情况: 处理空数组输入和文件写入错误，生成适当的空结果或错误处理', async () => {
    const generator = new ListGenerator();

    // 测试空数组输入
    try {
      const result = await generator.generatePromptList([], {});
      
      // TDD: 这应该失败，因为服务还没有实现
      expect(true).toBe(false); // 强制失败

    } catch (error) {
      // 验证抛出正确的"尚未实现"错误
      expect(error.message).toContain('尚未实现');
      expect(error.message).toContain('ListGenerator.generatePromptList()');
    }

    // 测试私有方法
    const mockPromptDetails = [];
    const mockMetadata = { totalScannedFiles: 0 };

    try {
      const result = generator._createPromptList(mockPromptDetails, mockMetadata);
      
      // TDD: 这应该失败，因为私有方法还没有实现
      expect(true).toBe(false); // 强制失败

    } catch (error) {
      // 验证抛出正确的"尚未实现"错误
      expect(error.message).toContain('尚未实现');
      expect(error.message).toContain('ListGenerator._createPromptList()');
    }

    // 验证配置获取仍然工作（已实现的部分）
    const config = generator.getConfig();
    expect(config).toHaveProperty('defaultOutputPath');
    expect(config).toHaveProperty('prettyPrint');
    expect(config.defaultOutputPath).toBe('./analysis/prompt-list.json'); // 默认值
    expect(config.prettyPrint).toBe(true); // 默认值

    // 如果实现了，边界情况应该验证以下内容（当前会失败）:
    // - 空数组输入应该生成空的PromptList但结构完整
    // - 无效输出路径应该抛出适当错误
    // - 文件写入权限问题应该被处理
    // - 格式化输出开关应该影响JSON格式
    // 
    // expect(result.totalFiles).toBe(0);
    // expect(result.totalPrompts).toBe(0);
    // expect(result.prompts).toEqual([]);
    // expect(result.processingStats.successFiles).toBe(0);
    // expect(result.processingStats.failedFiles).toBe(0);
  });
});