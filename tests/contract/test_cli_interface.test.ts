/**
 * 🔴 RED Phase: CLI Interface Contract Tests
 *
 * Tests for command-line interface, argument parsing, and user interaction.
 */

import { PromptAnalyzerCLI } from '@/cli/main';

describe('PromptAnalyzerCLI Contract Tests', () => {
  let cli: PromptAnalyzerCLI;

  beforeEach(() => {
    cli = new PromptAnalyzerCLI();
  });

  describe('Main Command Interface', () => {
    it('should parse basic directory argument', async () => {
      // Contract: CLI must accept directory as primary argument
      const args = ['node', 'prompt-analyzer', './test-project'];

      const result = await cli.parseAndExecute(args);

      expect(result.command).toBe('analyze');
      expect(result.options.directory).toBe('./test-project');
    });

    it('should handle version flag', async () => {
      // Contract: --version should display version and exit
      const args = ['node', 'prompt-analyzer', '--version'];

      const result = await cli.parseAndExecute(args);

      expect(result.command).toBe('version');
      expect(result.output).toMatch(/\d+\.\d+\.\d+/); // Version pattern
    });

    it('should handle help flag', async () => {
      // Contract: --help should display usage information
      const args = ['node', 'prompt-analyzer', '--help'];

      const result = await cli.parseAndExecute(args);

      expect(result.command).toBe('help');
      expect(result.output).toContain('Usage:');
      expect(result.output).toContain('Options:');
    });

    it('should validate required directory argument', async () => {
      // Contract: Missing directory should show error
      const args = ['node', 'prompt-analyzer'];

      await expect(cli.parseAndExecute(args)).rejects.toThrow(/directory.*required/i);
    });
  });

  describe('Command Line Options', () => {
    it('should parse concurrency option', async () => {
      // Contract: --concurrency should control parallel processing
      const args = ['node', 'prompt-analyzer', './test', '--concurrency', '20'];

      const result = await cli.parseAndExecute(args);

      expect(result.options.concurrency).toBe(20);
    });

    it('should parse API key option', async () => {
      // Contract: --api-key should override environment variable
      const args = ['node', 'prompt-analyzer', './test', '--api-key', 'test-key'];

      const result = await cli.parseAndExecute(args);

      expect(result.options.apiKey).toBe('test-key');
    });

    it('should parse include/exclude patterns', async () => {
      // Contract: Pattern filtering should support multiple patterns
      const args = [
        'node',
        'prompt-analyzer',
        './test',
        '--include',
        '**/*.md',
        '--include',
        '**/*.txt',
        '--exclude',
        '**/node_modules/**',
      ];

      const result = await cli.parseAndExecute(args);

      expect(result.options.include).toContain('**/*.md');
      expect(result.options.include).toContain('**/*.txt');
      expect(result.options.exclude).toContain('**/node_modules/**');
    });

    it('should parse output format options', async () => {
      // Contract: Output format should be configurable
      const args = ['node', 'prompt-analyzer', './test', '--format', 'csv'];

      const result = await cli.parseAndExecute(args);

      expect(result.options.format).toBe('csv');
    });
  });

  describe('Subcommands', () => {
    it('should handle scan subcommand', async () => {
      // Contract: scan subcommand for file discovery only
      const args = ['node', 'prompt-analyzer', 'scan', './test', '--dry-run'];

      const result = await cli.parseAndExecute(args);

      expect(result.command).toBe('scan');
      expect(result.options.dryRun).toBe(true);
    });

    it('should handle detect subcommand', async () => {
      // Contract: detect subcommand for prompt identification
      const args = ['node', 'prompt-analyzer', 'detect', './test.md', '--threshold', '0.8'];

      const result = await cli.parseAndExecute(args);

      expect(result.command).toBe('detect');
      expect(result.options.threshold).toBe(0.8);
    });

    it('should handle analyze subcommand', async () => {
      // Contract: analyze subcommand for element extraction
      const args = ['node', 'prompt-analyzer', 'analyze', '--quality-filter', 'B'];

      const result = await cli.parseAndExecute(args);

      expect(result.command).toBe('analyze');
      expect(result.options.qualityFilter).toBe('B');
    });

    it('should handle report subcommand', async () => {
      // Contract: report subcommand for visualization
      const args = ['node', 'prompt-analyzer', 'report', 'data.json', '--charts'];

      const result = await cli.parseAndExecute(args);

      expect(result.command).toBe('report');
      expect(result.options.charts).toBe(true);
    });
  });

  describe('Configuration File Support', () => {
    it('should load configuration from file', async () => {
      // Contract: --config should load settings from file
      const args = ['node', 'prompt-analyzer', './test', '--config', './test-config.json'];

      const result = await cli.parseAndExecute(args);

      expect(result.configFile).toBe('./test-config.json');
      // Config values should override defaults
    });

    it('should merge CLI args with config file', async () => {
      // Contract: CLI arguments should override config file values
      const args = [
        'node',
        'prompt-analyzer',
        './test',
        '--config',
        './test-config.json',
        '--concurrency',
        '15', // Should override config value
      ];

      const result = await cli.parseAndExecute(args);

      expect(result.options.concurrency).toBe(15); // CLI value wins
    });
  });

  describe('Progress and Output', () => {
    it('should show progress in verbose mode', async () => {
      // Contract: --verbose should enable detailed progress
      const args = ['node', 'prompt-analyzer', './test', '--verbose'];

      const result = await cli.parseAndExecute(args);

      expect(result.options.verbose).toBe(true);
      expect(result.progressEnabled).toBe(true);
    });

    it('should suppress output in quiet mode', async () => {
      // Contract: --quiet should minimize output
      const args = ['node', 'prompt-analyzer', './test', '--quiet'];

      const result = await cli.parseAndExecute(args);

      expect(result.options.quiet).toBe(true);
      expect(result.progressEnabled).toBe(false);
    });

    it('should support no-color option', async () => {
      // Contract: --no-color for CI/CD environments
      const args = ['node', 'prompt-analyzer', './test', '--no-color'];

      const result = await cli.parseAndExecute(args);

      expect(result.options.color).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should validate option values', async () => {
      // Contract: Invalid option values should show helpful errors
      const invalidArgs = [
        ['node', 'prompt-analyzer', './test', '--concurrency', 'invalid'],
        ['node', 'prompt-analyzer', './test', '--format', 'unsupported'],
        ['node', 'prompt-analyzer', './test', '--min-confidence', '1.5'],
      ];

      for (const args of invalidArgs) {
        await expect(cli.parseAndExecute(args)).rejects.toThrow();
      }
    });

    it('should handle missing required options gracefully', async () => {
      // Contract: Missing API key should provide helpful guidance
      process.env.OPENAI_API_KEY = ''; // Clear env var

      const args = ['node', 'prompt-analyzer', './test'];

      await expect(cli.parseAndExecute(args)).rejects.toThrow(/api.*key.*required/i);
    });

    it('should validate file paths exist', async () => {
      // Contract: Non-existent paths should be rejected early
      const args = ['node', 'prompt-analyzer', './non-existent-directory'];

      await expect(cli.parseAndExecute(args)).rejects.toThrow(
        /directory.*not.*found|does.*not.*exist/i
      );
    });
  });

  describe('Exit Codes', () => {
    it('should return appropriate exit codes', async () => {
      // Contract: Process exit codes should indicate success/failure
      const successArgs = ['node', 'prompt-analyzer', './test'];
      const failureArgs = ['node', 'prompt-analyzer', './invalid'];

      const successResult = await cli.parseAndExecute(successArgs);
      expect(successResult.exitCode).toBe(0);

      try {
        await cli.parseAndExecute(failureArgs);
      } catch (error: any) {
        expect(error.exitCode).toBeGreaterThan(0);
      }
    });
  });

  describe('Integration with Core Services', () => {
    it('should initialize services with CLI options', async () => {
      // Contract: CLI options should configure underlying services
      const args = [
        'node',
        'prompt-analyzer',
        './test',
        '--api-key',
        'test-key',
        '--model',
        'gpt-5',
        '--timeout',
        '60',
      ];

      const result = await cli.parseAndExecute(args);

      expect(result.services.promptDetector.config.apiKey).toBe('test-key');
      expect(result.services.promptDetector.config.model).toBe('gpt-5');
      expect(result.services.promptDetector.config.timeout).toBe(60000);
    });
  });
});
