/**
 * 行号定位功能集成测试
 * 每个功能2个测试用例
 */

import { describe, test, expect } from '@jest/globals';
import { PromptExtractor } from '../../src/services/prompt_extractor.js';

describe('Line Number Location', () => {
  const extractor = new PromptExtractor({});
  
  test('正常情况：定位提示词在文件中的行号', () => {
    const content = `# Document Title

This is some introduction text.

You are a helpful AI assistant.
Your task is to help users with coding.
You should be concise.

Some other content here.`;

    const promptContent = `You are a helpful AI assistant.
Your task is to help users with coding.
You should be concise.`;

    const result = extractor.locateLineNumbers(content, promptContent);
    
    expect(result.startLine).toBe(5); // "You are" 在第5行
    expect(result.endLine).toBe(7);   // 提示词结束在第7行
  });

  test('边界情况：处理空内容或未找到的情况', () => {
    const content = `Some random content
Without any matching text`;
    
    // 测试空提示词
    let result = extractor.locateLineNumbers(content, '');
    expect(result.startLine).toBe(1);
    expect(result.endLine).toBe(1);
    
    // 测试未找到匹配内容
    result = extractor.locateLineNumbers(content, 'This text does not exist');
    expect(result.startLine).toBe(1);
    expect(result.endLine).toBeGreaterThan(0);
  });
});