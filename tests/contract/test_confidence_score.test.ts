/**
 * 🔴 RED Phase: Confidence Scoring Algorithm Contract Tests
 *
 * Tests for confidence calculation algorithms and scoring consistency.
 */

import { ConfidenceCalculator } from '@/utils/confidence-calculator';
import { PromptContent } from '@/models';

describe('ConfidenceCalculator Contract Tests', () => {
  let calculator: ConfidenceCalculator;

  beforeEach(() => {
    calculator = new ConfidenceCalculator();
  });

  describe('Score Calculation', () => {
    it('should return score between 0 and 1', () => {
      // Contract: All confidence scores must be in valid range
      const testCases = [
        'You are a helpful AI assistant',
        'function test() { return 42; }',
        'README.md file content',
        'This is definitely a prompt for an AI system',
        '',
      ];

      testCases.forEach(text => {
        const score = calculator.calculateConfidence(text, {});
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      });
    });

    it('should give high scores to obvious prompts', () => {
      // Contract: Clear prompts should have confidence > 0.8
      const obviousPrompts = [
        'You are ChatGPT, a large language model trained by OpenAI',
        'Please analyze the following code and provide suggestions',
        'Act as a professional software engineer and help me',
        'System: You are an AI assistant. User: How do I code?',
      ];

      obviousPrompts.forEach(prompt => {
        const score = calculator.calculateConfidence(prompt, {});
        expect(score).toBeGreaterThan(0.8);
      });
    });

    it('should give low scores to non-prompt content', () => {
      // Contract: Non-prompts should have confidence < 0.3
      const nonPrompts = [
        'const express = require("express"); app.listen(3000);',
        'npm install --save-dev jest typescript',
        '{"name": "package", "version": "1.0.0"}',
        'SELECT * FROM users WHERE active = 1;',
      ];

      nonPrompts.forEach(content => {
        const score = calculator.calculateConfidence(content, {});
        expect(score).toBeLessThan(0.3);
      });
    });
  });

  describe('Feature Weights', () => {
    it('should consider prompt keywords heavily', () => {
      // Contract: Keywords increase confidence significantly
      const baseText = 'Please help me with this task';
      const keywordText = 'You are an AI assistant. Please help me with this task';

      const baseScore = calculator.calculateConfidence(baseText, {});
      const keywordScore = calculator.calculateConfidence(keywordText, {});

      expect(keywordScore).toBeGreaterThan(baseScore);
      expect(keywordScore - baseScore).toBeGreaterThan(0.2);
    });

    it('should consider text structure patterns', () => {
      // Contract: Prompt-like structure affects scoring
      const unstructured = 'help with code please thanks';
      const structured =
        'Please help me with the following code:\n\n1. Review syntax\n2. Suggest improvements\n3. Explain concepts';

      const unstructuredScore = calculator.calculateConfidence(unstructured, {});
      const structuredScore = calculator.calculateConfidence(structured, {});

      expect(structuredScore).toBeGreaterThan(unstructuredScore);
    });

    it('should consider imperatives and questions', () => {
      // Contract: Commands and questions increase confidence
      const statement = 'The weather is nice today';
      const question = 'How is the weather today?';
      const command = 'Tell me about the weather today';

      const statementScore = calculator.calculateConfidence(statement, {});
      const questionScore = calculator.calculateConfidence(question, {});
      const commandScore = calculator.calculateConfidence(command, {});

      expect(questionScore).toBeGreaterThan(statementScore);
      expect(commandScore).toBeGreaterThan(statementScore);
    });
  });

  describe('Context Awareness', () => {
    it('should consider file metadata in scoring', () => {
      // Contract: File context affects confidence calculation
      const sameText = 'Please review this code carefully';

      const promptFileContext = {
        fileName: 'ai-prompt.txt',
        fileExtension: '.txt',
      };

      const codeFileContext = {
        fileName: 'index.js',
        fileExtension: '.js',
      };

      const promptScore = calculator.calculateConfidence(sameText, promptFileContext);
      const codeScore = calculator.calculateConfidence(sameText, codeFileContext);

      expect(promptScore).toBeGreaterThan(codeScore);
    });

    it('should adjust for file size appropriately', () => {
      // Contract: Very short or very long files are less likely to be prompts
      const text = 'You are an AI assistant';

      const shortContext = { fileSize: 10 };
      const normalContext = { fileSize: 500 };
      const longContext = { fileSize: 100000 };

      const shortScore = calculator.calculateConfidence(text, shortContext);
      const normalScore = calculator.calculateConfidence(text, normalContext);
      const longScore = calculator.calculateConfidence(text, longContext);

      expect(normalScore).toBeGreaterThan(shortScore);
      expect(normalScore).toBeGreaterThan(longScore);
    });
  });

  describe('Language Sensitivity', () => {
    it('should handle multilingual content consistently', () => {
      // Contract: Different languages should be scored fairly
      const englishPrompt = 'You are a helpful AI assistant. Please help the user.';
      const chinesePrompt = '你是一个有用的AI助手。请帮助用户。';

      const englishScore = calculator.calculateConfidence(englishPrompt, {});
      const chineseScore = calculator.calculateConfidence(chinesePrompt, {});

      // Scores should be similar for equivalent prompts
      expect(Math.abs(englishScore - chineseScore)).toBeLessThan(0.2);
      expect(both([englishScore, chineseScore])).toBeGreaterThan(0.7);
    });

    it('should detect code-switching patterns', () => {
      // Contract: Mixed language prompts should be identified
      const mixedPrompt = 'You are an AI assistant. 请用中文回答问题。';

      const score = calculator.calculateConfidence(mixedPrompt, {});

      expect(score).toBeGreaterThan(0.6);
    });
  });

  describe('Consistency Requirements', () => {
    it('should return consistent scores for identical input', () => {
      // Contract: Deterministic scoring for same input
      const text = 'Please analyze this code for me';

      const scores = Array(10)
        .fill(null)
        .map(() => calculator.calculateConfidence(text, {}));

      const firstScore = scores[0];
      scores.forEach(score => {
        expect(score).toBe(firstScore);
      });
    });

    it('should show gradual score changes for similar content', () => {
      // Contract: Small changes should not cause dramatic score jumps
      const baseText = 'Please help me with coding';
      const variations = [
        'Please help me with coding tasks',
        'Please help me with coding problems',
        'Please help me with programming',
        'Help me with coding',
      ];

      const baseScore = calculator.calculateConfidence(baseText, {});
      variations.forEach(variation => {
        const score = calculator.calculateConfidence(variation, {});
        const difference = Math.abs(score - baseScore);
        expect(difference).toBeLessThan(0.3); // Should not vary too much
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content gracefully', () => {
      // Contract: Empty content should not cause errors
      const score = calculator.calculateConfidence('', {});

      expect(score).toBe(0);
      expect(typeof score).toBe('number');
    });

    it('should handle very long content efficiently', () => {
      // Contract: Performance with large text inputs
      const longText = 'Please help me with coding. '.repeat(10000); // ~250KB

      const startTime = Date.now();
      const score = calculator.calculateConfidence(longText, {});
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should handle special characters and Unicode', () => {
      // Contract: Unicode and special characters should not break scoring
      const specialText = 'Please analyze: ñáéíóú 中文 🤖 ∑∆√π ¿¡ «»';

      const score = calculator.calculateConfidence(specialText, {});

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('Calibration', () => {
    it('should maintain proper score distribution', () => {
      // Contract: Score distribution should be well-calibrated
      const testData = [
        { text: 'You are ChatGPT', expected: 'high' },
        { text: 'Please help with code', expected: 'medium-high' },
        { text: 'How do I code?', expected: 'medium' },
        { text: 'README file content', expected: 'medium-low' },
        { text: 'const x = 42;', expected: 'low' },
      ];

      const scores = testData.map(({ text }) => calculator.calculateConfidence(text, {}));

      // High confidence samples
      expect(scores[0]).toBeGreaterThan(0.8);
      // Medium-high samples
      expect(scores[1]).toBeGreaterThan(0.6);
      expect(scores[1]).toBeLessThan(0.8);
      // Medium samples
      expect(scores[2]).toBeGreaterThan(0.4);
      expect(scores[2]).toBeLessThan(0.7);
      // Low samples
      expect(scores[4]).toBeLessThan(0.3);
    });

    it('should provide confidence intervals when requested', () => {
      // Contract: Uncertainty estimation for borderline cases
      const ambiguousText = 'Configuration for AI model settings';

      const result = calculator.calculateWithUncertainty(ambiguousText, {});

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.uncertaintyRange).toBeDefined();
      expect(result.uncertaintyRange.lower).toBeLessThan(result.confidence);
      expect(result.uncertaintyRange.upper).toBeGreaterThan(result.confidence);
    });
  });

  // Helper function
  function both<T>(array: T[]): T {
    return array.every(item => typeof item === 'number' && item > 0)
      ? (Math.min(...(array as number[])) as T)
      : (0 as T);
  }
});
