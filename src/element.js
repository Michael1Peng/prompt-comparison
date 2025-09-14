#!/usr/bin/env node

/**
 * AI提示词框架要素拆分工具 - CLI入口
 * 读取提示词列表，拆分为13个框架要素
 */

import { program } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { PromptElementAnalyzer } from './services/prompt_element_analyzer.js';

// 获取package.json版本信息
const packageJsonPath = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'package.json');
const packageJson = await fs.readJson(packageJsonPath);

// 配置CLI选项
program
  .name('element')
  .description('AI提示词框架要素拆分工具 - 将提示词拆分为13个标准框架要素')
  .version(packageJson.version)
  .option('-i, --input <path>', '输入文件路径', 'analysis/prompt-list.json')
  .option('-o, --output <path>', '输出文件路径', 'analysis/prompt-list-elements.json')
  .option('--model <name>', 'GPT模型名称', 'gpt-3.5-turbo')
  .option('--concurrency <number>', '并发处理数量', '5')
  .parse();

const options = program.opts();

/**
 * 主函数
 */
async function main() {
  const startTime = Date.now();
  
  try {
    console.log(chalk.blue.bold('╔════════════════════════════════════════════════╗'));
    console.log(chalk.blue.bold('║     🔍 AI提示词框架要素拆分工具 v' + packageJson.version + '        ║'));
    console.log(chalk.blue.bold('╚════════════════════════════════════════════════╝'));
    console.log();
    
    // 验证环境
    if (!process.env.OPENAI_API_KEY) {
      console.error(chalk.red('❌ 错误: OPENAI_API_KEY环境变量未设置'));
      console.error(chalk.yellow('请设置: export OPENAI_API_KEY="your-api-key"'));
      process.exit(2);
    }
    
    // 验证输入文件存在
    const inputPath = path.resolve(options.input);
    if (!await fs.pathExists(inputPath)) {
      console.error(chalk.red(`❌ 错误: 输入文件不存在: ${inputPath}`));
      console.error(chalk.yellow('请先运行提示词提取工具生成 prompt-list.json'));
      process.exit(1);
    }
    
    console.log(chalk.gray(`输入文件: ${inputPath}`));
    console.log(chalk.gray(`输出文件: ${options.output}`));
    console.log(chalk.gray(`GPT模型: ${options.model}`));
    console.log(chalk.gray(`并发数: ${options.concurrency}`));
    
    // 读取输入文件
    console.log(chalk.yellow('📄 读取输入文件...'));
    const inputData = await fs.readJson(inputPath);
    
    if (!inputData.prompts || !Array.isArray(inputData.prompts)) {
      console.error(chalk.red('❌ 错误: 输入文件格式无效'));
      process.exit(3);
    }
    
    console.log(chalk.green(`✓ 发现 ${inputData.prompts.length} 个提示词`));
    
    // 初始化分析器
    const analyzer = new PromptElementAnalyzer({
      model: options.model,
      concurrencyLimit: parseInt(options.concurrency)
    });
    
    // 执行要素拆分
    console.log(chalk.yellow('🤖 AI分析中...'));
    console.log(chalk.gray(`  模型: ${options.model}`));
    console.log(chalk.gray(`  并发数: ${options.concurrency}`));
    console.log('');
    
    // 添加进度跟踪
    let processedCount = 0;
    const totalCount = inputData.prompts.length;
    
    // 监听分析进度（通过修改analyzer来支持）
    const originalAnalyzeSingle = analyzer.analyzeSinglePrompt.bind(analyzer);
    analyzer.analyzeSinglePrompt = async function(prompt) {
      const result = await originalAnalyzeSingle(prompt);
      processedCount++;
      const percentage = ((processedCount / totalCount) * 100).toFixed(1);
      process.stdout.write(chalk.cyan(`\r  进度: [${processedCount}/${totalCount}] ${percentage}% - 正在处理: ${prompt.promptId}${' '.repeat(20)}`));
      if (processedCount === totalCount) {
        console.log(''); // 换行
      }
      return result;
    };
    
    const result = await analyzer.analyzeElements(inputData.prompts);
    
    // 生成输出文件（确保格式符合规范）
    const outputPath = path.resolve(options.output);
    await analyzer.saveResultsToJSON(result, outputPath);
    
    // 显示结果统计
    console.log(chalk.green('✅ 分析完成！'));
    console.log(chalk.cyan('📊 统计信息:'));
    console.log(chalk.cyan(`  总提示词数: ${result.totalPrompts}`));
    console.log(chalk.cyan(`  分析时间: ${result.analysisTime}`));
    
    // 显示要素统计
    if (result.prompts.length > 0) {
      const elementStats = {};
      result.prompts.forEach(prompt => {
        Object.entries(prompt.elements).forEach(([key, value]) => {
          if (value && value.trim() !== '') {
            elementStats[key] = (elementStats[key] || 0) + 1;
          }
        });
      });
      
      console.log(chalk.cyan('  要素覆盖率:'));
      Object.entries(elementStats).forEach(([key, count]) => {
        const percentage = ((count / result.totalPrompts) * 100).toFixed(1);
        console.log(chalk.cyan(`    ${key}: ${count}/${result.totalPrompts} (${percentage}%)`));
      });
    }
    
    const duration = (Date.now() - startTime) / 1000;
    console.log('');
    console.log(chalk.green.bold('╔════════════════════════════════════════════════╗'));
    console.log(chalk.green.bold('║              ✨ 分析完成！                     ║'));
    console.log(chalk.green.bold('╚════════════════════════════════════════════════╝'));
    console.log(chalk.green(`⏱  耗时: ${duration.toFixed(2)}秒`));
    console.log(chalk.green(`📁 结果已保存到: ${outputPath}`));
    
    process.exit(0);
    
  } catch (error) {
    console.error(chalk.red('❌ 执行失败:'), error.message);
    
    if (error.stack) {
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
  if (error.stack) {
    console.error(chalk.red('错误详情:'), error.stack);
  }
  process.exit(3);
});

// 运行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}