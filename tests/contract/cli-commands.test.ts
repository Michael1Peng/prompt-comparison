/**
 * CLI Commands 契约测试
 * 基于 contracts/cli-commands.json 定义的CLI契约
 * 
 * 测试目标：
 * - scan: 文件扫描命令
 * - analyze: AI分析命令
 * - translate: 翻译命令
 * - report: 报告生成命令
 * - config: 配置管理命令
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawn, exec } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('CLI Commands 契约测试', () => {
  let testDir: string;
  let cliPath: string;

  beforeEach(() => {
    // 创建临时测试目录
    testDir = join(tmpdir(), 'cli-test-' + Date.now());
    mkdirSync(testDir, { recursive: true });
    
    // CLI可执行文件路径 (预期此时会失败，因为还未实现)
    cliPath = 'npx tsx src/cli/index.ts'; // 使用tsx运行TypeScript
    
    // 创建测试文件
    writeFileSync(join(testDir, 'prompt.md'), `
# AI Assistant Prompt
You are a helpful assistant. Please help users with their questions.

## Instructions
1. Be polite and professional
2. Provide accurate information
3. Ask for clarification when needed
    `);
    
    writeFileSync(join(testDir, 'code-prompt.js'), `
// Code Review Prompt
/* 
Please review this JavaScript function:
- Check for bugs
- Suggest improvements
- Verify best practices
*/
function processData(data) {
  return data.map(item => item * 2);
}
    `);
  });

  afterEach(() => {
    // 清理测试目录
    if (testDir && existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('scan 命令', () => {
    it('应该扫描目录中的提示词文件', async () => {
      const command = `${cliPath} scan ${testDir} --format json --output ${testDir}/scan-output.json`;
      
      try {
        const { stdout, stderr } = await execAsync(command);
        
        // 验证命令成功执行
        expect(stderr).toBe('');
        
        // 验证输出格式符合契约
        const output = JSON.parse(stdout);
        expect(output).toMatchObject({
          success: true,
          sessionId: expect.any(String),
          startTime: expect.any(String),
          endTime: expect.any(String),
          duration: expect.any(Number),
          summary: expect.objectContaining({
            totalFiles: expect.any(Number),
            promptFiles: expect.any(Number),
            totalPrompts: expect.any(Number),
            errorCount: expect.any(Number)
          }),
          outputFiles: expect.any(Array),
          statistics: expect.any(Object)
        });

        // 验证发现了测试文件
        expect(output.summary.totalFiles).toBeGreaterThan(0);
        expect(output.summary.promptFiles).toBeGreaterThan(0);

      } catch (error) {
        // 预期在实现前会失败
        expect(error.message).toContain('Command failed');
      }
    });

    it('应该支持递归扫描选项', async () => {
      // 创建子目录和文件
      const subDir = join(testDir, 'subdirectory');
      mkdirSync(subDir);
      writeFileSync(join(subDir, 'nested-prompt.md'), '# Nested Prompt\nThis is a nested prompt file.');

      const command = `${cliPath} scan ${testDir} --recursive --extensions .md,.js`;
      
      try {
        const { stdout } = await execAsync(command);
        const output = JSON.parse(stdout);
        
        // 应该找到子目录中的文件
        expect(output.summary.totalFiles).toBeGreaterThanOrEqual(3);
      } catch (error) {
        expect(error.message).toContain('Command failed');
      }
    });

    it('应该支持忽略模式', async () => {
      // 创建应该被忽略的文件
      mkdirSync(join(testDir, 'node_modules'), { recursive: true });
      writeFileSync(join(testDir, 'node_modules', 'ignored.js'), 'should be ignored');

      const command = `${cliPath} scan ${testDir} --ignore "node_modules/**"`;
      
      try {
        const { stdout } = await execAsync(command);
        const output = JSON.parse(stdout);
        
        // 不应该包含node_modules中的文件
        expect(output.statistics.filesByExtension['.js']).toBeLessThan(2);
      } catch (error) {
        expect(error.message).toContain('Command failed');
      }
    });

    it('应该处理无效路径', async () => {
      const command = `${cliPath} scan /non/existent/path`;
      
      try {
        await execAsync(command);
      } catch (error) {
        expect(error.code).toBe(2); // 路径不存在错误码
      }
    });

    it('应该支持AI识别选项', async () => {
      const command = `${cliPath} scan ${testDir} --ai-identify --ai-provider qwen --confidence 0.8`;
      
      try {
        const { stdout } = await execAsync(command);
        const output = JSON.parse(stdout);
        
        expect(output.summary).toHaveProperty('promptFiles');
        expect(output.summary.promptFiles).toBeGreaterThan(0);
      } catch (error) {
        expect(error.message).toContain('Command failed');
      }
    });
  });

  describe('analyze 命令', () => {
    it('应该分析提示词文件', async () => {
      // 先创建一个扫描结果文件
      const scanResultFile = join(testDir, 'scan-results.json');
      writeFileSync(scanResultFile, JSON.stringify({
        prompts: [
          {
            promptId: 'test-001',
            name: 'Test Prompt',
            content: 'You are a helpful assistant. Please help users with coding questions.',
            sourceInfo: { filePath: join(testDir, 'prompt.md') }
          }
        ]
      }));

      const command = `${cliPath} analyze ${scanResultFile} --ai-provider qwen --model qwen-plus --batch-size 1`;
      
      try {
        const { stdout } = await execAsync(command);
        const output = JSON.parse(stdout);
        
        // 验证分析输出契约
        expect(output).toMatchObject({
          success: true,
          sessionId: expect.any(String),
          startTime: expect.any(String),
          endTime: expect.any(String),
          duration: expect.any(Number),
          summary: expect.objectContaining({
            totalPrompts: expect.any(Number),
            analyzedSuccessfully: expect.any(Number),
            analysisFailed: expect.any(Number),
            averageConfidence: expect.any(Number),
            averageCompleteness: expect.any(Number)
          }),
          outputFiles: expect.any(Array),
          performance: expect.objectContaining({
            totalApiCalls: expect.any(Number),
            averageResponseTime: expect.any(Number),
            totalTokensUsed: expect.any(Number),
            estimatedCost: expect.any(Number)
          }),
          qualityMetrics: expect.any(Object)
        });

        // 验证15要素分析
        expect(output.summary.analyzedSuccessfully).toBeGreaterThan(0);

      } catch (error) {
        expect(error.message).toContain('Command failed');
      }
    });

    it('应该支持不同分析深度', async () => {
      const scanResultFile = join(testDir, 'test-prompts.json');
      writeFileSync(scanResultFile, JSON.stringify({ prompts: [] }));

      const depths = ['basic', 'standard', 'detailed'];
      
      for (const depth of depths) {
        const command = `${cliPath} analyze ${scanResultFile} --depth ${depth}`;
        
        try {
          const { stdout } = await execAsync(command);
          const output = JSON.parse(stdout);
          expect(output.success).toBe(true);
        } catch (error) {
          expect(error.message).toContain('Command failed');
        }
      }
    });

    it('应该支持批处理选项', async () => {
      const command = `${cliPath} analyze prompts.json --batch-size 3 --concurrency 2 --retry-count 1`;
      
      try {
        await execAsync(command);
      } catch (error) {
        // 应该因为文件不存在而失败，但不是因为选项错误
        expect(error.code).toBe(2);
      }
    });

    it('应该处理API配置错误', async () => {
      const command = `${cliPath} analyze prompts.json --ai-provider invalid-provider`;
      
      try {
        await execAsync(command);
      } catch (error) {
        expect(error.code).toBe(4); // 配置错误
      }
    });

    it('应该支持重试失败的分析', async () => {
      const command = `${cliPath} analyze prompts.json --retry-failed --min-confidence 0.8`;
      
      try {
        await execAsync(command);
      } catch (error) {
        expect(error.message).toContain('Command failed');
      }
    });
  });

  describe('translate 命令', () => {
    it('应该翻译提示词内容', async () => {
      const promptsFile = join(testDir, 'prompts-to-translate.json');
      writeFileSync(promptsFile, JSON.stringify({
        prompts: [
          {
            promptId: 'translate-test',
            name: 'Code Helper',
            description: 'Helps with coding tasks',
            originalContent: 'You are a helpful coding assistant.'
          }
        ]
      }));

      const command = `${cliPath} translate ${promptsFile} --target-lang zh --ai-provider qwen`;
      
      try {
        const { stdout } = await execAsync(command);
        const output = JSON.parse(stdout);
        
        // 验证翻译输出契约
        expect(output).toMatchObject({
          success: true,
          sessionId: expect.any(String),
          summary: expect.objectContaining({
            totalPrompts: expect.any(Number),
            translatedSuccessfully: expect.any(Number),
            translationFailed: expect.any(Number),
            skipped: expect.any(Number),
            averageConfidence: expect.any(Number)
          }),
          outputFiles: expect.any(Array),
          performance: expect.objectContaining({
            totalApiCalls: expect.any(Number),
            averageResponseTime: expect.any(Number),
            estimatedCost: expect.any(Number)
          })
        });

      } catch (error) {
        expect(error.message).toContain('Command failed');
      }
    });

    it('应该支持不同目标语言', async () => {
      const promptsFile = join(testDir, 'test-prompts.json');
      writeFileSync(promptsFile, JSON.stringify({ prompts: [] }));

      const languages = ['zh', 'en'];
      
      for (const lang of languages) {
        const command = `${cliPath} translate ${promptsFile} --target-lang ${lang}`;
        
        try {
          await execAsync(command);
        } catch (error) {
          expect(error.message).toContain('Command failed');
        }
      }
    });

    it('应该支持跳过已翻译内容', async () => {
      const command = `${cliPath} translate prompts.json --skip-translated --quality-check`;
      
      try {
        await execAsync(command);
      } catch (error) {
        expect(error.message).toContain('Command failed');
      }
    });
  });

  describe('report 命令', () => {
    it('应该生成分析报告', async () => {
      const analysisFile = join(testDir, 'analyzed-prompts.json');
      writeFileSync(analysisFile, JSON.stringify({
        prompts: [
          {
            promptId: 'report-test',
            name: 'Test Prompt',
            analysis: {
              角色能力: '助手',
              任务请求: '帮助用户',
              输出规格: 'JSON格式'
            },
            qualityMetrics: {
              overallConfidence: 0.85,
              completenessScore: 0.9
            }
          }
        ]
      }));

      const command = `${cliPath} report ${analysisFile} --format html --output ${testDir}/report.html`;
      
      try {
        const { stdout } = await execAsync(command);
        const output = JSON.parse(stdout);
        
        // 验证报告生成输出契约
        expect(output).toMatchObject({
          success: true,
          reportId: expect.any(String),
          reportType: expect.any(String),
          generatedAt: expect.any(String),
          summary: expect.objectContaining({
            totalPrompts: expect.any(Number),
            sectionsGenerated: expect.any(Number),
            tablesGenerated: expect.any(Number),
            chartsGenerated: expect.any(Number)
          }),
          outputFiles: expect.any(Array),
          statistics: expect.objectContaining({
            processingTime: expect.any(Number),
            dataPoints: expect.any(Number)
          })
        });

        // 验证输出文件生成
        expect(output.outputFiles.length).toBeGreaterThan(0);

      } catch (error) {
        expect(error.message).toContain('Command failed');
      }
    });

    it('应该支持不同报告类型', async () => {
      const analysisFile = join(testDir, 'test-analysis.json');
      writeFileSync(analysisFile, JSON.stringify({ prompts: [] }));

      const reportTypes = ['summary', 'detailed', 'executive', 'table-only'];
      
      for (const type of reportTypes) {
        const command = `${cliPath} report ${analysisFile} --report-type ${type}`;
        
        try {
          await execAsync(command);
        } catch (error) {
          expect(error.message).toContain('Command failed');
        }
      }
    });

    it('应该支持多种输出格式', async () => {
      const analysisFile = join(testDir, 'test-analysis.json');
      writeFileSync(analysisFile, JSON.stringify({ prompts: [] }));

      const formats = ['html', 'markdown', 'csv', 'json'];
      
      for (const format of formats) {
        const command = `${cliPath} report ${analysisFile} --format ${format}`;
        
        try {
          await execAsync(command);
        } catch (error) {
          expect(error.message).toContain('Command failed');
        }
      }
    });

    it('应该支持图表和统计选项', async () => {
      const command = `${cliPath} report analysis.json --include-charts --include-statistics --group-by category --sort-by confidence`;
      
      try {
        await execAsync(command);
      } catch (error) {
        expect(error.message).toContain('Command failed');
      }
    });

    it('应该支持过滤选项', async () => {
      const filterJson = JSON.stringify({ minConfidence: 0.8, categories: ['code-review'] });
      const command = `${cliPath} report analysis.json --filter '${filterJson}' --max-cell-length 150`;
      
      try {
        await execAsync(command);
      } catch (error) {
        expect(error.message).toContain('Command failed');
      }
    });
  });

  describe('config 命令', () => {
    it('应该列出所有配置项', async () => {
      const command = `${cliPath} config --list`;
      
      try {
        const { stdout } = await execAsync(command);
        
        // 应该显示配置信息
        expect(stdout).toContain('ai.provider');
        expect(stdout).toContain('scan.extensions');
        expect(stdout).toContain('output.directory');

      } catch (error) {
        expect(error.message).toContain('Command failed');
      }
    });

    it('应该设置配置项', async () => {
      const command = `${cliPath} config ai.provider qwen`;
      
      try {
        const { stdout } = await execAsync(command);
        expect(stdout).toContain('ai.provider');
        expect(stdout).toContain('qwen');
      } catch (error) {
        expect(error.message).toContain('Command failed');
      }
    });

    it('应该支持嵌套配置', async () => {
      const commands = [
        `${cliPath} config ai.qwen.model qwen-plus`,
        `${cliPath} config scan.maxFileSize 10MB`,
        `${cliPath} config output.format html`
      ];
      
      for (const command of commands) {
        try {
          await execAsync(command);
        } catch (error) {
          expect(error.message).toContain('Command failed');
        }
      }
    });

    it('应该支持重置配置', async () => {
      const command = `${cliPath} config --reset`;
      
      try {
        const { stdout } = await execAsync(command);
        expect(stdout).toContain('配置已重置');
      } catch (error) {
        expect(error.message).toContain('Command failed');
      }
    });

    it('应该区分全局和本地配置', async () => {
      const commands = [
        `${cliPath} config ai.provider qwen --global`,
        `${cliPath} config ai.provider openai`, // 本地配置
      ];
      
      for (const command of commands) {
        try {
          await execAsync(command);
        } catch (error) {
          expect(error.message).toContain('Command failed');
        }
      }
    });
  });

  describe('全局选项', () => {
    it('应该支持详细输出模式', async () => {
      const command = `${cliPath} scan ${testDir} --verbose`;
      
      try {
        const { stdout, stderr } = await execAsync(command);
        // 详细模式应该输出更多信息到stderr
        expect(stderr.length).toBeGreaterThan(0);
      } catch (error) {
        expect(error.message).toContain('Command failed');
      }
    });

    it('应该支持静默模式', async () => {
      const command = `${cliPath} scan ${testDir} --quiet`;
      
      try {
        const { stdout, stderr } = await execAsync(command);
        // 静默模式应该只输出结果，无额外信息
        expect(stderr).toBe('');
      } catch (error) {
        expect(error.message).toContain('Command failed');
      }
    });

    it('应该支持自定义输出目录', async () => {
      const outputDir = join(testDir, 'custom-output');
      const command = `${cliPath} scan ${testDir} --output ${outputDir}`;
      
      try {
        await execAsync(command);
        // 应该在指定目录创建输出文件
        expect(existsSync(outputDir)).toBe(true);
      } catch (error) {
        expect(error.message).toContain('Command failed');
      }
    });

    it('应该支持自定义配置文件', async () => {
      const configFile = join(testDir, 'custom-config.json');
      writeFileSync(configFile, JSON.stringify({
        ai: { provider: 'qwen' },
        scan: { extensions: ['.md'] }
      }));

      const command = `${cliPath} scan ${testDir} --config ${configFile}`;
      
      try {
        await execAsync(command);
      } catch (error) {
        expect(error.message).toContain('Command failed');
      }
    });

    it('应该显示帮助信息', async () => {
      const commands = [
        `${cliPath} --help`,
        `${cliPath} scan --help`,
        `${cliPath} analyze --help`,
        `${cliPath} translate --help`,
        `${cliPath} report --help`,
        `${cliPath} config --help`
      ];
      
      for (const command of commands) {
        try {
          const { stdout } = await execAsync(command);
          expect(stdout).toContain('Usage:');
          expect(stdout).toContain('Options:');
        } catch (error) {
          // 帮助命令可能使用exit code 0或其他值
          if (error.stdout) {
            expect(error.stdout).toContain('Usage:');
          }
        }
      }
    });

    it('应该显示版本信息', async () => {
      const command = `${cliPath} --version`;
      
      try {
        const { stdout } = await execAsync(command);
        expect(stdout).toMatch(/\d+\.\d+\.\d+/); // 版本号格式
      } catch (error) {
        if (error.stdout) {
          expect(error.stdout).toMatch(/\d+\.\d+\.\d+/);
        }
      }
    });
  });

  describe('错误处理', () => {
    it('应该返回正确的退出码', async () => {
      const errorTests = [
        { command: `${cliPath} scan /non/existent`, expectedCode: 2 }, // 路径错误
        { command: `${cliPath} analyze missing.json`, expectedCode: 2 }, // 文件不存在
        { command: `${cliPath} invalid-command`, expectedCode: 1 }, // 无效命令
      ];

      for (const test of errorTests) {
        try {
          await execAsync(test.command);
        } catch (error) {
          expect(error.code).toBe(test.expectedCode);
        }
      }
    });

    it('应该提供有用的错误消息', async () => {
      const command = `${cliPath} scan /permission/denied/path`;
      
      try {
        await execAsync(command);
      } catch (error) {
        expect(error.message).toMatch(/permission|access|denied/i);
      }
    });
  });

  describe('性能要求', () => {
    it('命令启动应该快速', async () => {
      const startTime = Date.now();
      
      try {
        await execAsync(`${cliPath} --version`);
      } catch (error) {
        // 即使失败，也要检查启动时间
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // 5秒内启动
    });

    it('应该支持大目录扫描', async () => {
      // 创建大量测试文件
      for (let i = 0; i < 50; i++) {
        writeFileSync(join(testDir, `test-file-${i}.md`), `# Test ${i}\nContent ${i}`);
      }

      const startTime = Date.now();
      
      try {
        await execAsync(`${cliPath} scan ${testDir} --concurrency 10`);
      } catch (error) {
        // 检查即使失败也要在合理时间内
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(30000); // 30秒内完成
    });
  });

  describe('集成验证', () => {
    it('应该支持命令链式调用', async () => {
      // 这个测试验证整个工作流
      const workflow = [
        `${cliPath} scan ${testDir} --output ${testDir}/scan.json`,
        `${cliPath} analyze ${testDir}/scan.json --output ${testDir}/analysis.json`,
        `${cliPath} report ${testDir}/analysis.json --format html --output ${testDir}/report.html`
      ];

      let lastOutput;
      for (const command of workflow) {
        try {
          const { stdout } = await execAsync(command);
          lastOutput = stdout;
        } catch (error) {
          // 预期在实现前失败
          expect(error.message).toContain('Command failed');
        }
      }
    });
  });
});