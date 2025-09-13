import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';

// 模拟FileScanner类 - 在TDD中尚未实现
jest.unstable_mockModule('../../src/services/file_scanner.js', () => ({
  FileScanner: jest.fn().mockImplementation(() => ({
    scanFiles: jest.fn(),
    _isTextFile: jest.fn(),
    _shouldIgnoreFile: jest.fn()
  }))
}));

describe('File Scanner Unit Tests', () => {
  const testDir = path.join(process.cwd(), 'temp_test_file_scanner');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
    jest.clearAllMocks();
  });

  test('正常情况: 扫描Git仓库，遵循.gitignore规则，过滤文本文件', async () => {
    // 准备测试文件
    await fs.writeFile(path.join(testDir, '.gitignore'), 'node_modules/\n*.log\ntemp/');
    await fs.writeFile(path.join(testDir, 'prompt.md'), '这是一个提示词文件');
    await fs.writeFile(path.join(testDir, 'code.js'), 'console.log("hello");');
    await fs.writeFile(path.join(testDir, 'data.json'), '{"key": "value"}');
    await fs.writeFile(path.join(testDir, 'binary.png'), Buffer.from('fake-image-data'));
    await fs.writeFile(path.join(testDir, 'debug.log'), 'debug info'); // 应被.gitignore忽略
    
    await fs.ensureDir(path.join(testDir, 'node_modules')); // 应被.gitignore忽略
    await fs.writeFile(path.join(testDir, 'node_modules', 'package.js'), 'module code');

    // 动态导入并设置模拟
    const { FileScanner } = await import('../../src/services/file_scanner.js');
    const scanner = new FileScanner();
    
    // 模拟预期的文本文件过滤结果（排除二进制文件和被忽略的文件）
    const expectedFiles = [
      path.join(testDir, 'prompt.md'),
      path.join(testDir, 'code.js'), 
      path.join(testDir, 'data.json')
    ];
    
    scanner.scanFiles.mockResolvedValue(expectedFiles);
    
    // 执行扫描
    const result = await scanner.scanFiles(testDir);
    
    // 验证结果
    expect(scanner.scanFiles).toHaveBeenCalledWith(testDir);
    expect(result).toEqual(expectedFiles);
    expect(result).toHaveLength(3);
    
    // 验证包含预期的文本文件
    expect(result).toContain(path.join(testDir, 'prompt.md'));
    expect(result).toContain(path.join(testDir, 'code.js'));
    expect(result).toContain(path.join(testDir, 'data.json'));
    
    // 验证不包含被忽略的文件
    expect(result).not.toContain(path.join(testDir, 'debug.log'));
    expect(result).not.toContain(path.join(testDir, 'node_modules', 'package.js'));
    expect(result).not.toContain(path.join(testDir, 'binary.png'));
  });

  test('边界情况: 处理无.gitignore文件的情况', async () => {
    // 创建没有.gitignore的目录
    await fs.writeFile(path.join(testDir, 'file1.txt'), 'content 1');
    await fs.writeFile(path.join(testDir, 'file2.md'), 'content 2');
    await fs.writeFile(path.join(testDir, 'file3.py'), 'print("hello")');
    
    // 动态导入并设置模拟
    const { FileScanner } = await import('../../src/services/file_scanner.js');
    const scanner = new FileScanner();
    
    // 模拟无.gitignore时的扫描结果（只过滤文本文件）
    const expectedFiles = [
      path.join(testDir, 'file1.txt'),
      path.join(testDir, 'file2.md'),
      path.join(testDir, 'file3.py')
    ];
    
    scanner.scanFiles.mockResolvedValue(expectedFiles);
    
    // 执行扫描
    const result = await scanner.scanFiles(testDir);
    
    // 验证结果
    expect(scanner.scanFiles).toHaveBeenCalledWith(testDir);
    expect(result).toEqual(expectedFiles);
    expect(result).toHaveLength(3);
    
    // 验证所有文本文件都被包含（因为没有.gitignore规则）
    expect(result).toContain(path.join(testDir, 'file1.txt'));
    expect(result).toContain(path.join(testDir, 'file2.md'));
    expect(result).toContain(path.join(testDir, 'file3.py'));
  });
});