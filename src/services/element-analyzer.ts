/**
 * T023: Element Analyzer Service Implementation
 *
 * 🟢 GREEN Phase: Implements 13-elements extraction and analysis
 * Analyzes prompts to identify structural elements using AI
 */

import { PromptContent, PromptElements, ElementData, QualityScore, AnalysisOptions } from '../models';
import { v4 as uuidv4 } from 'uuid';
import { apiRetry } from '../utils/api-retry';

/**
 * Configuration for ElementAnalyzer
 */
export interface ElementAnalyzerConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

/**
 * Element analysis result with validation
 */
export interface ElementAnalysisResult {
  elements: PromptElements;
  confidence: number;
  analysisTime: number;
  tokensUsed: number;
}

/**
 * ElementAnalyzer service for extracting 13 framework elements from prompts
 */
export class ElementAnalyzer {
  private readonly config: Required<ElementAnalyzerConfig>;

  constructor(config: ElementAnalyzerConfig) {
    this.config = {
      apiKey: config.apiKey,
      model: config.model ?? 'gpt-4-turbo',
      temperature: config.temperature ?? 0.1,
      maxTokens: config.maxTokens ?? 2000,
      timeout: config.timeout ?? 45000
    };
  }

  /**
   * Analyze prompt content to extract 13 framework elements
   */
  async analyzePromptElements(
    content: PromptContent,
    _options: AnalysisOptions = {}
  ): Promise<ElementAnalysisResult> {
    const startTime = Date.now();

    try {
      // Create the analysis prompt
      const analysisPrompt = this._createElementAnalysisPrompt(content);

      // Execute API call with retry logic
      const result = await apiRetry.executeOpenAIRequest(async () => {
        return this._makeAnalysisRequest(analysisPrompt);
      });

      if (!result.success || !result.result) {
        throw new Error(`Element analysis failed: ${result.error?.message ?? 'Unknown error'}`);
      }

      const apiResponse = result.result;
      const analysisData = this._parseAnalysisResponse(apiResponse);

      // Create PromptElements object
      const elements: PromptElements = {
        elementId: uuidv4(),
        contentId: content.contentId,
        sourceFile: content.sourceFile,

        // Map the 13 elements
        roleAbility: this._createElementData(analysisData.roleAbility, content.originalText),
        taskRequest: this._createElementData(analysisData.taskRequest, content.originalText),
        contextSituation: this._createElementData(analysisData.contextSituation, content.originalText),
        instructionAction: this._createElementData(analysisData.instructionAction, content.originalText),
        outputSpec: this._createElementData(analysisData.outputSpec, content.originalText),
        examples: this._createElementData(analysisData.examples, content.originalText),
        constraints: this._createElementData(analysisData.constraints, content.originalText),
        objectives: this._createElementData(analysisData.objectives, content.originalText),
        information: this._createElementData(analysisData.information, content.originalText),
        evaluation: this._createElementData(analysisData.evaluation, content.originalText),
        adjustment: this._createElementData(analysisData.adjustment, content.originalText),
        audience: this._createElementData(analysisData.audience, content.originalText),

        // Meta information
        analysisTimestamp: new Date(),
        analysisModel: this.config.model,
        completeness: this._calculateCompleteness(analysisData),
        qualityScore: this._calculateQualityScore(analysisData)
      };

      const analysisTime = Date.now() - startTime;
      const confidence = this._calculateOverallConfidence(elements);

      return {
        elements,
        confidence,
        analysisTime,
        tokensUsed: apiResponse.tokensUsed ?? 0
      };
    } catch (error) {
      // Fallback to heuristic analysis if API fails
      return this._fallbackHeuristicAnalysis(content, startTime);
    }
  }

