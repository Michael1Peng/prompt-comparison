/**
 * CLI合约测试 - AI提示词框架要素拆分工具
 * 测试element.js CLI接口（MVP版本：每个功能2个测试）
 */

import { jest } from '@jest/globals';
import { spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

describe('Element CLI Contract Tests', () => {
  const cliPath = path.join(process.cwd(), 'src', 'element.js');
  const inputPath = path.join(process.cwd(), 'tests', 'fixtures', 'sample-prompt-list.json');
  const outputPath = path.join(process.cwd(), 'analysis', 'prompt-list-elements.json');

  beforeEach(async () => {
    // 清理输出文件
    await fs.remove(outputPath);
  });

  afterEach(async () => {
    // 清理测试产生的文件
    await fs.remove(outputPath);
  });

  test('正常情况: 读取prompt-list.json，生成prompt-list-elements.json', (done) => {
    // 设置环境变量
    const env = { ...process.env, OPENAI_API_KEY: 'test-key-123' };
    
    // 复制测试文件到默认输入位置
    fs.copySync(inputPath, path.join(process.cwd(), 'analysis', 'prompt-list.json'));
    
    // 运行CLI
    const child = spawn('node', [cliPath], { env });
    
    child.on('close', async (code) => {
      try {
        // 检查退出码
        expect(code).toBe(0);
        
        // 检查输出文件是否存在
        const outputExists = await fs.pathExists(outputPath);
        expect(outputExists).toBe(true);
        
        // 检查输出文件格式
        const output = await fs.readJson(outputPath);
        expect(output).toHaveProperty('totalPrompts');
        expect(output).toHaveProperty('analysisTime');
        expect(output).toHaveProperty('prompts');
        expect(Array.isArray(output.prompts)).toBe(true);
        
        // 检查13个要素字段都存在
        if (output.prompts.length > 0) {
          const firstPrompt = output.prompts[0];
          const requiredElements = [
            'source_file', 'role_capability', 'task_request',
            'background_context', 'instruction_action', 'output_specification',
            'examples', 'constraints_limitations', 'goals_expectations',
            'information', 'evaluation_optimization', 'adjustments', 'audience'
          ];
          
          requiredElements.forEach(element => {
            expect(firstPrompt.elements).toHaveProperty(element);
          });
        }
        
        done();
      } catch (error) {
        done(error);
      }
    });
  }, 30000);

  test('边界情况: 处理缺少OPENAI_API_KEY的情况', (done) => {
    // 不设置API密钥
    const env = { ...process.env };
    delete env.OPENAI_API_KEY;
    
    // 运行CLI
    const child = spawn('node', [cliPath], { env });
    
    child.on('close', (code) => {
      // 应该返回错误码2
      expect(code).toBe(2);
      done();
    });
  });
});