/**
 * 🔴 RED Phase: JSON Output Validation Contract Tests
 *
 * Tests for JSON Schema validation and structured output formatting.
 */

import { JsonFormatter } from '@/utils/json-formatter';
import { PromptElements, AnalysisReport } from '@/models';

describe('JsonFormatter Contract Tests', () => {
  let formatter: JsonFormatter;

  beforeEach(() => {
    formatter = new JsonFormatter({
      validateSchema: true,
      prettify: false,
    });
  });

  describe('Schema Validation', () => {
    it('should validate PromptElements against schema', () => {
      // Contract: PromptElements must conform to defined schema
      const validElements: PromptElements = {
        elementId: 'test-123',
        contentId: 'content-456',
        sourceFile: './test.md',
        roleAbility: { present: true, confidence: 0.9, content: 'Test role' },
        taskRequest: { present: true, confidence: 0.8, content: 'Test task' },
        contextSituation: { present: false, confidence: 0.1 },
        instructionAction: { present: false, confidence: 0.2 },
        outputSpec: { present: false, confidence: 0.1 },
        examples: { present: false, confidence: 0.1 },
        constraints: { present: false, confidence: 0.1 },
        objectives: { present: false, confidence: 0.1 },
        information: { present: false, confidence: 0.1 },
        evaluation: { present: false, confidence: 0.1 },
        adjustment: { present: false, confidence: 0.1 },
        audience: { present: false, confidence: 0.1 },
        analysisTimestamp: new Date(),
        analysisModel: 'gpt-5',
        completeness: 0.2,
        qualityScore: 'D',
      };

      const result = formatter.validateAndFormat(validElements);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.formatted).toBeDefined();
    });

    it('should reject invalid PromptElements', () => {
      // Contract: Invalid data should be rejected with clear errors
      const invalidElements = {
        elementId: '', // Invalid: empty string
        // Missing required fields
      };

      const result = formatter.validateAndFormat(invalidElements);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain(expect.stringMatching(/elementId.*required|empty/i));
    });
  });

  describe('Output Formatting', () => {
    it('should format analysis report correctly', () => {
      // Contract: Analysis reports must have consistent structure
      const mockReport: Partial<AnalysisReport> = {
        reportId: 'report-123',
        projectPath: './test-project',
        createdAt: new Date('2025-09-13T10:00:00Z'),
        version: '0.1.0',
        scanSummary: {
          totalFiles: 100,
          scannedFiles: 95,
          promptFiles: 25,
          failedFiles: 5,
          skippedFiles: 0,
        },
      };

      const result = formatter.formatReport(mockReport);

      expect(result).toMatch(/^\{.*\}$/s); // Valid JSON structure
      const parsed = JSON.parse(result);
      expect(parsed.reportId).toBe('report-123');
      expect(parsed.scanSummary.totalFiles).toBe(100);
    });

    it('should support pretty printing when enabled', () => {
      // Contract: Pretty printing should be configurable
      const prettyFormatter = new JsonFormatter({ prettify: true });
      const data = { test: 'value', nested: { key: 'data' } };

      const result = prettyFormatter.format(data);

      expect(result).toContain('\n'); // Should have line breaks
      expect(result).toContain('  '); // Should have indentation
    });

    it('should support compact output when disabled', () => {
      // Contract: Compact output for production use
      const compactFormatter = new JsonFormatter({ prettify: false });
      const data = { test: 'value', nested: { key: 'data' } };

      const result = compactFormatter.format(data);

      expect(result).not.toContain('\n'); // Should be single line
      expect(result).not.toMatch(/\s{2,}/); // Should not have multiple spaces
    });
  });

  describe('Data Sanitization', () => {
    it('should sanitize sensitive information', () => {
      // Contract: API keys and sensitive data must be removed
      const dataWithSecrets = {
        analysis: 'test data',
        config: {
          apiKey: 'sk-secret123',
          token: 'token-456',
          password: 'secret',
        },
        metadata: {
          user: 'testuser',
          project: 'test-project',
        },
      };

      const result = formatter.sanitizeAndFormat(dataWithSecrets);
      const parsed = JSON.parse(result);

      expect(parsed.config.apiKey).toMatch(/\*{3,}/); // Should be masked
      expect(parsed.config.token).toMatch(/\*{3,}/); // Should be masked
      expect(parsed.config.password).toMatch(/\*{3,}/); // Should be masked
      expect(parsed.metadata.user).toBe('testuser'); // Non-sensitive data preserved
    });

    it('should handle circular references gracefully', () => {
      // Contract: Circular references should not crash formatter
      const circular: any = { name: 'test' };
      circular.self = circular;

      expect(() => {
        formatter.format(circular);
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle undefined and null values', () => {
      // Contract: Edge cases should be handled gracefully
      expect(() => formatter.format(undefined)).not.toThrow();
      expect(() => formatter.format(null)).not.toThrow();

      expect(formatter.format(undefined)).toBe('null');
      expect(formatter.format(null)).toBe('null');
    });

    it('should provide detailed validation error messages', () => {
      // Contract: Validation errors should be actionable
      const invalidData = {
        elementId: 123, // Should be string
        completeness: 1.5, // Should be 0-1
        qualityScore: 'Z', // Should be A,B,C,D,F
      };

      const result = formatter.validateAndFormat(invalidData);

      expect(result.errors).toContain(expect.stringMatching(/elementId.*string/i));
      expect(result.errors).toContain(expect.stringMatching(/completeness.*0.*1/i));
      expect(result.errors).toContain(expect.stringMatching(/qualityScore.*A.*B.*C.*D.*F/i));
    });
  });
});
