#!/usr/bin/env node

/**
 * AI提示词深度分析和提取工具 - CLI入口
 * 读取第一步输出，提取具体提示词内容
 */

import { program } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { PromptExtractor } from './services/prompt_extractor.js';

// 版本信息
const packageJsonPath = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'package.json');
const packageJson = await fs.readJson(packageJsonPath);

// 配置CLI选项
program
  .name('prompt-extractor')
  .description('AI提示词深度分析和提取工具 - 从已识别文件中提取具体提示词')
  .version(packageJson.version)
  .option('-i, --input <path>', '输入文件路径 (默认: analysis/prompt-files.json)', 'analysis/prompt-files.json')
  .option('-o, --output <path>', '输出文件路径 (默认: analysis/prompt-list.json)', 'analysis/prompt-list.json')
  .option('-c, --concurrency <number>', '并发处理数量 (默认: 5)', '5')
  .option('--model <name>', 'GPT模型名称 (默认: gpt-5)', 'gpt-5')
  .option('--verbose', '显示详细输出信息')
  .parse();

const options = program.opts();

/**
 * 主函数
 */
async function main() {
  const startTime = Date.now();
  
  try {
    console.log(chalk.blue('🔍 AI提示词提取工具启动...'));
    
    // 验证环境
    if (!process.env.OPENAI_API_KEY) {
      console.error(chalk.red('❌ 错误: OPENAI_API_KEY环境变量未设置'));
      console.error(chalk.yellow('请设置: export OPENAI_API_KEY="your-api-key"'));
      process.exit(2);
    }
    
    // 验证输入文件存在
    if (!await fs.pathExists(options.input)) {
      console.error(chalk.red(`❌ 错误: 输入文件不存在: ${options.input}`));
      console.error(chalk.yellow('请先运行第一步扫描工具生成 prompt-files.json'));
      process.exit(1);
    }
    
    if (options.verbose) {
      console.log(chalk.gray('配置信息:'));
      console.log(chalk.gray(`- 输入文件: ${options.input}`));
      console.log(chalk.gray(`- 输出文件: ${options.output}`));
      console.log(chalk.gray(`- 并发数: ${options.concurrency}`));
      console.log(chalk.gray(`- GPT模型: ${options.model}`));
    }
    
    // 初始化提取器
    const extractor = new PromptExtractor({
      inputPath: options.input,
      outputPath: options.output,
      concurrencyLimit: parseInt(options.concurrency),
      model: options.model
    });
    
    // 执行提取
    console.log(chalk.yellow('📄 读取输入文件...'));
    const promptList = await extractor.extract();
    
    // 显示结果统计
    console.log(chalk.green('✅ 提取完成！'));
    console.log(chalk.cyan('📊 统计信息:'));
    console.log(chalk.cyan(`  总文件数: ${promptList.totalFiles}`));
    console.log(chalk.cyan(`  提取提示词数: ${promptList.totalPrompts}`));
    console.log(chalk.cyan(`  成功处理: ${promptList.processingStats.successfulFiles} 个文件`));
    console.log(chalk.cyan(`  处理失败: ${promptList.processingStats.failedFiles} 个文件`));
    
    if (promptList.processingStats.errors.length > 0 && options.verbose) {
      console.log(chalk.yellow('\n⚠️ 错误详情:'));
      promptList.processingStats.errors.forEach(err => {
        console.log(chalk.yellow(`  - ${err.file}: ${err.error}`));
      });
    }
    
    const duration = (Date.now() - startTime) / 1000;
    console.log(chalk.green(`\n✨ 完成! 耗时: ${duration.toFixed(2)}秒`));
    console.log(chalk.green(`📁 结果已保存到: ${options.output}`));
    
    process.exit(0);
    
  } catch (error) {
    console.error(chalk.red('❌ 执行失败:'), error.message);
    
    if (options.verbose) {
      console.error(chalk.red('错误详情:'), error.stack);
    }
    
    process.exit(3);
  }
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