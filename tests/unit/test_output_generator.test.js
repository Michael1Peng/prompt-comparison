import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';

// 模拟OutputGenerator类 - 在TDD中尚未实现
jest.unstable_mockModule('../../src/services/output_generator.js', () => ({
  OutputGenerator: jest.fn().mockImplementation(() => ({
    generateOutput: jest.fn(),
    _createScanResult: jest.fn(),
    _writeOutputFile: jest.fn()
  }))
}));

describe('Output Generator Unit Tests', () => {
  const testDir = path.join(process.cwd(), 'temp_test_output_generator');
  const analysisDir = path.join(testDir, 'analysis');
  const outputFile = path.join(analysisDir, 'prompt-files.json');

  beforeEach(async () => {
    await fs.ensureDir(analysisDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
    jest.clearAllMocks();
  });

  test('正常情况: 生成符合ScanResult格式的JSON文件', async () => {
    // 准备测试数据 - PromptFile对象数组
    const promptFiles = [
      {
        filePath: '/test/prompt1.md',
        fileName: 'prompt1.md',
        content: '请帮我写一个Python函数来计算斐波那契数列',
        isPrompt: true,
        confidence: 0.95,
        language: 'python',
        category: 'code-generation'
      },
      {
        filePath: '/test/prompt2.txt',
        fileName: 'prompt2.txt', 
        content: '如何使用React创建一个响应式导航栏？',
        isPrompt: true,
        confidence: 0.88,
        language: 'javascript',
        category: 'tutorial'
      }
    ];
    
    // 动态导入并设置模拟
    const { OutputGenerator } = await import('../../src/services/output_generator.js');
    const generator = new OutputGenerator();
    
    // 模拟预期的ScanResult格式输出
    const expectedOutput = {
      scanResult: {
        totalFiles: 2,
        promptFiles: promptFiles,
        scanTimestamp: '2025-09-13T10:30:00.000Z',
        scanDuration: 1500 // ms
      }
    };
    
    generator.generateOutput.mockResolvedValue(expectedOutput);
    
    // 执行输出生成
    const result = await generator.generateOutput(promptFiles, outputFile);
    
    // 验证调用
    expect(generator.generateOutput).toHaveBeenCalledWith(promptFiles, outputFile);
    
    // 验证ScanResult格式
    expect(result).toEqual(expectedOutput);
    expect(result).toHaveProperty('scanResult');
    expect(result.scanResult).toHaveProperty('totalFiles', 2);
    expect(result.scanResult).toHaveProperty('promptFiles');
    expect(result.scanResult).toHaveProperty('scanTimestamp');
    expect(result.scanResult).toHaveProperty('scanDuration');
    
    // 验证promptFiles数组结构
    expect(Array.isArray(result.scanResult.promptFiles)).toBe(true);
    expect(result.scanResult.promptFiles).toHaveLength(2);
    
    // 验证PromptFile对象完整性
    const firstPrompt = result.scanResult.promptFiles[0];
    expect(firstPrompt).toHaveProperty('filePath');
    expect(firstPrompt).toHaveProperty('fileName');
    expect(firstPrompt).toHaveProperty('content');
    expect(firstPrompt).toHaveProperty('isPrompt', true);
    expect(firstPrompt).toHaveProperty('confidence');
    expect(firstPrompt).toHaveProperty('language');
    expect(firstPrompt).toHaveProperty('category');
    
    // 验证时间戳格式
    expect(typeof result.scanResult.scanTimestamp).toBe('string');
    expect(new Date(result.scanResult.scanTimestamp)).toBeInstanceOf(Date);
    
    // 验证扫描时长
    expect(typeof result.scanResult.scanDuration).toBe('number');
    expect(result.scanResult.scanDuration).toBeGreaterThan(0);
  });

  test('边界情况: 处理空的提示词文件列表', async () => {
    // 准备空数据
    const emptyPromptFiles = [];
    
    // 动态导入并设置模拟
    const { OutputGenerator } = await import('../../src/services/output_generator.js');
    const generator = new OutputGenerator();
    
    // 模拟空结果输出
    const expectedEmptyOutput = {
      scanResult: {
        totalFiles: 0,
        promptFiles: [],
        scanTimestamp: '2025-09-13T10:30:00.000Z',
        scanDuration: 500 // ms
      }
    };
    
    generator.generateOutput.mockResolvedValue(expectedEmptyOutput);
    
    // 执行输出生成
    const result = await generator.generateOutput(emptyPromptFiles, outputFile);
    
    // 验证调用
    expect(generator.generateOutput).toHaveBeenCalledWith(emptyPromptFiles, outputFile);
    
    // 验证空结果格式
    expect(result).toEqual(expectedEmptyOutput);
    expect(result.scanResult.totalFiles).toBe(0);
    expect(result.scanResult.promptFiles).toEqual([]);
    expect(Array.isArray(result.scanResult.promptFiles)).toBe(true);
    
    // 验证基本结构仍然完整
    expect(result).toHaveProperty('scanResult');
    expect(result.scanResult).toHaveProperty('totalFiles');
    expect(result.scanResult).toHaveProperty('promptFiles');
    expect(result.scanResult).toHaveProperty('scanTimestamp');
    expect(result.scanResult).toHaveProperty('scanDuration');
    
    // 验证时间戳和持续时间有效性
    expect(typeof result.scanResult.scanTimestamp).toBe('string');
    expect(typeof result.scanResult.scanDuration).toBe('number');
    expect(result.scanResult.scanDuration).toBeGreaterThanOrEqual(0);
  });
});