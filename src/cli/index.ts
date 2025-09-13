#!/usr/bin/env node
/**
 * CLI主入口文件
 */

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { scanCommand } from './commands/scan.js';
import { analyzeCommand } from './commands/analyze.js';
import { translateCommand } from './commands/translate.js';
import { reportCommand } from './commands/report.js';
import { configCommand } from './commands/config.js';

async function main() {
  const argv = yargs(hideBin(process.argv))
    .scriptName('prompt-analysis')
    .usage('$0 <command> [options]')
    .demandCommand(1, '请指定一个命令')
    .help('h')
    .alias('h', 'help')
    .version('1.0.0')
    .command(scanCommand)
    .command(analyzeCommand)
    .command(translateCommand)
    .command(reportCommand)
    .command(configCommand)
    .example('$0 scan ./project', '扫描项目中的提示词文件')
    .example('$0 analyze results.json', '分析提示词内容')
    .example('$0 report analysis.json --format html', '生成HTML格式报告')
    .strict()
    .fail((msg, err) => {
      if (err) {
        console.error('错误:', err.message);
        process.exit(2);
      }
      console.error(msg);
      console.error('\n使用 --help 查看帮助信息');
      process.exit(1);
    });

  await argv.parse();
}

// 仅在直接运行时执行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('未处理的错误:', err);
    process.exit(1);
  });
}

export { main };