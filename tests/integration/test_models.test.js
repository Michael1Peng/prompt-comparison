/**
 * 数据模型集成测试
 * 每个功能只保留2个核心测试用例
 */

import { describe, test, expect } from '@jest/globals';
import { PromptDetail, PromptList } from '../../src/models/prompt_models.js';
import fs from 'fs-extra';

describe('PromptDetail Model', () => {
  test('正常情况：创建有效的PromptDetail实例', () => {
    const promptData = {
      promptId: 'prompt_001',
      sourceFile: 'test/file.md',
      content: 'You are an AI assistant.',
      startLine: 1,
      endLine: 1
    };

    const prompt = new PromptDetail(promptData);
    
    expect(prompt.promptId).toBe('prompt_001');
    expect(prompt.isValid()).toBe(true);
  });

  test('边界情况：验证无效的PromptDetail', () => {
    const invalidPrompt = new PromptDetail({
      promptId: 'invalid_id', // 格式错误
      sourceFile: 'test.md',
      content: 'content',
      startLine: 0, // 应该从1开始
      endLine: 1
    });

    expect(invalidPrompt.isValid()).toBe(false);
  });
});

describe('PromptList Model', () => {
  test('正常情况：创建并操作PromptList', () => {
    const promptList = new PromptList({
      totalFiles: 3,
      totalPrompts: 0,
      processingStats: {
        successfulFiles: 0,
        failedFiles: 0,
        errors: []
      },
      prompts: []
    });

    const prompt = new PromptDetail({
      promptId: 'prompt_001',
      sourceFile: 'test.md',
      content: 'AI prompt content',
      startLine: 1,
      endLine: 3
    });

    promptList.addPrompt(prompt);
    promptList.markFileSuccess();
    
    expect(promptList.totalPrompts).toBe(1);
    expect(promptList.processingStats.successfulFiles).toBe(1);
  });

  test('边界情况：处理错误并生成JSON', () => {
    const promptList = new PromptList({
      totalFiles: 1,
      totalPrompts: 0,
      processingStats: {
        successfulFiles: 0,
        failedFiles: 0,
        errors: []
      },
      prompts: []
    });

    promptList.addError('error-file.md', 'Failed to process file');
    const json = promptList.toJSON();
    
    expect(promptList.processingStats.failedFiles).toBe(1);
    expect(json.processingStats.errors).toHaveLength(1);
  });
});

describe('File System Integration', () => {
  test('正常情况：读取输入并生成输出文件', async () => {
    const inputPath = 'tests/fixtures/sample-prompt-files.json';
    const outputPath = 'tests/fixtures/test-output.json';
    
    const inputData = await fs.readJson(inputPath);
    const promptList = new PromptList({
      totalFiles: inputData.scanResult.totalFiles,
      totalPrompts: 0,
      processingStats: {
        successfulFiles: 0,
        failedFiles: 0,
        errors: []
      },
      prompts: []
    });

    // 添加一个提示词作为示例
    promptList.addPrompt(new PromptDetail({
      promptId: 'prompt_001',
      sourceFile: inputData.scanResult.promptFiles[0].filePath,
      content: 'Test content',
      startLine: 1,
      endLine: 5
    }));

    await fs.writeJson(outputPath, promptList.toJSON(), { spaces: 2 });
    const exists = await fs.pathExists(outputPath);
    expect(exists).toBe(true);
    
    await fs.remove(outputPath);
  });

  test('边界情况：处理空输入', async () => {
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

    expect(promptList.isValid()).toBe(true);
    expect(promptList.totalPrompts).toBe(0);
  });
});