/**
 * T021: Confidence Calculator Implementation
 *
 * 🟢 GREEN Phase: Implements confidence scoring algorithms
 * Calculates reliability scores for prompt detection and element analysis
 */

import { PromptContent, ContentType, Language } from '../models';

/**
 * Confidence calculation options
 */
export interface ConfidenceOptions {
  includeLanguageBonus?: boolean;
  includeContentTypeWeight?: boolean;
  includeContextualClues?: boolean;
  minConfidence?: number;
  maxConfidence?: number;
}

/**
 * Detailed confidence breakdown
 */
export interface ConfidenceBreakdown {
  baseScore: number;
  languageBonus: number;
  contentTypeWeight: number;
  contextualScore: number;
  finalScore: number;
  factors: string[];
}

/**
 * ConfidenceCalculator utility for computing reliability scores
 */
export class ConfidenceCalculator {
  private readonly DEFAULT_OPTIONS: Required<ConfidenceOptions> = {
    includeLanguageBonus: true,
    includeContentTypeWeight: true,
    includeContextualClues: true,
    minConfidence: 0.0,
    maxConfidence: 1.0
  };

  // Content type confidence weights
  private readonly CONTENT_TYPE_WEIGHTS: Record<ContentType, number> = {
    [ContentType.SYSTEM_PROMPT]: 1.0,
    [ContentType.USER_PROMPT]: 0.95,
    [ContentType.ASSISTANT_PROMPT]: 0.9,
    [ContentType.CONVERSATION]: 0.85,
    [ContentType.CONFIGURATION]: 0.6,
    [ContentType.CODE_COMMENT]: 0.3,
    [ContentType.DOCUMENTATION]: 0.4
  };

  // Language detection confidence bonuses
  private readonly LANGUAGE_BONUSES: Record<Language, number> = {
    [Language.ENGLISH]: 0.1,
    [Language.CHINESE]: 0.1,
    [Language.MIXED]: 0.05,
    [Language.OTHER]: 0.0
  };

  /**
   * Calculate confidence score for prompt content
   */
  calculatePromptConfidence(
    content: PromptContent,
    options: ConfidenceOptions = {}
  ): number {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const breakdown = this.calculateDetailedConfidence(content, opts);
    return this._clampConfidence(breakdown.finalScore, opts);
  }

  /**
   * Calculate detailed confidence breakdown
   */
  calculateDetailedConfidence(
    content: PromptContent,
    options: ConfidenceOptions = {}
  ): ConfidenceBreakdown {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const factors: string[] = [];

    // Start with the base confidence from detection
    let baseScore = content.confidence;
    factors.push(`Base detection: ${(baseScore * 100).toFixed(1)}%`);

    // Language bonus
    let languageBonus = 0;
    if (opts.includeLanguageBonus) {
      languageBonus = this.LANGUAGE_BONUSES[content.language];
      if (languageBonus > 0) {
        factors.push(`Language (${content.language}): +${(languageBonus * 100).toFixed(1)}%`);
      }
    }

    // Content type weight
    let contentTypeWeight = 0;
    if (opts.includeContentTypeWeight) {
      const typeMultiplier = this.CONTENT_TYPE_WEIGHTS[content.contentType];
      contentTypeWeight = (typeMultiplier - 1) * baseScore;
      if (contentTypeWeight !== 0) {
        factors.push(`Content type (${content.contentType}): ${contentTypeWeight > 0 ? '+' : ''}${(contentTypeWeight * 100).toFixed(1)}%`);
      }
    }

    // Contextual clues analysis
    let contextualScore = 0;
    if (opts.includeContextualClues) {
      contextualScore = this._analyzeContextualClues(content);
      if (contextualScore !== 0) {
        factors.push(`Contextual clues: ${contextualScore > 0 ? '+' : ''}${(contextualScore * 100).toFixed(1)}%`);
      }
    }

    // Calculate final score
    const finalScore = baseScore + languageBonus + contentTypeWeight + contextualScore;

    return {
      baseScore,
      languageBonus,
      contentTypeWeight,
      contextualScore,
      finalScore,
      factors
    };
  }

  /**
   * Calculate confidence for element analysis
   */
  calculateElementConfidence(
    extractedElements: Record<string, any>,
    _originalText: string
  ): number {
    let totalElements = 0;
    let presentElements = 0;
    let confidenceSum = 0;

    // Standard 13 elements
    const elementKeys = [
      'roleAbility', 'taskRequest', 'contextSituation', 'instructionAction',
      'outputSpec', 'examples', 'constraints', 'objectives',
      'information', 'evaluation', 'adjustment', 'audience'
    ];

    elementKeys.forEach(key => {
      totalElements++;
      if (extractedElements[key]?.present) {
        presentElements++;
        confidenceSum += extractedElements[key].confidence || 0.5;
      }
    });

    // Calculate completeness ratio
    const completeness = presentElements / totalElements;

    // Calculate average element confidence
    const avgElementConfidence = presentElements > 0 ? confidenceSum / presentElements : 0;

    // Combine completeness and element confidence
    const finalConfidence = (completeness * 0.6) + (avgElementConfidence * 0.4);

    return Math.max(0, Math.min(1, finalConfidence));
  }

