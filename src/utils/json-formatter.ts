/**
 * T024: JSON Formatter Implementation
 *
 * 🟢 GREEN Phase: Implements JSON output formatting and validation
 * Handles structured data serialization with schema validation
 */

import { PromptElements, AnalysisReport, ProcessingLog } from '../models';

/**
 * JSON formatting options
 */
export interface JsonFormatOptions {
  indent?: number | string;      // Indentation level or string
  sortKeys?: boolean;           // Sort object keys alphabetically
  includeMetadata?: boolean;    // Include metadata fields
  excludeFields?: string[];     // Fields to exclude from output
  dateFormat?: 'iso' | 'unix' | 'human'; // Date serialization format
  precision?: number;           // Decimal precision for numbers
}

/**
 * Schema validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  schema: string;
}

/**
 * JSONFormatter utility for structured data output
 */
export class JSONFormatter {
  private readonly DEFAULT_OPTIONS: Required<JsonFormatOptions> = {
    indent: 2,
    sortKeys: false,
    includeMetadata: true,
    excludeFields: [],
    dateFormat: 'iso',
    precision: 3
  };

  /**
   * Format PromptElements to JSON
   */
  formatPromptElements(
    elements: PromptElements,
    options: JsonFormatOptions = {}
  ): string {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    const processedElements = this._processElements(elements, mergedOptions);

    return JSON.stringify(processedElements, null, mergedOptions.indent);
  }

  /**
   * Format AnalysisReport to JSON
   */
  formatAnalysisReport(
    report: AnalysisReport,
    options: JsonFormatOptions = {}
  ): string {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    const processedReport = this._processReport(report, mergedOptions);

    return JSON.stringify(processedReport, null, mergedOptions.indent);
  }

  /**
   * Format array of ProcessingLog entries
   */
  formatProcessingLogs(
    logs: ProcessingLog[],
    options: JsonFormatOptions = {}
  ): string {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    const processedLogs = logs.map(log => this._processLog(log, mergedOptions));

    return JSON.stringify(processedLogs, null, mergedOptions.indent);
  }

