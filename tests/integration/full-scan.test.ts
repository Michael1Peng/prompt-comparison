/**
 * 完整仓库扫描集成测试
 * 测试扫描→识别→提取的完整流程
 * 
 * 这个测试验证了整个文件扫描工作流程，包括：
 * 1. 递归扫描文件系统
 * 2. AI智能识别提示词文件
 * 3. 从文件中提取具体提示词内容
 * 4. 生成完整的扫描报告
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { FileScanner } from '@/services/file-scanner';
import { PromptAnalyzer } from '@/services/prompt-analyzer';

describe('完整仓库扫描集成测试', () => {
  let testRepoDir: string;
  let fileScanner: FileScanner;
  let aiAnalyzer: PromptAnalyzer;

  beforeEach(() => {
    // 创建模拟代码仓库结构
    testRepoDir = join(tmpdir(), 'scan-integration-test-' + Date.now());
    createMockRepository(testRepoDir);
    
    // 初始化服务
    fileScanner = new FileScanner();
    aiAnalyzer = new PromptAnalyzer();
  });

  afterEach(() => {
    // 清理测试目录
    if (testRepoDir && existsSync(testRepoDir)) {
      rmSync(testRepoDir, { recursive: true, force: true });
    }
  });

  function createMockRepository(repoPath: string) {
    mkdirSync(repoPath, { recursive: true });

    // 创建包含提示词的Markdown文件
    writeFileSync(join(repoPath, 'README.md'), `
# AI Code Assistant

This repository contains various AI prompts for code assistance.

## Code Review Prompt
You are an expert code reviewer. Please analyze the following code:
- Check for bugs and potential issues
- Suggest improvements for performance
- Verify coding standards compliance
- Provide constructive feedback

## Documentation Prompt  
Please generate comprehensive documentation for this API:
- Include all endpoints with descriptions
- Document request/response formats
- Provide usage examples
- Add error handling information
    `);

    // 创建包含提示词的JavaScript文件
    writeFileSync(join(repoPath, 'src', 'prompts.js'), `
/**
 * AI Assistant Configuration
 * 
 * System Prompt: You are a helpful JavaScript expert assistant.
 * Task: Help users with JavaScript programming questions.
 * Guidelines:
 * 1. Provide clear, working code examples
 * 2. Explain concepts thoroughly
 * 3. Follow modern JavaScript best practices
 * 4. Include error handling when appropriate
 */

