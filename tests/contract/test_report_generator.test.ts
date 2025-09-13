/**
 * 🔴 RED Phase: Report Generator and CSV Export Contract Tests
 *
 * Tests for data aggregation, report generation, and CSV export functionality.
 */

import { ReportGenerator } from '@/services/report-generator';
import { CsvExporter } from '@/utils/csv-exporter';
import { AnalysisReport, PromptElements } from '@/models';

describe('ReportGenerator Contract Tests', () => {
  let reportGenerator: ReportGenerator;
  let csvExporter: CsvExporter;

  beforeEach(() => {
    reportGenerator = new ReportGenerator();
    csvExporter = new CsvExporter();
  });

  describe('Data Aggregation', () => {
    it('should aggregate scan statistics correctly', async () => {
      // Contract: Statistics must accurately reflect processed data
      const mockData = {
        files: Array(100)
          .fill(null)
          .map((_, i) => ({
            filePath: `file-${i}.txt`,
            scanStatus: i < 95 ? 'completed' : i < 98 ? 'failed' : 'skipped',
          })),
        contents: Array(25)
          .fill(null)
          .map(() => ({ isPrompt: true })),
        elements: Array(25)
          .fill(null)
          .map(() => ({ qualityScore: 'B' })),
      };

      const report = await reportGenerator.generateReport(mockData);

      expect(report.scanSummary.totalFiles).toBe(100);
      expect(report.scanSummary.scannedFiles).toBe(95);
      expect(report.scanSummary.failedFiles).toBe(3);
      expect(report.scanSummary.skippedFiles).toBe(2);
      expect(report.contentSummary.totalPrompts).toBe(25);
    });

    it('should calculate quality distribution accurately', async () => {
      // Contract: Quality grades must be counted correctly
      const mockElements = [
        { qualityScore: 'A' },
        { qualityScore: 'A' }, // 2 A's
        { qualityScore: 'B' },
        { qualityScore: 'B' },
        { qualityScore: 'B' }, // 3 B's
        { qualityScore: 'C' }, // 1 C
        { qualityScore: 'D' },
        { qualityScore: 'D' }, // 2 D's
        { qualityScore: 'F' }, // 1 F
      ];

      const report = await reportGenerator.aggregateQualityData(mockElements);

      expect(report.qualityDistribution.A).toBe(2);
      expect(report.qualityDistribution.B).toBe(3);
      expect(report.qualityDistribution.C).toBe(1);
      expect(report.qualityDistribution.D).toBe(2);
      expect(report.qualityDistribution.F).toBe(1);
    });

    it('should identify most missing elements', async () => {
      // Contract: Element frequency analysis for improvement suggestions
      const mockElements = Array(10)
        .fill(null)
        .map(() => ({
          roleAbility: { present: true },
          taskRequest: { present: true },
          contextSituation: { present: false }, // Missing in all
          instructionAction: { present: false }, // Missing in all
          outputSpec: { present: Math.random() > 0.7 }, // Missing in ~70%
          examples: { present: Math.random() > 0.8 }, // Missing in ~80%
          constraints: { present: true },
          objectives: { present: true },
          information: { present: Math.random() > 0.5 },
          evaluation: { present: false }, // Missing in all
          adjustment: { present: false }, // Missing in all
          audience: { present: Math.random() > 0.6 },
        }));

      const report = await reportGenerator.analyzeElementFrequency(mockElements);

      expect(report.topMissingElements).toContain('contextSituation');
      expect(report.topMissingElements).toContain('instructionAction');
      expect(report.topMissingElements).toContain('evaluation');
      expect(report.topMissingElements).toContain('adjustment');
      expect(report.topMissingElements).toHaveLength(5); // Top 5 missing
    });
  });

  describe('Performance Metrics', () => {
    it('should track processing performance', async () => {
      // Contract: Performance metrics must be captured and calculated
      const mockData = {
        startTime: new Date(Date.now() - 45000), // 45 seconds ago
        endTime: new Date(),
        apiCalls: 150,
        totalTokens: 75000,
        filesProcessed: 100,
      };

      const report = await reportGenerator.calculatePerformanceMetrics(mockData);

      expect(report.processingTime).toBeGreaterThan(40000); // ~45 seconds
      expect(report.apiCallsCount).toBe(150);
      expect(report.totalTokens).toBe(75000);
      expect(report.avgTimePerFile).toBeCloseTo(450, 50); // ~450ms per file
    });

    it('should provide rate calculations', async () => {
      // Contract: Processing rates for performance monitoring
      const mockData = {
        processingTime: 60000, // 1 minute
        filesProcessed: 120,
        promptsFound: 30,
      };

      const rates = await reportGenerator.calculateProcessingRates(mockData);

      expect(rates.filesPerSecond).toBe(2); // 120 files / 60 seconds
      expect(rates.promptsPerMinute).toBe(30); // 30 prompts / 1 minute
    });
  });

  describe('CSV Export', () => {
    it('should export prompt elements to CSV format', async () => {
      // Contract: All element data must be exportable to CSV
      const mockElements: PromptElements[] = [
        {
          elementId: 'elem-1',
          sourceFile: './test1.md',
          roleAbility: { present: true, confidence: 0.9, content: 'AI assistant' },
          taskRequest: { present: true, confidence: 0.8, content: 'Help with code' },
          completeness: 0.6,
          qualityScore: 'B',
        } as any,
        {
          elementId: 'elem-2',
          sourceFile: './test2.md',
          roleAbility: { present: false, confidence: 0.1 },
          taskRequest: { present: true, confidence: 0.7, content: 'Analyze data' },
          completeness: 0.4,
          qualityScore: 'C',
        } as any,
      ];

      const csvResult = await csvExporter.exportElements(mockElements);

      expect(csvResult).toContain('elementId,sourceFile,roleAbility_present'); // Headers
      expect(csvResult).toContain('elem-1,./test1.md,true'); // Data row 1
      expect(csvResult).toContain('elem-2,./test2.md,false'); // Data row 2
      expect(csvResult).toContain('B'); // Quality scores
      expect(csvResult).toContain('C');
    });

    it('should export summary statistics to CSV', async () => {
      // Contract: Report summaries must be CSV exportable
      const mockReport: Partial<AnalysisReport> = {
        scanSummary: {
          totalFiles: 200,
          scannedFiles: 190,
          promptFiles: 45,
          failedFiles: 10,
          skippedFiles: 0,
        },
        contentSummary: {
          totalPrompts: 45,
          avgConfidence: 0.82,
          byLanguage: { en: 30, zh: 10, mixed: 5 },
          byType: { user: 35, system: 8, documentation: 2 },
        },
      };

      const csvResult = await csvExporter.exportSummary(mockReport);

      expect(csvResult).toContain('metric,value'); // Headers
      expect(csvResult).toContain('totalFiles,200');
      expect(csvResult).toContain('avgConfidence,0.82');
      expect(csvResult).toContain('english_prompts,30');
    });

    it('should handle special characters and escaping', async () => {
      // Contract: CSV must properly escape special characters
      const dataWithSpecialChars = [
        {
          content: 'Text with "quotes" and, commas',
          description: 'Multi-line\ncontent\nwith breaks',
          code: 'const x = "hello, world";',
        },
      ];

      const csvResult = await csvExporter.exportCustomData(dataWithSpecialChars);

      expect(csvResult).toContain('"Text with ""quotes"" and, commas"'); // Escaped quotes
      expect(csvResult).toContain('"Multi-line\\ncontent\\nwith breaks"'); // Escaped newlines
      expect(csvResult).toContain('"const x = ""hello, world"";"'); // Escaped code
    });
  });

  describe('Report Templates', () => {
    it('should generate executive summary report', async () => {
      // Contract: Executive summary for management consumption
      const fullReport: Partial<AnalysisReport> = {
        projectPath: './my-project',
        scanSummary: {
          totalFiles: 500,
          promptFiles: 75,
          failedFiles: 5,
        } as any,
        elementSummary: {
          avgCompleteness: 0.65,
          qualityDistribution: { A: 15, B: 35, C: 20, D: 5, F: 0 },
        } as any,
        performance: {
          processingTime: 120000, // 2 minutes
          avgTimePerFile: 240, // 240ms per file
        } as any,
      };

      const summary = await reportGenerator.generateExecutiveSummary(fullReport);

      expect(summary.title).toContain('Executive Summary');
      expect(summary.keyMetrics).toContain('75 prompt files identified');
      expect(summary.keyMetrics).toContain('65% average completeness');
      expect(summary.recommendations).toHaveLength(3); // Should provide 3 recommendations
      expect(summary.riskAssessment).toBeDefined();
    });

    it('should generate technical detailed report', async () => {
      // Contract: Technical report for developers
      const fullReport: Partial<AnalysisReport> = {
        files: [
          {
            filePath: './prompts/system.txt',
            scanStatus: 'completed',
          },
        ] as any,
        elements: [
          {
            sourceFile: './prompts/system.txt',
            qualityScore: 'A',
            completeness: 0.92,
            roleAbility: { present: true, confidence: 0.95 },
          },
        ] as any,
      };

      const technicalReport = await reportGenerator.generateTechnicalReport(fullReport);

      expect(technicalReport.fileDetails).toBeDefined();
      expect(technicalReport.qualityAnalysis).toBeDefined();
      expect(technicalReport.improvementSuggestions).toHaveLength(5); // Top 5 suggestions
      expect(technicalReport.codeExamples).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty data gracefully', async () => {
      // Contract: Empty datasets should not crash report generation
      const emptyData = {
        files: [],
        contents: [],
        elements: [],
      };

      const report = await reportGenerator.generateReport(emptyData);

      expect(report.scanSummary.totalFiles).toBe(0);
      expect(report.contentSummary.totalPrompts).toBe(0);
      expect(report.elementSummary.avgCompleteness).toBe(0);
      expect(report.qualityScore).toBe('N/A');
    });

    it('should handle corrupted data entries', async () => {
      // Contract: Corrupted entries should be skipped with warnings
      const corruptedData = {
        elements: [
          { qualityScore: 'A' }, // Valid
          { qualityScore: undefined }, // Corrupted
          { qualityScore: 'InvalidGrade' }, // Invalid
          { qualityScore: 'B' }, // Valid
        ],
      };

      const result = await reportGenerator.processWithValidation(corruptedData);

      expect(result.validElements).toHaveLength(2); // Only A and B
      expect(result.warnings).toHaveLength(2); // Two problematic entries
      expect(result.warnings[0]).toContain('undefined qualityScore');
    });

    it('should maintain data consistency in exports', async () => {
      // Contract: CSV exports must match JSON data exactly
      const testData = {
        elements: [
          { id: 1, score: 'A' },
          { id: 2, score: 'B' },
        ],
      };

      const jsonReport = await reportGenerator.generateReport(testData);
      const csvData = await csvExporter.exportFromReport(jsonReport);

      // Parse CSV back and verify counts match
      const csvLines = csvData.split('\n').filter(line => line.trim());
      const dataLines = csvLines.slice(1); // Skip header

      expect(dataLines).toHaveLength(testData.elements.length);
    });
  });
});
