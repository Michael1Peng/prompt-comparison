/**
 * AI提示词框架要素拆分工具 - 数据模型
 * 定义PromptElement和ElementAnalysisOutput数据结构
 */

/**
 * 提示词框架要素类
 * 表示一个提示词拆分后的完整要素集合
 */
export class PromptElement {
  constructor({
    promptId,
    sourceFile,
    originalContent,
    elements
  }) {
    this.promptId = promptId;               // 提示词唯一标识
    this.sourceFile = sourceFile;           // 来源文件路径
    this.originalContent = originalContent; // 原始提示词内容
    this.elements = this.initializeElements(elements); // 13个框架要素
  }

  /**
   * 初始化13个要素，确保所有字段都存在（默认为空字符串）
   */
  initializeElements(elements = {}) {
    const defaultElements = {
      source_file: '',
      role_capability: '',
      task_request: '',
      background_context: '',
      instruction_action: '',
      output_specification: '',
      examples: '',
      constraints_limitations: '',
      goals_expectations: '',
      information: '',
      evaluation_optimization: '',
      adjustments: '',
      audience: ''
    };

    // 合并传入的要素，确保所有字段都是字符串
    return Object.keys(defaultElements).reduce((acc, key) => {
      acc[key] = elements[key] || defaultElements[key];
      // 确保值是字符串
      if (typeof acc[key] !== 'string') {
        acc[key] = String(acc[key] || '');
      }
      return acc;
    }, {});
  }

  /**
   * 验证PromptElement对象的有效性
   */
  isValid() {
    // 检查必需字段
    if (!this.promptId || !this.sourceFile || !this.originalContent) {
      return false;
    }

    // 检查13个要素是否都存在且为字符串
    const requiredElements = [
      'source_file', 'role_capability', 'task_request',
      'background_context', 'instruction_action', 'output_specification',
      'examples', 'constraints_limitations', 'goals_expectations',
      'information', 'evaluation_optimization', 'adjustments', 'audience'
    ];

    return requiredElements.every(element => 
      this.elements.hasOwnProperty(element) && 
      typeof this.elements[element] === 'string'
    );
  }

  /**
   * 转换为JSON对象
   */
  toJSON() {
    return {
      promptId: this.promptId,
      sourceFile: this.sourceFile,
      originalContent: this.originalContent,
      elements: this.elements
    };
  }

  /**
   * 从JSON对象创建PromptElement实例
   */
  static fromJSON(json) {
    return new PromptElement(json);
  }
}

/**
 * 要素分析输出类
 * 包含所有提示词的要素分析结果
 */
export class ElementAnalysisOutput {
  constructor({
    totalPrompts = 0,
    analysisTime = null,
    prompts = []
  }) {
    this.totalPrompts = totalPrompts;
    this.analysisTime = analysisTime || new Date().toISOString();
    this.prompts = prompts.map(p => 
      p instanceof PromptElement ? p : new PromptElement(p)
    );
  }

  /**
   * 添加提示词要素
   */
  addPromptElement(promptElement) {
    if (!(promptElement instanceof PromptElement)) {
      promptElement = new PromptElement(promptElement);
    }
    
    if (!promptElement.isValid()) {
      throw new Error('Invalid PromptElement object');
    }
    
    this.prompts.push(promptElement);
    this.totalPrompts = this.prompts.length;
  }

  /**
   * 验证输出对象的有效性
   */
  isValid() {
    return (
      typeof this.totalPrompts === 'number' &&
      this.totalPrompts >= 0 &&
      typeof this.analysisTime === 'string' &&
      Array.isArray(this.prompts) &&
      this.prompts.every(p => p instanceof PromptElement && p.isValid())
    );
  }

  /**
   * 转换为JSON对象
   */
  toJSON() {
    return {
      totalPrompts: this.totalPrompts,
      analysisTime: this.analysisTime,
      prompts: this.prompts.map(p => p.toJSON())
    };
  }

  /**
   * 从JSON对象创建ElementAnalysisOutput实例
   */
  static fromJSON(json) {
    return new ElementAnalysisOutput(json);
  }
}

// 导出13个要素的列表常量
export const ELEMENT_KEYS = [
  'source_file',
  'role_capability',
  'task_request',
  'background_context',
  'instruction_action',
  'output_specification',
  'examples',
  'constraints_limitations',
  'goals_expectations',
  'information',
  'evaluation_optimization',
  'adjustments',
  'audience'
];

// 导出要素的中文名称映射
export const ELEMENT_NAMES = {
  source_file: '所在文件',
  role_capability: '角色/能力',
  task_request: '任务/请求',
  background_context: '背景/情境',
  instruction_action: '指令/行动',
  output_specification: '输出规格',
  examples: '示例',
  constraints_limitations: '限制/约束',
  goals_expectations: '目标/期望',
  information: '信息',
  evaluation_optimization: '评估/优化',
  adjustments: '调整',
  audience: '受众'
};