  /**
   * Adjust confidence based on content length and quality indicators
   */
  adjustForContentQuality(
    baseConfidence: number,
    content: PromptContent
  ): number {
    let adjustment = 0;
    const textLength = content.cleanedText.length;

    // Length-based adjustments
    if (textLength < 10) {
      adjustment -= 0.3; // Very short content is suspicious
    } else if (textLength < 50) {
      adjustment -= 0.1; // Short content is somewhat suspicious
    } else if (textLength > 1000 && textLength < 5000) {
      adjustment += 0.1; // Well-developed prompts
    } else if (textLength > 10000) {
      adjustment -= 0.05; // Very long might be documentation
    }

    // Quality indicators
    const qualityIndicators = this._getQualityIndicators(content.cleanedText);
    adjustment += qualityIndicators * 0.15;

    return this._clampConfidence(baseConfidence + adjustment);
  }

  /**
   * Compare confidence scores and return reliability assessment
   */
  compareConfidenceScores(scores: number[]): {
    average: number;
    variance: number;
    reliability: 'high' | 'medium' | 'low';
    outliers: number[];
  } {
    if (scores.length === 0) {
      return { average: 0, variance: 0, reliability: 'low', outliers: [] };
    }

    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / scores.length;

    // Detect outliers (scores more than 2 standard deviations away)
    const stdDev = Math.sqrt(variance);
    const outliers = scores.filter(score => Math.abs(score - average) > 2 * stdDev);

    // Determine reliability
    let reliability: 'high' | 'medium' | 'low';
    if (variance < 0.01 && average > 0.8) {
      reliability = 'high';
    } else if (variance < 0.05 && average > 0.6) {
      reliability = 'medium';
    } else {
      reliability = 'low';
    }

    return { average, variance, reliability, outliers };
  }

  /**
   * Analyze contextual clues in the content
   */
  private _analyzeContextualClues(content: PromptContent): number {
    const text = content.cleanedText.toLowerCase();
    let score = 0;

    // Strong prompt indicators
    const strongIndicators = [
      'you are an ai', 'system prompt', 'follow these instructions',
      'respond with', 'your task is', 'you must', 'always', 'never',
      '你是一个', '系统提示', '请遵循', '你的任务是'
    ];

    strongIndicators.forEach(indicator => {
      if (text.includes(indicator)) {
        score += 0.15;
      }
    });

    // Medium indicators
    const mediumIndicators = [
      'please', 'help me', 'explain', 'analyze', 'describe',
      'what is', 'how to', 'can you', 'could you'
    ];

    mediumIndicators.forEach(indicator => {
      if (text.includes(indicator)) {
        score += 0.05;
      }
    });

    // Negative indicators (reduce confidence)
    const negativeIndicators = [
      'function ', 'class ', 'import ', 'const ', 'let ',
      'def ', 'print(', 'console.log', '#!/bin/', '<html'
    ];

    negativeIndicators.forEach(indicator => {
      if (text.includes(indicator)) {
        score -= 0.1;
      }
    });

    // Structure indicators
    if (content.lineRange && content.lineRange.end - content.lineRange.start > 5) {
      score += 0.05; // Multi-line content often indicates prompts
    }

    if (text.includes('```')) {
      score += 0.1; // Code blocks in prompts are common
    }

    return Math.max(-0.3, Math.min(0.3, score));
  }

  /**
   * Get quality indicators from text
   */
  private _getQualityIndicators(text: string): number {
    let score = 0;

    // Grammar and structure indicators
    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(/\s+/).length;
    const avgWordsPerSentence = words / Math.max(sentences, 1);

    // Optimal sentence length indicates quality
    if (avgWordsPerSentence >= 8 && avgWordsPerSentence <= 25) {
      score += 0.3;
    }

    // Punctuation usage
    const punctuationCount = (text.match(/[.!?,:;]/g) || []).length;
    const punctuationRatio = punctuationCount / Math.max(words, 1);
    if (punctuationRatio > 0.05 && punctuationRatio < 0.2) {
      score += 0.2;
    }

    // Capitalization (proper sentences start with capital letters)
    const sentences_array = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const properlyCapitalized = sentences_array.filter(s => /^[A-Z\u4e00-\u9fff]/.test(s.trim())).length;
    const capitalizationRatio = properlyCapitalized / Math.max(sentences_array.length, 1);
    if (capitalizationRatio > 0.7) {
      score += 0.3;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Clamp confidence score to valid range
   */
  private _clampConfidence(score: number, options?: { minConfidence?: number; maxConfidence?: number }): number {
    const min = options?.minConfidence ?? 0.0;
    const max = options?.maxConfidence ?? 1.0;
    return Math.max(min, Math.min(max, score));
  }
}