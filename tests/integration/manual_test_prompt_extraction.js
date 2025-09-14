#!/usr/bin/env node

/**
 * 手动提示词提取集成测试 - 验证完整工作流程
 * 测试PromptReader → ContentExtractor → ListGenerator的端到端集成
 */

import fs from 'fs-extra';
import path from 'path';
import { PromptReader } from '../../src/services/prompt_reader.js';
import { ContentExtractor } from '../../src/services/content_extractor.js';
import { ListGenerator } from '../../src/services/list_generator.js';

const testDir = path.join(process.cwd(), 'temp_manual_integration_test');
const analysisDir = path.join(testDir, 'analysis');
const inputFile = path.join(analysisDir, 'prompt-files.json');

async function runTest(testName, testFn) {
  console.log(`\n🧪 集成测试: ${testName}`);
  
  try {
    // 设置测试环境
    await fs.ensureDir(testDir);
    await fs.ensureDir(analysisDir);
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

async function testServiceIntegration() {
  console.log('   测试服务模块集成...');
  
  // 创建服务实例
  let reader, extractor, generator;
  
  try {
    reader = new PromptReader();
    extractor = new ContentExtractor();
    generator = new ListGenerator();
    
    console.log('   ✓ PromptReader 实例创建成功');
    console.log('   ✓ ContentExtractor 实例创建成功');
    console.log('   ✓ ListGenerator 实例创建成功');
    
  } catch (error) {
    return { passed: false, reason: `服务实例化失败: ${error.message}` };
  }
  
  // 验证配置获取
  try {
    const readerConfig = reader.getConfig();
    const extractorConfig = extractor.getConfig();
    const generatorConfig = generator.getConfig();
    
    console.log('   ✓ PromptReader 配置:', readerConfig.defaultInputPath);
    console.log('   ✓ ContentExtractor 配置:', extractorConfig.model);
    console.log('   ✓ ListGenerator 配置:', generatorConfig.defaultOutputPath);
    
  } catch (error) {
    return { passed: false, reason: `配置获取失败: ${error.message}` };
  }
  
  return { passed: true, reason: '所有服务模块正确集成，配置获取正常' };
}

async function testWorkflowWithPlaceholders() {
  console.log('   测试完整工作流程...');
  
  // 创建输入文件
  const mockInputData = {
    scanResult: {
      totalFiles: 2,
      promptFiles: [
        {
          filePath: 'docs/system-prompt.md',
          fileName: 'system-prompt.md',
          content: 'You are a helpful AI assistant.',
          isPrompt: true,
          confidence: 0.95,
          language: null,
          category: 'code-generation'
        },
        {
          filePath: 'examples/tutorial.md',
          fileName: 'tutorial.md',
          content: 'Write a Python function.',
          isPrompt: true,
          confidence: 0.88,
          language: 'python',
          category: 'tutorial'
        }
      ],
      scanTimestamp: '2025-09-14T14:30:22Z',
      scanDuration: 15000
    }
  };
  
  await fs.writeJson(inputFile, mockInputData);
  
  // 创建服务实例
  const reader = new PromptReader();
  const extractor = new ContentExtractor();
  const generator = new ListGenerator();
  
  let step1Result, step2Result, step3Result;
  
  // 步骤1: PromptReader
  try {
    step1Result = await reader.readPromptFiles(inputFile);
    return { passed: false, reason: 'TDD失败: PromptReader不应该在未实现时成功' };
  } catch (error) {
    if (error.message.includes('尚未实现')) {
      console.log('   ✓ PromptReader 按预期抛出占位符错误');
    } else {
      return { passed: false, reason: `PromptReader意外错误: ${error.message}` };
    }
  }
  
  // 步骤2: ContentExtractor
  try {
    step2Result = await extractor.extractPromptDetails([]);
    return { passed: false, reason: 'TDD失败: ContentExtractor不应该在未实现时成功' };
  } catch (error) {
    if (error.message.includes('尚未实现')) {
      console.log('   ✓ ContentExtractor 按预期抛出占位符错误');
    } else {
      return { passed: false, reason: `ContentExtractor意外错误: ${error.message}` };
    }
  }
  
  // 步骤3: ListGenerator
  try {
    step3Result = await generator.generatePromptList([]);
    return { passed: false, reason: 'TDD失败: ListGenerator不应该在未实现时成功' };
  } catch (error) {
    if (error.message.includes('尚未实现')) {
      console.log('   ✓ ListGenerator 按预期抛出占位符错误');
    } else {
      return { passed: false, reason: `ListGenerator意外错误: ${error.message}` };
    }
  }
  
  return { passed: true, reason: 'TDD验证通过: 所有服务按预期失败，占位符实现正确' };
}

async function testDataModelValidation() {
  console.log('   测试数据模型验证...');
  
  // 导入数据模型
  try {
    const { PromptDetail, PromptList } = await import('../../src/models/data_models.js');
    
    // 测试PromptDetail
    const detail = new PromptDetail({
      promptId: 'prompt_001',
      sourceFile: 'test.md',
      content: 'Test content',
      startLine: 0,
      endLine: 2
    });
    
    if (!detail.isValid()) {
      return { passed: false, reason: 'PromptDetail验证失败' };
    }
    
    console.log('   ✓ PromptDetail 创建和验证成功');
    
    // 测试PromptList
    const list = new PromptList({
      totalFiles: 1,
      totalPrompts: 1,
      prompts: [detail],
      processingStats: { successFiles: 1, failedFiles: 0 }
    });
    
    if (!list.isValid()) {
      return { passed: false, reason: 'PromptList验证失败' };
    }
    
    console.log('   ✓ PromptList 创建和验证成功');
    
    // 测试JSON序列化
    const jsonData = list.toJSON();
    const reconstructed = PromptList.fromJSON(jsonData);
    
    if (!reconstructed.isValid()) {
      return { passed: false, reason: 'JSON序列化/反序列化失败' };
    }
    
    console.log('   ✓ JSON序列化/反序列化成功');
    
  } catch (error) {
    return { passed: false, reason: `数据模型测试失败: ${error.message}` };
  }
  
  return { passed: true, reason: '数据模型验证完全通过' };
}

async function testErrorHandling() {
  console.log('   测试错误处理...');
  
  // 测试无效输入文件
  const reader = new PromptReader();
  
  try {
    await reader.readPromptFiles('non-existent-file.json');
    return { passed: false, reason: 'TDD失败: 应该抛出尚未实现错误' };
  } catch (error) {
    if (error.message.includes('尚未实现')) {
      console.log('   ✓ 无效输入文件按预期处理');
    } else {
      return { passed: false, reason: `意外的错误处理: ${error.message}` };
    }
  }
  
  // 测试空数据处理
  const extractor = new ContentExtractor();
  
  try {
    await extractor.extractPromptDetails([]);
    return { passed: false, reason: 'TDD失败: 应该抛出尚未实现错误' };
  } catch (error) {
    if (error.message.includes('尚未实现')) {
      console.log('   ✓ 空数据输入按预期处理');
    } else {
      return { passed: false, reason: `意外的错误处理: ${error.message}` };
    }
  }
  
  return { passed: true, reason: '错误处理逻辑正确，符合TDD要求' };
}

async function main() {
  console.log('🎯 提示词提取集成测试 - 验证完整工作流程');
  console.log('期望：工作流程已正确搭建，但服务实现仍为占位符（TDD要求）');
  
  let allPassed = true;
  
  allPassed &= await runTest(
    '服务模块集成测试',
    testServiceIntegration
  );
  
  allPassed &= await runTest(
    '完整工作流程占位符验证',
    testWorkflowWithPlaceholders
  );
  
  allPassed &= await runTest(
    '数据模型验证测试',
    testDataModelValidation
  );
  
  allPassed &= await runTest(
    '错误处理机制测试',
    testErrorHandling
  );
  
  console.log(`\n📊 集成测试总结: ${allPassed ? '✅ 所有测试通过' : '❌ 部分测试失败'}`);
  console.log('📋 TDD状态: 工作流程已搭建，服务占位符正确，准备进入实现阶段');
  
  process.exit(allPassed ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 集成测试异常:', error);
    process.exit(1);
  });
}