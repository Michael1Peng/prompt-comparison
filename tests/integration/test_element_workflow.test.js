/**
 * 集成测试 - AI提示词框架要素拆分工作流
 * 测试完整的要素拆分流程（MVP版本：每个功能2个测试）
 */

import { jest } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import { PromptElementAnalyzer } from '../../src/services/prompt_element_analyzer.js';

describe('Element Extraction Workflow Integration Tests', () => {
  const fixturesPath = path.join(process.cwd(), 'tests', 'fixtures');
  const inputPath = path.join(fixturesPath, 'sample-prompt-list.json');
  let analyzer;
  let inputData;

  beforeAll(async () => {
    // 读取测试数据
    inputData = await fs.readJson(inputPath);
    
    // 设置测试环境变量
    if (!process.env.OPENAI_API_KEY) {
      process.env.OPENAI_API_KEY = 'test-key-for-testing';
    }
  });

  beforeEach(() => {
    // 创建分析器实例
    analyzer = new PromptElementAnalyzer({
      concurrencyLimit: 5
    });
  });

  test('正常情况: 拆分提示词为13个要素', async () => {
    // 执行要素拆分
    const result = await analyzer.analyzeElements(inputData.prompts);
    
    // 验证结果结构
    expect(result).toBeDefined();
    expect(result).toHaveProperty('totalPrompts');
    expect(result).toHaveProperty('analysisTime');
    expect(result).toHaveProperty('prompts');
    
    // 验证提示词数量
    expect(result.totalPrompts).toBe(inputData.prompts.length);
    expect(result.prompts).toHaveLength(inputData.prompts.length);
    
    // 验证每个提示词的要素
    result.prompts.forEach((prompt, index) => {
      // 基本字段
      expect(prompt.promptId).toBe(inputData.prompts[index].promptId);
      expect(prompt.sourceFile).toBe(inputData.prompts[index].sourceFile);
      expect(prompt.originalContent).toBe(inputData.prompts[index].content);
      
      // 验证13个要素都存在
      expect(prompt.elements).toBeDefined();
      const requiredElements = [
        'source_file', 'role_capability', 'task_request',
        'background_context', 'instruction_action', 'output_specification',
        'examples', 'constraints_limitations', 'goals_expectations',
        'information', 'evaluation_optimization', 'adjustments', 'audience'
      ];
      
      requiredElements.forEach(element => {
        expect(prompt.elements).toHaveProperty(element);
        expect(typeof prompt.elements[element]).toBe('string');
      });
    });
  }, 30000);

  test('边界情况: 空要素设为空字符串', async () => {
    // 使用简单的提示词测试
    const simplePrompts = [{
      promptId: 'test_001',
      sourceFile: 'test.md',
      content: 'You are a helpful assistant.',
      startLine: 1,
      endLine: 1
    }];
    
    const result = await analyzer.analyzeElements(simplePrompts);
    
    expect(result.prompts).toHaveLength(1);
    const elements = result.prompts[0].elements;
    
    // 验证所有要素字段都存在且为字符串
    Object.values(elements).forEach(value => {
      expect(typeof value).toBe('string');
    });
    
    // 验证某些要素可能为空字符串
    // 角色定义应该有内容
    expect(elements.role_capability.length).toBeGreaterThan(0);
    
    // 某些要素可能为空字符串（如examples, evaluation_optimization等）
    const canBeEmpty = ['examples', 'evaluation_optimization', 'adjustments', 'information'];
    canBeEmpty.forEach(key => {
      // 验证是字符串类型（可以是空字符串）
      expect(typeof elements[key]).toBe('string');
    });
  }, 30000);
});