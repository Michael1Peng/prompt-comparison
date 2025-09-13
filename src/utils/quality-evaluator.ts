/**
 * T025: Quality Evaluator Implementation
 *
 * 🟢 GREEN Phase: Implements quality assessment algorithms
 * Evaluates prompt quality, completeness, and structural integrity
 */

import { PromptElements, PromptContent, QualityScore, ElementData } from '../models';

/**
 * Quality evaluation criteria
 */
export interface QualityEvaluationCriteria {
  elementCompleteness?: number;     // Weight for element completeness (0-1)
  confidenceThreshold?: number;     // Minimum confidence for quality elements
  structuralIntegrity?: number;     // Weight for structural consistency
  contentClarity?: number;          // Weight for content clarity
  purposeAlignment?: number;        // Weight for purpose alignment
}

/**
 * Detailed quality assessment result
 */
export interface QualityAssessment {
  overallScore: QualityScore;
  numericScore: number;             // 0-100 numeric score
  completeness: number;             // Element completeness ratio (0-1)
  avgConfidence: number;            // Average confidence of present elements
  strengths: string[];              // Identified strengths
  weaknesses: string[];             // Areas for improvement
  recommendations: string[];        // Specific recommendations
  elementScores: Record<string, number>; // Individual element scores
  breakdown: {
    elementCompleteness: number;
    confidenceLevel: number;
    structuralIntegrity: number;
    contentClarity: number;
    purposeAlignment: number;
  };
}

/**
 * Quality comparison result
 */
export interface QualityComparison {
  betterPrompt: 'first' | 'second' | 'tie';
  scoreDifference: number;
  comparisonDetails: {
    completeness: { first: number; second: number; winner: string };
    confidence: { first: number; second: number; winner: string };
    clarity: { first: number; second: number; winner: string };
  };
  recommendations: string[];
}

/**
 * QualityEvaluator utility for assessing prompt quality
 */
export class QualityEvaluator {
  private readonly DEFAULT_CRITERIA: Required<QualityEvaluationCriteria> = {
    elementCompleteness: 0.4,     // 40% weight
    confidenceThreshold: 0.6,
    structuralIntegrity: 0.2,     // 20% weight
    contentClarity: 0.2,          // 20% weight
    purposeAlignment: 0.2         // 20% weight
  };

  // Element importance weights (some elements are more critical than others)
  private readonly ELEMENT_WEIGHTS: Record<string, number> = {
    roleAbility: 1.2,      // High importance
    taskRequest: 1.3,      // Highest importance
    instructionAction: 1.1,  // High importance
    outputSpec: 1.0,       // Standard importance
    contextSituation: 0.9,  // Medium-high importance
    objectives: 1.0,       // Standard importance
    constraints: 0.8,      // Medium importance
    examples: 0.7,         // Medium-low importance
    information: 0.6,      // Lower importance
    audience: 0.6,         // Lower importance
    evaluation: 0.5,       // Low importance
    adjustment: 0.4,       // Low importance
  };

  /**
   * Evaluate overall quality of prompt elements
   */
  evaluateQuality(
    elements: PromptElements,
    content?: PromptContent,
    criteria: QualityEvaluationCriteria = {}
  ): QualityAssessment {
    const crit = { ...this.DEFAULT_CRITERIA, ...criteria };

    // Extract element data
    const elementData = this._extractElementData(elements);

    // Calculate individual components
    const completeness = this._calculateElementCompleteness(elementData);
    const avgConfidence = this._calculateAverageConfidence(elementData);
    const structuralIntegrity = this._assessStructuralIntegrity(elements, elementData);
    const contentClarity = content ? this._assessContentClarity(content) : 0.7; // Default if not provided
    const purposeAlignment = this._assessPurposeAlignment(elements, content);

    // Calculate weighted final score
    const numericScore = Math.round(
      (completeness * crit.elementCompleteness +
       (avgConfidence / crit.confidenceThreshold) * crit.elementCompleteness +
       structuralIntegrity * crit.structuralIntegrity +
       contentClarity * crit.contentClarity +
       purposeAlignment * crit.purposeAlignment) * 100
    );

    // Determine letter grade
    const overallScore = this._calculateQualityScore(numericScore);

    // Generate insights
    const strengths = this._identifyStrengths(elements, elementData, numericScore);
    const weaknesses = this._identifyWeaknesses(elements, elementData, numericScore);
    const recommendations = this._generateRecommendations(elements, elementData, weaknesses);

    // Calculate individual element scores
    const elementScores = this._calculateElementScores(elementData);

    return {
      overallScore,
      numericScore: Math.max(0, Math.min(100, numericScore)),
      completeness,
      avgConfidence,
      strengths,
      weaknesses,
      recommendations,
      elementScores,
      breakdown: {
        elementCompleteness: completeness * 100,
        confidenceLevel: avgConfidence * 100,
        structuralIntegrity: structuralIntegrity * 100,
        contentClarity: contentClarity * 100,
        purposeAlignment: purposeAlignment * 100
      }
    };
  }

