/**
 * 🔴 RED Phase: File Filtering Rules Contract Tests
 *
 * Tests for file filtering logic including glob patterns, exclusions,
 * and binary file detection.
 */

import { FileFilter } from '@/utils/file-filters';
import { PromptFile } from '@/models';

describe('FileFilter Contract Tests', () => {
  let fileFilter: FileFilter;
  let mockFiles: PromptFile[];

  beforeEach(() => {
    fileFilter = new FileFilter();

    // Mock file data for testing
    mockFiles = [
      createMockFile('src/main.ts', '.ts', 1024),
      createMockFile('docs/readme.md', '.md', 2048),
      createMockFile('node_modules/package/index.js', '.js', 512),
      createMockFile('dist/bundle.js', '.js', 10240),
      createMockFile('.git/config', '', 256),
      createMockFile('tests/test.spec.ts', '.ts', 1536),
      createMockFile('binary-file.png', '.png', 5120),
      createMockFile('large-video.mp4', '.mp4', 50 * 1024 * 1024), // 50MB
    ];
  });

  describe('Include Patterns', () => {
    it('should filter files by single include pattern', () => {
      // Contract: Include pattern filters files correctly
      const pattern = '**/*.ts';

      const result = fileFilter.applyIncludePattern(mockFiles, pattern);

      expect(result).toHaveLength(2); // main.ts and test.spec.ts
      result.forEach(file => {
        expect(file.fileExtension).toBe('.ts');
      });
    });

    it('should support multiple include patterns', () => {
      // Contract: Multiple patterns are OR-ed together
      const patterns = ['**/*.ts', '**/*.md'];

      const result = fileFilter.applyIncludePatterns(mockFiles, patterns);

      expect(result).toHaveLength(3); // 2 TS files + 1 MD file
    });

    it('should handle complex glob patterns', () => {
      // Contract: Advanced glob syntax works correctly
      const pattern = 'src/**/*.{ts,js}';

      const result = fileFilter.applyIncludePattern(mockFiles, pattern);

      const srcFiles = result.filter(f => f.filePath.startsWith('src/'));
      expect(srcFiles).toHaveLength(1); // Only main.ts matches
    });
  });

  describe('Exclude Patterns', () => {
    it('should exclude files by pattern', () => {
      // Contract: Exclude patterns remove matching files
      const excludePattern = '**/node_modules/**';

      const result = fileFilter.applyExcludePattern(mockFiles, excludePattern);

      expect(result).toHaveLength(mockFiles.length - 1);
      expect(result.find(f => f.filePath.includes('node_modules'))).toBeUndefined();
    });

    it('should support multiple exclude patterns', () => {
      // Contract: Multiple exclude patterns are combined
      const excludePatterns = ['**/node_modules/**', '**/dist/**', '.git/**'];

      const result = fileFilter.applyExcludePatterns(mockFiles, excludePatterns);

      // Should exclude node_modules, dist, and .git files
      expect(result).toHaveLength(4); // Remaining files
      expect(result.find(f => f.filePath.includes('node_modules'))).toBeUndefined();
      expect(result.find(f => f.filePath.includes('dist'))).toBeUndefined();
      expect(result.find(f => f.filePath.includes('.git'))).toBeUndefined();
    });

    it('should exclude hidden files by default', () => {
      // Contract: Hidden files (starting with .) are excluded unless specified
      const result = fileFilter.applyDefaultExclusions(mockFiles);

      const hiddenFiles = result.filter(f => f.fileName.startsWith('.'));
      expect(hiddenFiles).toHaveLength(0);
    });
  });

  describe('Binary File Detection', () => {
    it('should detect binary files by extension', () => {
      // Contract: Common binary extensions are identified
      const binaryFile = mockFiles.find(f => f.fileName === 'binary-file.png')!;

      const isBinary = fileFilter.isBinaryFile(binaryFile);

      expect(isBinary).toBe(true);
    });

    it('should detect large media files as binary', () => {
      // Contract: Large media files are treated as binary
      const videoFile = mockFiles.find(f => f.fileName === 'large-video.mp4')!;

      const isBinary = fileFilter.isBinaryFile(videoFile);

      expect(isBinary).toBe(true);
    });

    it('should not flag text files as binary', () => {
      // Contract: Text files are not flagged as binary
      const textFile = mockFiles.find(f => f.fileName === 'readme.md')!;

      const isBinary = fileFilter.isBinaryFile(textFile);

      expect(isBinary).toBe(false);
    });
  });

  describe('Size-based Filtering', () => {
    it('should filter files by maximum size', () => {
      // Contract: Files exceeding max size are excluded
      const maxSize = 10 * 1024; // 10KB

      const result = fileFilter.applyMaxSize(mockFiles, maxSize);

      result.forEach(file => {
        expect(file.fileSize).toBeLessThanOrEqual(maxSize);
      });
    });

    it('should filter out empty files when configured', () => {
      // Contract: Zero-byte files can be excluded
      const filesWithEmpty = [...mockFiles, createMockFile('empty.txt', '.txt', 0)];

      const result = fileFilter.excludeEmptyFiles(filesWithEmpty);

      expect(result.find(f => f.fileSize === 0)).toBeUndefined();
    });
  });

  describe('Combined Filtering', () => {
    it('should apply all filters in correct order', () => {
      // Contract: Filters are applied in: include → exclude → binary → size
      const config = {
        include: ['**/*.{ts,js,md}'],
        exclude: ['**/node_modules/**', '**/dist/**'],
        maxSize: 5 * 1024, // 5KB
        excludeBinary: true,
      };

      const result = fileFilter.applyAllFilters(mockFiles, config);

      // Should only include text files under 5KB, excluding node_modules/dist
      expect(result).toHaveLength(3); // main.ts, readme.md, test.spec.ts
      result.forEach(file => {
        expect(file.fileSize).toBeLessThanOrEqual(config.maxSize);
        expect(file.filePath).not.toMatch(/node_modules|dist/);
        expect(fileFilter.isBinaryFile(file)).toBe(false);
      });
    });

    it('should handle empty result gracefully', () => {
      // Contract: Empty results don't cause errors
      const restrictiveConfig = {
        include: ['**/*.nonexistent'],
      };

      const result = fileFilter.applyAllFilters(mockFiles, restrictiveConfig);

      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should filter 1000 files in under 100ms', () => {
      // Contract: Filtering performance requirement
      const manyFiles = Array(1000)
        .fill(null)
        .map((_, i) => createMockFile(`file${i}.txt`, '.txt', 1024));

      const startTime = Date.now();
      const result = fileFilter.applyAllFilters(manyFiles, {
        include: ['**/*.txt'],
      });
      const duration = Date.now() - startTime;

      expect(result).toHaveLength(1000);
      expect(duration).toBeLessThan(100);
    });
  });

  // Helper function to create mock files
  function createMockFile(path: string, ext: string, size: number): PromptFile {
    return {
      filePath: path,
      fileName: path.split('/').pop()!,
      fileExtension: ext,
      fileSize: size,
      lastModified: new Date(),
      scanStatus: 'pending' as any,
      scanTimestamp: new Date(),
      encoding: 'UTF-8',
    };
  }
});