  /**
   * Batch analyze multiple prompt contents
   */
  async batchAnalyzeElements(
    contents: PromptContent[],
    options: AnalysisOptions & { concurrency?: number } = {}
  ): Promise<ElementAnalysisResult[]> {
    const concurrency = options.concurrency || 3;
    const results: ElementAnalysisResult[] = [];

    // Process in batches to avoid overwhelming the API
    for (let i = 0; i < contents.length; i += concurrency) {
      const batch = contents.slice(i, i + concurrency);
      const batchPromises = batch.map(content => this.analyzePromptElements(content, options));

      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        // Handle batch failures gracefully
        const failedResults = batch.map(content => this._createFailedAnalysis(content));
        results.push(...failedResults);
      }

      // Small delay between batches
      if (i + concurrency < contents.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return results;
  }

  /**
   * Create the analysis prompt for element extraction
   */
  private _createElementAnalysisPrompt(content: PromptContent): string {
    return `You are an expert prompt engineer. Analyze the following prompt content and identify the 13 framework elements. For each element, determine if it's present and extract the relevant text.

The 13 elements are:
1. 角色能力 (Role/Ability): Defines the AI's identity, role, or professional capabilities
2. 任务请求 (Task/Request): The specific task or request to be completed
3. 背景情境 (Context/Situation): Background information or usage context
4. 指令行动 (Instruction/Action): Specific steps, methods, or guidelines
5. 输出规格 (Output Spec): Requirements for output format, structure, or style
6. 示例 (Examples): Provided examples, samples, or demonstrations
7. 限制约束 (Constraints): Prohibitions, restrictions, or constraint rules
8. 目标期望 (Objectives): Expected outcomes or goals
9. 信息 (Information): Background information, data, or knowledge provided
10. 评估优化 (Evaluation): Standards for evaluation or optimization directions
11. 调整 (Adjustment): Customizable or configurable content
12. 受众 (Audience): Target users, readers, or user objects

Prompt to analyze:
"""
${content.cleanedText}
"""

Please respond in this exact JSON format:
{
  "roleAbility": {
    "present": boolean,
    "content": "extracted content or null",
    "confidence": 0.0-1.0,
    "extractedText": "original text excerpt or null"
  },
  "taskRequest": { ... },
  "contextSituation": { ... },
  "instructionAction": { ... },
  "outputSpec": { ... },
  "examples": { ... },
  "constraints": { ... },
  "objectives": { ... },
  "information": { ... },
  "evaluation": { ... },
  "adjustment": { ... },
  "audience": { ... }
}`;
  }

  /**
   * Make API request for element analysis
   */
  private async _makeAnalysisRequest(prompt: string): Promise<{
    response: any;
    tokensUsed: number;
  }> {
    const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are a precise prompt analysis expert. Always respond with valid JSON in the exact format requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      }),
      signal: AbortSignal.timeout(this.config.timeout)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as any;
    const content = data.choices[0].message.content;
    const tokensUsed = data.usage?.total_tokens || 0;