  /**
   * Compare quality between two prompt elements
   */
  compareQuality(
    first: PromptElements,
    second: PromptElements,
    firstContent?: PromptContent,
    secondContent?: PromptContent
  ): QualityComparison {
    const firstAssessment = this.evaluateQuality(first, firstContent);
    const secondAssessment = this.evaluateQuality(second, secondContent);

    const scoreDifference = firstAssessment.numericScore - secondAssessment.numericScore;

    let betterPrompt: 'first' | 'second' | 'tie';
    if (Math.abs(scoreDifference) < 5) {
      betterPrompt = 'tie';
    } else {
      betterPrompt = scoreDifference > 0 ? 'first' : 'second';
    }

    const comparisonDetails = {
      completeness: {
        first: firstAssessment.completeness,
        second: secondAssessment.completeness,
        winner: firstAssessment.completeness > secondAssessment.completeness ? 'first' :
                firstAssessment.completeness < secondAssessment.completeness ? 'second' : 'tie'
      },
      confidence: {
        first: firstAssessment.avgConfidence,
        second: secondAssessment.avgConfidence,
        winner: firstAssessment.avgConfidence > secondAssessment.avgConfidence ? 'first' :
                firstAssessment.avgConfidence < secondAssessment.avgConfidence ? 'second' : 'tie'
      },
      clarity: {
        first: firstAssessment.breakdown.contentClarity,
        second: secondAssessment.breakdown.contentClarity,
        winner: firstAssessment.breakdown.contentClarity > secondAssessment.breakdown.contentClarity ? 'first' :
                firstAssessment.breakdown.contentClarity < secondAssessment.breakdown.contentClarity ? 'second' : 'tie'
      }
    };

    const recommendations = this._generateComparisonRecommendations(
      betterPrompt,
      firstAssessment,
      secondAssessment
    );

    return {
      betterPrompt,
      scoreDifference,
      comparisonDetails,
      recommendations
    };
  }

  /**
   * Evaluate batch quality and provide statistics
   */
  evaluateBatchQuality(
    elementsArray: PromptElements[],
    contentsArray?: PromptContent[]
  ): {
    assessments: QualityAssessment[];
    statistics: {
      averageScore: number;
      medianScore: number;
      distribution: Record<QualityScore, number>;
      topPerformers: { index: number; score: number }[];
      improvementNeeded: { index: number; score: number; issues: string[] }[];
    };
  } {
    const assessments = elementsArray.map((elements, index) =>
      this.evaluateQuality(elements, contentsArray?.[index])
    );

    const scores = assessments.map(a => a.numericScore);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    const sortedScores = [...scores].sort((a, b) => a - b);
    const medianScore = sortedScores.length % 2 === 0
      ? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2
      : sortedScores[Math.floor(sortedScores.length / 2)];

    // Distribution by letter grade
    const distribution: Record<QualityScore, number> = {
      [QualityScore.A]: 0,
      [QualityScore.B]: 0,
      [QualityScore.C]: 0,
      [QualityScore.D]: 0,
      [QualityScore.F]: 0
    };

    assessments.forEach(assessment => {
      distribution[assessment.overallScore]++;
    });

    // Top performers (score >= 85)
    const topPerformers = assessments
      .map((assessment, index) => ({ index, score: assessment.numericScore }))
      .filter(item => item.score >= 85)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // Need improvement (score < 60)
    const improvementNeeded = assessments
      .map((assessment, index) => ({
        index,
        score: assessment.numericScore,
        issues: assessment.weaknesses
      }))
      .filter(item => item.score < 60)
      .sort((a, b) => a.score - b.score);

    return {
      assessments,
      statistics: {
        averageScore,
        medianScore,
        distribution,
        topPerformers,
        improvementNeeded
      }
    };
  }

  /**
   * Extract element data from PromptElements
   */
  private _extractElementData(elements: PromptElements): Record<string, ElementData> {
    return {
      roleAbility: elements.roleAbility,
      taskRequest: elements.taskRequest,
      contextSituation: elements.contextSituation,
      instructionAction: elements.instructionAction,
      outputSpec: elements.outputSpec,
      examples: elements.examples,
      constraints: elements.constraints,
      objectives: elements.objectives,
      information: elements.information,
      evaluation: elements.evaluation,
      adjustment: elements.adjustment,
      audience: elements.audience
    };
  }

