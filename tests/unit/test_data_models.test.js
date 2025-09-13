import { describe, test, expect } from '@jest/globals';
import { PromptFile, ScanResult, OutputWrapper, SUPPORTED_FILE_EXTENSIONS } from '../../src/models/data_models.js';

describe('Data Models Unit Tests', () => {
  test('正常情况: 创建完整的数据模型对象并验证JSON输出格式', () => {
    // 创建PromptFile对象
    const promptFile = new PromptFile({
      filePath: '/test/prompt.md',
      fileName: 'prompt.md',
      content: '请帮我写一个Python函数来计算斐波那契数列',
      isPrompt: true,
      confidence: 0.95,
      language: 'python',
      category: 'code-generation'
    });

    // 验证PromptFile
    expect(promptFile.filePath).toBe('/test/prompt.md');
    expect(promptFile.isPrompt).toBe(true);
    expect(promptFile.confidence).toBe(0.95);
    expect(promptFile.isValid()).toBe(true);

    // 创建ScanResult对象
    const scanResult = new ScanResult({
      totalFiles: 5,
      promptFiles: [promptFile],
      scanDuration: 1500
    });

    // 验证ScanResult
    expect(scanResult.totalFiles).toBe(5);
    expect(scanResult.promptFiles).toHaveLength(1);
    expect(scanResult.isValid()).toBe(true);
    expect(typeof scanResult.scanTimestamp).toBe('string');

    // 创建OutputWrapper - 符合测试期望的最终输出格式
    const output = new OutputWrapper(scanResult);
    const json = output.toJSON();

    // 验证最终JSON格式符合所有测试的期望
    expect(json).toHaveProperty('scanResult');
    expect(json.scanResult).toHaveProperty('totalFiles', 5);
    expect(json.scanResult).toHaveProperty('promptFiles');
    expect(json.scanResult).toHaveProperty('scanTimestamp');
    expect(json.scanResult).toHaveProperty('scanDuration');
    expect(Array.isArray(json.scanResult.promptFiles)).toBe(true);

    // 验证PromptFile结构完整性
    const firstPrompt = json.scanResult.promptFiles[0];
    expect(firstPrompt).toHaveProperty('filePath');
    expect(firstPrompt).toHaveProperty('fileName');
    expect(firstPrompt).toHaveProperty('content');
    expect(firstPrompt).toHaveProperty('isPrompt', true);
    expect(firstPrompt).toHaveProperty('confidence');
    expect(firstPrompt).toHaveProperty('language');
    expect(firstPrompt).toHaveProperty('category');
  });

  test('边界情况: 处理空数据和最小有效数据', () => {
    // 创建最小有效PromptFile（非提示词文件）
    const nonPromptFile = new PromptFile({
      filePath: '/test/config.json',
      fileName: 'config.json',
      content: '{"key": "value"}',
      isPrompt: false,
      confidence: 0.1
    });

    // 验证最小有效数据
    expect(nonPromptFile.language).toBe(null);
    expect(nonPromptFile.category).toBe(null);
    expect(nonPromptFile.isValid()).toBe(true);

    // 创建空的ScanResult
    const emptyScanResult = new ScanResult({
      totalFiles: 0,
      promptFiles: []
    });

    // 验证空结果
    expect(emptyScanResult.totalFiles).toBe(0);
    expect(emptyScanResult.promptFiles).toHaveLength(0);
    expect(emptyScanResult.scanDuration).toBe(null);
    expect(emptyScanResult.isValid()).toBe(true);

    // 创建空输出包装器
    const emptyOutput = new OutputWrapper(emptyScanResult);
    const emptyJson = emptyOutput.toJSON();

    // 验证空输出格式仍然正确
    expect(emptyJson).toHaveProperty('scanResult');
    expect(emptyJson.scanResult.totalFiles).toBe(0);
    expect(emptyJson.scanResult.promptFiles).toEqual([]);
    expect(Array.isArray(emptyJson.scanResult.promptFiles)).toBe(true);

    // 验证JSON序列化/反序列化
    const restored = OutputWrapper.fromJSON(emptyJson);
    expect(restored).toBeInstanceOf(OutputWrapper);
    expect(restored.scanResult.totalFiles).toBe(0);

    // 验证常量
    expect(Array.isArray(SUPPORTED_FILE_EXTENSIONS)).toBe(true);
    expect(SUPPORTED_FILE_EXTENSIONS.length).toBeGreaterThan(0);
  });
});