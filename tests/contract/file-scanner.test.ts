/**
 * FileScanner 契约测试
 * 基于 contracts/file-scanner.json 定义的API契约
 * 
 * 测试目标：
 * - scanRepository: 扫描指定目录中的所有文件
 * - identifyPromptFiles: 使用AI智能识别包含提示词的文件  
 * - extractPromptContent: 从识别的文件中提取具体的提示词内容
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { FileScanner } from '@/services/file-scanner';

describe('FileScanner 契约测试', () => {
  let fileScanner: FileScanner;
  let testDir: string;

  beforeEach(() => {
    // 创建临时测试目录
    testDir = join(tmpdir(), 'file-scanner-test-' + Date.now());
    mkdirSync(testDir, { recursive: true });
    
    // 创建测试文件
    writeFileSync(join(testDir, 'prompt1.md'), `
# AI Assistant Prompt
You are a helpful AI assistant. Please analyze the following code and provide feedback.

## Task
Analyze the code quality and suggest improvements.

## Context
This is a JavaScript function for data processing.
    `);
    
    writeFileSync(join(testDir, 'regular.txt'), 'This is just regular text content.');
    
    writeFileSync(join(testDir, 'code.js'), `
// AI Code Review Prompt  
function processData(input) {
  // Please review this function for:
  // 1. Performance issues
  // 2. Error handling
  // 3. Code clarity
  return input.map(x => x * 2);
}
    `);
    
    mkdirSync(join(testDir, 'node_modules'), { recursive: true });
    writeFileSync(join(testDir, 'node_modules', 'ignore.js'), 'should be ignored');

    // 创建FileScanner实例 (预期此时会失败，因为还未实现)
    fileScanner = new FileScanner();
  });

  afterEach(() => {
    // 清理测试目录
    if (testDir) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('scanRepository', () => {
    it('应该扫描指定目录中的所有文件', async () => {
      // 输入参数契约验证
      const scanOptions = {
        extensions: ['.md', '.txt', '.js'],
        ignorePatterns: ['node_modules/**'],
        maxFileSize: 5242880, // 5MB
        concurrency: 10,
        timeout: 300000
      };

      // 执行扫描
      const result = await fileScanner.scanRepository({
        rootPath: testDir,
        options: scanOptions
      });

      // 验证输出契约
      expect(result).toMatchObject({
        sessionId: expect.any(String),
        startTime: expect.any(String),
        endTime: expect.any(String),
        duration: expect.any(Number),
        rootPath: testDir,
        totalFiles: expect.any(Number),
        filteredFiles: expect.any(Number),
        files: expect.any(Array),
        errors: expect.any(Array),
        statistics: expect.any(Object)
      });

      // 验证文件数量
      expect(result.totalFiles).toBeGreaterThan(0);
      expect(result.filteredFiles).toBeLessThanOrEqual(result.totalFiles);
      
      // 验证应该忽略node_modules
      const nodeModulesFiles = result.files.filter(f => f.filePath.includes('node_modules'));
      expect(nodeModulesFiles).toHaveLength(0);

      // 验证文件结构
      expect(result.files[0]).toMatchObject({
        filePath: expect.any(String),
        fileName: expect.any(String),
        extension: expect.any(String),
        size: expect.any(Number)
      });

      // 验证统计信息
      expect(result.statistics).toMatchObject({
        filesByExtension: expect.any(Object),
        totalFileSize: expect.any(Number),
        averageFileSize: expect.any(Number),
        processingSpeed: expect.any(Number)
      });
    });

    it('应该处理无效路径错误', async () => {
      await expect(fileScanner.scanRepository({
        rootPath: '/non/existent/path'
      })).rejects.toThrow('INVALID_PATH');
    });

    it('应该处理扫描超时', async () => {
      const scanOptions = {
        timeout: 1 // 1ms 超时
      };

      await expect(fileScanner.scanRepository({
        rootPath: testDir,
        options: scanOptions
      })).rejects.toThrow('SCAN_TIMEOUT');
    });
  });

  describe('identifyPromptFiles', () => {
    it('应该使用AI智能识别包含提示词的文件', async () => {
      // 先扫描文件
      const scanResult = await fileScanner.scanRepository({
        rootPath: testDir
      });

      // AI识别选项
      const identificationOptions = {
        aiProvider: 'qwen' as const,
        model: 'qwen-plus',
        batchSize: 5,
        confidenceThreshold: 0.7,
        retryCount: 2,
        timeout: 30000
      };

      // 执行AI识别
      const result = await fileScanner.identifyPromptFiles({
        files: scanResult.files,
        options: identificationOptions
      });

      // 验证输出契约
      expect(result).toMatchObject({
        sessionId: expect.any(String),
        processedFiles: expect.any(Number),
        promptFiles: expect.any(Array),
        statistics: expect.objectContaining({
          totalApiCalls: expect.any(Number),
          successfulCalls: expect.any(Number),
          failedCalls: expect.any(Number),
          averageConfidence: expect.any(Number),
          processingTime: expect.any(Number)
        }),
        errors: expect.any(Array)
      });

      // 验证应该识别出包含提示词的文件
      expect(result.promptFiles.length).toBeGreaterThan(0);
      
      // 验证提示词文件结构
      const promptFile = result.promptFiles[0];
      expect(promptFile).toMatchObject({
        fileId: expect.any(String),
        filePath: expect.any(String),
        hasPrompts: true,
        confidence: expect.any(Number),
        promptCount: expect.any(Number),
        identificationReason: expect.any(String),
        keyPhrases: expect.any(Array),
        processingTime: expect.any(Number)
      });

      // 验证置信度在合理范围内
      expect(promptFile.confidence).toBeGreaterThanOrEqual(0);
      expect(promptFile.confidence).toBeLessThanOrEqual(1);
    });

    it('应该处理AI API错误', async () => {
      const invalidOptions = {
        aiProvider: 'invalid' as any,
        model: 'invalid-model'
      };

      await expect(fileScanner.identifyPromptFiles({
        files: [],
        options: invalidOptions
      })).rejects.toThrow('AI_API_ERROR');
    });

    it('应该处理批处理错误', async () => {
      const largeFileList = new Array(1000).fill(null).map((_, i) => ({
        filePath: `/fake/path/file${i}.txt`,
        fileName: `file${i}.txt`,
        extension: '.txt',
        size: 1000
      }));

      await expect(fileScanner.identifyPromptFiles({
        files: largeFileList,
        options: { batchSize: 0 } // 无效的批次大小
      })).rejects.toThrow('BATCH_PROCESSING_ERROR');
    });
  });

  describe('extractPromptContent', () => {
    it('应该从识别的文件中提取具体的提示词内容', async () => {
      // 创建一个包含提示词的文件对象
      const promptFile = {
        filePath: join(testDir, 'prompt1.md'),
        fileName: 'prompt1.md',
        extension: '.md',
        size: 1000
      };

      const extractionOptions = {
        includeContext: true,
        contextLines: 5,
        preserveFormatting: true,
        extractionMode: 'automatic' as const
      };

      // 执行提示词提取
      const result = await fileScanner.extractPromptContent({
        file: promptFile,
        options: extractionOptions
      });

      // 验证输出契约
      expect(result).toMatchObject({
        fileId: expect.any(String),
        extractedPrompts: expect.any(Array),
        extractionMetadata: expect.objectContaining({
          extractionTime: expect.any(String),
          extractionMethod: expect.any(String),
          processingTime: expect.any(Number)
        })
      });

      // 验证提取的提示词
      expect(result.extractedPrompts.length).toBeGreaterThan(0);
      
      const extractedPrompt = result.extractedPrompts[0];
      expect(extractedPrompt).toMatchObject({
        promptId: expect.any(String),
        content: expect.any(String),
        startLine: expect.any(Number),
        endLine: expect.any(Number),
        confidence: expect.any(Number)
      });

      // 验证内容不为空
      expect(extractedPrompt.content.length).toBeGreaterThan(0);
      expect(extractedPrompt.startLine).toBeGreaterThan(0);
      expect(extractedPrompt.endLine).toBeGreaterThanOrEqual(extractedPrompt.startLine);
    });

    it('应该处理文件读取错误', async () => {
      const invalidFile = {
        filePath: '/non/existent/file.txt',
        fileName: 'file.txt',
        extension: '.txt',
        size: 0
      };

      await expect(fileScanner.extractPromptContent({
        file: invalidFile
      })).rejects.toThrow('FILE_READ_ERROR');
    });

    it('应该处理过大文件', async () => {
      const largeFile = {
        filePath: join(testDir, 'large.txt'),
        fileName: 'large.txt',
        extension: '.txt',
        size: 100 * 1024 * 1024 // 100MB
      };

      await expect(fileScanner.extractPromptContent({
        file: largeFile
      })).rejects.toThrow('CONTENT_TOO_LARGE');
    });
  });

  describe('错误处理契约', () => {
    it('所有方法都应该返回正确的错误格式', async () => {
      try {
        await fileScanner.scanRepository({
          rootPath: '/invalid/path'
        });
      } catch (error) {
        expect(error).toHaveProperty('code');
        expect(error).toHaveProperty('message');
        expect(['INVALID_PATH', 'PERMISSION_DENIED', 'SCAN_TIMEOUT']).toContain(error.code);
      }
    });
  });

  describe('性能契约', () => {
    it('scanRepository应该在合理时间内完成', async () => {
      const startTime = Date.now();
      
      await fileScanner.scanRepository({
        rootPath: testDir,
        options: { timeout: 10000 }
      });
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(10000); // 应该在10秒内完成
    });

    it('应该支持并发处理', async () => {
      const scanPromise1 = fileScanner.scanRepository({ rootPath: testDir });
      const scanPromise2 = fileScanner.scanRepository({ rootPath: testDir });
      
      const [result1, result2] = await Promise.all([scanPromise1, scanPromise2]);
      
      expect(result1.sessionId).not.toBe(result2.sessionId);
    });
  });
});