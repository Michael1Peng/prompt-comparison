/**
 * T026: Report Generator Service Implementation
 *
 * 🟢 GREEN Phase: Implements comprehensive report generation
 * Creates analysis reports, statistics, and formatted outputs
 */

import fs from 'fs/promises';
import path from 'path';
import {
  AnalysisReport,
  PromptFile,
  PromptContent,
  PromptElements,
  QualityScore,
  Language,
  ContentType,
  ReportOptions
} from '../models';
import { v4 as uuidv4 } from 'uuid';
import { QualityEvaluator } from '../utils/quality-evaluator';
import { JSONFormatter } from '../utils/json-formatter';

/**
 * Report generation configuration
 */
export interface ReportGeneratorConfig {
  outputDirectory?: string;
  includeDetailedStats?: boolean;
  includeTrends?: boolean;
  includeRecommendations?: boolean;
  templatePath?: string;
}

/**
 * Report generation result
 */
export interface ReportGenerationResult {
  reportPath: string;
  reportId: string;
  filesProcessed: number;
  promptsFound: number;
  processingTime: number;
  outputSize: number;
}

/**
 * ReportGenerator service for creating comprehensive analysis reports
 */
export class ReportGenerator {
  private readonly config: Required<ReportGeneratorConfig>;
  // private readonly qualityEvaluator: QualityEvaluator;
  private readonly jsonFormatter: JSONFormatter;

  constructor(config: ReportGeneratorConfig = {}) {
    this.config = {
      outputDirectory: config.outputDirectory ?? './analysis',
      includeDetailedStats: config.includeDetailedStats ?? true,
      includeTrends: config.includeTrends ?? true,
      includeRecommendations: config.includeRecommendations ?? true,
      templatePath: config.templatePath ?? ''
    };

    // this.qualityEvaluator = new QualityEvaluator();
    this.jsonFormatter = new JSONFormatter();
  }

  /**
   * Generate comprehensive analysis report
   */
  async generateReport(
    files: PromptFile[],
    contents: PromptContent[],
    elements: PromptElements[],
    options: ReportOptions = {}
  ): Promise<ReportGenerationResult> {
    const startTime = Date.now();
    const reportId = uuidv4();

    try {
      // Ensure output directory exists
      await fs.mkdir(this.config.outputDirectory, { recursive: true });

      // Create main report
      const report = await this._createAnalysisReport(
        reportId,
        files,
        contents,
        elements
      );

      // Generate report file
      const reportPath = await this._writeReportFile(
        report,
        options,
        reportId
      );

      // Generate additional outputs if requested
      if (options.format === 'csv' || options.includeDetails) {
        await this._generateAdditionalOutputs(report, elements, reportId);
      }

      const processingTime = Date.now() - startTime;
      const stats = await fs.stat(reportPath);

      return {
        reportPath,
        reportId,
        filesProcessed: files.length,
        promptsFound: contents.filter(c => c.isPrompt).length,
        processingTime,
        outputSize: stats.size
      };
    } catch (error: any) {
      throw new Error(`Report generation failed: ${error.message}`);
    }
  }

  /**
   * Generate summary statistics
   */
  generateSummaryStats(
    files: PromptFile[],
    contents: PromptContent[],
    elements: PromptElements[]
  ): {
    totalFiles: number;
    promptFiles: number;
    averageConfidence: number;
    languageDistribution: Record<Language, number>;
    contentTypeDistribution: Record<ContentType, number>;
    qualityDistribution: Record<QualityScore, number>;
    completenessStats: {
      average: number;
      median: number;
      min: number;
      max: number;
    };
  } {
    const promptContents = contents.filter(c => c.isPrompt);

    // Language distribution
    const languageDistribution = this._calculateDistribution(
      promptContents.map(c => c.language)
    );

    // Content type distribution
    const contentTypeDistribution = this._calculateDistribution(
      promptContents.map(c => c.contentType)
    );

    // Quality distribution
    const qualityDistribution = this._calculateDistribution(
      elements.map(e => e.qualityScore)
    );

    // Average confidence
    const totalConfidence = promptContents.reduce((sum, c) => sum + c.confidence, 0);
    const averageConfidence = promptContents.length > 0 ? totalConfidence / promptContents.length : 0;

    // Completeness statistics
    const completenessValues = elements.map(e => e.completeness).sort((a, b) => a - b);
    const completenessStats = {
      average: completenessValues.length > 0 ? completenessValues.reduce((sum, val) => sum + val, 0) / completenessValues.length : 0,
      median: this._calculateMedian(completenessValues),
      min: completenessValues.length > 0 ? completenessValues[0] : 0,
      max: completenessValues.length > 0 ? completenessValues[completenessValues.length - 1] : 0
    };

    return {
      totalFiles: files.length,
      promptFiles: new Set(promptContents.map(c => c.sourceFile)).size,
      averageConfidence,
      languageDistribution: languageDistribution as Record<Language, number>,
      contentTypeDistribution: contentTypeDistribution as Record<ContentType, number>,
      qualityDistribution: qualityDistribution as Record<QualityScore, number>,
      completenessStats
    };
  }

