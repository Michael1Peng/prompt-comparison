/**
 * JSON输出功能集成测试
 * 每个功能2个测试用例
 */

import { describe, test, expect, afterEach } from '@jest/globals';
import { PromptExtractor } from '../../src/services/prompt_extractor.js';
import { PromptDetail, PromptList } from '../../src/models/prompt_models.js';
import fs from 'fs-extra';
import path from 'path';

describe('JSON Output Generation', () => {
  const testOutputPath = 'tests/fixtures/test-json-output.json';
  const extractor = new PromptExtractor({
    outputPath: testOutputPath
  });
  
  afterEach(async () => {
    // 清理测试输出文件
    await fs.remove(testOutputPath);
  });
  
  test('正常情况：生成符合规格的JSON输出', async () => {
    // 创建测试数据
    const promptList = new PromptList({
      totalFiles: 3,
      totalPrompts: 0,
      processingStats: {
        successfulFiles: 0,
        failedFiles: 0,
        errors: []
      },
      analysisTime: '2025-09-14T10:00:00Z',
      prompts: []
    });
    
    // 添加提示词
    promptList.addPrompt(new PromptDetail({
      promptId: 'prompt_001',
      sourceFile: 'test.md',
      content: 'You are an AI assistant.',
      startLine: 1,
      endLine: 1
    }));
    
    promptList.addPrompt(new PromptDetail({
      promptId: 'prompt_002',
      sourceFile: 'test2.md',
      content: 'Generate a function.',
      startLine: 5,
      endLine: 10
    }));
    
    promptList.markFileSuccess();
    promptList.markFileSuccess();
    
    // 生成输出
    const outputPath = await extractor.generateOutput(promptList);
    
    // 验证文件存在
    expect(await fs.pathExists(outputPath)).toBe(true);
    
    // 读取并验证内容
    const outputData = await fs.readJson(outputPath);
    
    expect(outputData.totalFiles).toBe(3);
    expect(outputData.totalPrompts).toBe(2);
    expect(outputData.processingStats.successfulFiles).toBe(2);
    expect(outputData.processingStats.failedFiles).toBe(0);
    expect(outputData.prompts).toHaveLength(2);
    expect(outputData.prompts[0].promptId).toBe('prompt_001');
    expect(outputData.prompts[1].promptId).toBe('prompt_002');
    expect(outputData.analysisTime).toBeDefined();
  });

  test('边界情况：处理空提示词列表', async () => {
    // 创建空的提示词列表
    const promptList = new PromptList({
      totalFiles: 0,
      totalPrompts: 0,
      processingStats: {
        successfulFiles: 0,
        failedFiles: 0,
        errors: []
      },
      prompts: []
    });
    
    // 生成输出
    const outputPath = await extractor.generateOutput(promptList);
    
    // 验证文件存在
    expect(await fs.pathExists(outputPath)).toBe(true);
    
    // 读取并验证内容
    const outputData = await fs.readJson(outputPath);
    
    expect(outputData.totalFiles).toBe(0);
    expect(outputData.totalPrompts).toBe(0);
    expect(outputData.prompts).toHaveLength(0);
    expect(outputData.processingStats).toBeDefined();
    expect(outputData.analysisTime).toBeDefined();
  });
});