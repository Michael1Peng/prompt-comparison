/**
 * 🔴 RED Phase: API Retry Mechanism Contract Tests
 *
 * Tests for robust API retry logic, exponential backoff,
 * and error recovery strategies.
 */

import { ApiRetryHandler } from '@/utils/api-retry';

describe('ApiRetryHandler Contract Tests', () => {
  let retryHandler: ApiRetryHandler;

  beforeEach(() => {
    retryHandler = new ApiRetryHandler({
      maxRetries: 3,
      initialDelay: 100,
      maxDelay: 5000,
      backoffMultiplier: 2,
    });
  });

  describe('Basic Retry Logic', () => {
    it('should retry failed requests up to max attempts', async () => {
      // Contract: Failed requests should be retried according to config
      let attemptCount = 0;

      const failingOperation = jest.fn().mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return { success: true, attempt: attemptCount };
      });

      const result = await retryHandler.execute(failingOperation);

      expect(result.success).toBe(true);
      expect(result.attempt).toBe(3);
      expect(failingOperation).toHaveBeenCalledTimes(3);
    });

    it('should fail after exhausting all retry attempts', async () => {
      // Contract: Permanent failures should eventually give up
      const alwaysFailingOperation = jest.fn().mockImplementation(async () => {
        throw new Error('Permanent failure');
      });

      await expect(retryHandler.execute(alwaysFailingOperation)).rejects.toThrow(
        'Permanent failure'
      );

      expect(alwaysFailingOperation).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    });

    it('should succeed immediately on first try when possible', async () => {
      // Contract: Successful operations should not be retried
      const successfulOperation = jest.fn().mockResolvedValue({ success: true });

      const result = await retryHandler.execute(successfulOperation);

      expect(result.success).toBe(true);
      expect(successfulOperation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Exponential Backoff', () => {
    it('should implement exponential backoff delays', async () => {
      // Contract: Delays should increase exponentially between retries
      const timestamps: number[] = [];
      const failingOperation = jest.fn().mockImplementation(async () => {
        timestamps.push(Date.now());
        if (timestamps.length <= 2) {
          throw new Error('Temporary failure');
        }
        return { success: true };
      });

      await retryHandler.execute(failingOperation);

      expect(timestamps).toHaveLength(3);

      // Check that delays are approximately exponential
      const delay1 = timestamps[1] - timestamps[0];
      const delay2 = timestamps[2] - timestamps[1];

      expect(delay1).toBeGreaterThanOrEqual(90); // ~100ms with some tolerance
      expect(delay1).toBeLessThan(150);

      expect(delay2).toBeGreaterThanOrEqual(180); // ~200ms (doubled)
      expect(delay2).toBeLessThan(250);
    });

    it('should cap delays at maximum value', async () => {
      // Contract: Delays should not exceed maximum configured value
      const longRetryHandler = new ApiRetryHandler({
        maxRetries: 5,
        initialDelay: 1000,
        maxDelay: 2000, // Cap at 2 seconds
        backoffMultiplier: 2,
      });

      const timestamps: number[] = [];
      const failingOperation = jest.fn().mockImplementation(async () => {
        timestamps.push(Date.now());
        if (timestamps.length <= 4) {
          throw new Error('Temporary failure');
        }
        return { success: true };
      });

      await longRetryHandler.execute(failingOperation);

      // Later delays should be capped at maxDelay
      const lastDelay = timestamps[timestamps.length - 1] - timestamps[timestamps.length - 2];
      expect(lastDelay).toBeLessThan(2200); // Should be around maxDelay (2000ms)
    });
  });

  describe('Error Type Handling', () => {
    it('should retry on transient errors', async () => {
      // Contract: Network/temporary errors should trigger retries
      const transientErrors = [
        new Error('Network timeout'),
        new Error('Connection reset'),
        new Error('Rate limit exceeded'),
        new Error('Service temporarily unavailable'),
      ];

      for (const error of transientErrors) {
        let attempts = 0;
        const operation = jest.fn().mockImplementation(async () => {
          attempts++;
          if (attempts === 1) {
            throw error;
          }
          return { success: true };
        });

        const result = await retryHandler.execute(operation);
        expect(result.success).toBe(true);
        expect(operation).toHaveBeenCalledTimes(2);
      }
    });

    it('should not retry on permanent errors', async () => {
      // Contract: Auth/client errors should fail immediately
      const permanentErrors = [
        new Error('Invalid API key'),
        new Error('Authentication failed'),
        new Error('Bad request format'),
        new Error('Resource not found'),
      ];

      for (const error of permanentErrors) {
        const operation = jest.fn().mockRejectedValue(error);

        await expect(retryHandler.execute(operation)).rejects.toThrow(error.message);

        expect(operation).toHaveBeenCalledTimes(1);
      }
    });

    it('should handle custom retry conditions', async () => {
      // Contract: Custom retry logic should be supported
      const customRetryHandler = new ApiRetryHandler({
        maxRetries: 2,
        shouldRetry: (error: Error) => error.message.includes('RETRY_ME'),
      });

      let attempts = 0;
      const customOperation = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts === 1) {
          throw new Error('RETRY_ME: Custom retryable error');
        }
        if (attempts === 2) {
          throw new Error('DO_NOT_RETRY: Custom permanent error');
        }
        return { success: true };
      });

      await expect(customRetryHandler.execute(customOperation)).rejects.toThrow('DO_NOT_RETRY');

      expect(customOperation).toHaveBeenCalledTimes(2);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle API rate limit responses', async () => {
      // Contract: Rate limits should trigger appropriate backoff
      let attempts = 0;
      const rateLimitedOperation = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts <= 2) {
          const error = new Error('Rate limit exceeded') as any;
          error.status = 429;
          error.retryAfter = 1; // 1 second
          throw error;
        }
        return { success: true };
      });

      const startTime = Date.now();
      const result = await retryHandler.execute(rateLimitedOperation);
      const totalTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(totalTime).toBeGreaterThan(2000); // Should wait for rate limit
    });

    it('should respect Retry-After headers', async () => {
      // Contract: Server-specified retry delays should be honored
      const rateLimitedOperation = jest.fn().mockImplementation(async () => {
        const error = new Error('Rate limited') as any;
        error.status = 429;
        error.retryAfter = 0.5; // 500ms
        throw error;
      });

      const timestamps: number[] = [];
      const trackingOperation = jest.fn().mockImplementation(async () => {
        timestamps.push(Date.now());
        if (timestamps.length === 1) {
          return rateLimitedOperation();
        }
        return { success: true };
      });

      await retryHandler.execute(trackingOperation);

      const delay = timestamps[1] - timestamps[0];
      expect(delay).toBeGreaterThanOrEqual(450); // ~500ms with tolerance
    });
  });

  describe('Circuit Breaker Pattern', () => {
    it('should implement circuit breaker for repeated failures', async () => {
      // Contract: Repeated failures should trigger circuit breaker
      const circuitBreakerHandler = new ApiRetryHandler({
        maxRetries: 2,
        circuitBreakerThreshold: 3,
        circuitBreakerTimeout: 1000,
      });

      const alwaysFailingOperation = jest.fn().mockRejectedValue(new Error('Service down'));

      // Trigger circuit breaker with repeated failures
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreakerHandler.execute(alwaysFailingOperation);
        } catch (e) {
          // Expected failures
        }
      }

      // Next call should fail immediately due to circuit breaker
      const startTime = Date.now();
      try {
        await circuitBreakerHandler.execute(alwaysFailingOperation);
      } catch (error: any) {
        expect(error.message).toContain('Circuit breaker');
        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(50); // Should fail fast
      }
    });

    it('should reset circuit breaker after timeout', async () => {
      // Contract: Circuit breaker should reset and allow retries
      const circuitBreakerHandler = new ApiRetryHandler({
        circuitBreakerThreshold: 2,
        circuitBreakerTimeout: 100, // Short timeout for testing
      });

      const operationCallCount = { count: 0 };
      const improvedOperation = jest.fn().mockImplementation(async () => {
        operationCallCount.count++;
        if (operationCallCount.count <= 4) {
          // Fail first 4 times
          throw new Error('Service down');
        }
        return { success: true };
      });

      // Trigger circuit breaker
      for (let i = 0; i < 2; i++) {
        try {
          await circuitBreakerHandler.execute(improvedOperation);
        } catch (e) {
          // Expected
        }
      }

      // Wait for circuit breaker to reset
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should now allow retries and eventually succeed
      const result = await circuitBreakerHandler.execute(improvedOperation);
      expect(result.success).toBe(true);
    });
  });

  describe('Performance and Monitoring', () => {
    it('should provide retry statistics', async () => {
      // Contract: Retry operations should be monitored
      let attempts = 0;
      const monitoredOperation = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return { data: 'success' };
      });

      const result = await retryHandler.executeWithStats(monitoredOperation);

      expect(result.data).toBe('success');
      expect(result.stats).toBeDefined();
      expect(result.stats.totalAttempts).toBe(3);
      expect(result.stats.totalDuration).toBeGreaterThan(0);
      expect(result.stats.retryReasons).toHaveLength(2);
    });

    it('should support progress callbacks', async () => {
      // Contract: Long retry operations should provide progress updates
      const progressUpdates: any[] = [];

      let attempts = 0;
      const slowOperation = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 4) {
          throw new Error(`Attempt ${attempts} failed`);
        }
        return { success: true };
      });

      await retryHandler.execute(slowOperation, {
        onRetry: (attempt, error, delay) => {
          progressUpdates.push({ attempt, error: error.message, delay });
        },
      });

      expect(progressUpdates).toHaveLength(3);
      expect(progressUpdates[0].attempt).toBe(1);
      expect(progressUpdates[2].attempt).toBe(3);
    });

    it('should handle concurrent retry operations safely', async () => {
      // Contract: Multiple concurrent retries should not interfere
      const sharedResource = { count: 0 };

      const concurrentOperations = Array(5)
        .fill(null)
        .map((_, index) =>
          jest.fn().mockImplementation(async () => {
            sharedResource.count++;
            if (sharedResource.count % 2 === 0 && index < 3) {
              throw new Error(`Failure for operation ${index}`);
            }
            return { result: `Operation ${index} success`, count: sharedResource.count };
          })
        );

      const promises = concurrentOperations.map(op =>
        retryHandler.execute(op).catch(e => ({ error: e.message }))
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result).toBeDefined();
      });
    });
  });
});
