/**
 * CLI端到端测试
 * 测试命令行完整工作流验证
 */

import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';

describe('CLI端到端测试', () => {
  it('应该显示帮助信息', async () => {
    const proc = spawn('node', ['src/cli/index.ts', '--help']);
    
    const output = await new Promise<string>((resolve, reject) => {
      let stdout = '';
      proc.stdout.on('data', data => stdout += data);
      proc.on('close', code => {
        if (code === 0 || stdout.includes('Usage:')) {
          resolve(stdout);
        } else {
          reject(new Error(`Process failed with code ${code}`));
        }
      });
    });

    expect(output).toContain('Usage:');
  });
});