  /**
   * Calculate element completeness with weights
   */
  private _calculateElementCompleteness(elementData: Record<string, ElementData>): number {
    let totalWeight = 0;
    let weightedPresent = 0;

    for (const [elementName, data] of Object.entries(elementData)) {
      const weight = this.ELEMENT_WEIGHTS[elementName] || 1.0;
      totalWeight += weight;

      if (data.present && data.confidence >= 0.5) {
        weightedPresent += weight * data.confidence;
      }
    }

    return totalWeight > 0 ? weightedPresent / totalWeight : 0;
  }

  /**
   * Calculate average confidence of present elements
   */
  private _calculateAverageConfidence(elementData: Record<string, ElementData>): number {
    const presentElements = Object.values(elementData).filter(data => data.present);

    if (presentElements.length === 0) return 0;

    const totalConfidence = presentElements.reduce((sum, data) => sum + data.confidence, 0);
    return totalConfidence / presentElements.length;
  }

  /**
   * Assess structural integrity
   */
  private _assessStructuralIntegrity(elements: PromptElements, elementData: Record<string, ElementData>): number {
    let score = 0.5; // Base score

    // Check for logical consistency
    if (elementData.roleAbility.present && elementData.taskRequest.present) {
      score += 0.2; // Good foundation
    }

    if (elementData.instructionAction.present && elementData.outputSpec.present) {
      score += 0.15; // Clear guidance
    }

    if (elementData.constraints.present && elementData.objectives.present) {
      score += 0.1; // Well-bounded task
    }

    // Check for contradictions (simplified heuristic)
    const hasExamples = elementData.examples.present;
    const hasOutputSpec = elementData.outputSpec.present;
    if (hasExamples && hasOutputSpec) {
      score += 0.1; // Examples support output format
    }

    return Math.min(1.0, score);
  }

