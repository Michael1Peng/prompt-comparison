/**
 * T027: CSV Exporter Implementation
 *
 * 🟢 GREEN Phase: Implements CSV export functionality
 * Converts analysis data to CSV format with flexible column selection
 */

import fs from 'fs/promises';
import path from 'path';
import { PromptFile, PromptContent, PromptElements, AnalysisReport } from '../models';

/**
 * CSV export configuration
 */
export interface CSVExportOptions {
  outputPath?: string;              // Output file path
  includeHeaders?: boolean;         // Include column headers
  separator?: string;               // Field separator (default: comma)
  encoding?: string;                // File encoding (default: utf-8)
  includeMetadata?: boolean;        // Include metadata columns
  flattenObjects?: boolean;         // Flatten nested objects
  dateFormat?: 'iso' | 'local' | 'unix'; // Date format
  precision?: number;               // Decimal precision
  excludeColumns?: string[];        // Columns to exclude
}

/**
 * CSV column definition
 */
export interface CSVColumn {
  key: string;                      // Object property key
  header: string;                   // Column header name
  transform?: (value: any) => string; // Value transformation function
}

/**
 * CSV export result
 */
export interface CSVExportResult {
  filePath: string;
  rowCount: number;
  columnCount: number;
  fileSize: number;
  exportTime: number;
}

/**
 * CSVExporter utility for converting analysis data to CSV format
 */
export class CSVExporter {
  private readonly DEFAULT_OPTIONS: Required<CSVExportOptions> = {
    outputPath: '',
    includeHeaders: true,
    separator: ',',
    encoding: 'utf-8',
    includeMetadata: true,
    flattenObjects: false,
    dateFormat: 'iso',
    precision: 3,
    excludeColumns: []
  };

  /**
   * Export prompt files to CSV
   */
  async exportPromptFiles(
    files: PromptFile[],
    options: CSVExportOptions = {}
  ): Promise<CSVExportResult> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const startTime = Date.now();

    const columns: CSVColumn[] = [
      { key: 'filePath', header: 'File Path' },
      { key: 'fileName', header: 'File Name' },
      { key: 'fileExtension', header: 'Extension' },
      { key: 'fileSize', header: 'Size (bytes)' },
      { key: 'lastModified', header: 'Last Modified', transform: (date) => this._formatDate(date, opts.dateFormat) },
      { key: 'scanStatus', header: 'Scan Status' },
      { key: 'scanTimestamp', header: 'Scan Time', transform: (date) => this._formatDate(date, opts.dateFormat) },
      { key: 'errorMessage', header: 'Error Message' }
    ];

    if (!opts.includeMetadata) {
      columns.splice(-2); // Remove scan metadata columns
    }

    const csvContent = this._generateCSVContent(files, columns, opts);
    const filePath = opts.outputPath || `./prompt-files-${Date.now()}.csv`;

    await this._writeCSVFile(filePath, csvContent, opts.encoding);
    const stats = await fs.stat(filePath);

