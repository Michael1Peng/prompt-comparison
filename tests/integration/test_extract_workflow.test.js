/**
 * 端到端集成测试
 * 测试完整的提取工作流
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { PromptExtractor } from '../../src/services/prompt_extractor.js';
import fs from 'fs-extra';
import path from 'path';

describe('End-to-End Extract Workflow', () => {
  const testInputPath = 'tests/fixtures/sample-prompt-files.json';
  const testOutputPath = 'tests/fixtures/test-e2e-output.json';
  
  beforeAll(async () => {
    // 确保测试输入文件存在
    expect(await fs.pathExists(testInputPath)).toBe(true);
  });
  
  afterAll(async () => {
    // 清理测试输出
    await fs.remove(testOutputPath);
  });
  
  test('正常情况：完整的提取流程', async () => {
    // 初始化提取器（使用模拟的备用分析方法，避免真实API调用）
    const extractor = new PromptExtractor({
      inputPath: testInputPath,
      outputPath: testOutputPath,
      concurrencyLimit: 1 // 使用单线程避免并发问题
    });
    
    // 模拟分析方法，避免真实API调用
    extractor.analyzePrompts = async (content, filePath) => {
      return extractor.fallbackAnalysis(content);
    };
    
    // 执行完整的提取流程
    const promptList = await extractor.extract();
    
    // 验证返回结果
    expect(promptList).toBeDefined();
    expect(promptList.totalFiles).toBeGreaterThan(0);
    expect(promptList.prompts).toBeDefined();
    expect(Array.isArray(promptList.prompts)).toBe(true);
    
    // 验证输出文件
    expect(await fs.pathExists(testOutputPath)).toBe(true);
    
    // 读取并验证输出文件内容
    const outputData = await fs.readJson(testOutputPath);
    expect(outputData.totalFiles).toBe(promptList.totalFiles);
    expect(outputData.totalPrompts).toBe(promptList.totalPrompts);
    expect(outputData.processingStats).toBeDefined();
    expect(outputData.analysisTime).toBeDefined();
    
    // 验证提示词数据结构
    if (outputData.prompts.length > 0) {
      const firstPrompt = outputData.prompts[0];
      expect(firstPrompt.promptId).toMatch(/^prompt_\d{3}$/);
      expect(firstPrompt.sourceFile).toBeDefined();
      expect(firstPrompt.content).toBeDefined();
      expect(firstPrompt.startLine).toBeGreaterThan(0);
      expect(firstPrompt.endLine).toBeGreaterThanOrEqual(firstPrompt.startLine);
    }
  }, 15000); // 设置15秒超时

  test('边界情况：处理无效输入路径', async () => {
    const extractor = new PromptExtractor({
      inputPath: 'non-existent-file.json',
      outputPath: testOutputPath
    });
    
    // 应该抛出错误
    await expect(extractor.extract()).rejects.toThrow('输入文件不存在');
  });
});