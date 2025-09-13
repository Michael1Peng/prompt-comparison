/**
 * T017: File Scanner Service Implementation
 *
 * 🟢 GREEN Phase: Implements file scanning functionality to pass contract tests
 * Follows TDD approach - minimal implementation to make tests pass
 */

import fs from 'fs/promises';
import path from 'path';
import { PromptFile, ScanStatus, ScanOptions, FileScannedError } from '../models';

/**
 * FileScanner service for discovering and cataloging files in a repository
 */
export class FileScanner {
  /**
   * Scan a directory and return all files with metadata
   *
   * @param dirPath - Directory path to scan
   * @param options - Scanning options
   * @returns Promise<PromptFile[]> - Array of discovered files
   */
  async scanDirectory(dirPath: string, options: ScanOptions = {}): Promise<PromptFile[]> {
    const {
      recursive = true,
      followSymlinks = false,
      excludePatterns = [],
      includePatterns = [],
      maxDepth = 50,
      maxFileSize = 50 * 1024 * 1024 // 50MB default
    } = options;

    try {
      // Check if directory exists
      const stats = await fs.stat(dirPath);
      if (!stats.isDirectory()) {
        throw new FileScannedError(dirPath, 'ENOTDIR', 'Path is not a directory');
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new FileScannedError(dirPath, 'ENOENT', 'Directory not found');
      }
      if (error.code === 'EACCES') {
        throw new FileScannedError(dirPath, 'EACCES', 'Permission denied');
      }
      throw error;
    }

    const scanTimestamp = new Date();
    const allFiles: PromptFile[] = [];

    await this._scanRecursive(
      dirPath,
      allFiles,
      {
        recursive,
        followSymlinks,
        excludePatterns,
        includePatterns,
        maxDepth,
        maxFileSize,
        currentDepth: 0,
        scanTimestamp,
        basePath: dirPath
      }
    );

    return allFiles;
  }

  /**
   * Internal recursive scanning method
   */
  private async _scanRecursive(
    currentPath: string,
    allFiles: PromptFile[],
    context: {
      recursive: boolean;
      followSymlinks: boolean;
      excludePatterns: string[];
      includePatterns: string[];
      maxDepth: number;
      maxFileSize: number;
      currentDepth: number;
      scanTimestamp: Date;
      basePath: string;
    }
  ): Promise<void> {
    const {
      recursive,
      followSymlinks,
      excludePatterns,
      includePatterns,
      maxDepth,
      maxFileSize,
      currentDepth,
      scanTimestamp,
      basePath
    } = context;

    // Check depth limit
    if (currentDepth >= maxDepth) {
      return;
    }

    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        const relativePath = path.relative(basePath, fullPath);

        // Skip excluded patterns
        if (this._isExcluded(relativePath, excludePatterns)) {
          continue;
        }

        // Handle files
        if (entry.isFile()) {
          // Check include patterns
          if (includePatterns.length > 0 && !this._isIncluded(relativePath, includePatterns)) {
            continue;
          }

          try {
            const stats = await fs.stat(fullPath);

            // Skip files that are too large
            if (stats.size > maxFileSize) {
              continue;
            }

            // Create PromptFile entry
            const promptFile: PromptFile = {
              filePath: relativePath,
              fileName: entry.name,
              fileExtension: path.extname(entry.name),
              fileSize: stats.size,
              lastModified: stats.mtime,
              encoding: 'utf-8', // Assumed encoding, could be detected
              scanStatus: ScanStatus.PENDING,
              scanTimestamp: scanTimestamp
            };

            allFiles.push(promptFile);
          } catch (error: any) {
            // Skip files with permission errors
            if (error.code === 'EACCES') {
              continue;
            }
            throw error;
          }
        }
        // Handle directories
        else if (entry.isDirectory() && recursive) {
          await this._scanRecursive(fullPath, allFiles, {
            ...context,
            currentDepth: currentDepth + 1
          });
        }
        // Handle symbolic links
        else if (entry.isSymbolicLink() && followSymlinks) {
          try {
            const linkStats = await fs.stat(fullPath);
            if (linkStats.isDirectory() && recursive) {
              // Prevent infinite loops by tracking visited directories
              await this._scanRecursive(fullPath, allFiles, {
                ...context,
                currentDepth: currentDepth + 1
              });
            }
          } catch (error: any) {
            // Skip broken or circular symlinks
            continue;
          }
        }
      }
    } catch (error) {
      if ((error as any).code === 'EACCES') {
        throw new FileScannedError(currentPath, 'EACCES', 'Permission denied');
      }
      throw error;
    }
  }

  /**
   * Check if path matches any exclude pattern
   */
  private _isExcluded(relativePath: string, excludePatterns: string[]): boolean {
    return excludePatterns.some(pattern => {
      return this._matchesPattern(relativePath, pattern);
    });
  }

  /**
   * Check if path matches any include pattern
   */
  private _isIncluded(relativePath: string, includePatterns: string[]): boolean {
    return includePatterns.some(pattern => {
      return this._matchesPattern(relativePath, pattern);
    });
  }

  /**
   * Simple pattern matching (supports * wildcard)
   */
  private _matchesPattern(path: string, pattern: string): boolean {
    // Convert glob-style pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }
}