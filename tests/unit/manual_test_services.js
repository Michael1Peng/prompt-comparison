#!/usr/bin/env node

/**
 * 手动服务单元测试 - 验证ContentExtractor和ListGenerator
 * 严格遵循每个服务只有2个测试用例的要求
 */

import fs from 'fs-extra';
import path from 'path';
import { ContentExtractor } from '../../src/services/content_extractor.js';
import { ListGenerator } from '../../src/services/list_generator.js';

const testDir = path.join(process.cwd(), 'temp_manual_services_unit');

async function runTest(testName, testFn) {
  console.log(`\n🧪 服务单元测试: ${testName}`);
  
  try {
    // 设置测试环境
    await fs.ensureDir(testDir);
    process.chdir(testDir);
    
    const result = await testFn();
    
    if (result.passed) {
      console.log(`✅ ${testName} - 通过: ${result.reason}`);
    } else {
      console.log(`❌ ${testName} - 失败: ${result.reason}`);
    }
    
    return result.passed;
    
  } catch (error) {
    console.log(`💥 ${testName} - 异常: ${error.message}`);
    return false;
  } finally {
    // 清理测试环境
    process.chdir('/home/michael/ubuntu-repos/Michael1Peng/prompt-comparison.spec-kit');
    await fs.remove(testDir);
  }
}

// ContentExtractor 测试用例1: 正常情况
async function testContentExtractorNormal() {
  console.log('   测试ContentExtractor正常情况...');
  
  const mockPromptFiles = [
    {
      filePath: 'docs/prompt.md',
      fileName: 'prompt.md',
      content: 'You are a helpful assistant.',
      isPrompt: true,
      confidence: 0.95
    }
  ];
  
  const extractor = new ContentExtractor({
    concurrencyLimit: 3,
    model: 'gpt-5'
  });
  
  // 验证配置
  const config = extractor.getConfig();
  if (config.concurrencyLimit !== 3 || config.model !== 'gpt-5') {
    return { passed: false, reason: '配置设置错误' };
  }
  
  console.log('   ✓ 配置正确:', config.model);
  
  // 测试核心方法 - 应该失败（TDD要求）
  try {
    await extractor.extractPromptDetails(mockPromptFiles);
    return { passed: false, reason: 'TDD失败: extractPromptDetails不应该在未实现时成功' };
  } catch (error) {
    if (error.message.includes('尚未实现')) {
      console.log('   ✓ extractPromptDetails 按预期失败');
    } else {
      return { passed: false, reason: `意外错误: ${error.message}` };
    }
  }
  
  return { passed: true, reason: 'TDD验证通过，配置正常' };
}

// ContentExtractor 测试用例2: 边界情况
async function testContentExtractorEdge() {
  console.log('   测试ContentExtractor边界情况...');
  
  const extractor = new ContentExtractor();
  
  // 测试空数组
  try {
    await extractor.extractPromptDetails([]);
    return { passed: false, reason: 'TDD失败: 空数组应该抛出尚未实现错误' };
  } catch (error) {
    if (error.message.includes('尚未实现')) {
      console.log('   ✓ 空数组处理按预期失败');
    } else {
      return { passed: false, reason: `空数组错误异常: ${error.message}` };
    }
  }
  
  // 测试私有方法
  try {
    await extractor._extractFromFile({});
    return { passed: false, reason: 'TDD失败: _extractFromFile不应该在未实现时成功' };
  } catch (error) {
    if (error.message.includes('尚未实现')) {
      console.log('   ✓ _extractFromFile 按预期失败');
    } else {
      return { passed: false, reason: `私有方法错误异常: ${error.message}` };
    }
  }
  
  // 验证默认配置
  const config = extractor.getConfig();
  if (config.concurrencyLimit !== 5 || config.model !== 'gpt-5') {
    return { passed: false, reason: '默认配置错误' };
  }
  
  console.log('   ✓ 默认配置正确');
  
  return { passed: true, reason: '边界情况TDD验证通过' };
}

