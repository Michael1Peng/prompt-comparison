import pkg from '@jest/globals';
const { describe, test, expect, beforeEach, afterEach } = pkg;
import { spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

describe('Extract CLI Contract Tests', () => {
  const testDir = path.join(process.cwd(), 'temp_test_extract_cli');
  const analysisDir = path.join(testDir, 'analysis');
  const inputFile = path.join(analysisDir, 'prompt-files.json');
  const outputFile = path.join(analysisDir, 'prompt-list.json');

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

  test('正常情况: CLI命令 `node extract.js` 能够读取 analysis/prompt-files.json，生成 analysis/prompt-list.json', async () => {
    // 设置环境变量
    const env = { 
      ...process.env, 
      OPENAI_API_KEY: 'sk-1234567890123456789012345678901234567890' // 有效格式的测试密钥
    };
    
    // 创建第一步工具的输出文件（模拟输入）
    const mockInputData = {
      scanResult: {
        totalFiles: 2,
        promptFiles: [
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
        ],
        scanTimestamp: '2025-09-14T14:30:22Z',
        scanDuration: 15000
      }
    };
    
    await fs.writeJson(inputFile, mockInputData);
    
    // 创建对应的源文件（ContentExtractor需要读取这些文件）
    await fs.ensureDir('docs');
    await fs.ensureDir('examples');
    await fs.writeFile('docs/system-prompt.md', mockInputData.scanResult.promptFiles[0].content);
    await fs.writeFile('examples/tutorial.md', mockInputData.scanResult.promptFiles[1].content);
    
    // 执行CLI命令
    const result = await new Promise((resolve) => {
      const cli = spawn('node', [path.join('/home/michael/ubuntu-repos/Michael1Peng/prompt-comparison.spec-kit', 'src/extract.js')], {
        env,
        stdio: 'pipe',
        cwd: testDir
      });
      
      let stdout = '';
      let stderr = '';
      
      cli.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      cli.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      cli.on('close', (code) => {
        resolve({ code, stdout, stderr });
      });
    });
    
    // 验证CLI执行成功
    expect(result.code).toBe(0);
    
    // 验证输出文件存在
    expect(await fs.pathExists(outputFile)).toBe(true);
    
    // 验证输出文件格式
    const outputContent = await fs.readJson(outputFile);
    expect(outputContent).toHaveProperty('totalFiles');
    expect(outputContent).toHaveProperty('totalPrompts');
    expect(outputContent).toHaveProperty('prompts');
    expect(outputContent).toHaveProperty('analysisTime');
    expect(outputContent).toHaveProperty('processingStats');
    
    // 验证数据类型
    expect(typeof outputContent.totalFiles).toBe('number');
    expect(typeof outputContent.totalPrompts).toBe('number');
    expect(Array.isArray(outputContent.prompts)).toBe(true);
    expect(typeof outputContent.analysisTime).toBe('string');
    expect(typeof outputContent.processingStats).toBe('object');
    
    // 验证处理统计结构
    expect(outputContent.processingStats).toHaveProperty('successFiles');
    expect(outputContent.processingStats).toHaveProperty('failedFiles');
    expect(typeof outputContent.processingStats.successFiles).toBe('number');
    expect(typeof outputContent.processingStats.failedFiles).toBe('number');
    
    // 验证提示词数组中每个对象的结构
    if (outputContent.prompts.length > 0) {
      const prompt = outputContent.prompts[0];
      expect(prompt).toHaveProperty('promptId');
      expect(prompt).toHaveProperty('sourceFile');
      expect(prompt).toHaveProperty('content');
      expect(prompt).toHaveProperty('startLine');
      expect(prompt).toHaveProperty('endLine');
      
      expect(typeof prompt.promptId).toBe('string');
      expect(typeof prompt.sourceFile).toBe('string');
      expect(typeof prompt.content).toBe('string');
      expect(typeof prompt.startLine).toBe('number');
      expect(typeof prompt.endLine).toBe('number');
    }
    
    // 验证控制台输出包含预期信息
    expect(result.stdout).toContain('AI提示词深度分析器启动');
    expect(result.stdout).toContain('读取输入文件');
    expect(result.stdout).toContain('提取完成');
  }, 60000); // 60秒超时

  test('边界情况: 处理输入文件不存在的情况', async () => {
    // 设置环境变量
    const env = { 
      ...process.env, 
      OPENAI_API_KEY: 'sk-1234567890123456789012345678901234567890'
    };
    
    // 不创建输入文件，测试错误处理
    
    // 执行CLI命令
    const result = await new Promise((resolve) => {
      const cli = spawn('node', [path.join('/home/michael/ubuntu-repos/Michael1Peng/prompt-comparison.spec-kit', 'src/extract.js')], {
        env,
        stdio: 'pipe',
        cwd: testDir
      });
      
      let stdout = '';
      let stderr = '';
      
      cli.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      cli.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      cli.on('close', (code) => {
        resolve({ code, stdout, stderr });
      });
    });
    
    // 验证CLI退出码为1（输入文件不存在）
    expect(result.code).toBe(1);
    
    // 验证错误信息
    expect(result.stderr).toContain('输入文件不存在');
    expect(result.stderr).toContain('请先运行第一步工具');
    
    // 验证输出文件没有被创建
    expect(await fs.pathExists(outputFile)).toBe(false);
  }, 30000); // 30秒超时
});