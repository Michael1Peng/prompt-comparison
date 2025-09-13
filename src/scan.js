#!/usr/bin/env node

/**
 * AI提示词文件发现和汇总工具 - 主CLI入口点
 * 扫描Git仓库识别AI提示词文件，生成JSON分析报告
 */

import { program } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { FileScanner } from './services/file_scanner.js';
import { AIAnalyzer } from './services/ai_analyzer.js';
import { OutputGenerator } from './services/output_generator.js';
import { DEFAULT_OUTPUT_PATH } from './models/data_models.js';

// 版本信息
const scriptDir = path.dirname(new URL(import.meta.url).pathname);
const projectRoot = path.resolve(scriptDir, '..');
const packageJsonPath = path.join(projectRoot, 'package.json');
const packageJson = await fs.readJson(packageJsonPath);

// 配置CLI选项
program
  .name('ai-prompt-scanner')
  .description('AI提示词文件发现和汇总工具')
  .version(packageJson.version)
  .option('-o, --output <path>', `输出文件路径 (默认: ${DEFAULT_OUTPUT_PATH})`, DEFAULT_OUTPUT_PATH)
  .option('-c, --concurrency <number>', '并发处理数量 (默认: 5)', '5')
  .option('--api-base <url>', 'OpenAI API 基础URL (默认: https://api.openai.com/v1)')
  .option('--model <name>', 'GPT模型名称 (默认: gpt-5)', 'gpt-5')
  .option('--no-pretty', '关闭JSON格式化输出')
  .option('--verbose', '显示详细输出信息')
  .parse();

const options = program.opts();

/**
 * 主扫描函数
 */
async function main() {
  const startTime = Date.now();
  
  try {
    console.log(chalk.blue('🔍 AI提示词文件扫描器启动...'));
    
    // 验证环境
    await validateEnvironment();
    
    // 处理命令行参数设置的API Base URL
    if (options.apiBase) {
      process.env.OPENAI_API_BASE = options.apiBase;
      if (options.verbose) {
        console.log(chalk.gray(`使用自定义API Base URL: ${options.apiBase}`));
      }
    }
    
    // 初始化服务
    const scanner = new FileScanner();
    const analyzer = new AIAnalyzer({
      concurrencyLimit: parseInt(options.concurrency),
      model: options.model
    });
    const generator = new OutputGenerator({
      outputPath: options.output,
      prettyPrint: options.pretty !== false
    });
    
    if (options.verbose) {
      console.log(chalk.gray('配置信息:'));
      console.log(chalk.gray(`- 输出路径: ${options.output}`));
      console.log(chalk.gray(`- 并发数: ${options.concurrency}`));
      console.log(chalk.gray(`- GPT模型: ${options.model}`));
      console.log(chalk.gray(`- API Base URL: ${process.env.OPENAI_API_BASE || 'https://api.openai.com/v1'}`));
      console.log(chalk.gray(`- 格式化输出: ${options.pretty !== false}`));
    }
    
    // 步骤1: 扫描文件
    console.log(chalk.yellow('📁 扫描文件中...'));
    const currentDir = process.cwd();
    const filePaths = await scanner.scanFiles(currentDir);
    
    console.log(chalk.green(`✓ 发现 ${filePaths.length} 个文本文件`));
    
    if (filePaths.length === 0) {
      console.log(chalk.yellow('⚠️  未找到需要分析的文件'));
      await generateEmptyOutput(generator, startTime);
      return;
    }
    
    if (options.verbose) {
      console.log(chalk.gray('扫描到的文件类型统计:'));
      const extStats = {};
      filePaths.forEach(file => {
        const ext = path.extname(file);
        extStats[ext] = (extStats[ext] || 0) + 1;
      });
      Object.entries(extStats).forEach(([ext, count]) => {
        console.log(chalk.gray(`  ${ext}: ${count} 个`));
      });
    }
    
    // 步骤2: AI分析
    console.log(chalk.yellow('🤖 AI分析中...'));
    const promptFiles = await analyzer.analyzeFiles(filePaths);
    
    console.log(chalk.green(`✓ 识别出 ${promptFiles.length} 个提示词文件`));
    
    if (options.verbose && promptFiles.length > 0) {
      console.log(chalk.gray('识别的提示词文件:'));
      promptFiles.forEach((file, index) => {
        console.log(chalk.gray(`  ${index + 1}. ${file.fileName} (置信度: ${(file.confidence * 100).toFixed(1)}%)`));
      });
    }
    
    // 步骤3: 生成输出
    console.log(chalk.yellow('📊 生成分析报告...'));
    const scanMetadata = {
      totalScannedFiles: filePaths.length,
      startTime: new Date(startTime).toISOString(),
      duration: Date.now() - startTime
    };
    
    await generator.generateOutput(promptFiles, options.output, scanMetadata);
    
    // 显示统计信息
    if (promptFiles.length > 0) {
      const stats = generator.generateStats(promptFiles);
      console.log(chalk.cyan('📈 扫描统计:'));
      console.log(chalk.cyan(`  总文件数: ${filePaths.length}`));
      console.log(chalk.cyan(`  提示词文件数: ${stats.totalPromptFiles}`));
      console.log(chalk.cyan(`  平均置信度: ${(stats.averageConfidence * 100).toFixed(1)}%`));
      console.log(chalk.cyan(`  高置信度文件: ${stats.highConfidenceFiles} 个`));
      
      if (options.verbose) {
        console.log(chalk.cyan('  分类统计:'));
        Object.entries(stats.categoryCounts).forEach(([category, count]) => {
          console.log(chalk.cyan(`    ${category}: ${count} 个`));
        });
      }
    }
    
    const duration = (Date.now() - startTime) / 1000;
    console.log(chalk.green(`✅ 扫描完成! 耗时: ${duration.toFixed(2)}s`));
    console.log(chalk.green(`📄 分析报告已保存至: ${options.output}`));
    
  } catch (error) {
    console.error(chalk.red('❌ 扫描失败:'), error.message);
    
    if (options.verbose) {
      console.error(chalk.red('错误详情:'), error.stack);
    }
    
    process.exit(1);
  }
}

