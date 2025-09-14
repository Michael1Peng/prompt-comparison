/**
 * AI分析功能集成测试
 * 每个功能2个测试用例
 */

import { describe, test, expect } from '@jest/globals';
import { PromptExtractor } from '../../src/services/prompt_extractor.js';

describe('AI Prompt Analysis', () => {
  const extractor = new PromptExtractor({});
  
  test('正常情况：使用备用方法分析提示词内容', async () => {
    // 测试内容包含明显的提示词特征
    const content = `# AI Assistant Prompt

You are a helpful AI assistant that helps users with coding tasks.
Your responses should be clear and concise.

## Task Instructions

Generate a Python function that calculates factorial.`;

    // 使用备用分析方法（不调用真实API）
    const prompts = extractor.fallbackAnalysis(content);
    
    expect(prompts).toBeDefined();
    expect(prompts.length).toBeGreaterThan(0);
    expect(prompts[0].content).toContain('You are');
    expect(prompts[0].startLine).toBeGreaterThan(0);
    expect(prompts[0].endLine).toBeGreaterThanOrEqual(prompts[0].startLine);
  });

  test('边界情况：分析没有提示词的内容', async () => {
    // 普通文档内容，不包含提示词
    const content = `# Regular Documentation

This is just a regular documentation file.
It contains information about the project.
No AI prompts here.`;

    // 使用备用分析方法
    const prompts = extractor.fallbackAnalysis(content);
    
    // 对于短文件且没有明显提示词特征，应返回整个内容或空数组
    expect(prompts).toBeDefined();
    expect(Array.isArray(prompts)).toBe(true);
    
    if (prompts.length > 0) {
      // 如果返回了内容，检查是否合理
      expect(prompts[0].startLine).toBe(1);
      expect(prompts[0].endLine).toBeGreaterThan(0);
    }
  });
});

describe('Fallback Analysis Method', () => {
  const extractor = new PromptExtractor({});
  
  test('正常情况：识别多个独立提示词块', () => {
    const content = `# First Prompt

You are an expert in JavaScript.
Help users with React development.

# Second Prompt

Generate a Python function for sorting.
The function should be efficient.

# Regular Content

This is not a prompt.`;

    const prompts = extractor.fallbackAnalysis(content);
    
    expect(prompts.length).toBeGreaterThanOrEqual(1);
    // 至少应该识别出包含 "You are" 的提示词
    const hasYouAre = prompts.some(p => p.content.includes('You are'));
    expect(hasYouAre).toBe(true);
  });

  test('边界情况：处理空内容', () => {
    const content = '';
    const prompts = extractor.fallbackAnalysis(content);
    
    expect(prompts).toBeDefined();
    expect(Array.isArray(prompts)).toBe(true);
    expect(prompts.length).toBe(0);
  });
});