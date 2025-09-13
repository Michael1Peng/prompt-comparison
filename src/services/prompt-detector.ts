/**
 * T020: Prompt Detector Service Implementation
 *
 * 🟢 GREEN Phase: Implements GPT-5 API integration for prompt detection
 * Handles content analysis, confidence scoring, and language detection
 */

import fs from 'fs/promises';
import { PromptFile, PromptContent, Language, ContentType } from '../models';
import { v4 as uuidv4 } from 'uuid';

/**
 * Configuration options for PromptDetector
 */
export interface PromptDetectorConfig {
  apiKey: string;
  model?: string;
  timeout?: number;
  baseURL?: string;
}

/**
 * PromptDetector service for identifying prompt content using GPT-5 API
 */
export class PromptDetector {
  private readonly config: Required<PromptDetectorConfig>;

  constructor(config: PromptDetectorConfig) {
    // Validate API key format
    if (!config.apiKey || config.apiKey.length < 20) {
      throw new Error('Invalid API key format: must be at least 20 characters');
    }

    this.config = {
      apiKey: config.apiKey,
      model: config.model ?? 'gpt-4-turbo',
      timeout: config.timeout ?? 30000,
      baseURL: config.baseURL ?? 'https://api.openai.com/v1'
    };
  }

  /**
   * Test connection to the API
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this._makeApiRequest('POST', '/chat/completions', {
        model: this.config.model,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1
      });

      return response.ok;
    } catch (error: any) {
      if (error instanceof Error && (error.message.includes('authentication') ||
          error.message.includes('unauthorized') ||
          error.message.includes('invalid') && error.message.includes('key'))) {
        throw error;
      }
      return false;
    }
  }

  /**
   * Analyze a file to determine if it contains prompt content
   */
  async analyzeFile(file: PromptFile): Promise<PromptContent> {
    try {
      // Read file content
      const originalText = await fs.readFile(file.filePath, { encoding: file.encoding as BufferEncoding || 'utf-8' });

      // Clean the text (remove markdown formatting, etc.)
      const cleanedText = this._cleanText(originalText);

      // Determine if this is a prompt using GPT-5
      const analysisResult = await this._analyzeWithGPT5(originalText, cleanedText, file.fileName);

      // Create PromptContent result
      const content: PromptContent = {
        contentId: uuidv4(),
        sourceFile: file.filePath,
        originalText,
        cleanedText,
        language: this._detectLanguage(cleanedText),
        contentType: analysisResult.contentType,
        isPrompt: analysisResult.isPrompt,
        confidence: analysisResult.confidence,
        detectionMethod: 'gpt-5-analysis',
        ...(analysisResult.startPosition !== undefined && { startPosition: analysisResult.startPosition }),
        ...(analysisResult.endPosition !== undefined && { endPosition: analysisResult.endPosition }),
        ...(analysisResult.lineRange !== undefined && { lineRange: analysisResult.lineRange })
      };

      return content;
    } catch (error) {
      // Return default result with low confidence for failed analysis
      return {
        contentId: uuidv4(),
        sourceFile: file.filePath,
        originalText: '',
        cleanedText: '',
        language: Language.OTHER,
        contentType: ContentType.DOCUMENTATION,
        isPrompt: false,
        confidence: 0.0,
        detectionMethod: 'error-fallback'
      };
    }
  }

  /**
   * Analyze content with GPT-5 to determine if it's a prompt
   */
  private async _analyzeWithGPT5(originalText: string, cleanedText: string, fileName: string): Promise<{
    isPrompt: boolean;
    confidence: number;
    contentType: ContentType;
    startPosition?: number;
    endPosition?: number;
    lineRange?: { start: number; end: number };
  }> {
    const analysisPrompt = `You are an expert at identifying AI prompts and prompt-related content. Analyze the following text content from a file named "${fileName}" and determine:

1. Is this content an AI prompt or prompt-related content? (true/false)
2. What type of content is this? (system, user, assistant, conversation, code_comment, documentation, configuration)
3. What is your confidence level? (0.0 to 1.0)

Content to analyze:
"""
${cleanedText.slice(0, 2000)} ${cleanedText.length > 2000 ? '...' : ''}
"""

Please respond in this exact JSON format:
{
  "isPrompt": boolean,
  "contentType": "system|user|assistant|conversation|code_comment|documentation|configuration",
  "confidence": number,
  "reasoning": "brief explanation"
}`;

    try {
      const response = await this._makeApiRequest('POST', '/chat/completions', {
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are a precise AI content analyzer. Always respond with valid JSON in the exact format requested.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        max_tokens: 200,
        temperature: 0.1
      });

      const result = await response.json() as any;
      const content = result.choices[0].message.content;

      // Parse the JSON response
      const analysis = JSON.parse(content);

      // Find prompt position in original text (simplified)
      let startPosition: number | undefined;
      let endPosition: number | undefined;
      let lineRange: { start: number; end: number } | undefined;

      if (analysis.isPrompt) {
        startPosition = 0;
        endPosition = originalText.length;
        const lines = originalText.split('\n');
        lineRange = { start: 1, end: lines.length };
      }

      return {
        isPrompt: analysis.isPrompt,
        confidence: Math.max(0, Math.min(1, analysis.confidence)),
        contentType: this._mapContentType(analysis.contentType),
        ...(startPosition !== undefined && { startPosition }),
        ...(endPosition !== undefined && { endPosition }),
        ...(lineRange !== undefined && { lineRange })
      };
    } catch (error) {
      // Fallback: Use heuristic analysis if API fails
      return this._heuristicAnalysis(cleanedText, fileName);
    }
  }

