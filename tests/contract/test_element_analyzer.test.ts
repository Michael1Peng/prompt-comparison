/**
 * 🔴 RED Phase: 13-Elements Extraction Contract Tests
 *
 * Tests for extracting and analyzing the 13 framework elements
 * from prompt content using structured AI analysis.
 */

import { ElementAnalyzer } from '@/services/element-analyzer';
import { PromptContent, PromptElements, ElementData } from '@/models';

describe('ElementAnalyzer Contract Tests', () => {
  let analyzer: ElementAnalyzer;

  beforeEach(() => {
    analyzer = new ElementAnalyzer({
      apiKey: process.env.OPENAI_API_KEY || 'test-key',
      model: 'gpt-5',
    });
  });

  describe('Element Extraction', () => {
    it('should extract all 13 standard elements', async () => {
      // Contract: All 13 framework elements must be analyzed
      const comprehensivePrompt: PromptContent = {
        contentId: 'test-001',
        sourceFile: './test.md',
        originalText: `You are a professional software engineer assistant with expertise in code review and best practices.

Please analyze the following Python code and provide detailed feedback:

\`\`\`python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
\`\`\`

Your analysis should include:
1. Code correctness and functionality
2. Performance optimization suggestions
3. Best practice recommendations
4. Security considerations

Please format your response as a structured report.
Avoid using technical jargon that beginners might not understand.
Focus on actionable improvements.

This analysis is intended for junior developers learning Python.`,
        cleanedText: '', // Would be filled by detector
        language: 'en',
        contentType: 'user',
        isPrompt: true,
        confidence: 0.95,
        detectionMethod: 'gpt-5',
      };

      const result = await analyzer.analyzeElements(comprehensivePrompt);

      expect(result).toBeDefined();
      expect(result.elementId).toBeDefined();
      expect(result.contentId).toBe('test-001');

      // Verify all 13 elements are present
      const elementNames = [
        'roleAbility',
        'taskRequest',
        'contextSituation',
        'instructionAction',
        'outputSpec',
        'examples',
        'constraints',
        'objectives',
        'information',
        'evaluation',
        'adjustment',
        'audience',
      ];

      elementNames.forEach(elementName => {
        expect(result).toHaveProperty(elementName);
        expect(result[elementName as keyof PromptElements]).toMatchObject({
          present: expect.any(Boolean),
          confidence: expect.any(Number),
        });
      });
    });

    it('should identify present elements accurately', async () => {
      // Contract: Clearly present elements should be marked as such
      const roleBasedPrompt: PromptContent = createMockPromptContent(
        'You are a senior Python developer. Help junior developers write better code.',
        'role-test'
      );

      const result = await analyzer.analyzeElements(roleBasedPrompt);

      expect(result.roleAbility.present).toBe(true);
      expect(result.roleAbility.confidence).toBeGreaterThan(0.8);
      expect(result.roleAbility.content).toContain('senior Python developer');
      expect(result.audience.present).toBe(true);
      expect(result.audience.content).toContain('junior developers');
    });

    it('should handle missing elements correctly', async () => {
      // Contract: Missing elements should be marked as absent
      const simplePrompt: PromptContent = createMockPromptContent(
        'What is the weather like today?',
        'simple-test'
      );

      const result = await analyzer.analyzeElements(simplePrompt);

      // Simple question likely lacks many elements
      expect(result.roleAbility.present).toBe(false);
      expect(result.outputSpec.present).toBe(false);
      expect(result.examples.present).toBe(false);
      expect(result.taskRequest.present).toBe(true); // It is a request
    });
  });

  describe('Element Content Extraction', () => {
    it('should extract accurate text snippets for present elements', async () => {
      // Contract: Extracted content should match original text
      const structuredPrompt: PromptContent = createMockPromptContent(
        `System: You are CodeReviewBot, an AI assistant specialized in code analysis.

Task: Review the attached JavaScript file for potential bugs and improvements.

Context: This code is part of a production e-commerce website handling user payments.

Instructions:
1. Check for security vulnerabilities
2. Identify performance bottlenecks
3. Suggest modern JavaScript alternatives

Output: Provide a numbered list with severity levels (High/Medium/Low).

Example:
High: SQL injection vulnerability on line 42
Medium: Consider using arrow functions for better readability

Constraints: Do not suggest changes that would break backwards compatibility with Internet Explorer 11.

Goal: Ensure the code meets enterprise-grade quality standards.

Audience: This review is for senior developers on the platform team.`,
        'structured-test'
      );

      const result = await analyzer.analyzeElements(structuredPrompt);

      // Verify content extraction
      expect(result.roleAbility.content).toContain('CodeReviewBot');
      expect(result.taskRequest.content).toContain('Review the attached JavaScript file');
      expect(result.contextSituation.content).toContain('production e-commerce website');
      expect(result.outputSpec.content).toContain('numbered list with severity levels');
      expect(result.examples.content).toContain('SQL injection vulnerability');
      expect(result.constraints.content).toContain('Internet Explorer 11');
      expect(result.objectives.content).toContain('enterprise-grade quality standards');
      expect(result.audience.content).toContain('senior developers');
    });

    it('should provide position information for elements', async () => {
      // Contract: Element positions must be tracked for editing
      const testPrompt: PromptContent = createMockPromptContent(
        'You are a helpful assistant. Please help the user with their question.',
        'position-test'
      );

      const result = await analyzer.analyzeElements(testPrompt);

      result.roleAbility.position &&
        expect(result.roleAbility.position.start).toBeGreaterThanOrEqual(0);
      result.roleAbility.position && expect(result.roleAbility.position.length).toBeGreaterThan(0);

      if (result.taskRequest.present && result.taskRequest.position) {
        expect(result.taskRequest.position.start).toBeGreaterThanOrEqual(0);
        expect(result.taskRequest.position.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Confidence Scoring', () => {
    it('should provide confidence scores for element detection', async () => {
      // Contract: All elements should have confidence scores 0-1
      const testPrompt: PromptContent = createMockPromptContent(
        'Please analyze this code and tell me how to improve it.',
        'confidence-test'
      );

      const result = await analyzer.analyzeElements(testPrompt);

      Object.values(result).forEach(element => {
        if (typeof element === 'object' && element && 'confidence' in element) {
          const elementData = element as ElementData;
          expect(elementData.confidence).toBeGreaterThanOrEqual(0);
          expect(elementData.confidence).toBeLessThanOrEqual(1);
        }
      });
    });

    it('should have higher confidence for obvious elements', async () => {
      // Contract: Clear elements should have confidence > 0.7
      const obviousRolePrompt: PromptContent = createMockPromptContent(
        'You are ChatGPT, a large language model trained by OpenAI. You are knowledgeable, helpful, and truthful.',
        'obvious-test'
      );

      const result = await analyzer.analyzeElements(obviousRolePrompt);

      expect(result.roleAbility.present).toBe(true);
      expect(result.roleAbility.confidence).toBeGreaterThan(0.7);
    });

    it('should have lower confidence for ambiguous elements', async () => {
      // Contract: Unclear elements should have confidence < 0.5
      const ambiguousPrompt: PromptContent = createMockPromptContent(
        'This is some content that might be instructions.',
        'ambiguous-test'
      );

      const result = await analyzer.analyzeElements(ambiguousPrompt);

      // Most elements should have low confidence for ambiguous content
      const lowConfidenceElements = Object.values(result).filter(element => {
        if (typeof element === 'object' && element && 'confidence' in element) {
          return (element as ElementData).confidence < 0.5;
        }
        return false;
      });

      expect(lowConfidenceElements.length).toBeGreaterThan(5);
    });
  });

  describe('Quality Assessment', () => {
    it('should calculate overall completeness score', async () => {
      // Contract: Completeness should reflect element coverage
      const completePrompt: PromptContent = createMockPromptContent(
        `You are an expert code reviewer (ROLE).

Please analyze this Python function for bugs and improvements (TASK).
This code is used in a production banking application (CONTEXT).

Steps to follow:
1. Check syntax and logic errors
2. Review security implications
3. Suggest performance optimizations (INSTRUCTIONS)

Provide your findings in JSON format with severity levels (OUTPUT).

Example: {"finding": "Variable not initialized", "severity": "high"} (EXAMPLES)

Do not suggest changes that require Python 3.9+ features (CONSTRAINTS).
Focus on making the code production-ready and maintainable (GOALS).

This analysis is for the senior development team (AUDIENCE).`,
        'complete-test'
      );

      const result = await analyzer.analyzeElements(completePrompt);

      expect(result.completeness).toBeGreaterThanOrEqual(0);
      expect(result.completeness).toBeLessThanOrEqual(1);
      expect(result.completeness).toBeGreaterThan(0.6); // Should be fairly complete
    });

    it('should assign quality grades correctly', async () => {
      // Contract: Quality grades should match completeness levels
      const highQualityPrompt: PromptContent = createMockPromptContent(
        `System: You are TechnicalWriter, an AI specialized in creating developer documentation.

Task: Create comprehensive API documentation for the given REST endpoints.

Context: This documentation will be used by external developers integrating with our e-commerce platform.

Instructions:
1. Document each endpoint with HTTP method, URL, and parameters
2. Provide request/response examples in JSON format
3. Include authentication requirements and error codes
4. Add rate limiting information

Output Format: Generate markdown documentation with clear sections and code blocks.

Example:
## POST /api/orders
Creates a new order in the system.
\`\`\`json
{"product_id": 123, "quantity": 2}
\`\`\`

Constraints:
- Keep examples under 50 lines for readability
- Use RESTful naming conventions only
- Include deprecation notices where applicable

Goals: Enable developers to integrate quickly with minimal support requests.

Target Audience: External API consumers ranging from junior to senior developers.

Success Metrics: Documentation should reduce support tickets by 30%.`,
        'high-quality-test'
      );

      const result = await analyzer.analyzeElements(highQualityPrompt);

      expect(result.completeness).toBeGreaterThan(0.8);
      expect(result.qualityScore).toMatch(/^[AB]$/); // Should be A or B grade
    });

    it('should provide quality improvement suggestions', async () => {
      // Contract: Analysis should suggest improvements for low-quality prompts
      const incompletePrompt: PromptContent = createMockPromptContent(
        'Help me with code.',
        'incomplete-test'
      );

      const result = await analyzer.analyzeElements(incompletePrompt);

      expect(result.completeness).toBeLessThan(0.3);
      expect(result.qualityScore).toMatch(/^[DF]$/); // Should be D or F grade

      // Should identify missing elements
      const missingElements = Object.entries(result).filter(([key, element]) => {
        if (typeof element === 'object' && element && 'present' in element) {
          return !(element as ElementData).present;
        }
        return false;
      });

      expect(missingElements.length).toBeGreaterThan(5);
    });
  });

  describe('Multilingual Support', () => {
    it('should analyze Chinese prompts correctly', async () => {
      // Contract: Non-English prompts should be analyzed properly
      const chinesePrompt: PromptContent = createMockPromptContent(
        `你是一名专业的软件工程师助手，专门帮助开发者分析和改进代码质量。

请分析以下Python代码并提供详细的改进建议：

代码：
def calculate_average(numbers):
    total = sum(numbers)
    return total / len(numbers)

请提供：
1. 代码正确性分析
2. 性能优化建议
3. 最佳实践推荐

输出格式：请使用结构化的markdown格式。

约束条件：不要使用初学者难以理解的专业术语。

目标：帮助初级开发者提高编程能力。

目标受众：Python初学者。`,
        'chinese-test'
      );

      const result = await analyzer.analyzeElements(chinesePrompt);

      expect(result.roleAbility.present).toBe(true);
      expect(result.roleAbility.content).toContain('软件工程师助手');
      expect(result.taskRequest.present).toBe(true);
      expect(result.outputSpec.present).toBe(true);
      expect(result.constraints.present).toBe(true);
      expect(result.audience.present).toBe(true);
    });
  });

  describe('Performance Requirements', () => {
    it('should analyze elements within time limit', async () => {
      // Contract: Analysis should complete within 10 seconds
      const testPrompt: PromptContent = createMockPromptContent(
        'You are a helpful assistant. Please analyze this code and provide suggestions.',
        'performance-test'
      );

      const startTime = Date.now();
      const result = await analyzer.analyzeElements(testPrompt);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(10000); // 10 seconds
      expect(result).toBeDefined();
    });

    it('should handle concurrent analysis requests', async () => {
      // Contract: Multiple concurrent analyses should work correctly
      const prompts = Array(3)
        .fill(null)
        .map((_, i) =>
          createMockPromptContent(
            `You are assistant ${i}. Please help with task ${i}.`,
            `concurrent-${i}`
          )
        );

      const promises = prompts.map(prompt => analyzer.analyzeElements(prompt));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.contentId).toBe(`concurrent-${index}`);
        expect(result.elementId).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid content gracefully', async () => {
      // Contract: Invalid content should not crash the analyzer
      const invalidPrompt: PromptContent = createMockPromptContent('', 'empty-test');

      const result = await analyzer.analyzeElements(invalidPrompt);

      expect(result).toBeDefined();
      expect(result.completeness).toBe(0);
      expect(result.qualityScore).toBe('F');
    });

    it('should handle API failures gracefully', async () => {
      // Contract: API failures should return partial results or errors
      const invalidAnalyzer = new ElementAnalyzer({
        apiKey: 'invalid-key',
        model: 'gpt-5',
      });

      const testPrompt: PromptContent = createMockPromptContent(
        'Test prompt for API failure',
        'api-failure-test'
      );

      await expect(invalidAnalyzer.analyzeElements(testPrompt)).rejects.toThrow(
        /authentication|unauthorized/i
      );
    });
  });

  // Helper function
  function createMockPromptContent(text: string, id: string): PromptContent {
    return {
      contentId: id,
      sourceFile: `./test-${id}.md`,
      originalText: text,
      cleanedText: text,
      language: text.match(/[\u4e00-\u9fa5]/) ? 'zh' : 'en',
      contentType: 'user',
      isPrompt: true,
      confidence: 0.8,
      detectionMethod: 'gpt-5',
    };
  }
});