  /**
   * Generate trend analysis
   */
  generateTrendAnalysis(
    elements: PromptElements[]
  ): {
    topMissingElements: Array<{ element: string; missingCount: number; percentage: number }>;
    mostConfidentElements: Array<{ element: string; avgConfidence: number }>;
    qualityTrends: {
      highQualityPatterns: string[];
      improvementAreas: string[];
    };
  } {
    const elementNames = [
      'roleAbility', 'taskRequest', 'contextSituation', 'instructionAction',
      'outputSpec', 'examples', 'constraints', 'objectives',
      'information', 'evaluation', 'adjustment', 'audience'
    ];

    // Calculate missing elements
    const missingCounts = elementNames.map(elementName => {
      const missingCount = elements.filter(el => !el[elementName]?.present).length;
      return {
        element: elementName,
        missingCount,
        percentage: (missingCount / elements.length) * 100
      };
    });

    const topMissingElements = missingCounts
      .sort((a, b) => b.missingCount - a.missingCount)
      .slice(0, 5);

    // Calculate most confident elements
    const confidenceAverages = elementNames.map(elementName => {
      const presentElements = elements.filter(el => el[elementName]?.present);
      const avgConfidence = presentElements.length > 0
        ? presentElements.reduce((sum, el) => sum + el[elementName].confidence, 0) / presentElements.length
        : 0;

      return { element: elementName, avgConfidence };
    });

    const mostConfidentElements = confidenceAverages
      .sort((a, b) => b.avgConfidence - a.avgConfidence)
      .slice(0, 5);

    // Quality trends analysis
    const highQualityElements = elements.filter(el =>
      el.qualityScore === QualityScore.A || el.qualityScore === QualityScore.B
    );

    const highQualityPatterns = this._identifyHighQualityPatterns(highQualityElements);
    const improvementAreas = this._identifyImprovementAreas(elements, topMissingElements);

    return {
      topMissingElements,
      mostConfidentElements,
      qualityTrends: {
        highQualityPatterns,
        improvementAreas
      }
    };
  }

  /**
   * Create the main analysis report structure
   */
  private async _createAnalysisReport(
    reportId: string,
    files: PromptFile[],
    contents: PromptContent[],
    elements: PromptElements[]
  ): Promise<AnalysisReport> {
    const promptContents = contents.filter(c => c.isPrompt);
    const processedFiles = files.filter(f => f.scanStatus === 'completed');

    // Generate statistics
    const summaryStats = this.generateSummaryStats(files, contents, elements);

    // Calculate performance metrics
    const processingTimes = files
      .filter(f => f.scanStatus === 'completed')
      .map(f => f.scanTimestamp?.getTime() || 0);

    const avgTimePerFile = processingTimes.length > 0
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
      : 0;

    // Generate trend analysis
    const trends = this.config.includeTrends ? this.generateTrendAnalysis(elements) : null;

    // Create element frequency map
    const elementFrequency: Record<string, number> = {};
    const elementNames = [
      'roleAbility', 'taskRequest', 'contextSituation', 'instructionAction',
      'outputSpec', 'examples', 'constraints', 'objectives',
      'information', 'evaluation', 'adjustment', 'audience'
    ];

    elementNames.forEach(elementName => {
      elementFrequency[elementName] = elements.filter(el => el[elementName]?.present).length;
    });

    const report: AnalysisReport = {
      reportId,
      projectPath: process.cwd(),
      createdAt: new Date(),
      version: '1.0.0',

      scanSummary: {
        totalFiles: files.length,
        scannedFiles: processedFiles.length,
        promptFiles: summaryStats.promptFiles,
        failedFiles: files.filter(f => f.scanStatus === 'failed').length,
        skippedFiles: files.filter(f => f.scanStatus === 'skipped').length
      },

      contentSummary: {
        totalPrompts: promptContents.length,
        byLanguage: summaryStats.languageDistribution,
        byType: summaryStats.contentTypeDistribution,
        avgConfidence: summaryStats.averageConfidence
      },

      elementSummary: {
        avgCompleteness: summaryStats.completenessStats.average,
        qualityDistribution: summaryStats.qualityDistribution,
        elementFrequency,
        topMissingElements: trends?.topMissingElements.map(e => e.element).slice(0, 3) || []
      },

      performance: {
        processingTime: Date.now() - (files[0]?.scanTimestamp?.getTime() || Date.now()),
        apiCallsCount: promptContents.length, // Estimate
        totalTokens: 0, // Would need to track from actual API calls
        avgTimePerFile
      },

      files,
      contents,
      elements
    };

    return report;
  }