  /**
   * Assess content clarity
   */
  private _assessContentClarity(content: PromptContent): number {
    const text = content.cleanedText;
    let score = 0.5; // Base score

    // Length appropriateness
    if (text.length >= 50 && text.length <= 2000) {
      score += 0.2;
    } else if (text.length < 20) {
      score -= 0.3; // Too short
    } else if (text.length > 5000) {
      score -= 0.2; // Possibly too long
    }

    // Sentence structure
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = text.length / Math.max(sentences.length, 1);

    if (avgSentenceLength >= 10 && avgSentenceLength <= 30) {
      score += 0.1; // Good sentence length
    }

    // Clear instructions (presence of action words)
    const actionWords = ['analyze', 'explain', 'describe', 'create', 'generate', 'help', 'please'];
    const hasActionWords = actionWords.some(word => text.toLowerCase().includes(word));
    if (hasActionWords) {
      score += 0.15;
    }

    // Grammar and punctuation (simplified check)
    const punctuationRatio = (text.match(/[.!?,;:]/g) || []).length / Math.max(text.length / 50, 1);
    if (punctuationRatio >= 0.5 && punctuationRatio <= 3) {
      score += 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Assess purpose alignment
   */
  private _assessPurposeAlignment(elements: PromptElements, _content?: PromptContent): number {
    const elementData = this._extractElementData(elements);
    let score = 0.5; // Base score

    // Core purpose elements
    const hasClearRole = elementData.roleAbility.present && elementData.roleAbility.confidence > 0.7;
    const hasClearTask = elementData.taskRequest.present && elementData.taskRequest.confidence > 0.7;

    if (hasClearRole && hasClearTask) {
      score += 0.3; // Strong purpose alignment
    } else if (hasClearRole || hasClearTask) {
      score += 0.15; // Moderate purpose alignment
    }

    // Supporting elements
    if (elementData.objectives.present) {
      score += 0.1; // Clear goals
    }

    if (elementData.outputSpec.present) {
      score += 0.1; // Clear deliverables
    }

    return Math.min(1.0, score);
  }

  /**
   * Calculate quality score from numeric score
   */
  private _calculateQualityScore(numericScore: number): QualityScore {
    if (numericScore >= 90) return QualityScore.A;
    if (numericScore >= 70) return QualityScore.B;
    if (numericScore >= 50) return QualityScore.C;
    if (numericScore >= 30) return QualityScore.D;
    return QualityScore.F;
  }

  /**
   * Identify strengths in the prompt
   */
  private _identifyStrengths(
    elements: PromptElements,
    elementData: Record<string, ElementData>,
    score: number
  ): string[] {
    const strengths: string[] = [];

    if (elements.completeness >= 0.8) {
      strengths.push('Excellent element completeness');
    }

    if (elementData.roleAbility.present && elementData.roleAbility.confidence > 0.8) {
      strengths.push('Clear role definition');
    }

    if (elementData.taskRequest.present && elementData.taskRequest.confidence > 0.8) {
      strengths.push('Well-defined task requirements');
    }

    if (elementData.outputSpec.present && elementData.outputSpec.confidence > 0.7) {
      strengths.push('Clear output specifications');
    }

    if (elementData.examples.present) {
      strengths.push('Includes helpful examples');
    }

    if (elementData.constraints.present && elementData.constraints.confidence > 0.6) {
      strengths.push('Well-defined constraints');
    }

    if (score >= 80) {
      strengths.push('High overall quality score');
    }

    return strengths;
  }

  /**
   * Identify weaknesses in the prompt
   */
  private _identifyWeaknesses(
    elements: PromptElements,
    elementData: Record<string, ElementData>,
    score: number
  ): string[] {
    const weaknesses: string[] = [];

    if (elements.completeness < 0.5) {
      weaknesses.push('Low element completeness');
    }

    if (!elementData.roleAbility.present || elementData.roleAbility.confidence < 0.5) {
      weaknesses.push('Unclear or missing role definition');
    }

    if (!elementData.taskRequest.present || elementData.taskRequest.confidence < 0.5) {
      weaknesses.push('Vague task requirements');
    }

    if (!elementData.outputSpec.present) {
      weaknesses.push('Missing output format specifications');
    }

    if (!elementData.contextSituation.present) {
      weaknesses.push('Lacks contextual background');
    }

    if (!elementData.constraints.present && elementData.taskRequest.present) {
      weaknesses.push('No clear constraints or limitations');
    }

    if (score < 50) {
      weaknesses.push('Overall quality needs significant improvement');
    }

    return weaknesses;
  }

  /**
   * Generate improvement recommendations
   */
  private _generateRecommendations(
    elements: PromptElements,
    elementData: Record<string, ElementData>,
    weaknesses: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (weaknesses.includes('Unclear or missing role definition')) {
      recommendations.push('Add a clear role definition (e.g., "You are an expert...")');
    }

    if (weaknesses.includes('Vague task requirements')) {
      recommendations.push('Be more specific about what you want the AI to do');
    }

    if (weaknesses.includes('Missing output format specifications')) {
      recommendations.push('Specify the desired output format (e.g., JSON, bullet points, paragraph)');
    }

    if (weaknesses.includes('Lacks contextual background')) {
      recommendations.push('Provide relevant context or background information');
    }

    if (weaknesses.includes('No clear constraints or limitations')) {
      recommendations.push('Add constraints to guide the AI\'s behavior');
    }

    if (!elementData.examples.present && elements.completeness < 0.7) {
      recommendations.push('Consider adding examples to clarify expectations');
    }

    if (elements.completeness < 0.6) {
      recommendations.push('Review the 13-element framework and add missing components');
    }

    return recommendations;
  }

  /**
   * Calculate individual element scores
   */
  private _calculateElementScores(elementData: Record<string, ElementData>): Record<string, number> {
    const scores: Record<string, number> = {};

    for (const [elementName, data] of Object.entries(elementData)) {
      const weight = this.ELEMENT_WEIGHTS[elementName] || 1.0;
      let score = 0;

      if (data.present) {
        score = data.confidence * 100 * weight;
      }

      scores[elementName] = Math.round(Math.min(100, score));
    }

    return scores;
  }

  /**
   * Generate comparison recommendations
   */
  private _generateComparisonRecommendations(
    winner: 'first' | 'second' | 'tie',
    firstAssessment: QualityAssessment,
    secondAssessment: QualityAssessment
  ): string[] {
    const recommendations: string[] = [];

    if (winner === 'tie') {
      recommendations.push('Both prompts have similar quality levels');
      recommendations.push('Consider combining the strengths of both prompts');
    } else {
      const betterAssessment = winner === 'first' ? firstAssessment : secondAssessment;
      const worseAssessment = winner === 'first' ? secondAssessment : firstAssessment;

      recommendations.push(`The ${winner} prompt performs better overall`);

      // Suggest learning from the better prompt
      betterAssessment.strengths.forEach(strength => {
        recommendations.push(`Learn from: ${strength}`);
      });

      // Suggest improvements for the weaker prompt
      worseAssessment.weaknesses.slice(0, 3).forEach(weakness => {
        recommendations.push(`Improve: ${weakness}`);
      });
    }

    return recommendations;
  }
}