    return {
      response: JSON.parse(content),
      tokensUsed
    };
  }

  /**
   * Parse and validate API response
   */
  private _parseAnalysisResponse(apiResponse: { response: any; tokensUsed: number }): any {
    const data = apiResponse.response;

    // Validate structure
    const requiredElements = [
      'roleAbility', 'taskRequest', 'contextSituation', 'instructionAction',
      'outputSpec', 'examples', 'constraints', 'objectives',
      'information', 'evaluation', 'adjustment', 'audience'
    ];

    for (const element of requiredElements) {
      if (!data[element]) {
        data[element] = {
          present: false,
          content: null,
          confidence: 0.0,
          extractedText: null
        };
      }
    }

    return data;
  }

  /**
   * Create ElementData from parsed response
   */
  private _createElementData(elementData: any, originalText: string): ElementData {
    if (!elementData || typeof elementData !== 'object') {
      return {
        present: false,
        confidence: 0.0
      };
    }

    let position: { start: number; length: number } | undefined;

    // Try to find position in original text if extracted text is provided
    if (elementData.extractedText && originalText) {
      const index = originalText.indexOf(elementData.extractedText);
      if (index !== -1) {
        position = {
          start: index,
          length: elementData.extractedText.length
        };
      }
    }

    const result: any = {
      present: Boolean(elementData.present),
      content: elementData.content || undefined,
      confidence: Math.max(0, Math.min(1, elementData.confidence || 0)),
      extractedText: elementData.extractedText || undefined
    };

    if (position) {
      result.position = position;
    }

    return result;
  }

  /**
   * Calculate completeness score (0-1)
   */
  private _calculateCompleteness(analysisData: any): number {
    const elements = [
      'roleAbility', 'taskRequest', 'contextSituation', 'instructionAction',
      'outputSpec', 'examples', 'constraints', 'objectives',
      'information', 'evaluation', 'adjustment', 'audience'
    ];

    const presentCount = elements.filter(element =>
      analysisData[element]?.present === true
    ).length;

    return presentCount / elements.length;
  }

  /**
   * Calculate quality score based on completeness and confidence
   */
  private _calculateQualityScore(analysisData: any): QualityScore {
    const completeness = this._calculateCompleteness(analysisData);

    if (completeness >= 0.9) return QualityScore.A;
    if (completeness >= 0.7) return QualityScore.B;
    if (completeness >= 0.5) return QualityScore.C;
    if (completeness >= 0.3) return QualityScore.D;
    return QualityScore.F;
  }

  /**
   * Calculate overall confidence from individual element confidences
   */
  private _calculateOverallConfidence(elements: PromptElements): number {
    const elementData = [
      elements.roleAbility, elements.taskRequest, elements.contextSituation,
      elements.instructionAction, elements.outputSpec, elements.examples,
      elements.constraints, elements.objectives, elements.information,
      elements.evaluation, elements.adjustment, elements.audience
    ];

    const presentElements = elementData.filter(el => el.present);

    if (presentElements.length === 0) return 0.0;

    const totalConfidence = presentElements.reduce((sum, el) => sum + el.confidence, 0);
    const avgConfidence = totalConfidence / presentElements.length;

    // Weight by completeness
    const completenessWeight = presentElements.length / elementData.length;

    return avgConfidence * (0.7 + completenessWeight * 0.3);
  }

  /**
   * Fallback heuristic analysis when API fails
   */
  private _fallbackHeuristicAnalysis(
    content: PromptContent,
    startTime: number
  ): ElementAnalysisResult {
    const elements: PromptElements = {
      elementId: uuidv4(),
      contentId: content.contentId,
      sourceFile: content.sourceFile,

      // Basic heuristic detection
      roleAbility: this._heuristicElementDetection(content.cleanedText, ['you are', '你是', 'act as', 'role']),
      taskRequest: this._heuristicElementDetection(content.cleanedText, ['please', 'task', '请', 'help me']),
      contextSituation: this._heuristicElementDetection(content.cleanedText, ['context', 'background', 'situation']),
      instructionAction: this._heuristicElementDetection(content.cleanedText, ['follow', 'steps', 'instructions']),
      outputSpec: this._heuristicElementDetection(content.cleanedText, ['format', 'output', 'respond']),
      examples: this._heuristicElementDetection(content.cleanedText, ['example', 'for instance', '例如']),
      constraints: this._heuristicElementDetection(content.cleanedText, ['don\'t', 'never', 'avoid', '不要']),
      objectives: this._heuristicElementDetection(content.cleanedText, ['goal', 'objective', 'aim']),
      information: this._heuristicElementDetection(content.cleanedText, ['information', 'data', 'details']),
      evaluation: this._heuristicElementDetection(content.cleanedText, ['evaluate', 'assess', 'quality']),
      adjustment: this._heuristicElementDetection(content.cleanedText, ['adjust', 'modify', 'customize']),
      audience: this._heuristicElementDetection(content.cleanedText, ['user', 'audience', 'reader']),

      analysisTimestamp: new Date(),
      analysisModel: 'heuristic-fallback',
      completeness: 0.3,
      qualityScore: QualityScore.D
    };

    return {
      elements,
      confidence: 0.4, // Lower confidence for heuristic analysis
      analysisTime: Date.now() - startTime,
      tokensUsed: 0
    };
  }

  /**
   * Simple heuristic element detection
   */
  private _heuristicElementDetection(text: string, keywords: string[]): ElementData {
    const lowerText = text.toLowerCase();
    const hasKeywords = keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));

    return {
      present: hasKeywords,
      confidence: hasKeywords ? 0.6 : 0.1
    };
  }

  /**
   * Create a failed analysis result
   */
  private _createFailedAnalysis(content: PromptContent): ElementAnalysisResult {
    const elements: PromptElements = {
      elementId: uuidv4(),
      contentId: content.contentId,
      sourceFile: content.sourceFile,

      // Empty elements for failed analysis
      roleAbility: { present: false, confidence: 0.0 },
      taskRequest: { present: false, confidence: 0.0 },
      contextSituation: { present: false, confidence: 0.0 },
      instructionAction: { present: false, confidence: 0.0 },
      outputSpec: { present: false, confidence: 0.0 },
      examples: { present: false, confidence: 0.0 },
      constraints: { present: false, confidence: 0.0 },
      objectives: { present: false, confidence: 0.0 },
      information: { present: false, confidence: 0.0 },
      evaluation: { present: false, confidence: 0.0 },
      adjustment: { present: false, confidence: 0.0 },
      audience: { present: false, confidence: 0.0 },

      analysisTimestamp: new Date(),
      analysisModel: 'failed-analysis',
      completeness: 0.0,
      qualityScore: QualityScore.F
    };

    return {
      elements,
      confidence: 0.0,
      analysisTime: 0,
      tokensUsed: 0
    };
  }
}