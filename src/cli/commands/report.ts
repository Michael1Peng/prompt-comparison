/**
 * report 命令实现
 */
import { CommandModule } from 'yargs';


export const reportCommand: CommandModule<{}, any> = {
  command: 'report <input>',
  describe: '生成提示词分析报告',
  builder: (yargs) => {
    return yargs
      .positional('input', {
        describe: '输入文件路径（analyze命令的输出）',
        type: 'string',
        demandOption: true
      })
      .option('output', {
        alias: 'o',
        describe: '输出文件路径',
        type: 'string'
      })
      .option('format', {
        alias: 'f',
        describe: '输出格式',
        choices: ['html', 'markdown', 'csv', 'json', 'pdf'],
        default: 'html'
      })
      .option('template', {
        alias: 't',
        describe: '报告模板',
        choices: ['default', 'detailed', 'summary', 'comparison'],
        default: 'default'
      })
      .option('include', {
        alias: 'i',
        describe: '包含的章节',
        type: 'array',
        string: true
      })
      .option('exclude', {
        alias: 'e',
        describe: '排除的章节',
        type: 'array',
        string: true
      })
      .option('verbose', {
        alias: 'v',
        describe: '详细输出',
        type: 'boolean',
        default: false
      });
  },
  handler: async (argv) => {
    try {
      // 检查输入文件是否存在
      const fs = await import('fs/promises');
      try {
        await fs.access(argv['input']);
      } catch (error) {
        console.error('错误: 输入文件不存在:', argv['input']);
        process.exit(2);
      }
      
      // 读取输入文件
      const inputData = await fs.readFile(argv['input'], 'utf-8');
      const analyzedPrompts = JSON.parse(inputData);
      
      // 导入ReportGenerator服务
      const { ReportGenerator } = await import('@/services/report-generator.js');
      const generator = new ReportGenerator();
      
      if (argv['verbose']) {
        console.log(`正在生成报告...`);
      }
      
      // 生成报告
      const report = await generator.generateSummaryReport({
        prompts: analyzedPrompts,
        options: {
          reportType: argv['template'] || 'summary',
          includeStatistics: true,
          includeInsights: true
        }
      });
      
      // 导出报告
      const outputPath = argv['output'] || `report-${Date.now()}.${argv['format']}`;
      const exportResult = await generator.exportToFormat({
        report,
        options: {
          outputFormat: argv['format'],
          outputPath: outputPath,
          templateStyle: argv['template'] || 'default'
        }
      });
      
      if (exportResult.success) {
        console.log(`报告已生成: ${exportResult.outputPath}`);
      } else {
        console.error('报告生成失败:', exportResult.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('报告生成错误:', error);
      process.exit(1);
    }
  }
};