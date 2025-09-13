/**
 * 🔴 RED Phase: File Scanner API Contract Tests
 *
 * These tests MUST FAIL initially to prove TDD compliance.
 * Tests define the expected API contract for the file-scanner service.
 */

import { FileScanner } from '@/services/file-scanner';
import { ScanStatus } from '@/models';

describe('FileScanner Contract Tests', () => {
  let fileScanner: FileScanner;

  beforeEach(() => {
    fileScanner = new FileScanner();
  });

  describe('Directory Traversal API', () => {
    it('should scan directory and return file list with metadata', async () => {
      // Contract: scanDirectory(path) returns Promise<PromptFile[]>
      const testDir = './tests/fixtures/sample-project';

      const result = await fileScanner.scanDirectory(testDir);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Each file should have required metadata
      result.forEach(file => {
        expect(file).toHaveProperty('filePath');
        expect(file).toHaveProperty('fileName');
        expect(file).toHaveProperty('fileExtension');
        expect(file).toHaveProperty('fileSize');
        expect(file).toHaveProperty('lastModified');
        expect(file).toHaveProperty('scanStatus', ScanStatus.PENDING);
        expect(file).toHaveProperty('scanTimestamp');

        // Validate types
        expect(typeof file.filePath).toBe('string');
        expect(typeof file.fileName).toBe('string');
        expect(typeof file.fileSize).toBe('number');
        expect(file.fileSize).toBeGreaterThanOrEqual(0);
        expect(file.lastModified).toBeInstanceOf(Date);
      });
    });

    it('should handle non-existent directory gracefully', async () => {
      // Contract: Non-existent path should reject with specific error
      const nonExistentDir = './non-existent-directory';

      await expect(fileScanner.scanDirectory(nonExistentDir)).rejects.toThrow(
        'Directory not found'
      );
    });

    it('should handle permission errors', async () => {
      // Contract: Permission denied should reject with specific error
      // This test assumes a restricted directory exists on the system
      const restrictedDir = '/root'; // Unix-like systems

      await expect(fileScanner.scanDirectory(restrictedDir)).rejects.toThrow(
        /Permission denied|EACCES/
      );
    });
  });

  describe('Recursive Scanning', () => {
    it('should scan recursively by default', async () => {
      // Contract: Default behavior includes subdirectories
      const testDir = './tests/fixtures/nested-project';

      const result = await fileScanner.scanDirectory(testDir);

      // Should find files in subdirectories
      const nestedFiles = result.filter(
        file => file.filePath.includes('/') && file.filePath !== testDir
      );
      expect(nestedFiles.length).toBeGreaterThan(0);
    });

    it('should support shallow scanning when configured', async () => {
      // Contract: Shallow scan only returns direct children
      const testDir = './tests/fixtures/nested-project';
      const options = { recursive: false };

      const result = await fileScanner.scanDirectory(testDir, options);

      // Should not find files in subdirectories
      const nestedFiles = result.filter(file => file.filePath.split('/').length > 2);
      expect(nestedFiles.length).toBe(0);
    });
  });

  describe('Performance Requirements', () => {
    it('should scan 100 files in under 1 second', async () => {
      // Contract: Performance requirement for medium projects
      const testDir = './tests/fixtures/large-project';

      const startTime = Date.now();
      const result = await fileScanner.scanDirectory(testDir);
      const duration = Date.now() - startTime;

      expect(result.length).toBeGreaterThanOrEqual(100);
      expect(duration).toBeLessThan(1000); // 1 second
    });

    it('should handle concurrent scanning', async () => {
      // Contract: Thread safety for concurrent operations
      const testDir = './tests/fixtures/sample-project';

      const promises = Array(5)
        .fill(null)
        .map(() => fileScanner.scanDirectory(testDir));

      const results = await Promise.all(promises);

      // All results should be identical
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toEqual(results[0]);
      });
    });
  });

  describe('File Metadata Accuracy', () => {
    it('should provide accurate file size', async () => {
      // Contract: File size must match actual file system
      const testDir = './tests/fixtures/sample-files';

      const result = await fileScanner.scanDirectory(testDir);
      const specificFile = result.find(f => f.fileName === 'test.txt');

      expect(specificFile).toBeDefined();
      expect(specificFile!.fileSize).toBeGreaterThan(0);

      // Could verify against fs.stat if needed
    });

    it('should detect file extensions correctly', async () => {
      // Contract: File extension extraction must be accurate
      const testDir = './tests/fixtures/sample-files';

      const result = await fileScanner.scanDirectory(testDir);

      const mdFile = result.find(f => f.fileName.endsWith('.md'));
      expect(mdFile?.fileExtension).toBe('.md');

      const jsFile = result.find(f => f.fileName.endsWith('.js'));
      expect(jsFile?.fileExtension).toBe('.js');

      const noExtFile = result.find(f => !f.fileName.includes('.'));
      expect(noExtFile?.fileExtension).toBe('');
    });
  });

  describe('Error Handling', () => {
    it('should provide detailed error context', async () => {
      // Contract: Errors should include helpful context
      const invalidPath = '/invalid/path/with/unicode/测试';

      try {
        await fileScanner.scanDirectory(invalidPath);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toBeDefined();
        expect(error.code).toBeDefined();
        expect(error.path).toBe(invalidPath);
      }
    });

    it('should handle symbolic links safely', async () => {
      // Contract: Circular symlinks should not cause infinite loops
      const testDir = './tests/fixtures/symlink-project';

      // Should complete without hanging or crashing
      const result = await fileScanner.scanDirectory(testDir);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