  /**
   * Write report to file in specified format
   */
  private async _writeReportFile(
    report: AnalysisReport,
    options: ReportOptions,
    reportId: string
  ): Promise<string> {
    const timestamp = new Date().toISOString().split('T')[0];
    const baseFilename = options.outputPath
      ? path.basename(options.outputPath, path.extname(options.outputPath))
      : `analysis-report-${timestamp}-${reportId.slice(0, 8)}`;

    let filename: string;
    let content: string;

    switch (options.format) {
      case 'json':
        filename = `${baseFilename}.json`;
        content = this.jsonFormatter.formatAnalysisReport(report, {
          indent: 2,
          includeMetadata: options.includeDetails ?? true
        });
        break;

      case 'csv':
        filename = `${baseFilename}.csv`;
        content = this._generateCSVReport(report);
        break;

      case 'html':
        filename = `${baseFilename}.html`;
        content = await this._generateHTMLReport(report);
        break;

      default:
        filename = `${baseFilename}.json`;
        content = this.jsonFormatter.formatAnalysisReport(report);
    }

    const fullPath = path.join(this.config.outputDirectory, filename);
    await fs.writeFile(fullPath, content, 'utf-8');

    return fullPath;
  }

  /**
   * Generate additional outputs (detailed files)
   */
  private async _generateAdditionalOutputs(
    report: AnalysisReport,
    elements: PromptElements[],
    reportId: string
  ): Promise<void> {
    const timestamp = new Date().toISOString().split('T')[0];

    // Generate detailed elements report
    if (this.config.includeDetailedStats) {
      const elementsReport = {
        metadata: {
          reportId,
          generatedAt: new Date().toISOString(),
          totalElements: elements.length
        },
        elements: elements.map(el => ({
          elementId: el.elementId,
          sourceFile: el.sourceFile,
          completeness: el.completeness,
          qualityScore: el.qualityScore,
          presentElements: this._getElementSummary(el)
        }))
      };

      const elementsPath = path.join(
        this.config.outputDirectory,
        `elements-detail-${timestamp}-${reportId.slice(0, 8)}.json`
      );
      await fs.writeFile(elementsPath, JSON.stringify(elementsReport, null, 2), 'utf-8');
    }

    // Generate recommendations report
    if (this.config.includeRecommendations) {
      const recommendations = this._generateRecommendations(report, elements);
      const recommendationsPath = path.join(
        this.config.outputDirectory,
        `recommendations-${timestamp}-${reportId.slice(0, 8)}.md`
      );
      await fs.writeFile(recommendationsPath, recommendations, 'utf-8');
    }
  }

  /**
   * Calculate distribution for enum values
   */
  private _calculateDistribution<T extends string>(values: T[]): Record<T, number> {
    const distribution = {} as Record<T, number>;

    for (const value of values) {
      distribution[value] = (distribution[value] || 0) + 1;
    }

    return distribution;
  }

