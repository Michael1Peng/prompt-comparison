/**
 * 缓存库
 * 提供内存缓存和文件缓存功能
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { homedir } from 'os';

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size in items
  cacheDir?: string; // Directory for file cache
  namespace?: string; // Cache namespace
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

/**
 * 内存缓存
 */
export class MemoryCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder: string[] = [];
  
  constructor(private options: CacheOptions = {}) {
    this.options.ttl = options.ttl || 3600000; // 默认1小时
    this.options.maxSize = options.maxSize || 1000;
  }
  
  /**
   * 获取缓存值
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    // 检查是否过期
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      return undefined;
    }
    
    // 更新访问顺序
    this.updateAccessOrder(key);
    
    return entry.value;
  }
  
  /**
   * 设置缓存值
   */
  set(key: string, value: T, ttl?: number): void {
    // 检查缓存大小限制
    if (this.cache.size >= this.options.maxSize! && !this.cache.has(key)) {
      this.evictLRU();
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.options.ttl!
    });
    
    this.updateAccessOrder(key);
  }
  
  /**
   * 删除缓存值
   */
  delete(key: string): boolean {
    this.removeFromAccessOrder(key);
    return this.cache.delete(key);
  }
  
  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }
  
  /**
   * 获取缓存大小
   */
  get size(): number {
    return this.cache.size;
  }
  
  /**
   * 检查是否有缓存
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      return false;
    }
    
    return true;
  }
  
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }
  
  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }
  
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }
  
  private evictLRU(): void {
    if (this.accessOrder.length > 0) {
      const lruKey = this.accessOrder[0];
      if (lruKey !== undefined) {
        this.delete(lruKey);
      }
    }
  }
}

/**
 * 文件缓存
 */
export class FileCache {
  private cacheDir: string;
  private memoryCache: MemoryCache<any>;
  
  constructor(private options: CacheOptions = {}) {
    this.options.namespace = options.namespace || 'default';
    this.cacheDir = options.cacheDir || join(homedir(), '.prompt-analyzer', 'cache', this.options.namespace);
    this.memoryCache = new MemoryCache(options);
  }
  
  /**
   * 初始化缓存目录
   */
  async init(): Promise<void> {
    await fs.mkdir(this.cacheDir, { recursive: true });
  }
  
  /**
   * 获取缓存值
   */
  async get<T>(key: string): Promise<T | undefined> {
    // 先检查内存缓存
    const memValue = this.memoryCache.get(key);
    if (memValue !== undefined) {
      return memValue;
    }
    
    // 检查文件缓存
    const filePath = this.getFilePath(key);
    
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const entry: CacheEntry<T> = JSON.parse(data);
      
      // 检查是否过期
      if (Date.now() - entry.timestamp > entry.ttl) {
        await fs.unlink(filePath).catch(() => {});
        return undefined;
      }
      
      // 存入内存缓存
      this.memoryCache.set(key, entry.value, entry.ttl);
      
      return entry.value;
    } catch (error) {
      return undefined;
    }
  }
  
  /**
   * 设置缓存值
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const actualTtl = ttl || this.options.ttl || 3600000;
    
    // 存入内存缓存
    this.memoryCache.set(key, value, actualTtl);
    
    // 存入文件缓存
    const filePath = this.getFilePath(key);
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl: actualTtl
    };
    
    await fs.writeFile(filePath, JSON.stringify(entry, null, 2), 'utf-8');
  }
  
  /**
   * 删除缓存值
   */
  async delete(key: string): Promise<boolean> {
    // 删除内存缓存
    this.memoryCache.delete(key);
    
    // 删除文件缓存
    const filePath = this.getFilePath(key);
    
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * 清空缓存
   */
  async clear(): Promise<void> {
    // 清空内存缓存
    this.memoryCache.clear();
    
    // 清空文件缓存
    try {
      const files = await fs.readdir(this.cacheDir);
      await Promise.all(
        files.map(file => fs.unlink(join(this.cacheDir, file)))
      );
    } catch (error) {
      // 忽略错误
    }
  }
  
  /**
   * 获取缓存统计
   */
  async getStats(): Promise<{
    memorySize: number;
    fileCount: number;
    totalSize: number;
  }> {
    let fileCount = 0;
    let totalSize = 0;
    
    try {
      const files = await fs.readdir(this.cacheDir);
      fileCount = files.length;
      
      for (const file of files) {
        const stat = await fs.stat(join(this.cacheDir, file));
        totalSize += stat.size;
      }
    } catch (error) {
      // 忽略错误
    }
    
    return {
      memorySize: this.memoryCache.size,
      fileCount,
      totalSize
    };
  }
  
  private getFilePath(key: string): string {
    const hash = createHash('md5').update(key).digest('hex');
    return join(this.cacheDir, `${hash}.json`);
  }
}

/**
 * 创建缓存装饰器
 */
export function cacheable<T>(
  cacheKey: string | ((args: any[]) => string),
  options: CacheOptions = {}
): MethodDecorator {
  const cache = new MemoryCache<T>(options);
  
  return function (_target: any, _propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const key = typeof cacheKey === 'function' ? cacheKey(args) : cacheKey;
      
      // 检查缓存
      const cached = cache.get(key);
      if (cached !== undefined) {
        return cached;
      }
      
      // 执行原方法
      const result = await originalMethod.apply(this, args);
      
      // 存入缓存
      cache.set(key, result);
      
      return result;
    };
    
    return descriptor;
  };
}