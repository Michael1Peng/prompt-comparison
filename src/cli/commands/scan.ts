/**
 * scan 命令实现
 */
import { CommandModule } from 'yargs';

export const scanCommand: CommandModule<{}, any> = {
  command: 'scan <path>',
  describe: '扫描仓库中的提示词文件',
  builder: (yargs) => {
    return yargs
      .positional('path', {
        describe: '要扫描的目录路径',
        type: 'string',
        demandOption: true
      })
      .option('output', {
        alias: 'o',
        describe: '输出文件路径',
        type: 'string'
      })
      .option('recursive', {
        alias: 'r',
        describe: '递归扫描子目录',
        type: 'boolean',
        default: true
      })
      .option('include', {
        alias: 'i',
        describe: '包含的文件模式',
        type: 'array',
        string: true
      })
      .option('exclude', {
        alias: 'e',
        describe: '排除的文件模式',
        type: 'array',
        string: true,
        default: ['node_modules/**', '.git/**', '*.lock']
      })
      .option('format', {
        alias: 'f',
        describe: '输出格式',
        choices: ['json', 'csv', 'yaml'] as const,
        default: 'json' as const
      })
      .option('ai-model', {
        describe: 'AI识别模型',
        type: 'string',
        default: 'qwen-plus'
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
      // 检查路径是否存在
      const fs = await import('fs/promises');
      try {
        const stat = await fs.stat(argv['path']);
        if (!stat.isDirectory()) {
          console.error('错误: 指定的路径不是目录:', argv['path']);
          process.exit(2);
        }
      } catch (error) {
        console.error('错误: 指定的路径不存在:', argv['path']);
        process.exit(2); // 路径不存在错误码
      }
      
      // 导入FileScanner服务
      const { FileScanner } = await import('@/services/file-scanner.js');
      const scanner = new FileScanner();
      
      if (argv['verbose']) {
        console.log(`正在扫描目录: ${argv['path']}`);
      }
      
      // 执行扫描
      const scanResult = await scanner.scanRepository({
        rootPath: argv['path'],
        options: {
          extensions: argv['include'] ? argv['include'].map((p: string) => `.${p}`) : undefined,
          ignorePatterns: argv['exclude'],
          respectGitignore: true
        }
      });
      
      // 创建输出结果
      const result = {
        scanPath: argv['path'],
        timestamp: scanResult.startTime,
        totalFiles: scanResult.totalFiles,
        filteredFiles: scanResult.filteredFiles,
        files: scanResult.files,
        promptFiles: [],
        summary: {
          totalFiles: 0,
          promptFiles: 0
        }
      };
      
      if (argv['output']) {
        await fs.writeFile(argv['output'], JSON.stringify(result, null, 2), 'utf8');
        console.log(`结果已保存到: ${argv['output']}`);
      } else {
        console.log(JSON.stringify(result, null, 2));
      }
      
    } catch (error) {
      console.error('扫描失败:', error instanceof Error ? error.message : error);
      
      // 根据错误类型返回不同的退出码
      if (error instanceof Error) {
        if (error.message.includes('不存在') || error.message.includes('ENOENT')) {
          process.exit(2); // 路径不存在
        }
        if (error.message.includes('权限') || error.message.includes('EACCES')) {
          process.exit(3); // 权限错误
        }
      }
      
      process.exit(1); // 通用错误
    }
  }
};