  /**
   * Calculate median value
   */
  private _calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Identify high-quality patterns
   */
  private _identifyHighQualityPatterns(highQualityElements: PromptElements[]): string[] {
    const patterns: string[] = [];

    // Common elements in high-quality prompts
    const elementFrequency = {};
    const elementNames = ['roleAbility', 'taskRequest', 'instructionAction', 'outputSpec'];

    elementNames.forEach(elementName => {
      const frequency = highQualityElements.filter(el => el[elementName]?.present).length;
      if (frequency / highQualityElements.length > 0.8) {
        patterns.push(`High-quality prompts typically include ${elementName.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
      }
    });

    if (highQualityElements.some(el => el.examples?.present && el.outputSpec?.present)) {
      patterns.push('Combining examples with output specifications improves quality');
    }

    if (patterns.length === 0) {
      patterns.push('Consistent element presence improves overall quality');
    }

    return patterns.slice(0, 5);
  }

  /**
   * Identify improvement areas
   */
  private _identifyImprovementAreas(
    elements: PromptElements[],
    topMissing: Array<{ element: string; percentage: number }>
  ): string[] {
    const areas: string[] = [];

    topMissing.slice(0, 3).forEach(missing => {
      if (missing.percentage > 50) {
        areas.push(`Focus on adding ${missing.element.replace(/([A-Z])/g, ' $1').toLowerCase()} (missing in ${missing.percentage.toFixed(1)}% of prompts)`);
      }
    });

    const lowQualityCount = elements.filter(el =>
      el.qualityScore === QualityScore.D || el.qualityScore === QualityScore.F
    ).length;

    if (lowQualityCount / elements.length > 0.3) {
      areas.push('Consider reviewing prompts with low completeness scores');
    }

    return areas;
  }

  /**
   * Get element summary for detailed report
   */
  private _getElementSummary(element: PromptElements): Record<string, boolean> {
    return {
      roleAbility: element.roleAbility.present,
      taskRequest: element.taskRequest.present,
      contextSituation: element.contextSituation.present,
      instructionAction: element.instructionAction.present,
      outputSpec: element.outputSpec.present,
      examples: element.examples.present,
      constraints: element.constraints.present,
      objectives: element.objectives.present,
      information: element.information.present,
      evaluation: element.evaluation.present,
      adjustment: element.adjustment.present,
      audience: element.audience.present
    };
  }

  /**
   * Generate CSV report
   */
  private _generateCSVReport(report: AnalysisReport): string {
    const rows: string[] = [];

    // Header
    rows.push('File,Is Prompt,Confidence,Language,Content Type,Quality Score,Completeness');

    // Data rows
    report.contents.forEach(content => {
      const element = report.elements.find(el => el.contentId === content.contentId);
      const row = [
        `"${content.sourceFile}"`,
        content.isPrompt.toString(),
        content.confidence.toFixed(3),
        content.language,
        content.contentType,
        element?.qualityScore || 'N/A',
        element?.completeness.toFixed(3) || '0'
      ];
      rows.push(row.join(','));
    });

    return rows.join('\n');
  }

  /**
   * Generate HTML report
   */
  private async _generateHTMLReport(report: AnalysisReport): Promise<string> {
    // Simplified HTML report generation
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Prompt Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .stats { display: flex; gap: 20px; margin-bottom: 20px; }
        .stat-box { background: white; border: 1px solid #ddd; padding: 10px; border-radius: 5px; flex: 1; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Prompt Analysis Report</h1>

    <div class="summary">
        <h2>Summary</h2>
        <p>Generated: ${report.createdAt.toLocaleString()}</p>
        <p>Total Files: ${report.scanSummary.totalFiles}</p>
        <p>Prompt Files: ${report.scanSummary.promptFiles}</p>
        <p>Total Prompts: ${report.contentSummary.totalPrompts}</p>
    </div>

    <div class="stats">
        <div class="stat-box">
            <h3>Average Confidence</h3>
            <p>${(report.contentSummary.avgConfidence * 100).toFixed(1)}%</p>
        </div>
        <div class="stat-box">
            <h3>Average Completeness</h3>
            <p>${(report.elementSummary.avgCompleteness * 100).toFixed(1)}%</p>
        </div>
    </div>

    <h2>Quality Distribution</h2>
    <ul>
        ${Object.entries(report.elementSummary.qualityDistribution)
          .map(([grade, count]) => `<li>Grade ${grade}: ${count}</li>`)
          .join('')}
    </ul>

    <h2>Files</h2>
    <table>
        <tr><th>File</th><th>Status</th><th>Size</th></tr>
        ${report.files.slice(0, 20).map(file => `
            <tr>
                <td>${file.filePath}</td>
                <td>${file.scanStatus}</td>
                <td>${file.fileSize}</td>
            </tr>
        `).join('')}
    </table>

</body>
</html>`;

    return html;
  }

  /**
   * Generate recommendations markdown
   */
  private _generateRecommendations(report: AnalysisReport, elements: PromptElements[]): string {
    const trends = this.generateTrendAnalysis(elements);

    let markdown = `# Prompt Analysis Recommendations\n\n`;
    markdown += `Generated: ${new Date().toLocaleString()}\n\n`;

    markdown += `## Key Findings\n\n`;
    markdown += `- Analyzed ${report.scanSummary.totalFiles} files and found ${report.contentSummary.totalPrompts} prompts\n`;
    markdown += `- Average confidence: ${(report.contentSummary.avgConfidence * 100).toFixed(1)}%\n`;
    markdown += `- Average completeness: ${(report.elementSummary.avgCompleteness * 100).toFixed(1)}%\n\n`;

    markdown += `## Most Frequently Missing Elements\n\n`;
    trends.topMissingElements.slice(0, 5).forEach((missing, index) => {
      markdown += `${index + 1}. **${missing.element}** - Missing in ${missing.percentage.toFixed(1)}% of prompts\n`;
    });

    markdown += `\n## High-Quality Patterns\n\n`;
    trends.qualityTrends.highQualityPatterns.forEach((pattern, index) => {
      markdown += `${index + 1}. ${pattern}\n`;
    });

    markdown += `\n## Improvement Areas\n\n`;
    trends.qualityTrends.improvementAreas.forEach((area, index) => {
      markdown += `${index + 1}. ${area}\n`;
    });

    return markdown;
  }
}