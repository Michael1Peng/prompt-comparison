#!/usr/bin/env node

/**
 * AI提示词文件深度分析和提取工具 - CLI入口点
 * 读取第一步工具输出的JSON，深度分析提取每个文件中的具体提示词内容
 */

import { program } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { PromptReader } from './services/prompt_reader.js';
import { ContentExtractor } from './services/content_extractor.js';
import { ListGenerator } from './services/list_generator.js';
import { DEFAULT_PROMPT_LIST_OUTPUT_PATH } from './models/data_models.js';

// 版本信息
const scriptDir = path.dirname(new URL(import.meta.url).pathname);
const projectRoot = path.resolve(scriptDir, '..');
const packageJsonPath = path.join(projectRoot, 'package.json');
const packageJson = await fs.readJson(packageJsonPath);

// 配置CLI选项
program
  .name('ai-prompt-extractor')
  .description('AI提示词文件深度分析和提取工具')
  .version(packageJson.version)
  .option('--verbose', '显示详细输出信息')
  .option('--api-base <url>', 'OpenAI API 基础URL (默认: https://api.openai.com/v1)')
  .option('--model <name>', 'GPT模型名称 (默认: gpt-5)', 'gpt-5')
  .option('-c, --concurrency <number>', '并发处理数量 (默认: 5)', '5')
  .parse();

const options = program.opts();

// 固定的输入输出路径
const INPUT_PATH = './analysis/prompt-files.json';
const OUTPUT_PATH = DEFAULT_PROMPT_LIST_OUTPUT_PATH;

/**
 * 主提取函数
 */
async function main() {
  const startTime = Date.now();
  
  try {
    console.log(chalk.blue('🔍 AI提示词深度分析器启动...'));
    
    if (options.verbose) {
      console.log(chalk.gray('配置信息:'));
      console.log(chalk.gray(`- 输入文件: ${INPUT_PATH}`));
      console.log(chalk.gray(`- 输出文件: ${OUTPUT_PATH}`));
      console.log(chalk.gray(`- 并发数: ${options.concurrency}`));
      console.log(chalk.gray(`- GPT模型: ${options.model}`));
      console.log(chalk.gray(`- API Base URL: ${process.env.OPENAI_API_BASE || 'https://api.openai.com/v1'}`));
    }
    
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
    const reader = new PromptReader();
    const extractor = new ContentExtractor({
      concurrencyLimit: parseInt(options.concurrency),
      model: options.model
    });
    const generator = new ListGenerator({
      outputPath: OUTPUT_PATH
    });
    
    // 步骤1: 读取第一步工具输出
    console.log(chalk.yellow(`📁 读取输入文件: ${INPUT_PATH}`));
    const promptFiles = await reader.readPromptFiles(INPUT_PATH);
    
    console.log(chalk.green(`✓ 发现 ${promptFiles.length} 个待处理文件`));
    
    if (promptFiles.length === 0) {
      console.log(chalk.yellow('⚠️  输入文件中没有待处理的提示词文件'));
      await generateEmptyOutput(generator, startTime);
      return;
    }
    
    if (options.verbose) {
      console.log(chalk.gray('待处理文件:'));
      promptFiles.forEach((file, index) => {
        console.log(chalk.gray(`  ${index + 1}. ${file.fileName || path.basename(file.filePath)}`));
      });
    }
    
    // 步骤2: 深度分析提取提示词内容
    console.log(chalk.yellow('🤖 开始分析提示词内容...'));
    const promptDetails = await extractor.extractPromptDetails(promptFiles);
    
    console.log(chalk.green(`✓ 分析完成: 发现 ${promptDetails.length} 个提示词`));
    
    if (options.verbose && promptDetails.length > 0) {
      console.log(chalk.gray('提取的提示词:'));
      promptDetails.forEach((detail, index) => {
        console.log(chalk.gray(`  ${index + 1}. ${detail.promptId} (${path.basename(detail.sourceFile)}:${detail.startLine}-${detail.endLine})`));
      });
    }
    
    // 步骤3: 生成分析报告
    console.log(chalk.yellow('📊 生成分析报告...'));
    const metadata = {
      totalScannedFiles: promptFiles.length,
      startTime: new Date(startTime).toISOString(),
      duration: Date.now() - startTime
    };
    
    const result = await generator.generatePromptList(promptDetails, metadata, OUTPUT_PATH);
    
    // 显示统计信息
    console.log(chalk.cyan('📈 提取统计:'));
    console.log(chalk.cyan(`  总文件数: ${result.totalFiles}`));
    console.log(chalk.cyan(`  成功处理文件数: ${result.processingStats.successFiles}`));
    console.log(chalk.cyan(`  失败文件数: ${result.processingStats.failedFiles}`));
    console.log(chalk.cyan(`  发现提示词总数: ${result.totalPrompts}`));
    
    if (result.totalPrompts > 0) {
      const avgPerFile = (result.totalPrompts / result.processingStats.successFiles).toFixed(1);
      console.log(chalk.cyan(`  平均每文件提示词数: ${avgPerFile}`));
    }
    
    const duration = (Date.now() - startTime) / 1000;
    console.log(chalk.green(`✅ 提取完成! 耗时: ${duration.toFixed(2)}s`));
    console.log(chalk.green(`📄 分析报告已保存至: ${OUTPUT_PATH}`));
    
  } catch (error) {
    console.error(chalk.red('❌ 提取失败:'), error.message);
    
    if (options.verbose) {
      console.error(chalk.red('错误详情:'), error.stack);
    }
    
    // 根据错误类型设置不同的退出码
    if (error.message.includes('输入文件不存在')) {
      process.exit(1);
    } else if (error.message.includes('OPENAI_API_KEY') || error.message.includes('API密钥')) {
      process.exit(2);
    } else {
      process.exit(3);
    }
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
    console.error(chalk.gray(`  OPENAI_API_KEY="sk-your-api-key" node src/extract.js`));
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
  
  // 检查输入文件是否存在
  if (!await fs.pathExists(INPUT_PATH)) {
    console.error(chalk.red('❌ 输入文件不存在'));
    console.error(chalk.red(`未找到输入文件: ${INPUT_PATH}`));
    console.error(chalk.yellow('请先运行第一步工具:'));
    console.error(chalk.gray('  node src/scan.js'));
    throw new Error('输入文件不存在');
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
  const metadata = {
    totalScannedFiles: 0,
    startTime: new Date(startTime).toISOString(),
    duration: Date.now() - startTime
  };
  
  await generator.generatePromptList([], metadata, OUTPUT_PATH);
  
  const duration = (Date.now() - startTime) / 1000;
  console.log(chalk.green(`✅ 分析完成! 耗时: ${duration.toFixed(2)}s`));
  console.log(chalk.green(`📄 空分析报告已保存至: ${OUTPUT_PATH}`));
}

/**
 * 处理未捕获的异常
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('❌ 未处理的异步错误:'), reason);
  process.exit(3);
});

process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ 未捕获的异常:'), error.message);
  if (options?.verbose) {
    console.error(chalk.red('错误详情:'), error.stack);
  }
  process.exit(3);
});

// 运行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}