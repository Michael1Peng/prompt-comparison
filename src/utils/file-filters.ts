/**
 * T018: File Filtering Logic Implementation
 *
 * 🟢 GREEN Phase: Implements file filtering functionality to pass contract tests
 * Handles glob patterns, exclusions, binary detection, and size-based filtering
 */

import { PromptFile } from '../models';

/**
 * Configuration interface for filtering options
 */
export interface FilterConfig {
  include?: string[];
  exclude?: string[];
  maxSize?: number;
  excludeBinary?: boolean;
  excludeEmpty?: boolean;
}

/**
 * FileFilter utility class for applying various filtering rules to file lists
 */
export class FileFilter {
  // Common binary file extensions
  private readonly BINARY_EXTENSIONS = new Set([
    // Images
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.ico', '.svg', '.webp',
    // Videos
    '.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v',
    // Audio
    '.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.wma',
    // Archives
    '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz',
    // Executables
    '.exe', '.dll', '.so', '.dylib', '.bin', '.app',
    // Documents (binary formats)
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    // Others
    '.db', '.sqlite', '.img', '.iso'
  ]);

  // Default exclusion patterns
  private readonly DEFAULT_EXCLUDE_PATTERNS = [
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    '**/build/**',
    '**/.DS_Store',
    '**/Thumbs.db'
  ];

  /**
   * Apply a single include pattern to filter files
   */
  applyIncludePattern(files: PromptFile[], pattern: string): PromptFile[] {
    return files.filter(file => this._matchesPattern(file.filePath, pattern));
  }

  /**
   * Apply multiple include patterns (OR logic)
   */
  applyIncludePatterns(files: PromptFile[], patterns: string[]): PromptFile[] {
    if (patterns.length === 0) return files;

    return files.filter(file =>
      patterns.some(pattern => this._matchesPattern(file.filePath, pattern))
    );
  }

  /**
   * Apply a single exclude pattern to filter out files
   */
  applyExcludePattern(files: PromptFile[], pattern: string): PromptFile[] {
    return files.filter(file => !this._matchesPattern(file.filePath, pattern));
  }

  /**
   * Apply multiple exclude patterns (OR logic)
   */
  applyExcludePatterns(files: PromptFile[], patterns: string[]): PromptFile[] {
    if (patterns.length === 0) return files;

    return files.filter(file =>
      !patterns.some(pattern => this._matchesPattern(file.filePath, pattern))
    );
  }

  /**
   * Apply default exclusions (node_modules, .git, etc.)
   */
  applyDefaultExclusions(files: PromptFile[]): PromptFile[] {
    return this.applyExcludePatterns(files, this.DEFAULT_EXCLUDE_PATTERNS);
  }

  /**
   * Check if a file is binary based on extension and other heuristics
   */
  isBinaryFile(file: PromptFile): boolean {
    const extension = file.fileExtension.toLowerCase();

    // Check against known binary extensions
    if (this.BINARY_EXTENSIONS.has(extension)) {
      return true;
    }

    // Check for very large files (likely binary)
    if (file.fileSize > 10 * 1024 * 1024) { // > 10MB
      return true;
    }

    // Files without extensions that are large might be binary
    if (!extension && file.fileSize > 1024 * 1024) { // > 1MB
      return true;
    }

    return false;
  }

  /**
   * Filter files by maximum size
   */
  applyMaxSize(files: PromptFile[], maxSize: number): PromptFile[] {
    return files.filter(file => file.fileSize <= maxSize);
  }

  /**
   * Exclude empty files (0 bytes)
   */
  excludeEmptyFiles(files: PromptFile[]): PromptFile[] {
    return files.filter(file => file.fileSize > 0);
  }

  /**
   * Apply all filters in the correct order: include → exclude → binary → size
   */
  applyAllFilters(files: PromptFile[], config: FilterConfig): PromptFile[] {
    let filteredFiles = files;

    // Step 1: Apply include patterns (if specified)
    if (config.include && config.include.length > 0) {
      filteredFiles = this.applyIncludePatterns(filteredFiles, config.include);
    }

    // Step 2: Apply exclude patterns
    const excludePatterns = [...this.DEFAULT_EXCLUDE_PATTERNS];
    if (config.exclude && config.exclude.length > 0) {
      excludePatterns.push(...config.exclude);
    }
    filteredFiles = this.applyExcludePatterns(filteredFiles, excludePatterns);

    // Step 3: Exclude binary files (if configured)
    if (config.excludeBinary) {
      filteredFiles = filteredFiles.filter(file => !this.isBinaryFile(file));
    }

    // Step 4: Apply size limit (if specified)
    if (config.maxSize !== undefined) {
      filteredFiles = this.applyMaxSize(filteredFiles, config.maxSize);
    }

    // Step 5: Exclude empty files (if configured)
    if (config.excludeEmpty) {
      filteredFiles = this.excludeEmptyFiles(filteredFiles);
    }

    return filteredFiles;
  }

  /**
   * Match file path against glob pattern
   * Supports basic glob syntax: *, **, ?, {a,b}
   */
  private _matchesPattern(filePath: string, pattern: string): boolean {
    // Handle curly braces first: {ts,js} -> (ts|js)
    let regexPattern = pattern.replace(/\{([^}]+)\}/g, (match, content) => {
      const alternatives = content.split(',');
      return `(${alternatives.join('|')})`;
    });

    // Convert other glob patterns to regex
    regexPattern = regexPattern
      .replace(/\./g, '\\.')           // Escape dots
      .replace(/\*\*/g, '__DOUBLESTAR__') // Temporarily replace **
      .replace(/\*/g, '[^/]*')         // * matches anything except /
      .replace(/__DOUBLESTAR__/g, '.*') // ** matches anything including /
      .replace(/\?/g, '[^/]');         // ? matches single character except /

    // Ensure we match the entire path
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  }
}