  /**
   * Fallback heuristic analysis when API is unavailable
   */
  private _heuristicAnalysis(text: string, fileName: string): {
    isPrompt: boolean;
    confidence: number;
    contentType: ContentType;
  } {
    const lowercaseText = text.toLowerCase();
    let promptScore = 0;
    let contentType = ContentType.DOCUMENTATION;

    // Prompt indicators
    const promptKeywords = [
      'you are', 'act as', 'please', 'analyze', 'explain', 'help me',
      'system prompt', 'ai assistant', 'respond with', 'follow these instructions',
      '请', '你是', '分析', '解释', '帮助', 'assistant:', 'user:', 'human:'
    ];

    // System prompt indicators
    const systemKeywords = [
      'you are an ai', 'you are claude', 'you are gpt', 'system prompt',
      'ai assistant created', 'helpful, harmless', 'you are a helpful'
    ];

    // User prompt indicators
    const userKeywords = [
      'please explain', 'can you', 'how do i', 'what is', 'help me with',
      'i need', 'could you', 'would you'
    ];

    // Conversation indicators
    const conversationKeywords = [
      'user:', 'assistant:', 'human:', 'ai:', 'bot:', 'claude:', 'gpt:'
    ];

    // Count matches
    promptKeywords.forEach(keyword => {
      if (lowercaseText.includes(keyword)) {
        promptScore += 0.2;
      }
    });

    // Determine content type
    if (systemKeywords.some(keyword => lowercaseText.includes(keyword))) {
      contentType = ContentType.SYSTEM_PROMPT;
      promptScore += 0.3;
    } else if (userKeywords.some(keyword => lowercaseText.includes(keyword))) {
      contentType = ContentType.USER_PROMPT;
      promptScore += 0.2;
    } else if (conversationKeywords.some(keyword => lowercaseText.includes(keyword))) {
      contentType = ContentType.CONVERSATION;
      promptScore += 0.25;
    } else if (fileName.includes('config') || fileName.includes('yaml') || fileName.includes('json')) {
      contentType = ContentType.CONFIGURATION;
    } else if (text.includes('```') || text.includes('function') || text.includes('class ')) {
      contentType = ContentType.CODE_COMMENT;
    }

    // Adjust score based on content characteristics
    if (text.length < 50) {
      promptScore *= 0.5; // Very short content is less likely to be a prompt
    }

    if (text.includes('TODO') || text.includes('FIXME') || text.includes('//')) {
      promptScore *= 0.3; // Code comments
    }

    const isPrompt = promptScore > 0.5;
    const confidence = Math.min(Math.max(promptScore, 0.1), 0.95);

    return {
      isPrompt,
      confidence,
      contentType
    };
  }

  /**
   * Clean text by removing markdown and formatting
   */
  private _cleanText(text: string): string {
    return text
      // Remove markdown headers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove markdown bold/italic
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      // Remove strikethrough
      .replace(/~~(.*?)~~/g, '$1')
      // Remove blockquotes
      .replace(/^>\s+/gm, '')
      // Remove list markers (preserve content)
      .replace(/^[-*+]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      // Clean up multiple whitespaces
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Detect primary language of content
   */
  private _detectLanguage(text: string): Language {
    // Simple heuristic language detection
    const chineseCharCount = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishWordCount = (text.match(/[a-zA-Z]+/g) || []).length;
    const totalChars = text.length;

    if (totalChars === 0) return Language.OTHER;

    const chineseRatio = chineseCharCount / totalChars;
    const englishRatio = englishWordCount / totalChars;

    if (chineseRatio > 0.3 && englishRatio > 0.1) {
      return Language.MIXED;
    } else if (chineseRatio > 0.1) {
      return Language.CHINESE;
    } else if (englishRatio > 0.3) {
      return Language.ENGLISH;
    } else {
      return Language.OTHER;
    }
  }

  /**
   * Map API response content type to our enum
   */
  private _mapContentType(type: string): ContentType {
    switch (type?.toLowerCase()) {
      case 'system': return ContentType.SYSTEM_PROMPT;
      case 'user': return ContentType.USER_PROMPT;
      case 'assistant': return ContentType.ASSISTANT_PROMPT;
      case 'conversation': return ContentType.CONVERSATION;
      case 'code_comment': return ContentType.CODE_COMMENT;
      case 'configuration': return ContentType.CONFIGURATION;
      default: return ContentType.DOCUMENTATION;
    }
  }

  /**
   * Make authenticated API request
   */
  private async _makeApiRequest(method: string, endpoint: string, body?: any): Promise<Response> {
    const url = `${this.config.baseURL}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      ...(body && { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(this.config.timeout)
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed: Invalid API key');
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded');
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response;
  }
}