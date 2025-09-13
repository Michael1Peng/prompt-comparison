/**
 * API工具库
 * 提供API重试机制、并发控制等功能
 */

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  maxRetryDelay?: number;
  shouldRetry?: (error: any) => boolean;
}

export interface ConcurrencyOptions {
  maxConcurrent?: number;
  queueTimeout?: number;
}

/**
 * 带重试的API调用
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    backoffMultiplier = 2,
    maxRetryDelay = 30000,
    shouldRetry = (error) => {
      // 默认重试网络错误和5xx错误
      if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') return true;
      if (error.response?.status >= 500) return true;
      return false;
    }
  } = options;

  let lastError: any;
  let delay = retryDelay;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i === maxRetries || !shouldRetry(error)) {
        throw error;
      }
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // 指数退避
      delay = Math.min(delay * backoffMultiplier, maxRetryDelay);
    }
  }
  
  throw lastError;
}

/**
 * 并发控制器
 */
export class ConcurrencyController {
  private running = 0;
  private queue: Array<() => void> = [];
  
  constructor(private maxConcurrent: number = 5) {}
  
  async run<T>(fn: () => Promise<T>): Promise<T> {
    // 等待可用的执行槽位
    await this.waitForSlot();
    
    this.running++;
    
    try {
      return await fn();
    } finally {
      this.running--;
      this.processQueue();
    }
  }
  
  private async waitForSlot(): Promise<void> {
    if (this.running < this.maxConcurrent) {
      return;
    }
    
    return new Promise(resolve => {
      this.queue.push(resolve);
    });
  }
  
  private processQueue(): void {
    if (this.queue.length > 0 && this.running < this.maxConcurrent) {
      const resolve = this.queue.shift();
      resolve?.();
    }
  }
  
  get pendingCount(): number {
    return this.queue.length;
  }
  
  get runningCount(): number {
    return this.running;
  }
}

/**
 * 批量API调用
 */
export async function batchApiCall<T, R>(
  items: T[],
  apiCall: (item: T) => Promise<R>,
  options: {
    batchSize?: number;
    concurrency?: number;
    onProgress?: (completed: number, total: number) => void;
  } = {}
): Promise<R[]> {
  const {
    batchSize = 10,
    concurrency = 3,
    onProgress
  } = options;
  
  const controller = new ConcurrencyController(concurrency);
  const results: R[] = [];
  let completed = 0;
  
  // 分批处理
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    const batchPromises = batch.map(item => 
      controller.run(async () => {
        const result = await apiCall(item);
        completed++;
        onProgress?.(completed, items.length);
        return result;
      })
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * API速率限制器
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number = Date.now();
  
  constructor(
    private maxTokens: number,
    private refillRate: number // tokens per second
  ) {
    this.tokens = maxTokens;
  }
  
  async acquire(tokens: number = 1): Promise<void> {
    await this.refill();
    
    while (this.tokens < tokens) {
      await new Promise(resolve => setTimeout(resolve, 100));
      await this.refill();
    }
    
    this.tokens -= tokens;
  }
  
  private async refill(): Promise<void> {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsed * this.refillRate;
    
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

/**
 * 创建带超时的Promise
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    })
  ]);
}