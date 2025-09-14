#!/usr/bin/env node

/**
 * 手动PromptReader单元测试 - 验证服务的核心功能
 * 重点验证TDD要求：测试必须先失败，然后通过实现使其通过
 */

import fs from 'fs-extra';
import path from 'path';
import { PromptReader } from '../../src/services/prompt_reader.js';

const testDir = path.join(process.cwd(), 'temp_manual_prompt_reader_unit');
const analysisDir = path.join(testDir, 'analysis');

async function runTest(testName, testFn) {
  console.log(`\n🧪 单元测试: ${testName}`);
  
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

async function testNormalCase() {
  console.log('   测试正常情况: 读取有效JSON文件...');
  
  // 创建有效的输入文件
  const validInputFile = path.join(analysisDir, 'valid-input.json');
  const mockInputData = {
    scanResult: {
      totalFiles: 2,
      promptFiles: [
        {
          filePath: 'docs/prompt1.md',
          fileName: 'prompt1.md',
          content: 'You are a helpful assistant.',
          isPrompt: true,
          confidence: 0.95,
          language: null,
          category: 'system'
        },
        {
          filePath: 'examples/prompt2.md',
          fileName: 'prompt2.md',
          content: 'Write a Python function.',
          isPrompt: true,
          confidence: 0.88,
          language: 'python',
          category: 'coding'
        }
      ],
      scanTimestamp: '2025-09-14T14:30:22Z',
      scanDuration: 12000
    }
  };
  
  await fs.writeJson(validInputFile, mockInputData);
  
  // 测试PromptReader
  const reader = new PromptReader();
  
  // 验证配置
  const config = reader.getConfig();
  console.log('   ✓ 配置获取成功:', config.defaultInputPath);
  
  if (config.defaultInputPath !== './analysis/prompt-files.json') {
    return { passed: false, reason: '默认输入路径配置错误' };
  }
  
  // 测试主要方法 - 应该失败（TDD要求）
  try {
    const result = await reader.readPromptFiles(validInputFile);
    return { passed: false, reason: 'TDD失败: readPromptFiles不应该在未实现时成功' };
  } catch (error) {
    if (error.message.includes('尚未实现')) {
      console.log('   ✓ readPromptFiles 按预期抛出占位符错误');
    } else {
      return { passed: false, reason: `意外的错误: ${error.message}` };
    }
  }
  
  return { passed: true, reason: 'TDD验证通过：服务按预期失败，配置正常' };
}

async function testEdgeCase() {
  console.log('   测试边界情况: 处理无效输入...');
  
  const reader = new PromptReader();
  
  // 测试不存在的文件
  try {
    const result = await reader.readPromptFiles('non-existent.json');
    return { passed: false, reason: 'TDD失败: 不存在文件应该抛出尚未实现错误' };
  } catch (error) {
    if (error.message.includes('尚未实现')) {
      console.log('   ✓ 不存在文件处理按预期失败');
    } else {
      return { passed: false, reason: `文件不存在错误处理异常: ${error.message}` };
    }
  }
  
  // 测试验证方法
  try {
    const isValid = reader._validateInputFormat({});
    return { passed: false, reason: 'TDD失败: _validateInputFormat不应该在未实现时成功' };
  } catch (error) {
    if (error.message.includes('尚未实现')) {
      console.log('   ✓ _validateInputFormat 按预期抛出占位符错误');
    } else {
      return { passed: false, reason: `验证方法错误: ${error.message}` };
    }
  }
  
  // 创建无效JSON文件
  const invalidFile = path.join(analysisDir, 'invalid.json');
  await fs.writeJson(invalidFile, { wrongField: 'invalid data' });
  
  try {
    const result = await reader.readPromptFiles(invalidFile);
    return { passed: false, reason: 'TDD失败: 无效JSON应该抛出尚未实现错误' };
  } catch (error) {
    if (error.message.includes('尚未实现')) {
      console.log('   ✓ 无效JSON处理按预期失败');
    } else {
      return { passed: false, reason: `无效JSON处理异常: ${error.message}` };
    }
  }
  
  return { passed: true, reason: 'TDD验证通过：边界情况按预期失败' };
}

async function testCustomConfiguration() {
  console.log('   测试自定义配置...');
  
  // 测试自定义输入路径
  const customReader = new PromptReader({
    inputPath: './custom/test/input.json'
  });
  
  const customConfig = customReader.getConfig();
  if (customConfig.defaultInputPath !== './custom/test/input.json') {
    return { passed: false, reason: '自定义输入路径配置失败' };
  }
  
  console.log('   ✓ 自定义配置成功:', customConfig.defaultInputPath);
  
  // 测试默认配置
  const defaultReader = new PromptReader();
  const defaultConfig = defaultReader.getConfig();
  
  if (defaultConfig.defaultInputPath !== './analysis/prompt-files.json') {
    return { passed: false, reason: '默认配置验证失败' };
  }
  
  console.log('   ✓ 默认配置正确:', defaultConfig.defaultInputPath);
  
  return { passed: true, reason: '配置系统工作正常' };
}

async function testInstanceCreation() {
  console.log('   测试实例创建和基本属性...');
  
  try {
    // 测试默认实例创建
    const reader1 = new PromptReader();
    if (!reader1 || typeof reader1.getConfig !== 'function') {
      return { passed: false, reason: '默认实例创建失败' };
    }
    
    // 测试自定义选项实例创建
    const reader2 = new PromptReader({ inputPath: './test.json' });
    if (!reader2 || reader2.defaultInputPath !== './test.json') {
      return { passed: false, reason: '自定义选项实例创建失败' };
    }
    
    console.log('   ✓ 实例创建正常');
    console.log('   ✓ 属性设置正确');
    
    // 验证方法存在
    const methods = ['readPromptFiles', '_validateInputFormat', 'getConfig'];
    for (const method of methods) {
      if (typeof reader1[method] !== 'function') {
        return { passed: false, reason: `缺少方法: ${method}` };
      }
    }
    
    console.log('   ✓ 所有必需方法存在');
    
  } catch (error) {
    return { passed: false, reason: `实例创建异常: ${error.message}` };
  }
  
  return { passed: true, reason: '实例创建和基本功能正常' };
}

async function main() {
  console.log('🎯 PromptReader 单元测试 - 验证核心服务功能');
  console.log('期望：服务结构正确，但核心方法仍为占位符（TDD要求）');
  
  let allPassed = true;
  
  allPassed &= await runTest(
    '实例创建和基本属性测试',
    testInstanceCreation
  );
  
  allPassed &= await runTest(
    '正常情况：读取有效JSON文件',
    testNormalCase
  );
  
  allPassed &= await runTest(
    '边界情况：处理无效输入',
    testEdgeCase
  );
  
  allPassed &= await runTest(
    '配置系统测试',
    testCustomConfiguration
  );
  
  console.log(`\n📊 单元测试总结: ${allPassed ? '✅ 所有测试通过' : '❌ 部分测试失败'}`);
  console.log('📋 TDD状态: PromptReader 结构完整，核心方法为占位符，准备实现');
  
  process.exit(allPassed ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 单元测试异常:', error);
    process.exit(1);
  });
}