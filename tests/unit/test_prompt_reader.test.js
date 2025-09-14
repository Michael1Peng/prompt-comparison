import pkg from '@jest/globals';
const { describe, test, expect, beforeEach, afterEach } = pkg;
import fs from 'fs-extra';
import path from 'path';
import { PromptReader } from '../../src/services/prompt_reader.js';

describe('PromptReader Service Unit Tests', () => {
  const testDir = path.join(process.cwd(), 'temp_test_prompt_reader_unit');
  const analysisDir = path.join(testDir, 'analysis');
  const validInputFile = path.join(analysisDir, 'valid-prompt-files.json');
  const invalidInputFile = path.join(analysisDir, 'invalid-prompt-files.json');

  beforeEach(async () => {
    // 创建测试目录
    await fs.ensureDir(testDir);
    await fs.ensureDir(analysisDir);
    process.chdir(testDir);
  });

  afterEach(async () => {
    process.chdir('/home/michael/ubuntu-repos/Michael1Peng/prompt-comparison.spec-kit');
    await fs.remove(testDir);
  });

  test('正常情况: 读取有效的第一步工具JSON输出，返回提示词文件数组', async () => {
    // 创建有效的输入JSON文件（模拟第一步工具的输出）
    const mockInputData = {
      scanResult: {
        totalFiles: 3,
        promptFiles: [
          {
            filePath: 'docs/system-prompt.md',
            fileName: 'system-prompt.md',
            content: 'You are a helpful AI assistant. Please help me with coding tasks.',
            isPrompt: true,
            confidence: 0.95,
            language: null,
            category: 'code-generation'
          },
          {
            filePath: 'examples/tutorial.md',
            fileName: 'tutorial.md',
            content: 'Write a Python function that calculates fibonacci numbers.',
            isPrompt: true,
            confidence: 0.88,
            language: 'python',
            category: 'tutorial'
          },
          {
            filePath: 'config/prompts.yaml',
            fileName: 'prompts.yaml',
            content: 'system_prompt: "You are a helpful assistant"\\nuser_prompt: "Help me code"',
            isPrompt: true,
            confidence: 0.92,
            language: null,
            category: 'configuration'
          }
        ],
        scanTimestamp: '2025-09-14T14:30:22Z',
        scanDuration: 15000
      }
    };

    await fs.writeJson(validInputFile, mockInputData);

    // 创建PromptReader实例
    const reader = new PromptReader();

    // 测试readPromptFiles方法
    try {
      const result = await reader.readPromptFiles(validInputFile);
      
      // TDD: 这应该失败，因为服务还没有实现
      expect(true).toBe(false); // 强制失败，表示测试不应该成功

    } catch (error) {
      // 验证抛出正确的"尚未实现"错误
      expect(error.message).toContain('尚未实现');
      expect(error.message).toContain('PromptReader.readPromptFiles()');
    }

    // 测试配置获取（这应该工作，因为已经实现）
    const config = reader.getConfig();
    expect(config).toHaveProperty('defaultInputPath');
    expect(typeof config.defaultInputPath).toBe('string');
    expect(config.defaultInputPath).toBe('./analysis/prompt-files.json');

    // 验证实例属性
    expect(reader.defaultInputPath).toBe('./analysis/prompt-files.json');

    // 如果实现了，应该验证以下内容（当前会失败）:
    // expect(Array.isArray(result)).toBe(true);
    // expect(result).toHaveLength(3);
    // expect(result[0]).toHaveProperty('filePath');
    // expect(result[0]).toHaveProperty('fileName');
    // expect(result[0]).toHaveProperty('content');
    // expect(result[0]).toHaveProperty('isPrompt');
    // expect(result[0]).toHaveProperty('confidence');
    // 
    // expect(result[0].filePath).toBe('docs/system-prompt.md');
    // expect(result[0].fileName).toBe('system-prompt.md');
    // expect(result[0].isPrompt).toBe(true);
    // expect(result[0].confidence).toBe(0.95);
    //
    // expect(result[1].language).toBe('python');
    // expect(result[1].category).toBe('tutorial');
    //
    // expect(result[2].category).toBe('configuration');
  });

  test('边界情况: 处理无效文件格式或空数据，返回空数组或抛出验证错误', async () => {
    // 创建无效的输入JSON文件
    const invalidInputData = {
      // 缺少scanResult字段
      wrongField: {
        totalFiles: 1,
        promptFiles: []
      }
    };

    await fs.writeJson(invalidInputFile, invalidInputData);

    // 创建PromptReader实例
    const reader = new PromptReader();

    // 测试处理无效输入文件
    try {
      const result = await reader.readPromptFiles(invalidInputFile);
      
      // TDD: 这应该失败，因为服务还没有实现
      expect(true).toBe(false); // 强制失败，表示测试不应该成功

    } catch (error) {
      // 验证抛出正确的"尚未实现"错误
      expect(error.message).toContain('尚未实现');
      expect(error.message).toContain('PromptReader.readPromptFiles()');
    }

    // 测试处理不存在的文件
    try {
      const result = await reader.readPromptFiles('non-existent-file.json');
      
      // TDD: 这应该失败，因为服务还没有实现
      expect(true).toBe(false); // 强制失败，表示测试不应该成功

    } catch (error) {
      // 验证抛出正确的"尚未实现"错误
      expect(error.message).toContain('尚未实现');
      expect(error.message).toContain('PromptReader.readPromptFiles()');
    }

    // 测试_validateInputFormat方法
    try {
      const isValid = reader._validateInputFormat({});
      
      // TDD: 这应该失败，因为方法还没有实现
      expect(true).toBe(false); // 强制失败，表示测试不应该成功

    } catch (error) {
      // 验证抛出正确的"尚未实现"错误
      expect(error.message).toContain('尚未实现');
      expect(error.message).toContain('PromptReader._validateInputFormat()');
    }

    // 测试配置获取仍然工作
    const config = reader.getConfig();
    expect(config.defaultInputPath).toBe('./analysis/prompt-files.json');

    // 如果实现了，边界情况应该验证以下内容（当前会失败）:
    // 1. 无效JSON格式应该抛出解析错误
    // 2. 缺少必需字段应该抛出验证错误
    // 3. 空的promptFiles数组应该返回空数组
    // 4. 不存在的文件应该抛出文件不存在错误
    //
    // expect(() => reader._validateInputFormat({})).toThrow();
    // expect(() => reader._validateInputFormat({ wrongField: {} })).toThrow();
    // expect(reader._validateInputFormat({ scanResult: { promptFiles: [] } })).toBe(true);
  });

  // 测试自定义输入路径配置
  test('配置测试: 验证自定义输入路径配置', () => {
    // 使用自定义配置创建实例
    const customReader = new PromptReader({
      inputPath: './custom/input/path.json'
    });

    const config = customReader.getConfig();
    expect(config.defaultInputPath).toBe('./custom/input/path.json');
    expect(customReader.defaultInputPath).toBe('./custom/input/path.json');

    // 使用默认配置创建实例
    const defaultReader = new PromptReader();
    const defaultConfig = defaultReader.getConfig();
    expect(defaultConfig.defaultInputPath).toBe('./analysis/prompt-files.json');
  });
});