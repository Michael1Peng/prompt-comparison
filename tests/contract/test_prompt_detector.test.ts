/**
 * 🔴 RED Phase: GPT-5 API Integration Contract Tests
 *
 * Tests for OpenAI API integration, prompt detection accuracy,
 * and API error handling.
 */

import { PromptDetector } from '@/services/prompt-detector';
import { PromptFile, PromptContent } from '@/models';

describe('PromptDetector Contract Tests', () => {
  let promptDetector: PromptDetector;

  beforeEach(() => {
    promptDetector = new PromptDetector({
      apiKey: process.env.OPENAI_API_KEY || 'test-key',
      model: 'gpt-5',
      timeout: 30000,
    });
  });

  describe('API Integration', () => {
    it('should establish connection to GPT-5 API', async () => {
      // Contract: API connection must be validated
      const isConnected = await promptDetector.testConnection();

      expect(isConnected).toBe(true);
    });

    it('should handle API authentication failures', async () => {
      // Contract: Invalid API key should be handled gracefully
      const invalidDetector = new PromptDetector({
        apiKey: 'invalid-key',
        model: 'gpt-5',
      });

      await expect(invalidDetector.testConnection()).rejects.toThrow(
        /authentication|unauthorized|invalid.*key/i
      );
    });

    it('should validate API key format before requests', () => {
      // Contract: API key format validation
      expect(() => {
        new PromptDetector({
          apiKey: 'short',
          model: 'gpt-5',
        });
      }).toThrow(/invalid.*api.*key.*format/i);
    });
  });

  describe('Prompt Detection', () => {
    it('should detect clear prompt content with high confidence', async () => {
      // Contract: Obvious prompts should have confidence > 0.9
      const testFile = createMockFile(
        'prompt.md',
        `You are a helpful AI assistant. Please analyze the following code and provide suggestions for improvement.

Here's the code:
\`\`\`python
def hello_world():
    print("Hello, World!")
\`\`\`

Please provide:
1. Code review comments
2. Best practices recommendations
3. Performance optimizations`
      );

      const result = await promptDetector.analyzeFile(testFile);

      expect(result.isPrompt).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.contentType).toBe('user');
      expect(result.language).toMatch(/en|english/i);
    });

    it('should reject non-prompt content with low confidence', async () => {
      // Contract: Non-prompts should have confidence < 0.3
      const testFile = createMockFile(
        'code.js',
        `function calculateSum(a, b) {
  return a + b;
}

const result = calculateSum(5, 3);
console.log('Result:', result);

module.exports = calculateSum;`
      );

      const result = await promptDetector.analyzeFile(testFile);

      expect(result.isPrompt).toBe(false);
      expect(result.confidence).toBeLessThan(0.3);
      expect(result.contentType).toBe('code_comment');
    });

    it('should handle ambiguous content appropriately', async () => {
      // Contract: Borderline cases should have medium confidence
      const testFile = createMockFile(
        'config.yaml',
        `# AI Configuration
model: gpt-4
temperature: 0.7
max_tokens: 1000

# System prompt for the AI
system_message: |
  You are an expert software engineer.
  Help users with coding questions.

# User preferences
preferred_language: python`
      );

      const result = await promptDetector.analyzeFile(testFile);

      expect(result.confidence).toBeGreaterThan(0.3);
      expect(result.confidence).toBeLessThan(0.9);
      expect(result.contentType).toBe('configuration');
    });
  });

  describe('Content Type Classification', () => {
    it('should classify system prompts correctly', async () => {
      // Contract: System prompts should be identified
      const systemPrompt = createMockFile(
        'system.txt',
        'You are Claude, an AI assistant created by Anthropic. You are helpful, harmless, and honest.'
      );

      const result = await promptDetector.analyzeFile(systemPrompt);

      expect(result.contentType).toBe('system');
      expect(result.isPrompt).toBe(true);
    });

    it('should classify user prompts correctly', async () => {
      // Contract: User prompts should be identified
      const userPrompt = createMockFile(
        'user_query.md',
        'Please explain how machine learning algorithms work, focusing on neural networks.'
      );

      const result = await promptDetector.analyzeFile(userPrompt);

      expect(result.contentType).toBe('user');
      expect(result.isPrompt).toBe(true);
    });

    it('should classify conversation logs correctly', async () => {
      // Contract: Multi-turn conversations should be identified
      const conversation = createMockFile(
        'chat_log.txt',
        `User: How do I implement a binary search tree?
Assistant: I'll help you implement a binary search tree. Here's a basic implementation:

class TreeNode:
    def __init__(self, val=0):
        self.val = val
        self.left = None
        self.right = None

User: Can you explain the time complexity?
Assistant: The time complexity depends on the tree's balance...`
      );

      const result = await promptDetector.analyzeFile(conversation);

      expect(result.contentType).toBe('conversation');
      expect(result.isPrompt).toBe(true);
    });
  });

  describe('Language Detection', () => {
    it('should detect Chinese prompts', async () => {
      // Contract: Chinese language should be detected
      const chinesePrompt = createMockFile(
        'chinese_prompt.md',
        '你是一个专业的软件工程师助手。请分析以下代码并提供改进建议。请用中文回复。'
      );

      const result = await promptDetector.analyzeFile(chinesePrompt);

      expect(result.language).toMatch(/zh|chinese/i);
      expect(result.isPrompt).toBe(true);
    });

    it('should detect mixed language content', async () => {
      // Contract: Mixed languages should be identified
      const mixedPrompt = createMockFile(
        'mixed.md',
        'You are an AI assistant. 请用中英文回答问题。Please respond in both English and Chinese.'
      );

      const result = await promptDetector.analyzeFile(mixedPrompt);

      expect(result.language).toMatch(/mixed/i);
      expect(result.isPrompt).toBe(true);
    });
  });

  describe('Content Processing', () => {
    it('should extract clean text from formatted content', async () => {
      // Contract: Markup and formatting should be cleaned
      const formattedFile = createMockFile(
        'formatted.md',
        `# AI Assistant Prompt

**You are a helpful AI assistant.**

- Respond clearly and concisely
- Use *markdown* formatting when appropriate
- Always be ~~rude~~ polite

> Remember to stay helpful!

\`\`\`
Code blocks should be preserved
\`\`\``
      );

      const result = await promptDetector.analyzeFile(formattedFile);

      expect(result.cleanedText).toBeDefined();
      expect(result.cleanedText).not.toContain('**');
      expect(result.cleanedText).not.toContain('##');
      expect(result.cleanedText).toContain('You are a helpful AI assistant');
      expect(result.originalText).toContain('**');
    });

    it('should preserve code blocks in prompts', async () => {
      // Contract: Code examples in prompts should be preserved
      const promptWithCode = createMockFile(
        'prompt_with_code.md',
        `Please review this Python function:

\`\`\`python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
\`\`\`

Suggest improvements for performance.`
      );

      const result = await promptDetector.analyzeFile(promptWithCode);

      expect(result.cleanedText).toContain('fibonacci');
      expect(result.cleanedText).toContain('def');
      expect(result.isPrompt).toBe(true);
    });
  });

  describe('Position Tracking', () => {
    it('should track content position in source file', async () => {
      // Contract: Content position must be tracked for editing
      const testFile = createMockFile(
        'multi_content.md',
        `Some header content here.

<!-- AI Prompt Start -->
You are a code reviewer. Please analyze the following:
<!-- AI Prompt End -->

Some footer content here.`
      );

      const result = await promptDetector.analyzeFile(testFile);

      if (result.isPrompt) {
        expect(result.startPosition).toBeDefined();
        expect(result.endPosition).toBeDefined();
        expect(result.lineRange).toBeDefined();
        expect(result.startPosition).toBeGreaterThan(0);
        expect(result.endPosition).toBeGreaterThan(result.startPosition!);
      }
    });
  });

  describe('Performance Requirements', () => {
    it('should process small files under 2 seconds', async () => {
      // Contract: Small file processing performance
      const smallFile = createMockFile('small.txt', 'Short prompt content');

      const startTime = Date.now();
      const result = await promptDetector.analyzeFile(smallFile);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000);
      expect(result).toBeDefined();
    });

    it('should handle concurrent analysis requests', async () => {
      // Contract: Concurrent requests should not interfere
      const files = Array(5)
        .fill(null)
        .map((_, i) => createMockFile(`file${i}.txt`, `Test prompt content ${i}`));

      const promises = files.map(file => promptDetector.analyzeFile(file));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach((result, i) => {
        expect(result).toBeDefined();
        expect(result.contentId).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API rate limiting gracefully', async () => {
      // Contract: Rate limits should trigger appropriate backoff
      const manyFiles = Array(20)
        .fill(null)
        .map((_, i) => createMockFile(`rate${i}.txt`, `Rate test ${i}`));

      // Should not fail due to rate limiting (should use backoff)
      const results = await Promise.all(manyFiles.map(file => promptDetector.analyzeFile(file)));

      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.contentId).toBeDefined();
      });
    });

    it('should handle network timeouts', async () => {
      // Contract: Network issues should be handled with retries
      const timeoutDetector = new PromptDetector({
        apiKey: process.env.OPENAI_API_KEY || 'test-key',
        model: 'gpt-5',
        timeout: 1, // Very short timeout to simulate network issues
      });

      const testFile = createMockFile('timeout_test.txt', 'Test content');

      // Should either succeed with retry or fail gracefully
      try {
        const result = await timeoutDetector.analyzeFile(testFile);
        expect(result).toBeDefined();
      } catch (error: any) {
        expect(error.message).toMatch(/timeout|network|connection/i);
      }
    });
  });

  // Helper function
  function createMockFile(filename: string, content: string): PromptFile {
    return {
      filePath: `./tests/fixtures/${filename}`,
      fileName: filename,
      fileExtension: filename.includes('.') ? `.${filename.split('.').pop()}` : '',
      fileSize: content.length,
      lastModified: new Date(),
      scanStatus: 'pending' as any,
      scanTimestamp: new Date(),
      encoding: 'UTF-8',
    };
  }
});