/**
 * 环境验证
 */
async function validateEnvironment() {
  // 检查OPENAI_API_KEY
  if (!process.env.OPENAI_API_KEY) {
    console.error(chalk.red('❌ 缺少API密钥'));
    console.error(chalk.red('请设置OpenAI API密钥:'));
    console.error(chalk.gray('  export OPENAI_API_KEY="sk-your-api-key"'));
    console.error(chalk.gray('或者:'));
    console.error(chalk.gray('  OPENAI_API_KEY="sk-your-api-key" node src/scan.js'));
    throw new Error('OPENAI_API_KEY环境变量未设置');
  }
  
  // 验证API密钥格式
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey.startsWith('sk-') || apiKey.length < 40) {
    console.error(chalk.red('❌ API密钥格式错误'));
    console.error(chalk.red('OpenAI API密钥应该以 "sk-" 开头且长度至少40字符'));
    console.error(chalk.gray('请访问 https://platform.openai.com/account/api-keys 获取有效密钥'));
    throw new Error('OPENAI_API_KEY格式无效');
  }
  
  // 检查是否在Git仓库中
  const gitDir = path.join(process.cwd(), '.git');
  if (!await fs.pathExists(gitDir)) {
    console.log(chalk.yellow('⚠️  当前目录不是Git仓库，将扫描所有文件'));
  }
  
  // 检查Node.js版本
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0]);
  if (majorVersion < 18) {
    throw new Error(`需要Node.js 18+版本，当前版本: ${nodeVersion}`);
  }
}

/**
 * 生成空输出结果
 */
async function generateEmptyOutput(generator, startTime) {
  const scanMetadata = {
    totalScannedFiles: 0,
    startTime: new Date(startTime).toISOString(),
    duration: Date.now() - startTime
  };
  
  await generator.generateOutput([], options.output, scanMetadata);
  
  const duration = (Date.now() - startTime) / 1000;
  console.log(chalk.green(`✅ 扫描完成! 耗时: ${duration.toFixed(2)}s`));
  console.log(chalk.green(`📄 空分析报告已保存至: ${options.output}`));
}

/**
 * 处理未捕获的异常
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('❌ 未处理的异步错误:'), reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ 未捕获的异常:'), error.message);
  if (options?.verbose) {
    console.error(chalk.red('错误详情:'), error.stack);
  }
  process.exit(1);
});

// 运行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}