  /**
   * Validate JSON against schema
   */
  validateSchema(data: any, schemaType: 'elements' | 'report' | 'log'): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      schema: schemaType
    };

    try {
      switch (schemaType) {
        case 'elements':
          this._validateElements(data, result);
          break;
        case 'report':
          this._validateReport(data, result);
          break;
        case 'log':
          this._validateLog(data, result);
          break;
        default:
          result.valid = false;
          result.errors.push('Unknown schema type');
      }
    } catch (error: any) {
      result.valid = false;
      result.errors.push(`Validation failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Convert JSON to other formats
   */
  convertFormat(
    data: any,
    targetFormat: 'csv' | 'xml' | 'yaml',
    options: JsonFormatOptions = {}
  ): string {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };

    switch (targetFormat) {
      case 'csv':
        return this._convertToCSV(data, mergedOptions);
      case 'xml':
        return this._convertToXML(data);
      case 'yaml':
        return this._convertToYAML(data, mergedOptions);
      default:
        throw new Error(`Unsupported format: ${targetFormat}`);
    }
  }

  /**
   * Process PromptElements for serialization
   */
  private _processElements(elements: PromptElements, options: Required<JsonFormatOptions>): any {
    const processed: any = {};

    // Copy all properties
    Object.keys(elements).forEach(key => {
      if (!options.excludeFields.includes(key)) {
        const value = (elements as any)[key];
        processed[key] = this._processValue(value, options);
      }
    });

    // Add metadata if requested
    if (options.includeMetadata && !options.excludeFields.includes('_metadata')) {
      processed._metadata = {
        processedAt: this._formatDate(new Date(), options.dateFormat),
        formatVersion: '1.0',
        totalElements: Object.keys(processed).length
      };
    }

    return options.sortKeys ? this._sortObjectKeys(processed) : processed;
  }

  /**
   * Process AnalysisReport for serialization
   */
  private _processReport(report: AnalysisReport, options: Required<JsonFormatOptions>): any {
    const processed: any = {};

    Object.keys(report).forEach(key => {
      if (!options.excludeFields.includes(key)) {
        const value = (report as any)[key];
        processed[key] = this._processValue(value, options);
      }
    });

    if (options.includeMetadata && !options.excludeFields.includes('_metadata')) {
      processed._metadata = {
        processedAt: this._formatDate(new Date(), options.dateFormat),
        formatVersion: '1.0'
      };
    }

    return options.sortKeys ? this._sortObjectKeys(processed) : processed;
  }

  /**
   * Process ProcessingLog for serialization
   */
  private _processLog(log: ProcessingLog, options: Required<JsonFormatOptions>): any {
    const processed: any = {};

    Object.keys(log).forEach(key => {
      if (!options.excludeFields.includes(key)) {
        const value = (log as any)[key];
        processed[key] = this._processValue(value, options);
      }
    });

    return options.sortKeys ? this._sortObjectKeys(processed) : processed;
  }

  /**
   * Process individual values
   */
  private _processValue(value: any, options: Required<JsonFormatOptions>): any {
    if (value === null || value === undefined) {
      return value;
    }

    if (value instanceof Date) {
      return this._formatDate(value, options.dateFormat);
    }

    if (typeof value === 'number') {
      return Number(value.toFixed(options.precision));
    }

    if (Array.isArray(value)) {
      return value.map(item => this._processValue(item, options));
    }

    if (typeof value === 'object') {
      const processed: any = {};
      Object.keys(value).forEach(key => {
        if (!options.excludeFields.includes(key)) {
          processed[key] = this._processValue(value[key], options);
        }
      });
      return options.sortKeys ? this._sortObjectKeys(processed) : processed;
    }

    return value;
  }

  /**
   * Format date according to options
   */
  private _formatDate(date: Date, format: 'iso' | 'unix' | 'human'): string | number {
    switch (format) {
      case 'iso':
        return date.toISOString();
      case 'unix':
        return Math.floor(date.getTime() / 1000);
      case 'human':
        return date.toLocaleString();
      default:
        return date.toISOString();
    }
  }

  /**
   * Sort object keys alphabetically
   */
  private _sortObjectKeys(obj: any): any {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      return obj;
    }

    const sorted: any = {};
    Object.keys(obj).sort().forEach(key => {
      sorted[key] = obj[key];
    });
    return sorted;
  }

  /**
   * Validate PromptElements structure
   */
  private _validateElements(data: any, result: ValidationResult): void {
    const requiredFields = ['elementId', 'contentId'];

    requiredFields.forEach(field => {
      if (!(field in data)) {
        result.errors.push(`Missing required field: ${field}`);
        result.valid = false;
      }
    });

    // Validate element data structure
    const elementFields = [
      'roleAbility', 'taskRequest', 'contextSituation', 'instructionAction',
      'outputSpec', 'examples', 'constraints', 'objectives',
      'information', 'evaluation', 'adjustment', 'audience'
    ];

    elementFields.forEach(field => {
      if (field in data) {
        const elementData = data[field];
        if (typeof elementData !== 'object' || elementData === null) {
          result.warnings.push(`Element ${field} should be an object`);
        } else {
          if (!('present' in elementData) || !('confidence' in elementData)) {
            result.warnings.push(`Element ${field} missing required properties`);
          }
        }
      }
    });
  }

  /**
   * Validate AnalysisReport structure
   */
  private _validateReport(data: any, result: ValidationResult): void {
    const requiredFields = ['reportId', 'projectPath', 'createdAt'];

    requiredFields.forEach(field => {
      if (!(field in data)) {
        result.errors.push(`Missing required field: ${field}`);
        result.valid = false;
      }
    });

    // Validate summary sections
    const summaryFields = ['scanSummary', 'contentSummary', 'elementSummary', 'performance'];
    summaryFields.forEach(field => {
      if (!(field in data)) {
        result.warnings.push(`Missing summary section: ${field}`);
      }
    });
  }

  /**
   * Validate ProcessingLog structure
   */
  private _validateLog(data: any, result: ValidationResult): void {
    const requiredFields = ['logId', 'timestamp', 'level', 'message'];

    requiredFields.forEach(field => {
      if (!(field in data)) {
        result.errors.push(`Missing required field: ${field}`);
        result.valid = false;
      }
    });
  }

  /**
   * Convert JSON to CSV format
   */
  private _convertToCSV(data: any, options: Required<JsonFormatOptions>): string {
    if (!Array.isArray(data)) {
      data = [data];
    }

    const processedData = data.map((item: any) => this._flattenObject(item));

    // Get all unique keys for headers
    const allKeys = new Set<string>();
    processedData.forEach((item: any) => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach(key => allKeys.add(key));
      }
    });

    const headers = Array.from(allKeys).sort();
    const csvRows = [headers.join(',')];

    processedData.forEach((item: any) => {
      const row = headers.map(header => {
        const value = item[header];
        if (value === undefined || value === null) return '';
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
        return String(value);
      });
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * Convert JSON to XML format (simplified)
   */
  private _convertToXML(data: any, rootElement = 'root'): string {
    const xmlParts = [`<${rootElement}>`];

    const convertValue = (value: any, key: string): string => {
      if (value === null || value === undefined) {
        return `<${key}></${key}>`;
      }
      if (typeof value === 'object') {
        if (Array.isArray(value)) {
          return value.map(item => convertValue(item, key)).join('');
        } else {
          const innerXml = Object.entries(value)
            .map(([k, v]) => convertValue(v, k))
            .join('');
          return `<${key}>${innerXml}</${key}>`;
        }
      } else {
        return `<${key}>${String(value)}</${key}>`;
      }
    };

    if (typeof data === 'object' && !Array.isArray(data)) {
      Object.entries(data).forEach(([key, value]) => {
        xmlParts.push(convertValue(value, key));
      });
    } else if (Array.isArray(data)) {
      data.forEach((item, index) => {
        xmlParts.push(convertValue(item, `item_${index}`));
      });
    } else {
      xmlParts.push(String(data));
    }

    xmlParts.push(`</${rootElement}>`);
    return xmlParts.join('\n');
  }

  /**
   * Convert JSON to YAML format (simplified)
   */
  private _convertToYAML(data: any, options: Required<JsonFormatOptions>, level = 0): string {
    const indent = ' '.repeat(level * 2);

    if (data === null || data === undefined) {
      return 'null';
    }

    if (typeof data === 'string') {
      return `"${data.replace(/"/g, '\\"')}"`;
    }

    if (typeof data === 'number' || typeof data === 'boolean') {
      return String(data);
    }

    if (Array.isArray(data)) {
      if (data.length === 0) return '[]';
      return data.map(item => `${indent}- ${this._convertToYAML(item, options, level + 1)}`).join('\n');
    }

    if (typeof data === 'object') {
      const entries = Object.entries(data);
      if (entries.length === 0) return '{}';

      return entries.map(([key, value]) => {
        const yamlValue = this._convertToYAML(value, options, level + 1);
        return `${indent}${key}: ${yamlValue}`;
      }).join('\n');
    }

    return String(data);
  }

  /**
   * Flatten nested object for CSV conversion
   */
  private _flattenObject(obj: any, prefix = ''): any {
    const flattened: any = {};

    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value === null || value === undefined) {
        flattened[newKey] = value;
      } else if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        Object.assign(flattened, this._flattenObject(value, newKey));
      } else if (Array.isArray(value)) {
        flattened[newKey] = value.join('; ');
      } else {
        flattened[newKey] = value;
      }
    });

    return flattened;
  }

  /**
   * Get nested value by dot notation path
   */
  private _getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Set nested value by path
   */
  private _setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop();
    if (lastKey === undefined) return;

    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }
}