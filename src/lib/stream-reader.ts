/**
 * 流式文件读取库
 * 处理大文件的高效读取
 */

import { createReadStream, promises as fs } from 'fs';
import { createHash } from 'crypto';
import { Transform } from 'stream';
import { pipeline } from 'stream/promises';

export interface StreamReaderOptions {
  encoding?: BufferEncoding;
  highWaterMark?: number; // 缓冲区大小
  maxFileSize?: number; // 最大文件大小限制
  chunkProcessor?: (chunk: string) => void;
}

export interface FileInfo {
  size: number;
  hash?: string;
  lineCount?: number;
  encoding?: string;
}

/**
 * 流式文件读取器
 */
export class StreamReader {
  constructor(private options: StreamReaderOptions = {}) {
    this.options.encoding = options.encoding || 'utf-8';
    this.options.highWaterMark = options.highWaterMark || 64 * 1024; // 64KB
    this.options.maxFileSize = options.maxFileSize || 100 * 1024 * 1024; // 100MB
  }
  
  /**
   * 流式读取文件内容
   */
  async readFile(filePath: string): Promise<string> {
    // 检查文件大小
    const stats = await fs.stat(filePath);
    
    if (stats.size > this.options.maxFileSize!) {
      throw new Error(`File too large: ${stats.size} bytes (max: ${this.options.maxFileSize} bytes)`);
    }
    
    // 小文件直接读取
    if (stats.size < 1024 * 1024) { // < 1MB
      return fs.readFile(filePath, this.options.encoding!);
    }
    
    // 大文件流式读取
    return this.streamRead(filePath);
  }
  
  /**
   * 流式读取文件的前N行
   */
  async readLines(filePath: string, maxLines: number): Promise<string[]> {
    const lines: string[] = [];
    let buffer = '';
    
    const stream = createReadStream(filePath, {
      encoding: this.options.encoding,
      highWaterMark: this.options.highWaterMark
    });
    
    for await (const chunk of stream) {
      buffer += chunk;
      const newLines = buffer.split('\n');
      
      // 保留最后一个可能不完整的行
      buffer = newLines.pop() || '';
      
      for (const line of newLines) {
        lines.push(line);
        
        if (lines.length >= maxLines) {
          stream.destroy();
          return lines;
        }
      }
    }
    
    // 添加最后的缓冲区内容
    if (buffer) {
      lines.push(buffer);
    }
    
    return lines;
  }
  
  /**
   * 流式搜索文件内容
   */
  async searchInFile(
    filePath: string,
    pattern: string | RegExp,
    options: {
      maxMatches?: number;
      includeLineNumbers?: boolean;
      contextLines?: number;
    } = {}
  ): Promise<Array<{
    line: string;
    lineNumber?: number;
    context?: string[];
  }>> {
    const matches: Array<{
      line: string;
      lineNumber?: number;
      context?: string[];
    }> = [];
    
    const regex = typeof pattern === 'string' 
      ? new RegExp(pattern, 'g')
      : pattern;
    
    let lineNumber = 0;
    let buffer = '';
    const contextBuffer: string[] = [];
    const contextLines = options.contextLines || 0;
    
    const stream = createReadStream(filePath, {
      encoding: this.options.encoding,
      highWaterMark: this.options.highWaterMark
    });
    
    for await (const chunk of stream) {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        lineNumber++;
        
        // 维护上下文缓冲区
        if (contextLines > 0) {
          contextBuffer.push(line);
          if (contextBuffer.length > contextLines * 2 + 1) {
            contextBuffer.shift();
          }
        }
        
        if (regex.test(line)) {
          const match: any = {
            line
          };
          
          if (options.includeLineNumbers) {
            match.lineNumber = lineNumber;
          }
          
          if (contextLines > 0) {
            match.context = [...contextBuffer];
          }
          
          matches.push(match);
          
          if (options.maxMatches && matches.length >= options.maxMatches) {
            stream.destroy();
            return matches;
          }
        }
      }
    }
    
    // 检查最后的缓冲区
    if (buffer && regex.test(buffer)) {
      lineNumber++;
      const match: any = {
        line: buffer
      };
      
      if (options.includeLineNumbers) {
        match.lineNumber = lineNumber;
      }
      
      matches.push(match);
    }
    