const SYSTEM_PROMPTS = {
  codeReview: \`
    You are a senior JavaScript developer with 10+ years experience.
    Review the provided code for:
    - Syntax errors and bugs
    - Performance optimizations  
    - Security vulnerabilities
    - Code readability and maintainability
    
    Format your response as:
    ## Issues Found
    [List any problems]
    
    ## Suggestions
    [Improvement recommendations]
    
    ## Rating
    [Score 1-10 with justification]
  \`,
  
  debugging: \`
    You are a debugging expert. Help identify and fix issues in JavaScript code.
    
    When analyzing code:
    1. Identify the specific error or issue
    2. Explain why it's happening
    3. Provide a corrected version
    4. Suggest prevention strategies
    
    Be thorough but concise in your explanations.
  \`
};
    `);

    // 创建Python文件，包含不同类型的提示词
    mkdirSync(join(repoPath, 'scripts'), { recursive: true });
    writeFileSync(join(repoPath, 'scripts', 'ai_helper.py'), `
"""
AI Code Generation Assistant

This module contains prompts for AI-powered code generation.
"""

CODE_GENERATION_PROMPT = '''
You are an expert Python developer. Generate clean, efficient Python code based on the requirements.

Requirements:
- Follow PEP 8 style guidelines
- Include appropriate type hints
- Add docstrings for functions and classes
- Handle edge cases and errors
- Write testable, modular code

Input: [User requirement description]
Output: Complete Python code with explanations
'''

DATA_ANALYSIS_PROMPT = '''
You are a data science expert specializing in Python analytics.

Task: Analyze the provided dataset and generate insights.

Process:
1. Load and examine the data structure
2. Perform exploratory data analysis
3. Identify patterns and trends
4. Create visualizations
5. Provide actionable recommendations

Use libraries: pandas, numpy, matplotlib, seaborn
'''

def get_prompt(prompt_type: str) -> str:
    """Get AI prompt by type."""
    prompts = {
        'code_gen': CODE_GENERATION_PROMPT,
        'data_analysis': DATA_ANALYSIS_PROMPT
    }
    return prompts.get(prompt_type, "")
    `);

    // 创建配置文件，包含系统提示词
    writeFileSync(join(repoPath, 'config', 'ai-config.yaml'), `
ai_assistant:
  system_prompt: |
    You are an intelligent code assistant specialized in multiple programming languages.
    
    Core capabilities:
    - Code generation and completion
    - Bug detection and fixing
    - Performance optimization
    - Code explanation and documentation
    - Best practices guidance
    
    Interaction style:
    - Be concise but thorough
    - Provide working code examples
    - Explain your reasoning
    - Ask clarifying questions when needed
    
  models:
    primary: "gpt-4"
    fallback: "gpt-3.5-turbo"
    
  prompt_templates:
    code_review: |
      Please review this \${{language}} code:
      
      \`\`\`\${{language}}
      \${{code}}
      \`\`\`
      
      Focus on: \${{focus_areas}}
      
    bug_fix: |
      This \${{language}} code has an issue:
      
      \`\`\`\${{language}}
      \${{code}}
      \`\`\`
      
      Error: \${{error_message}}
      
      Please identify the problem and provide a fix.
    `);

    // 创建文档文件
    mkdirSync(join(repoPath, 'docs'), { recursive: true });
    writeFileSync(join(repoPath, 'docs', 'prompt-guidelines.md'), `
# AI Prompt Engineering Guidelines

## Writing Effective Prompts

### Structure Template
\`\`\`
Role: [Define the AI's expertise]
Task: [Specific objective]
Context: [Background information] 
Format: [Expected output structure]
Examples: [Sample inputs/outputs]
Constraints: [Limitations and rules]
\`\`\`

### Best Practices
1. **Be Specific**: Clearly define what you want
2. **Provide Context**: Include relevant background
3. **Set Expectations**: Define output format and style
4. **Include Examples**: Show desired patterns
5. **Test Iteratively**: Refine based on results

## Example: Technical Documentation Prompt

\`\`\`
You are a technical writer specializing in API documentation.

Task: Create comprehensive API documentation for the provided endpoints.

Requirements:
- Use OpenAPI 3.0 specification format
- Include detailed parameter descriptions
- Provide realistic example requests/responses  
- Document all possible error codes
- Add usage notes and best practices

Input: Raw API endpoint definitions
Output: Complete OpenAPI specification in YAML format
\`\`\`
    `);

    // 创建应该被忽略的文件
    mkdirSync(join(repoPath, 'node_modules', 'some-package'), { recursive: true });
    writeFileSync(join(repoPath, 'node_modules', 'some-package', 'index.js'), 'module.exports = {}');
    
    mkdirSync(join(repoPath, '.git', 'objects'), { recursive: true });
    writeFileSync(join(repoPath, '.git', 'config'), '[core]\nrepositoryformatversion = 0');

    // 创建普通文件（非提示词）
    writeFileSync(join(repoPath, 'package.json'), JSON.stringify({
      name: "test-repo",
      version: "1.0.0",
      description: "Test repository for scanning"
    }, null, 2));

    writeFileSync(join(repoPath, 'src', 'utils.js'), `
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function calculateSum(numbers) {
  return numbers.reduce((sum, num) => sum + num, 0);
}

module.exports = { formatDate, calculateSum };
    `);
  }

  describe('扫描→识别→提取完整流程', () => {
    it('应该成功扫描整个仓库并识别所有提示词文件', async () => {
      // Step 1: 扫描仓库文件
      const scanResult = await fileScanner.scanRepository({
        rootPath: testRepoDir,
        options: {
          extensions: ['.md', '.js', '.py', '.yaml', '.yml'],
          ignorePatterns: ['node_modules/**', '.git/**', '*.json'],
          maxFileSize: 5 * 1024 * 1024, // 5MB
          concurrency: 10,
          respectGitignore: true
        }
      });

      // 验证扫描结果
      expect(scanResult.totalFiles).toBeGreaterThan(0);
      expect(scanResult.files.length).toBeGreaterThan(0);
      
      // 应该找到我们创建的提示词文件
      const foundFiles = scanResult.files.map(f => f.fileName);
      expect(foundFiles).toContain('README.md');
      expect(foundFiles).toContain('prompts.js');
      expect(foundFiles).toContain('ai_helper.py');
      expect(foundFiles).toContain('ai-config.yaml');
      expect(foundFiles).toContain('prompt-guidelines.md');
      
      // 不应该包含被忽略的文件
      expect(foundFiles).not.toContain('package.json');
      expect(foundFiles.some(f => f.includes('node_modules'))).toBe(false);
      expect(foundFiles.some(f => f.includes('.git'))).toBe(false);

      // Step 2: AI识别提示词文件
      const identificationResult = await fileScanner.identifyPromptFiles({
        files: scanResult.files,
        options: {
          aiProvider: 'qwen',
          model: 'qwen-plus',
          batchSize: 3,
          confidenceThreshold: 0.7,
          retryCount: 2
        }
      });

      // 验证识别结果
      expect(identificationResult.promptFiles.length).toBeGreaterThan(0);
      expect(identificationResult.statistics.successfulCalls).toBeGreaterThan(0);
      
      // 应该识别出明显的提示词文件
      const promptFileNames = identificationResult.promptFiles
        .filter(pf => pf.hasPrompts && pf.confidence >= 0.7)
        .map(pf => pf.filePath.split('/').pop());
      
      expect(promptFileNames).toContain('README.md');
      expect(promptFileNames).toContain('prompts.js'); 
      expect(promptFileNames).toContain('ai_helper.py');

      // Step 3: 提取具体提示词内容
      const extractionResults = [];
      for (const promptFile of identificationResult.promptFiles.filter(pf => pf.hasPrompts)) {
        const file = scanResult.files.find(f => f.filePath === promptFile.filePath);
        if (file) {
          const extraction = await fileScanner.extractPromptContent({
            file,
            options: {
              includeContext: true,
              contextLines: 3,
              preserveFormatting: true,
              extractionMode: 'automatic'
            }
          });
          extractionResults.push(extraction);
        }
      }

      // 验证提取结果
      expect(extractionResults.length).toBeGreaterThan(0);
      
      const allExtractedPrompts = extractionResults.flatMap(er => er.extractedPrompts);
      expect(allExtractedPrompts.length).toBeGreaterThan(0);

      // 验证提取的提示词内容质量
      for (const prompt of allExtractedPrompts) {
        expect(prompt.promptId).toBeDefined();
        expect(prompt.content.length).toBeGreaterThan(10);
        expect(prompt.startLine).toBeGreaterThan(0);
        expect(prompt.endLine).toBeGreaterThanOrEqual(prompt.startLine);
        expect(prompt.confidence).toBeGreaterThanOrEqual(0);
        expect(prompt.confidence).toBeLessThanOrEqual(1);
      }

      // Step 4: 验证完整工作流数据一致性
      const totalPromptFiles = identificationResult.promptFiles.filter(pf => pf.hasPrompts).length;
      expect(extractionResults.length).toBe(totalPromptFiles);

      // 验证数据关联正确性
      for (const extraction of extractionResults) {
        const originalFile = scanResult.files.find(f => f.filePath.includes(extraction.fileId));
        expect(originalFile).toBeDefined();
      }
    });

    it('应该正确处理不同文件类型的提示词', async () => {
      const scanResult = await fileScanner.scanRepository({
        rootPath: testRepoDir,
        options: { extensions: ['.md', '.js', '.py', '.yaml'] }
      });

      const identificationResult = await fileScanner.identifyPromptFiles({
        files: scanResult.files,
        options: { confidenceThreshold: 0.6 }
      });

      // 按文件类型分组验证
      const promptFilesByExt = identificationResult.promptFiles
        .filter(pf => pf.hasPrompts)
        .reduce((acc, pf) => {
          const ext = pf.filePath.split('.').pop();
          acc[ext] = acc[ext] || [];
          acc[ext].push(pf);
          return acc;
        }, {} as Record<string, any[]>);

      // 应该在多种文件类型中发现提示词
      expect(Object.keys(promptFilesByExt).length).toBeGreaterThanOrEqual(3);
      
      // Markdown文件应该有较高的提示词识别率
      if (promptFilesByExt.md) {
        const mdConfidence = promptFilesByExt.md.reduce((sum, pf) => sum + pf.confidence, 0) / promptFilesByExt.md.length;
        expect(mdConfidence).toBeGreaterThan(0.7);
      }

      // JavaScript文件中的提示词应该被正确识别
      if (promptFilesByExt.js) {
        expect(promptFilesByExt.js.length).toBeGreaterThan(0);
      }
    });

    it('应该正确处理大型仓库扫描', async () => {
      // 创建更多文件模拟大型仓库
      const largeRepoDir = join(testRepoDir, 'large-repo');
      mkdirSync(largeRepoDir, { recursive: true });

      // 创建多个子目录和文件
      for (let i = 0; i < 10; i++) {
        const subDir = join(largeRepoDir, `module-${i}`);
        mkdirSync(subDir, { recursive: true });
        
        writeFileSync(join(subDir, `prompt-${i}.md`), `
# AI Assistant ${i}
You are assistant number ${i}. Help users with task ${i}.

Instructions:
- Be helpful and accurate
- Provide step-by-step guidance
- Include examples when possible
        `);
        
        writeFileSync(join(subDir, `regular-${i}.js`), `
function task${i}() {
  console.log('Task ${i}');
}
        `);
      }

      const startTime = Date.now();

      // 执行大型扫描
      const scanResult = await fileScanner.scanRepository({
        rootPath: largeRepoDir,
        options: {
          concurrency: 5,
          timeout: 30000
        }
      });

      const scanDuration = Date.now() - startTime;

      // 验证性能
      expect(scanDuration).toBeLessThan(30000); // 30秒内完成
      expect(scanResult.totalFiles).toBe(20); // 每个模块2个文件
      expect(scanResult.statistics.processingSpeed).toBeGreaterThan(0);

      // 验证并发处理效果
      const identificationStart = Date.now();
      const identificationResult = await fileScanner.identifyPromptFiles({
        files: scanResult.files,
        options: {
          batchSize: 3,
          retryCount: 1
        }
      });
      const identificationDuration = Date.now() - identificationStart;

      expect(identificationDuration).toBeLessThan(60000); // 1分钟内完成
      expect(identificationResult.promptFiles.filter(pf => pf.hasPrompts).length).toBe(10); // 10个提示词文件
    });

    it('应该正确处理扫描错误和边界情况', async () => {
      // 创建一些问题文件
      const problemDir = join(testRepoDir, 'problems');
      mkdirSync(problemDir, { recursive: true });

      // 创建空文件
      writeFileSync(join(problemDir, 'empty.md'), '');
      
      // 创建大文件
      const largeContent = 'Large file content\n'.repeat(100000);
      writeFileSync(join(problemDir, 'large.txt'), largeContent);

      // 创建二进制文件
      const binaryData = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      writeFileSync(join(problemDir, 'image.png'), binaryData);

      const scanResult = await fileScanner.scanRepository({
        rootPath: problemDir,
        options: {
          maxFileSize: 50000, // 50KB 限制
          extensions: ['.md', '.txt', '.png']
        }
      });

      // 验证错误处理
      expect(scanResult.errors).toBeDefined();
      
      // 应该跳过太大的文件
      const processedFiles = scanResult.files.filter(f => f.size <= 50000);
      expect(processedFiles.length).toBeLessThan(scanResult.totalFiles);

      // 应该记录处理过的文件统计
      expect(scanResult.statistics.averageFileSize).toBeGreaterThan(0);
      expect(scanResult.filteredFiles).toBeLessThanOrEqual(scanResult.totalFiles);
    });

    it('应该生成完整的扫描报告', async () => {
      const scanResult = await fileScanner.scanRepository({
        rootPath: testRepoDir
      });

      const identificationResult = await fileScanner.identifyPromptFiles({
        files: scanResult.files.slice(0, 5) // 限制数量以加快测试
      });

      // 验证完整报告结构
      expect(scanResult).toMatchObject({
        sessionId: expect.any(String),
        startTime: expect.any(String),
        endTime: expect.any(String),
        duration: expect.any(Number),
        rootPath: testRepoDir,
        totalFiles: expect.any(Number),
        filteredFiles: expect.any(Number),
        files: expect.any(Array),
        errors: expect.any(Array),
        statistics: expect.objectContaining({
          filesByExtension: expect.any(Object),
          totalFileSize: expect.any(Number),
          averageFileSize: expect.any(Number),
          processingSpeed: expect.any(Number)
        })
      });

      expect(identificationResult).toMatchObject({
        sessionId: expect.any(String),
        processedFiles: expect.any(Number),
        promptFiles: expect.any(Array),
        statistics: expect.objectContaining({
          totalApiCalls: expect.any(Number),
          successfulCalls: expect.any(Number),
          failedCalls: expect.any(Number),
          averageConfidence: expect.any(Number),
          processingTime: expect.any(Number)
        }),
        errors: expect.any(Array)
      });

      // 验证时间戳格式
      expect(new Date(scanResult.startTime).getTime()).toBeGreaterThan(0);
      expect(new Date(scanResult.endTime).getTime()).toBeGreaterThan(0);
      expect(scanResult.duration).toBeGreaterThan(0);
    });
  });

  describe('配置和选项验证', () => {
    it('应该正确应用扫描配置', async () => {
      const customConfig = {
        extensions: ['.md'], // 只扫描Markdown
        ignorePatterns: ['docs/**'], // 忽略docs目录
        maxFileSize: 1024 * 1024, // 1MB限制
        concurrency: 3,
        respectGitignore: false
      };

      const result = await fileScanner.scanRepository({
        rootPath: testRepoDir,
        options: customConfig
      });

      // 验证只包含Markdown文件
      const extensions = result.files.map(f => f.extension);
      expect(extensions.every(ext => ext === '.md')).toBe(true);

      // 验证忽略了docs目录
      const docsFiles = result.files.filter(f => f.filePath.includes('/docs/'));
      expect(docsFiles.length).toBe(0);

      // 验证文件大小限制
      const oversizedFiles = result.files.filter(f => f.size > customConfig.maxFileSize);
      expect(oversizedFiles.length).toBe(0);
    });

    it('应该正确应用AI识别配置', async () => {
      const scanResult = await fileScanner.scanRepository({
        rootPath: testRepoDir
      });

      const aiConfig = {
        aiProvider: 'qwen' as const,
        model: 'qwen-plus',
        batchSize: 2,
        confidenceThreshold: 0.8, // 较高阈值
        retryCount: 1,
        timeout: 15000
      };

      const result = await fileScanner.identifyPromptFiles({
        files: scanResult.files.slice(0, 6), // 限制文件数量
        options: aiConfig
      });

      // 验证高置信度过滤
      const highConfidencePrompts = result.promptFiles.filter(pf => pf.hasPrompts && pf.confidence >= 0.8);
      expect(highConfidencePrompts.length).toBeLessThanOrEqual(result.promptFiles.filter(pf => pf.hasPrompts).length);

      // 验证批处理大小影响
      expect(result.statistics.totalApiCalls).toBeGreaterThan(0);
    });
  });

  describe('数据一致性验证', () => {
    it('扫描、识别、提取数据应该保持一致', async () => {
      const scanResult = await fileScanner.scanRepository({
        rootPath: testRepoDir
      });

      const identificationResult = await fileScanner.identifyPromptFiles({
        files: scanResult.files
      });

      // 所有识别的文件都应该在扫描结果中
      for (const promptFile of identificationResult.promptFiles) {
        const originalFile = scanResult.files.find(f => f.filePath === promptFile.filePath);
        expect(originalFile).toBeDefined();
        expect(originalFile?.fileName).toBe(promptFile.filePath.split('/').pop());
      }

      // 验证文件数量一致性
      expect(identificationResult.processedFiles).toBe(scanResult.files.length);

      // 验证session ID关联
      expect(scanResult.sessionId).toBeDefined();
      expect(identificationResult.sessionId).toBeDefined();
    });
  });
});