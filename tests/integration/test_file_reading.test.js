/**
 * 文件读取功能集成测试
 * 每个功能2个测试用例
 */

import { describe, test, expect } from '@jest/globals';
import { PromptExtractor } from '../../src/services/prompt_extractor.js';
import fs from 'fs-extra';
import path from 'path';

describe('File Reading Functionality', () => {
  const testInputPath = 'tests/fixtures/sample-prompt-files.json';
  const testOutputPath = 'tests/fixtures/test-file-reading-output.json';
  
  test('正常情况：读取输入文件并处理', async () => {
    const extractor = new PromptExtractor({
      inputPath: testInputPath,
      outputPath: testOutputPath
    });
    
    // 读取输入文件
    const inputData = await extractor.readInputFile();
    
    expect(inputData).toBeDefined();
    expect(inputData.scanResult).toBeDefined();
    expect(inputData.scanResult.promptFiles).toBeInstanceOf(Array);
    expect(inputData.scanResult.promptFiles.length).toBe(3);
  });

  test('边界情况：处理不存在的输入文件', async () => {
    const extractor = new PromptExtractor({
      inputPath: 'tests/fixtures/non-existent.json',
      outputPath: testOutputPath
    });
    
    // 应该抛出错误
    await expect(extractor.readInputFile()).rejects.toThrow('输入文件不存在');
  });
});

describe('File Content Reading', () => {
  const extractor = new PromptExtractor({});
  
  test('正常情况：读取存在的文件内容', async () => {
    const filePath = 'tests/fixtures/test-prompt1.md';
    const content = await extractor.readFileContent(filePath);
    
    expect(content).toBeDefined();
    expect(content).toContain('AI Assistant Prompt');
    expect(content.length).toBeGreaterThan(0);
  });

  test('边界情况：读取不存在的文件', async () => {
    const filePath = 'tests/fixtures/non-existent-file.md';
    
    await expect(extractor.readFileContent(filePath)).rejects.toThrow('文件不存在');
  });
});