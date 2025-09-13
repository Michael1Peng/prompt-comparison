/**
 * 结构化日志系统
 */

import { writeFile, appendFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogContext {
  timestamp: string;
  level: LogLevel;
  message: string;
  module?: string;
  operation?: string;
  duration?: number;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

export interface LoggerOptions {
  level?: LogLevel;
  outputFile?: string;
  outputConsole?: boolean;
  includeTimestamp?: boolean;
  includeModule?: boolean;
  colorize?: boolean;
  maxFileSize?: number;
  logDir?: string;
}

/**
 * 结构化日志记录器
 */
export class Logger {
  private static instance: Logger;
  private logFile?: string;
  private currentFileSize = 0;
  
  constructor(private options: LoggerOptions = {}) {
    this.options.level = options.level ?? LogLevel.INFO;
    this.options.outputConsole = options.outputConsole ?? true;
    this.options.includeTimestamp = options.includeTimestamp ?? true;
    this.options.includeModule = options.includeModule ?? true;
    this.options.colorize = options.colorize ?? true;
    this.options.maxFileSize = options.maxFileSize ?? 10 * 1024 * 1024; // 10MB
    this.options.logDir = options.logDir ?? join(homedir(), '.prompt-analyzer', 'logs');
    
    if (options.outputFile) {
      this.initLogFile();
    }
  }
  
  /**
   * 获取单例实例
   */
  static getInstance(options?: LoggerOptions): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(options);
    }
    return Logger.instance;
  }
  
  /**
   * 创建子记录器
   */
  child(module: string): LoggerChild {
    return new LoggerChild(this, module);
  }
  
  /**
   * DEBUG级别日志
   */
  debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }
  
  /**
   * INFO级别日志
   */
  info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }
  
  /**
   * WARN级别日志
   */
  warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }
  
  /**
   * ERROR级别日志
   */
  error(message: string, error?: Error | any, metadata?: Record<string, any>): void {
    const logContext: Partial<LogContext> = error ? {
      ...metadata,
      error: {
        name: error.name || 'Error',
        message: error.message || String(error),
        stack: error.stack,
        code: error.code
      }
    } : { ...metadata };
    
    this.log(LogLevel.ERROR, message, logContext);
  }
  
  /**
   * FATAL级别日志
   */
  fatal(message: string, error?: Error | any, metadata?: Record<string, any>): void {
    const logContext: Partial<LogContext> = error ? {
      ...metadata,
      error: {
        name: error.name || 'Error',
        message: error.message || String(error),
        stack: error.stack,
        code: error.code
      }
    } : { ...metadata };
    
    this.log(LogLevel.FATAL, message, logContext);
  }
  
  /**
   * 记录操作耗时
   */
  async time<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      this.info(`Operation completed: ${operation}`, {
        ...metadata,
        operation,
        duration,
        success: true
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.error(`Operation failed: ${operation}`, error as Error, {
        ...metadata,
        operation,
        duration,
        success: false
      });
      
      throw error;
    }
  }
  
  /**
   * 核心日志方法
   */
  log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    if (level < this.options.level!) {
      return;
    }
    
    const context: LogContext = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata: metadata as any
    };
    
    // 输出到控制台
    if (this.options.outputConsole) {
      this.logToConsole(context);
    }
    
    // 输出到文件
    if (this.logFile) {
      this.logToFile(context);
    }
  }
  
  private logToConsole(context: LogContext): void {
    const levelName = LogLevel[context.level];
    const timestamp = this.options.includeTimestamp ? `[${context.timestamp}] ` : '';
    const module = context.module && this.options.includeModule ? `[${context.module}] ` : '';
    
    let levelColor: typeof chalk = chalk.white;
    switch (context.level) {
      case LogLevel.DEBUG:
        levelColor = chalk.gray;
        break;
      case LogLevel.INFO:
        levelColor = chalk.blue;
        break;
      case LogLevel.WARN:
        levelColor = chalk.yellow;
        break;
      case LogLevel.ERROR:
        levelColor = chalk.red;
        break;
      case LogLevel.FATAL:
        levelColor = chalk.bgRed.white;
        break;
    }
    
    const prefix = this.options.colorize
      ? `${chalk.gray(timestamp)}${levelColor(`[${levelName}]`)} ${chalk.cyan(module)}`
      : `${timestamp}[${levelName}] ${module}`;
    
    const output = `${prefix}${context.message}`;
    
    // 根据级别选择输出流
    if (context.level >= LogLevel.ERROR) {
      console.error(output);
      if (context.error && context.error.stack) {
        console.error(chalk.gray(context.error.stack));
      }
    } else if (context.level === LogLevel.WARN) {
      console.warn(output);
    } else {
      console.log(output);
    }
    
    // 输出元数据
    if (context.metadata && Object.keys(context.metadata).length > 0) {
      console.log(chalk.gray(JSON.stringify(context.metadata, null, 2)));
    }
  }
  
  private async logToFile(context: LogContext): Promise<void> {
    const logEntry = JSON.stringify(context) + '\n';
    
    try {
      await appendFile(this.logFile!, logEntry, 'utf-8');
      this.currentFileSize += Buffer.byteLength(logEntry);
      
      // 检查文件大小，如果超过限制则轮转
      if (this.currentFileSize > this.options.maxFileSize!) {
        await this.rotateLogFile();
      }
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }
  
  private async initLogFile(): Promise<void> {
    try {
      await mkdir(this.options.logDir!, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      this.logFile = join(this.options.logDir!, `app-${timestamp}.log`);
      
      await writeFile(this.logFile, '', 'utf-8');
      this.currentFileSize = 0;
    } catch (error) {
      console.error('Failed to initialize log file:', error);
    }
  }
  
  private async rotateLogFile(): Promise<void> {
    await this.initLogFile();
  }
}

/**
 * 子记录器
 */
export class LoggerChild {
  constructor(
    private parent: Logger,
    private module: string
  ) {}
  
  debug(message: string, metadata?: Record<string, any>): void {
    this.parent.log(LogLevel.DEBUG, message, { ...metadata, module: this.module });
  }
  
  info(message: string, metadata?: Record<string, any>): void {
    this.parent.log(LogLevel.INFO, message, { ...metadata, module: this.module });
  }
  
  warn(message: string, metadata?: Record<string, any>): void {
    this.parent.log(LogLevel.WARN, message, { ...metadata, module: this.module });
  }
  
  error(message: string, error?: Error | any, metadata?: Record<string, any>): void {
    this.parent.error(message, error, { ...metadata, module: this.module });
  }
  
  fatal(message: string, error?: Error | any, metadata?: Record<string, any>): void {
    this.parent.fatal(message, error, { ...metadata, module: this.module });
  }
  
  time<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    return this.parent.time(operation, fn, { ...metadata, module: this.module });
  }
}

// 导出默认实例
export default Logger.getInstance();