    return matches;
  }
  
  /**
   * 计算文件哈希
   */
  async computeHash(filePath: string, algorithm: string = 'sha256'): Promise<string> {
    const hash = createHash(algorithm);
    const stream = createReadStream(filePath, {
      highWaterMark: this.options.highWaterMark
    });
    
    for await (const chunk of stream) {
      hash.update(chunk);
    }
    
    return hash.digest('hex');
  }
  
  /**
   * 获取文件信息
   */
  async getFileInfo(filePath: string): Promise<FileInfo> {
    const stats = await fs.stat(filePath);
    const info: FileInfo = {
      size: stats.size
    };
    
    // 计算行数
    let lineCount = 0;
    const stream = createReadStream(filePath, {
      encoding: this.options.encoding,
      highWaterMark: this.options.highWaterMark
    });
    
    for await (const chunk of stream) {
      lineCount += (chunk.match(/\n/g) || []).length;
    }
    
    info.lineCount = lineCount + 1; // 加上最后一行
    
    return info;
  }
  
  /**
   * 流式处理文件
   */
  async processFile(
    filePath: string,
    processor: (line: string, lineNumber: number) => Promise<void> | void
  ): Promise<void> {
    let lineNumber = 0;
    let buffer = '';
    
    const stream = createReadStream(filePath, {
      encoding: this.options.encoding,
      highWaterMark: this.options.highWaterMark
    });
    
    for await (const chunk of stream) {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        lineNumber++;
        await processor(line, lineNumber);
      }
    }
    
    // 处理最后的缓冲区
    if (buffer) {
      lineNumber++;
      await processor(buffer, lineNumber);
    }
  }
  
  /**
   * 创建转换流
   */
  createTransformStream(
    transform: (chunk: string) => string | null
  ): Transform {
    return new Transform({
      encoding: this.options.encoding,
      transform(chunk, _encoding, callback) {
        try {
          const result = transform(chunk.toString());
          callback(null, result);
        } catch (error) {
          callback(error as Error);
        }
      }
    });
  }
  
  /**
   * 流式复制文件并转换
   */
  async transformFile(
    inputPath: string,
    outputPath: string,
    transform: (chunk: string) => string | null
  ): Promise<void> {
    const readStream = createReadStream(inputPath, {
      encoding: this.options.encoding,
      highWaterMark: this.options.highWaterMark
    });
    
    const transformStream = this.createTransformStream(transform);
    const writeStream = await this.createWriteStream(outputPath);
    
    await pipeline(readStream, transformStream, writeStream);
  }
  
  private async streamRead(filePath: string): Promise<string> {
    const chunks: string[] = [];
    const stream = createReadStream(filePath, {
      encoding: this.options.encoding,
      highWaterMark: this.options.highWaterMark
    });
    
    for await (const chunk of stream) {
      chunks.push(chunk);
      
      if (this.options.chunkProcessor) {
        this.options.chunkProcessor(chunk);
      }
    }
    
    return chunks.join('');
  }
  
  private async createWriteStream(filePath: string): Promise<any> {
    const { createWriteStream } = await import('fs');
    return createWriteStream(filePath, {
      encoding: this.options.encoding
    });
  }
}

/**
 * 便捷函数：读取大文件
 */
export async function readLargeFile(
  filePath: string,
  options?: StreamReaderOptions
): Promise<string> {
  const reader = new StreamReader(options);
  return reader.readFile(filePath);
}

/**
 * 便捷函数：读取文件的前N行
 */
export async function readFirstLines(
  filePath: string,
  lineCount: number,
  options?: StreamReaderOptions
): Promise<string[]> {
  const reader = new StreamReader(options);
  return reader.readLines(filePath, lineCount);
}

/**
 * 便捷函数：在文件中搜索
 */
export async function searchInFile(
  filePath: string,
  pattern: string | RegExp,
  options?: StreamReaderOptions & {
    maxMatches?: number;
    includeLineNumbers?: boolean;
    contextLines?: number;
  }
): Promise<Array<{ line: string; lineNumber?: number; context?: string[] }>> {
  const reader = new StreamReader(options);
  return reader.searchInFile(filePath, pattern, options || {});
}