    return {
      filePath,
      rowCount: files.length,
      columnCount: columns.filter(col => !opts.excludeColumns.includes(col.key)).length,
      fileSize: stats.size,
      exportTime: Date.now() - startTime
    };
  }

  /**
   * Export prompt contents to CSV
   */
  async exportPromptContents(
    contents: PromptContent[],
    options: CSVExportOptions = {}
  ): Promise<CSVExportResult> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const startTime = Date.now();

    const columns: CSVColumn[] = [
      { key: 'contentId', header: 'Content ID' },
      { key: 'sourceFile', header: 'Source File' },
      { key: 'isPrompt', header: 'Is Prompt', transform: (val) => val ? 'Yes' : 'No' },
      { key: 'confidence', header: 'Confidence', transform: (val) => this._formatNumber(val, opts.precision) },
      { key: 'language', header: 'Language' },
      { key: 'contentType', header: 'Content Type' },
      { key: 'detectionMethod', header: 'Detection Method' },
      { key: 'originalText', header: 'Original Text', transform: (text) => this._truncateText(text, 200) },
      { key: 'cleanedText', header: 'Cleaned Text', transform: (text) => this._truncateText(text, 200) }
    ];

    if (opts.includeMetadata) {
      columns.push(
        { key: 'startPosition', header: 'Start Position' },
        { key: 'endPosition', header: 'End Position' },
        { key: 'lineRange', header: 'Line Range', transform: (range) => range ? `${range.start}-${range.end}` : '' }
      );
    }

    const csvContent = this._generateCSVContent(contents, columns, opts);
    const filePath = opts.outputPath || `./prompt-contents-${Date.now()}.csv`;

    await this._writeCSVFile(filePath, csvContent, opts.encoding);
    const stats = await fs.stat(filePath);

    return {
      filePath,
      rowCount: contents.length,
      columnCount: columns.filter(col => !opts.excludeColumns.includes(col.key)).length,
      fileSize: stats.size,
      exportTime: Date.now() - startTime
    };
  }

  /**
   * Export prompt elements to CSV
   */
  async exportPromptElements(
    elements: PromptElements[],
    options: CSVExportOptions = {}
  ): Promise<CSVExportResult> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const startTime = Date.now();

    if (opts.flattenObjects) {
      return this._exportFlattenedElements(elements, opts, startTime);
    } else {
      return this._exportStructuredElements(elements, opts, startTime);
    }
  }

  /**
   * Export analysis report summary to CSV
   */
  async exportAnalysisReport(
    report: AnalysisReport,
    options: CSVExportOptions = {}
  ): Promise<CSVExportResult> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const startTime = Date.now();

    // Create summary data
    const summaryData = [
      {
        metric: 'Total Files',
        value: report.scanSummary.totalFiles.toString(),
        category: 'Scan Summary'
      },
      {
        metric: 'Scanned Files',
        value: report.scanSummary.scannedFiles.toString(),
        category: 'Scan Summary'
      },
      {
        metric: 'Prompt Files',
        value: report.scanSummary.promptFiles.toString(),
        category: 'Scan Summary'
      },
      {
        metric: 'Failed Files',
        value: report.scanSummary.failedFiles.toString(),
        category: 'Scan Summary'
      },
      {
        metric: 'Total Prompts',
        value: report.contentSummary.totalPrompts.toString(),
        category: 'Content Summary'
      },
      {
        metric: 'Average Confidence',
        value: this._formatNumber(report.contentSummary.avgConfidence, opts.precision),
        category: 'Content Summary'
      },
      {
        metric: 'Average Completeness',
        value: this._formatNumber(report.elementSummary.avgCompleteness, opts.precision),
        category: 'Element Summary'
      },
      {
        metric: 'Processing Time (ms)',
        value: report.performance.processingTime.toString(),
        category: 'Performance'
      },
      {
        metric: 'API Calls',
        value: report.performance.apiCallsCount.toString(),
        category: 'Performance'
      }
    ];

    // Add language distribution
    Object.entries(report.contentSummary.byLanguage).forEach(([lang, count]) => {
      summaryData.push({
        metric: `Language: ${lang}`,
        value: count.toString(),
        category: 'Language Distribution'
      });
    });

    // Add content type distribution
    Object.entries(report.contentSummary.byType).forEach(([type, count]) => {
      summaryData.push({
        metric: `Content Type: ${type}`,
        value: count.toString(),
        category: 'Content Type Distribution'
      });
    });

    // Add quality distribution
    Object.entries(report.elementSummary.qualityDistribution).forEach(([grade, count]) => {
      summaryData.push({
        metric: `Quality Grade: ${grade}`,
        value: count.toString(),
        category: 'Quality Distribution'
      });
    });

    const columns: CSVColumn[] = [
      { key: 'category', header: 'Category' },
      { key: 'metric', header: 'Metric' },
      { key: 'value', header: 'Value' }
    ];

    const csvContent = this._generateCSVContent(summaryData, columns, opts);
    const filePath = opts.outputPath || `./analysis-report-summary-${Date.now()}.csv`;

    await this._writeCSVFile(filePath, csvContent, opts.encoding);
    const stats = await fs.stat(filePath);

    return {
      filePath,
      rowCount: summaryData.length,
      columnCount: 3,
      fileSize: stats.size,
      exportTime: Date.now() - startTime
    };
  }

  /**
   * Export custom data array to CSV
   */
  async exportCustomData<T>(
    data: T[],
    columns: CSVColumn[],
    options: CSVExportOptions = {}
  ): Promise<CSVExportResult> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const startTime = Date.now();

    const csvContent = this._generateCSVContent(data, columns, opts);
    const filePath = opts.outputPath || `./custom-export-${Date.now()}.csv`;

    await this._writeCSVFile(filePath, csvContent, opts.encoding);
    const stats = await fs.stat(filePath);

    return {
      filePath,
      rowCount: data.length,
      columnCount: columns.filter(col => !opts.excludeColumns.includes(col.key)).length,
      fileSize: stats.size,
      exportTime: Date.now() - startTime
    };
  }

  /**
   * Create comparison CSV between multiple datasets
   */
  async exportComparison(
    datasets: Array<{ name: string; data: any[] }>,
    options: CSVExportOptions = {}
  ): Promise<CSVExportResult> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const startTime = Date.now();

    // Create comparison data
    const comparisonData: any[] = [];

    datasets.forEach(dataset => {
      const summary = {
        dataset: dataset.name,
        count: dataset.data.length,
        // Add more comparison metrics based on data type
        ...this._calculateDatasetMetrics(dataset.data)
      };
      comparisonData.push(summary);
    });

    const columns: CSVColumn[] = [
      { key: 'dataset', header: 'Dataset' },
      { key: 'count', header: 'Count' },
      { key: 'avgConfidence', header: 'Avg Confidence' },
      { key: 'avgCompleteness', header: 'Avg Completeness' }
    ];

    const csvContent = this._generateCSVContent(comparisonData, columns, opts);
    const filePath = opts.outputPath || `./comparison-${Date.now()}.csv`;

    await this._writeCSVFile(filePath, csvContent, opts.encoding);
    const stats = await fs.stat(filePath);

    return {
      filePath,
      rowCount: comparisonData.length,
      columnCount: columns.length,
      fileSize: stats.size,
      exportTime: Date.now() - startTime
    };
  }

  /**
   * Export flattened elements structure
   */
  private async _exportFlattenedElements(
    elements: PromptElements[],
    opts: Required<CSVExportOptions>,
    startTime: number
  ): Promise<CSVExportResult> {
    const flattenedData = elements.map(element => ({
      elementId: element.elementId,
      contentId: element.contentId,
      sourceFile: element.sourceFile,
      completeness: this._formatNumber(element.completeness, opts.precision),
      qualityScore: element.qualityScore,
      analysisModel: element.analysisModel,
      analysisTimestamp: this._formatDate(element.analysisTimestamp, opts.dateFormat),

      // Flatten all 13 elements
      roleAbility_present: element.roleAbility.present ? 'Yes' : 'No',
      roleAbility_confidence: this._formatNumber(element.roleAbility.confidence, opts.precision),
      roleAbility_content: this._truncateText(element.roleAbility.content || '', 100),

      taskRequest_present: element.taskRequest.present ? 'Yes' : 'No',
      taskRequest_confidence: this._formatNumber(element.taskRequest.confidence, opts.precision),
      taskRequest_content: this._truncateText(element.taskRequest.content || '', 100),

      contextSituation_present: element.contextSituation.present ? 'Yes' : 'No',
      contextSituation_confidence: this._formatNumber(element.contextSituation.confidence, opts.precision),
      contextSituation_content: this._truncateText(element.contextSituation.content || '', 100),

      instructionAction_present: element.instructionAction.present ? 'Yes' : 'No',
      instructionAction_confidence: this._formatNumber(element.instructionAction.confidence, opts.precision),
      instructionAction_content: this._truncateText(element.instructionAction.content || '', 100),

      outputSpec_present: element.outputSpec.present ? 'Yes' : 'No',
      outputSpec_confidence: this._formatNumber(element.outputSpec.confidence, opts.precision),
      outputSpec_content: this._truncateText(element.outputSpec.content || '', 100),

      examples_present: element.examples.present ? 'Yes' : 'No',
      examples_confidence: this._formatNumber(element.examples.confidence, opts.precision),
      examples_content: this._truncateText(element.examples.content || '', 100),

      constraints_present: element.constraints.present ? 'Yes' : 'No',
      constraints_confidence: this._formatNumber(element.constraints.confidence, opts.precision),
      constraints_content: this._truncateText(element.constraints.content || '', 100),

      objectives_present: element.objectives.present ? 'Yes' : 'No',
      objectives_confidence: this._formatNumber(element.objectives.confidence, opts.precision),
      objectives_content: this._truncateText(element.objectives.content || '', 100),

      information_present: element.information.present ? 'Yes' : 'No',
      information_confidence: this._formatNumber(element.information.confidence, opts.precision),
      information_content: this._truncateText(element.information.content || '', 100),

      evaluation_present: element.evaluation.present ? 'Yes' : 'No',
      evaluation_confidence: this._formatNumber(element.evaluation.confidence, opts.precision),
      evaluation_content: this._truncateText(element.evaluation.content || '', 100),

      adjustment_present: element.adjustment.present ? 'Yes' : 'No',
      adjustment_confidence: this._formatNumber(element.adjustment.confidence, opts.precision),
      adjustment_content: this._truncateText(element.adjustment.content || '', 100),

      audience_present: element.audience.present ? 'Yes' : 'No',
      audience_confidence: this._formatNumber(element.audience.confidence, opts.precision),
      audience_content: this._truncateText(element.audience.content || '', 100)
    }));

    // Auto-generate columns from the first item
    const columns: CSVColumn[] = Object.keys(flattenedData[0] || {}).map(key => ({
      key,
      header: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }));

    const csvContent = this._generateCSVContent(flattenedData, columns, opts);
    const filePath = opts.outputPath || `./prompt-elements-flattened-${Date.now()}.csv`;

    await this._writeCSVFile(filePath, csvContent, opts.encoding);
    const stats = await fs.stat(filePath);

    return {
      filePath,
      rowCount: elements.length,
      columnCount: columns.filter(col => !opts.excludeColumns.includes(col.key)).length,
      fileSize: stats.size,
      exportTime: Date.now() - startTime
    };
  }

  /**
   * Export structured elements (summary format)
   */
  private async _exportStructuredElements(
    elements: PromptElements[],
    opts: Required<CSVExportOptions>,
    startTime: number
  ): Promise<CSVExportResult> {
    const columns: CSVColumn[] = [
      { key: 'elementId', header: 'Element ID' },
      { key: 'sourceFile', header: 'Source File' },
      { key: 'completeness', header: 'Completeness', transform: (val) => this._formatNumber(val, opts.precision) },
      { key: 'qualityScore', header: 'Quality Score' },
      { key: 'analysisModel', header: 'Analysis Model' },
      { key: 'analysisTimestamp', header: 'Analysis Time', transform: (date) => this._formatDate(date, opts.dateFormat) },
      { key: 'presentElements', header: 'Present Elements', transform: (elements) => this._countPresentElements(elements) },
      { key: 'avgConfidence', header: 'Avg Confidence', transform: (elements) => this._calculateAvgConfidence(elements) }
    ];

    // Transform elements data to include calculated fields
    const transformedData = elements.map(element => ({
      ...element,
      presentElements: element,
      avgConfidence: element
    }));

    const csvContent = this._generateCSVContent(transformedData, columns, opts);
    const filePath = opts.outputPath || `./prompt-elements-${Date.now()}.csv`;

    await this._writeCSVFile(filePath, csvContent, opts.encoding);
    const stats = await fs.stat(filePath);

    return {
      filePath,
      rowCount: elements.length,
      columnCount: columns.filter(col => !opts.excludeColumns.includes(col.key)).length,
      fileSize: stats.size,
      exportTime: Date.now() - startTime
    };
  }

  /**
   * Generate CSV content from data and columns
   */
  private _generateCSVContent<T>(
    data: T[],
    columns: CSVColumn[],
    options: Required<CSVExportOptions>
  ): string {
    const filteredColumns = columns.filter(col => !options.excludeColumns.includes(col.key));
    const rows: string[] = [];

    // Add headers if requested
    if (options.includeHeaders) {
      const headers = filteredColumns.map(col => this._escapeCSVValue(col.header, options.separator));
      rows.push(headers.join(options.separator));
    }

    // Add data rows
    data.forEach(item => {
      const row = filteredColumns.map(col => {
        let value = this._getNestedValue(item, col.key);

        // Apply transformation if provided
        if (col.transform && value !== undefined && value !== null) {
          value = col.transform(value);
        }

        // Convert to string and escape
        return this._escapeCSVValue(String(value || ''), options.separator);
      });

      rows.push(row.join(options.separator));
    });

    return rows.join('\n');
  }

  /**
   * Write CSV content to file
   */
  private async _writeCSVFile(filePath: string, content: string, encoding: string): Promise<void> {
    // Ensure directory exists
    const directory = path.dirname(filePath);
    await fs.mkdir(directory, { recursive: true });

    // Write file
    await fs.writeFile(filePath, content, encoding as BufferEncoding);
  }

  /**
   * Escape CSV value (handle quotes and separators)
   */
  private _escapeCSVValue(value: string, separator: string): string {
    if (value.includes(separator) || value.includes('"') || value.includes('\n') || value.includes('\r')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Get nested value from object by key path
   */
  private _getNestedValue(obj: any, keyPath: string): any {
    return keyPath.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Format date according to specified format
   */
  private _formatDate(date: Date | string, format: 'iso' | 'local' | 'unix'): string {
    if (!date) return '';

    const dateObj = date instanceof Date ? date : new Date(date);

    switch (format) {
      case 'iso':
        return dateObj.toISOString();
      case 'local':
        return dateObj.toLocaleString();
      case 'unix':
        return Math.floor(dateObj.getTime() / 1000).toString();
      default:
        return dateObj.toISOString();
    }
  }

  /**
   * Format number with specified precision
   */
  private _formatNumber(value: number, precision: number): string {
    if (typeof value !== 'number') return '';
    return value.toFixed(precision);
  }

  /**
   * Truncate text to specified length
   */
  private _truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  /**
   * Count present elements in PromptElements
   */
  private _countPresentElements(element: PromptElements): string {
    const elementNames = [
      'roleAbility', 'taskRequest', 'contextSituation', 'instructionAction',
      'outputSpec', 'examples', 'constraints', 'objectives',
      'information', 'evaluation', 'adjustment', 'audience'
    ];

    const presentCount = elementNames.filter(name => element[name]?.present).length;
    return `${presentCount}/${elementNames.length}`;
  }

  /**
   * Calculate average confidence of present elements
   */
  private _calculateAvgConfidence(element: PromptElements): string {
    const elementNames = [
      'roleAbility', 'taskRequest', 'contextSituation', 'instructionAction',
      'outputSpec', 'examples', 'constraints', 'objectives',
      'information', 'evaluation', 'adjustment', 'audience'
    ];

    const presentElements = elementNames.filter(name => element[name]?.present);
    if (presentElements.length === 0) return '0.000';

    const totalConfidence = presentElements.reduce((sum, name) => sum + element[name].confidence, 0);
    return (totalConfidence / presentElements.length).toFixed(3);
  }

  /**
   * Calculate metrics for dataset comparison
   */
  private _calculateDatasetMetrics(data: any[]): any {
    if (data.length === 0) return { avgConfidence: '0.000', avgCompleteness: '0.000' };

    // Try to calculate common metrics
    let totalConfidence = 0;
    let totalCompleteness = 0;
    let confidenceCount = 0;
    let completenessCount = 0;

    data.forEach(item => {
      if (typeof item.confidence === 'number') {
        totalConfidence += item.confidence;
        confidenceCount++;
      }
      if (typeof item.completeness === 'number') {
        totalCompleteness += item.completeness;
        completenessCount++;
      }
    });

    return {
      avgConfidence: confidenceCount > 0 ? (totalConfidence / confidenceCount).toFixed(3) : '0.000',
      avgCompleteness: completenessCount > 0 ? (totalCompleteness / completenessCount).toFixed(3) : '0.000'
    };
  }
}