import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

describe('CLI Contract Tests', () => {
  const testDir = path.join(process.cwd(), 'temp_test_cli');
  const analysisDir = path.join(testDir, 'analysis');
  const outputFile = path.join(analysisDir, 'prompt-files.json');

  beforeEach(async () => {
    // 创建测试目录
    await fs.ensureDir(testDir);
    process.chdir(testDir);
    
    // 初始化git仓库（CLI要求在git仓库中运行）
    await new Promise((resolve, reject) => {
      const git = spawn('git', ['init'], { stdio: 'pipe' });
      git.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`git init failed with code ${code}`));
      });
    });
  });

  afterEach(async () => {
    process.chdir('/home/michael/ubuntu-repos/Michael1Peng/prompt-comparison.spec-kit');
    await fs.remove(testDir);
  });

  test('正常情况: CLI命令 `node scan.js` 能够生成 analysis/prompt-files.json 文件', async () => {
    // 设置环境变量
    const env = { ...process.env, OPENAI_API_KEY: 'test-api-key' };
    
    // 创建测试文件
    await fs.writeFile('test.md', '请帮我写一个Python函数来计算斐波那契数列');
    
    // 执行CLI命令
    const result = await new Promise((resolve) => {
      const cli = spawn('node', [path.join('/home/michael/ubuntu-repos/Michael1Peng/prompt-comparison.spec-kit', 'src/scan.js')], {
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
    expect(outputContent).toHaveProperty('scanResult');
    expect(outputContent.scanResult).toHaveProperty('totalFiles');
    expect(outputContent.scanResult).toHaveProperty('promptFiles');
    expect(Array.isArray(outputContent.scanResult.promptFiles)).toBe(true);
  }, 30000);

  test('边界情况: 处理缺少OPENAI_API_KEY的情况', async () => {
    // 不设置OPENAI_API_KEY环境变量
    const env = { ...process.env };
    delete env.OPENAI_API_KEY;
    
    // 执行CLI命令
    const result = await new Promise((resolve) => {
      const cli = spawn('node', [path.join('/home/michael/ubuntu-repos/Michael1Peng/prompt-comparison.spec-kit', 'src/scan.js')], {
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
    
    // 验证CLI返回错误代码
    expect(result.code).not.toBe(0);
    
    // 验证错误信息包含API key相关内容
    expect(result.stderr.toLowerCase()).toMatch(/api.*key|openai/);
  }, 10000);
});