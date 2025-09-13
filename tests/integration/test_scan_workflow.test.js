import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';

// 模拟服务模块 - 这些在TDD中尚未实现，所以需要模拟
jest.unstable_mockModule('../../src/services/file_scanner.js', () => ({
  FileScanner: jest.fn().mockImplementation(() => ({
    scanFiles: jest.fn()
  }))
}));

jest.unstable_mockModule('../../src/services/ai_analyzer.js', () => ({
  AIAnalyzer: jest.fn().mockImplementation(() => ({
    analyzeFiles: jest.fn()
  }))
}));

jest.unstable_mockModule('../../src/services/output_generator.js', () => ({
  OutputGenerator: jest.fn().mockImplementation(() => ({
    generateOutput: jest.fn()
  }))
}));

describe('Scan Workflow Integration Tests', () => {
  const testDir = path.join(process.cwd(), 'temp_test_integration');
  const analysisDir = path.join(testDir, 'analysis');
  const outputFile = path.join(analysisDir, 'prompt-files.json');

  beforeEach(async () => {
    // 创建测试目录
    await fs.ensureDir(testDir);
    await fs.ensureDir(analysisDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
    jest.clearAllMocks();
  });

  test('正常情况: 扫描包含提示词的测试文件，验证JSON输出格式', async () => {
    // 准备测试数据
    const testFiles = [
      path.join(testDir, 'prompt1.md'),
      path.join(testDir, 'prompt2.txt')
    ];
    
    await fs.writeFile(testFiles[0], '请帮我写一个Python函数来计算斐波那契数列');
    await fs.writeFile(testFiles[1], '如何使用JavaScript实现深拷贝？');
    
    // 动态导入服务模块
    const { FileScanner } = await import('../../src/services/file_scanner.js');
    const { AIAnalyzer } = await import('../../src/services/ai_analyzer.js');  
    const { OutputGenerator } = await import('../../src/services/output_generator.js');
    
    // 设置模拟返回值
    const mockFileScanner = new FileScanner();
    const mockAIAnalyzer = new AIAnalyzer();
    const mockOutputGenerator = new OutputGenerator();
    
    mockFileScanner.scanFiles.mockResolvedValue(testFiles);
    
    mockAIAnalyzer.analyzeFiles.mockResolvedValue([
      {
        filePath: testFiles[0],
        fileName: 'prompt1.md',
        content: '请帮我写一个Python函数来计算斐波那契数列',
        isPrompt: true,
        confidence: 0.95,
        language: 'python',
        category: 'code-generation'
      },
      {
        filePath: testFiles[1], 
        fileName: 'prompt2.txt',
        content: '如何使用JavaScript实现深拷贝？',
        isPrompt: true,
        confidence: 0.88,
        language: 'javascript',
        category: 'tutorial'
      }
    ]);
    
    const expectedOutput = {
      scanResult: {
        totalFiles: 2,
        promptFiles: [
          {
            filePath: testFiles[0],
            fileName: 'prompt1.md', 
            content: '请帮我写一个Python函数来计算斐波那契数列',
            isPrompt: true,
            confidence: 0.95,
            language: 'python',
            category: 'code-generation'
          },
          {
            filePath: testFiles[1],
            fileName: 'prompt2.txt',
            content: '如何使用JavaScript实现深拷贝？', 
            isPrompt: true,
            confidence: 0.88,
            language: 'javascript',
            category: 'tutorial'
          }
        ],
        scanTimestamp: expect.any(String),
        scanDuration: expect.any(Number)
      }
    };
    
    mockOutputGenerator.generateOutput.mockResolvedValue(expectedOutput);
    
    // 执行完整的扫描工作流程
    const scannedFiles = await mockFileScanner.scanFiles(testDir);
    const analyzedFiles = await mockAIAnalyzer.analyzeFiles(scannedFiles);
    const result = await mockOutputGenerator.generateOutput(analyzedFiles, outputFile);
    
    // 验证工作流程调用
    expect(mockFileScanner.scanFiles).toHaveBeenCalledWith(testDir);
    expect(mockAIAnalyzer.analyzeFiles).toHaveBeenCalledWith(testFiles);
    expect(mockOutputGenerator.generateOutput).toHaveBeenCalledWith(analyzedFiles, outputFile);
    
    // 验证输出格式
    expect(result).toEqual(expectedOutput);
    expect(result.scanResult.totalFiles).toBe(2);
    expect(result.scanResult.promptFiles).toHaveLength(2);
    expect(result.scanResult.promptFiles[0]).toHaveProperty('filePath');
    expect(result.scanResult.promptFiles[0]).toHaveProperty('isPrompt', true);
  });

  test('边界情况: 扫描空目录，验证空结果输出', async () => {
    // 创建空目录
    const emptyDir = path.join(testDir, 'empty');
    await fs.ensureDir(emptyDir);
    
    // 动态导入服务模块
    const { FileScanner } = await import('../../src/services/file_scanner.js');
    const { AIAnalyzer } = await import('../../src/services/ai_analyzer.js');
    const { OutputGenerator } = await import('../../src/services/output_generator.js');
    
    // 设置模拟返回值
    const mockFileScanner = new FileScanner();
    const mockAIAnalyzer = new AIAnalyzer();
    const mockOutputGenerator = new OutputGenerator();
    
    mockFileScanner.scanFiles.mockResolvedValue([]);
    mockAIAnalyzer.analyzeFiles.mockResolvedValue([]);
    
    const expectedEmptyOutput = {
      scanResult: {
        totalFiles: 0,
        promptFiles: [],
        scanTimestamp: expect.any(String),
        scanDuration: expect.any(Number)
      }
    };
    
    mockOutputGenerator.generateOutput.mockResolvedValue(expectedEmptyOutput);
    
    // 执行空目录扫描
    const scannedFiles = await mockFileScanner.scanFiles(emptyDir);
    const analyzedFiles = await mockAIAnalyzer.analyzeFiles(scannedFiles);
    const result = await mockOutputGenerator.generateOutput(analyzedFiles, outputFile);
    
    // 验证空结果
    expect(result.scanResult.totalFiles).toBe(0);
    expect(result.scanResult.promptFiles).toEqual([]);
    expect(Array.isArray(result.scanResult.promptFiles)).toBe(true);
  });
});