// ListGenerator 测试用例1: 正常情况
async function testListGeneratorNormal() {
  console.log('   测试ListGenerator正常情况...');
  
  const mockPromptDetails = [
    {
      promptId: 'prompt_001',
      sourceFile: 'test.md',
      content: 'Test prompt',
      startLine: 0,
      endLine: 1
    }
  ];
  
  const outputPath = './analysis/test-output.json';
  const generator = new ListGenerator({
    outputPath: outputPath,
    prettyPrint: true
  });
  
  // 验证配置
  const config = generator.getConfig();
  if (config.defaultOutputPath !== outputPath || config.prettyPrint !== true) {
    return { passed: false, reason: '配置设置错误' };
  }
  
  console.log('   ✓ 配置正确:', config.defaultOutputPath);
  
  // 测试核心方法 - 应该失败（TDD要求）
  try {
    await generator.generatePromptList(mockPromptDetails, {});
    return { passed: false, reason: 'TDD失败: generatePromptList不应该在未实现时成功' };
  } catch (error) {
    if (error.message.includes('尚未实现')) {
      console.log('   ✓ generatePromptList 按预期失败');
    } else {
      return { passed: false, reason: `意外错误: ${error.message}` };
    }
  }
  
  return { passed: true, reason: 'TDD验证通过，配置正常' };
}

// ListGenerator 测试用例2: 边界情况
async function testListGeneratorEdge() {
  console.log('   测试ListGenerator边界情况...');
  
  const generator = new ListGenerator();
  
  // 测试空数组
  try {
    await generator.generatePromptList([], {});
    return { passed: false, reason: 'TDD失败: 空数组应该抛出尚未实现错误' };
  } catch (error) {
    if (error.message.includes('尚未实现')) {
      console.log('   ✓ 空数组处理按预期失败');
    } else {
      return { passed: false, reason: `空数组错误异常: ${error.message}` };
    }
  }
  
  // 测试私有方法
  try {
    generator._createPromptList([], {});
    return { passed: false, reason: 'TDD失败: _createPromptList不应该在未实现时成功' };
  } catch (error) {
    if (error.message.includes('尚未实现')) {
      console.log('   ✓ _createPromptList 按预期失败');
    } else {
      return { passed: false, reason: `私有方法错误异常: ${error.message}` };
    }
  }
  
  // 验证默认配置
  const config = generator.getConfig();
  if (config.defaultOutputPath !== './analysis/prompt-list.json' || config.prettyPrint !== true) {
    return { passed: false, reason: '默认配置错误' };
  }
  
  console.log('   ✓ 默认配置正确');
  
  return { passed: true, reason: '边界情况TDD验证通过' };
}

async function main() {
  console.log('🎯 服务单元测试 - 验证ContentExtractor和ListGenerator');
  console.log('约束: 每个服务严格只有2个测试用例');
  console.log('期望: 服务结构正确，核心方法为占位符（TDD要求）');
  
  let allPassed = true;
  
  // ContentExtractor 测试（严格2个用例）
  console.log('\n📦 ContentExtractor 服务测试:');
  allPassed &= await runTest(
    'ContentExtractor用例1: 正常情况处理',
    testContentExtractorNormal
  );
  
  allPassed &= await runTest(
    'ContentExtractor用例2: 边界情况处理',
    testContentExtractorEdge
  );
  
  // ListGenerator 测试（严格2个用例）
  console.log('\n📦 ListGenerator 服务测试:');
  allPassed &= await runTest(
    'ListGenerator用例1: 正常情况处理',
    testListGeneratorNormal
  );
  
  allPassed &= await runTest(
    'ListGenerator用例2: 边界情况处理',
    testListGeneratorEdge
  );
  
  console.log(`\n📊 服务单元测试总结: ${allPassed ? '✅ 所有测试通过' : '❌ 部分测试失败'}`);
  console.log('📋 TDD状态: 服务结构完整，核心方法为占位符，遵循2用例限制');
  
  process.exit(allPassed ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 服务单元测试异常:', error);
    process.exit(1);
  });
}