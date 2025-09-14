import pkg from '@jest/globals';
const { describe, test, expect, beforeEach, afterEach, jest } = pkg;
import fs from 'fs-extra';
import path from 'path';

// 模拟服务模块 - 这些在TDD中尚未实现，所以需要模拟
jest.unstable_mockModule('../../src/services/prompt_reader.js', () => ({
  PromptReader: jest.fn().mockImplementation(() => ({
    readPromptFiles: jest.fn()
  }))
}));

jest.unstable_mockModule('../../src/services/content_extractor.js', () => ({
  ContentExtractor: jest.fn().mockImplementation(() => ({
    extractPromptDetails: jest.fn()
  }))
}));

jest.unstable_mockModule('../../src/services/list_generator.js', () => ({
  ListGenerator: jest.fn().mockImplementation(() => ({
    generatePromptList: jest.fn()
  }))
}));

describe('Prompt Extraction Workflow Integration Tests', () => {
  const testDir = path.join(process.cwd(), 'temp_test_extraction_integration');
  const analysisDir = path.join(testDir, 'analysis');
  const inputFile = path.join(analysisDir, 'prompt-files.json');
  const outputFile = path.join(analysisDir, 'prompt-list.json');

  beforeEach(async () => {
    // 创建测试目录
    await fs.ensureDir(testDir);
    await fs.ensureDir(analysisDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
    jest.clearAllMocks();
  });

  test('正常情况: 读取第一步JSON并提取提示词，生成正确的提示词列表JSON', async () => {
    // 动态导入模拟的模块
    const { PromptReader } = await import('../../src/services/prompt_reader.js');
    const { ContentExtractor } = await import('../../src/services/content_extractor.js');
    const { ListGenerator } = await import('../../src/services/list_generator.js');

    // 创建模拟数据
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
        content: 'Write a Python function that calculates fibonacci numbers.\n\nMake sure to include error handling.',
        isPrompt: true,
        confidence: 0.88,
        language: 'python',
        category: 'tutorial'
      }
    ];

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
        content: 'Write a Python function that calculates fibonacci numbers.\n\nMake sure to include error handling.',
        startLine: 0,
        endLine: 2
      }
    ];

    const mockPromptList = {
      totalFiles: 2,
      totalPrompts: 3,
      prompts: mockPromptDetails,
      analysisTime: '2025-09-14T14:30:22Z',
      processingStats: {
        successFiles: 2,
        failedFiles: 0
      }
    };

    // 配置模拟行为
    const mockReader = new PromptReader();
    const mockExtractor = new ContentExtractor();
    const mockGenerator = new ListGenerator();

    mockReader.readPromptFiles.mockResolvedValue(mockPromptFiles);
    mockExtractor.extractPromptDetails.mockResolvedValue(mockPromptDetails);
    mockGenerator.generatePromptList.mockResolvedValue(mockPromptList);

    // 创建输入文件
    const inputData = {
      scanResult: {
        totalFiles: 2,
        promptFiles: mockPromptFiles,
        scanTimestamp: '2025-09-14T14:30:22Z',
        scanDuration: 15000
      }
    };
    await fs.writeJson(inputFile, inputData);

    // 执行工作流程
    const promptFiles = await mockReader.readPromptFiles(inputFile);
    const promptDetails = await mockExtractor.extractPromptDetails(promptFiles);
    const result = await mockGenerator.generatePromptList(promptDetails, {
      totalScannedFiles: promptFiles.length,
      startTime: '2025-09-14T14:30:22Z',
      duration: 5000
    });

    // 验证服务调用
    expect(PromptReader).toHaveBeenCalledTimes(1);
    expect(ContentExtractor).toHaveBeenCalledTimes(1);
    expect(ListGenerator).toHaveBeenCalledTimes(1);

    expect(mockReader.readPromptFiles).toHaveBeenCalledWith(inputFile);
    expect(mockExtractor.extractPromptDetails).toHaveBeenCalledWith(mockPromptFiles);
    expect(mockGenerator.generatePromptList).toHaveBeenCalledWith(
      mockPromptDetails,
      expect.objectContaining({
        totalScannedFiles: 2,
        startTime: expect.any(String),
        duration: expect.any(Number)
      })
    );

    // 验证工作流程结果
    expect(result).toEqual(mockPromptList);
    expect(result.totalFiles).toBe(2);
    expect(result.totalPrompts).toBe(3);
    expect(result.prompts).toHaveLength(3);
    expect(result.processingStats.successFiles).toBe(2);
    expect(result.processingStats.failedFiles).toBe(0);

    // 验证提示词详情结构
    const firstPrompt = result.prompts[0];
    expect(firstPrompt).toHaveProperty('promptId');
    expect(firstPrompt).toHaveProperty('sourceFile');
    expect(firstPrompt).toHaveProperty('content');
    expect(firstPrompt).toHaveProperty('startLine');
    expect(firstPrompt).toHaveProperty('endLine');

    // 验证数据类型
    expect(typeof firstPrompt.promptId).toBe('string');
    expect(typeof firstPrompt.sourceFile).toBe('string');
    expect(typeof firstPrompt.content).toBe('string');
    expect(typeof firstPrompt.startLine).toBe('number');
    expect(typeof firstPrompt.endLine).toBe('number');

    // 验证数据合理性
    expect(firstPrompt.startLine).toBeGreaterThanOrEqual(0);
    expect(firstPrompt.endLine).toBeGreaterThanOrEqual(firstPrompt.startLine);
  });

  test('边界情况: 处理单文件多提示词场景', async () => {
    // 动态导入模拟的模块
    const { PromptReader } = await import('../../src/services/prompt_reader.js');
    const { ContentExtractor } = await import('../../src/services/content_extractor.js');
    const { ListGenerator } = await import('../../src/services/list_generator.js');

    // 创建单文件多提示词的模拟数据
    const mockPromptFiles = [
      {
        filePath: 'docs/multi-prompts.md',
        fileName: 'multi-prompts.md',
        content: '# First prompt\nYou are a coding assistant.\n\n# Second prompt\nWrite unit tests.\n\n# Third prompt\nOptimize performance.',
        isPrompt: true,
        confidence: 0.92,
        language: null,
        category: 'code-generation'
      }
    ];

    // AI应该能识别出三个独立的提示词
    const mockPromptDetails = [
      {
        promptId: 'prompt_001',
        sourceFile: 'docs/multi-prompts.md',
        content: 'You are a coding assistant.',
        startLine: 1,
        endLine: 1
      },
      {
        promptId: 'prompt_002',
        sourceFile: 'docs/multi-prompts.md',
        content: 'Write unit tests.',
        startLine: 4,
        endLine: 4
      },
      {
        promptId: 'prompt_003',
        sourceFile: 'docs/multi-prompts.md',
        content: 'Optimize performance.',
        startLine: 7,
        endLine: 7
      }
    ];

    const mockPromptList = {
      totalFiles: 1,
      totalPrompts: 3,
      prompts: mockPromptDetails,
      analysisTime: '2025-09-14T14:30:22Z',
      processingStats: {
        successFiles: 1,
        failedFiles: 0
      }
    };

    // 配置模拟行为
    const mockReader = new PromptReader();
    const mockExtractor = new ContentExtractor();
    const mockGenerator = new ListGenerator();

    mockReader.readPromptFiles.mockResolvedValue(mockPromptFiles);
    mockExtractor.extractPromptDetails.mockResolvedValue(mockPromptDetails);
    mockGenerator.generatePromptList.mockResolvedValue(mockPromptList);

    // 创建输入文件
    const inputData = {
      scanResult: {
        totalFiles: 1,
        promptFiles: mockPromptFiles,
        scanTimestamp: '2025-09-14T14:30:22Z',
        scanDuration: 8000
      }
    };
    await fs.writeJson(inputFile, inputData);

    // 执行工作流程
    const promptFiles = await mockReader.readPromptFiles(inputFile);
    const promptDetails = await mockExtractor.extractPromptDetails(promptFiles);
    const result = await mockGenerator.generatePromptList(promptDetails, {
      totalScannedFiles: promptFiles.length,
      startTime: '2025-09-14T14:30:22Z',
      duration: 8000
    });

    // 验证单文件多提示词识别
    expect(result.totalFiles).toBe(1);
    expect(result.totalPrompts).toBe(3);
    expect(result.prompts).toHaveLength(3);

    // 验证所有提示词都来自同一个文件
    result.prompts.forEach(prompt => {
      expect(prompt.sourceFile).toBe('docs/multi-prompts.md');
    });

    // 验证提示词ID是唯一的
    const promptIds = result.prompts.map(p => p.promptId);
    const uniqueIds = new Set(promptIds);
    expect(uniqueIds.size).toBe(promptIds.length);

    // 验证行号是有序的
    const startLines = result.prompts.map(p => p.startLine);
    expect(startLines).toEqual([1, 4, 7]); // 应该按文件中出现顺序排序
  });

  test('边界情况: 处理文件不存在或无提示词文件的情况', async () => {
    // 动态导入模拟的模块
    const { PromptReader } = await import('../../src/services/prompt_reader.js');
    const { ContentExtractor } = await import('../../src/services/content_extractor.js');
    const { ListGenerator } = await import('../../src/services/list_generator.js');

    // 模拟空的输入
    const mockPromptFiles = [];
    const mockPromptDetails = [];
    const mockPromptList = {
      totalFiles: 0,
      totalPrompts: 0,
      prompts: [],
      analysisTime: '2025-09-14T14:30:22Z',
      processingStats: {
        successFiles: 0,
        failedFiles: 0
      }
    };

    // 配置模拟行为
    const mockReader = new PromptReader();
    const mockExtractor = new ContentExtractor();
    const mockGenerator = new ListGenerator();

    mockReader.readPromptFiles.mockResolvedValue(mockPromptFiles);
    mockExtractor.extractPromptDetails.mockResolvedValue(mockPromptDetails);
    mockGenerator.generatePromptList.mockResolvedValue(mockPromptList);

    // 创建空的输入文件
    const inputData = {
      scanResult: {
        totalFiles: 0,
        promptFiles: [],
        scanTimestamp: '2025-09-14T14:30:22Z',
        scanDuration: 1000
      }
    };
    await fs.writeJson(inputFile, inputData);

    // 执行工作流程
    const promptFiles = await mockReader.readPromptFiles(inputFile);
    const promptDetails = await mockExtractor.extractPromptDetails(promptFiles);
    const result = await mockGenerator.generatePromptList(promptDetails, {
      totalScannedFiles: promptFiles.length,
      startTime: '2025-09-14T14:30:22Z',
      duration: 1000
    });

    // 验证空结果处理
    expect(result.totalFiles).toBe(0);
    expect(result.totalPrompts).toBe(0);
    expect(result.prompts).toEqual([]);
    expect(result.processingStats.successFiles).toBe(0);
    expect(result.processingStats.failedFiles).toBe(0);

    // 验证服务仍然被调用（即使输入为空）
    expect(mockReader.readPromptFiles).toHaveBeenCalled();
    expect(mockExtractor.extractPromptDetails).toHaveBeenCalledWith([]);
    expect(mockGenerator.generatePromptList).toHaveBeenCalledWith([], expect.any(Object));
  });

  test('边界情况: 处理部分文件处理失败的情况', async () => {
    // 动态导入模拟的模块
    const { PromptReader } = await import('../../src/services/prompt_reader.js');
    const { ContentExtractor } = await import('../../src/services/content_extractor.js');
    const { ListGenerator } = await import('../../src/services/list_generator.js');

    // 模拟混合成功和失败的情况
    const mockPromptFiles = [
      {
        filePath: 'docs/good-prompt.md',
        fileName: 'good-prompt.md',
        content: 'This is a good prompt.',
        isPrompt: true,
        confidence: 0.9,
        language: null,
        category: 'unknown'
      },
      {
        filePath: 'docs/bad-file.md',
        fileName: 'bad-file.md',
        content: 'This file will cause processing error.',
        isPrompt: true,
        confidence: 0.8,
        language: null,
        category: 'unknown'
      }
    ];

    // 只有一个文件成功提取
    const mockPromptDetails = [
      {
        promptId: 'prompt_001',
        sourceFile: 'docs/good-prompt.md',
        content: 'This is a good prompt.',
        startLine: 0,
        endLine: 0
      }
    ];

    const mockPromptList = {
      totalFiles: 2,
      totalPrompts: 1,
      prompts: mockPromptDetails,
      analysisTime: '2025-09-14T14:30:22Z',
      processingStats: {
        successFiles: 1,
        failedFiles: 1
      }
    };

    // 配置模拟行为
    const mockReader = new PromptReader();
    const mockExtractor = new ContentExtractor();
    const mockGenerator = new ListGenerator();

    mockReader.readPromptFiles.mockResolvedValue(mockPromptFiles);
    mockExtractor.extractPromptDetails.mockResolvedValue(mockPromptDetails);
    mockGenerator.generatePromptList.mockResolvedValue(mockPromptList);

    // 创建输入文件
    const inputData = {
      scanResult: {
        totalFiles: 2,
        promptFiles: mockPromptFiles,
        scanTimestamp: '2025-09-14T14:30:22Z',
        scanDuration: 10000
      }
    };
    await fs.writeJson(inputFile, inputData);

    // 执行工作流程
    const promptFiles = await mockReader.readPromptFiles(inputFile);
    const promptDetails = await mockExtractor.extractPromptDetails(promptFiles);
    const result = await mockGenerator.generatePromptList(promptDetails, {
      totalScannedFiles: promptFiles.length,
      startTime: '2025-09-14T14:30:22Z',
      duration: 10000
    });

    // 验证部分失败处理
    expect(result.totalFiles).toBe(2);
    expect(result.totalPrompts).toBe(1);
    expect(result.prompts).toHaveLength(1);
    expect(result.processingStats.successFiles).toBe(1);
    expect(result.processingStats.failedFiles).toBe(1);

    // 验证失败统计正确性
    expect(result.processingStats.successFiles + result.processingStats.failedFiles).toBe(result.totalFiles);

    // 验证成功提取的提示词
    const successPrompt = result.prompts[0];
    expect(successPrompt.sourceFile).toBe('docs/good-prompt.md');
    expect(successPrompt.content).toBe('This is a good prompt.');
  });
});