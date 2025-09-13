/**
 * 示例测试文件
 * 验证测试框架配置是否正常工作
 */

import { describe, it, expect } from 'vitest';
import { createMockFileSystem, createMockApiResponse } from '../setup';

describe('测试框架验证', () => {
  it('基本断言应该工作', () => {
    expect(1 + 1).toBe(2);
    expect('hello').toContain('ell');
    expect([1, 2, 3]).toHaveLength(3);
  });

  it('异步测试应该工作', async () => {
    const result = await createMockApiResponse({ message: 'success' }, 10);
    expect(result).toEqual({ message: 'success' });
  });

  it('Mock文件系统应该工作', () => {
    const fs = createMockFileSystem();

    fs.writeFile('/test.txt', 'test content');
    expect(fs.exists('/test.txt')).toBe(true);
    expect(fs.readFile('/test.txt')).toBe('test content');

    expect(() => fs.readFile('/nonexistent.txt')).toThrow('File not found');
  });

  it('数组和对象匹配应该工作', () => {
    const user = {
      name: 'John',
      age: 30,
      hobbies: ['reading', 'swimming'],
    };

    expect(user).toMatchObject({
      name: 'John',
      age: 30,
    });

    expect(user.hobbies).toEqual(expect.arrayContaining(['reading']));
  });
});
