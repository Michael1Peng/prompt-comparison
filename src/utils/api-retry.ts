/**
 * T022: API Retry Logic Implementation
 *
 * 🟢 GREEN Phase: Implements robust retry mechanisms for API calls
 * Handles rate limiting, exponential backoff, and error recovery
 */

import { ApiCallError } from '../models';

/**
 * Retry configuration options
 */
export interface RetryOptions {
  maxRetries?: number;           // Maximum number of retry attempts
  initialDelay?: number;         // Initial delay in milliseconds
  maxDelay?: number;             // Maximum delay between retries
  backoffMultiplier?: number;    // Exponential backoff multiplier
  retryableErrors?: string[];    // Error types that should trigger retry
  onRetry?: (attempt: number, error: Error, delay: number) => void; // Retry callback
  timeout?: number;              // Overall timeout for all attempts
}

/**
 * Retry attempt information
 */
export interface RetryAttempt {
  attemptNumber: number;
  error: Error;
  delay: number;
  totalElapsed: number;
}

/**
 * Retry result with metadata
 */
export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
  lastAttempt?: RetryAttempt;
}

/**
 * APIRetry utility for handling robust API call retry logic
 */
export class APIRetry {
  private readonly DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
    maxRetries: 3,
    initialDelay: 1000,        // 1 second
    maxDelay: 30000,           // 30 seconds
    backoffMultiplier: 2.0,
    retryableErrors: [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'EAI_AGAIN',
      'RATE_LIMITED',
      'TEMPORARY_FAILURE',
      'NETWORK_ERROR'
    ],
    timeout: 300000            // 5 minutes total timeout
  };

  /**
   * Execute a function with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const startTime = Date.now();
    const attempts: RetryAttempt[] = [];

    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      try {
        // Check overall timeout
        if (Date.now() - startTime > opts.timeout) {
          throw new Error('Overall timeout exceeded');
        }

        const result = await operation();

        return {
          success: true,
          result,
          attempts: attempt + 1,
          totalTime: Date.now() - startTime
        };
      } catch (error: any) {
        const attemptInfo: RetryAttempt = {
          attemptNumber: attempt + 1,
          error,
          delay: 0,
          totalElapsed: Date.now() - startTime
        };

        attempts.push(attemptInfo);

        // Check if this is the last attempt
        if (attempt === opts.maxRetries) {
          return {
            success: false,
            error,
            attempts: attempt + 1,
            totalTime: Date.now() - startTime,
            lastAttempt: attemptInfo
          };
        }

        // Check if error is retryable
        if (!this._isRetryableError(error, opts.retryableErrors)) {
          return {
            success: false,
            error,
            attempts: attempt + 1,
            totalTime: Date.now() - startTime,
            lastAttempt: attemptInfo
          };
        }

        // Calculate delay for next attempt
        const delay = this._calculateDelay(attempt, opts);
        attemptInfo.delay = delay;

        // Call retry callback if provided
        if (options.onRetry) {
          options.onRetry(attempt + 1, error, delay);
        }

        // Wait before next attempt
        await this._sleep(delay);
      }
    }

    // This should never be reached, but TypeScript requires it
    return {
      success: false,
      error: new Error('Unexpected retry loop exit'),
      attempts: opts.maxRetries + 1,
      totalTime: Date.now() - startTime
    };
  }

  /**
   * Execute multiple operations with retry logic and concurrency control
   */
  async executeBatchWithRetry<T>(
    operations: (() => Promise<T>)[],
    options: RetryOptions & { concurrency?: number } = {}
  ): Promise<RetryResult<T>[]> {
    const concurrency = options.concurrency ?? 5;
    const results: RetryResult<T>[] = [];

    // Process operations in batches
    for (let i = 0; i < operations.length; i += concurrency) {
      const batch = operations.slice(i, i + concurrency);
      const batchPromises = batch.map(op => this.executeWithRetry(op, options));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add small delay between batches to avoid overwhelming the API
      if (i + concurrency < operations.length) {
        await this._sleep(100);
      }
    }

    return results;
  }

  /**
   * Create a rate-limited API caller
   */
  createRateLimitedCaller<T>(
    rateLimit: number, // calls per second
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): () => Promise<RetryResult<T>> {
    let lastCallTime = 0;
    const minInterval = 1000 / rateLimit; // ms between calls

    return async () => {
      // Ensure rate limiting
      const now = Date.now();
      const timeSinceLastCall = now - lastCallTime;
      if (timeSinceLastCall < minInterval) {
        await this._sleep(minInterval - timeSinceLastCall);
      }
      lastCallTime = Date.now();

      return this.executeWithRetry(operation, options);
    };
  }

  /**
   * Wrap an async function with automatic retry on specific errors
   */
  withRetry<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options: RetryOptions = {}
  ): T {
    return (async (...args: Parameters<T>) => {
      const result = await this.executeWithRetry(() => fn(...args), options);
      if (result.success) {
        return result.result;
      } else {
        throw result.error;
      }
    }) as T;
  }

  /**
   * Handle OpenAI API specific retry logic
   */
  async executeOpenAIRequest<T>(
    request: () => Promise<T>,
    options: Omit<RetryOptions, 'retryableErrors'> = {}
  ): Promise<RetryResult<T>> {
    const openAIRetryableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'NETWORK_ERROR',
      'RATE_LIMITED',
      'OVERLOADED',
      'INTERNAL_ERROR'
    ];

    return this.executeWithRetry(request, {
      ...options,
      retryableErrors: openAIRetryableErrors,
      maxRetries: options.maxRetries || 5,
      initialDelay: options.initialDelay || 2000,
      maxDelay: options.maxDelay || 60000,
      backoffMultiplier: options.backoffMultiplier || 2.5
    });
  }

  /**
   * Circuit breaker pattern implementation
   */
  createCircuitBreaker<T>(
    operation: () => Promise<T>,
    options: {
      failureThreshold?: number;    // Failures before opening circuit
      recoveryTimeout?: number;     // Time before attempting recovery
      monitoringPeriod?: number;    // Period to monitor for failures
    } = {}
  ): () => Promise<T> {
    const opts = {
      failureThreshold: options.failureThreshold || 5,
      recoveryTimeout: options.recoveryTimeout || 60000,
      monitoringPeriod: options.monitoringPeriod || 60000
    };

    let state: 'closed' | 'open' | 'half-open' = 'closed';
    let failureCount = 0;
    let lastFailureTime = 0;
    let lastSuccessTime = Date.now();

    return async () => {
      const now = Date.now();

      // Reset failure count if monitoring period has passed
      if (now - lastSuccessTime > opts.monitoringPeriod) {
        failureCount = 0;
      }

      // Check circuit state
      switch (state) {
        case 'open':
          if (now - lastFailureTime > opts.recoveryTimeout) {
            state = 'half-open';
          } else {
            throw new ApiCallError('circuit-breaker', 503, 'Circuit breaker is open');
          }
          break;

        case 'half-open':
          // Allow one test request
          break;

        case 'closed':
          // Normal operation
          break;
      }

      try {
        const result = await operation();

        // Success - reset circuit
        if (state === 'half-open' || state === 'closed') {
          state = 'closed';
          failureCount = 0;
          lastSuccessTime = now;
        }

        return result;
      } catch (error) {
        failureCount++;
        lastFailureTime = now;

        // Check if we should open the circuit
        if (failureCount >= opts.failureThreshold) {
          state = 'open';
        } else if (state === 'half-open') {
          state = 'open';
        }

        throw error;
      }
    };
  }

  /**
   * Calculate delay using exponential backoff with jitter
   */
  private _calculateDelay(attempt: number, options: Required<Omit<RetryOptions, 'onRetry'>>): number {
    // Calculate exponential backoff
    const exponentialDelay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt);

    // Apply maximum delay limit
    const cappedDelay = Math.min(exponentialDelay, options.maxDelay);

    // Add jitter (±25% random variation)
    const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);
    const finalDelay = cappedDelay + jitter;

    return Math.max(100, Math.round(finalDelay)); // Minimum 100ms delay
  }

  /**
   * Check if an error is retryable
   */
  private _isRetryableError(error: Error, retryableErrors: string[]): boolean {
    // Check error message for retryable patterns
    const errorMessage = error.message.toLowerCase();

    // Network-related errors
    const networkErrors = [
      'network', 'timeout', 'connection', 'econnreset', 'etimedout',
      'enotfound', 'eai_again', 'socket hang up'
    ];

    if (networkErrors.some(pattern => errorMessage.includes(pattern))) {
      return true;
    }

    // Rate limiting
    if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
      return true;
    }

    // Server errors (5xx)
    if (error instanceof ApiCallError) {
      return error.statusCode ? error.statusCode >= 500 : false;
    }

    // Check against custom retryable error list
    return retryableErrors.some(pattern =>
      error.name.includes(pattern) ||
      error.message.includes(pattern)
    );
  }

  /**
   * Sleep for specified milliseconds
   */
  private _sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export a default instance for convenience
export const apiRetry = new APIRetry();