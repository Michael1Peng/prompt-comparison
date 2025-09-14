# Data Model: AI提示词框架要素拆分工具

## 核心数据结构

### PromptElement
提示词框架要素对象，表示一个提示词拆分后的完整要素集合。

```javascript
{
  "promptId": "string",           // 提示词唯一标识 (如: "prompt_001")
  "sourceFile": "string",         // 来源文件路径
  "originalContent": "string",    // 原始提示词内容
  "elements": {                   // 13个框架要素（全部必须存在）
    "source_file": "string",           // 所在文件
    "role_capability": "string",       // 角色/能力
    "task_request": "string",          // 任务/请求
    "background_context": "string",    // 背景/情境
    "instruction_action": "string",    // 指令/行动
    "output_specification": "string",  // 输出规格
    "examples": "string",              // 示例
    "constraints_limitations": "string", // 限制/约束
    "goals_expectations": "string",    // 目标/期望
    "information": "string",           // 信息
    "evaluation_optimization": "string", // 评估/优化
    "adjustments": "string",           // 调整
    "audience": "string"               // 受众
  }
}
```

### ElementAnalysisOutput
完整的要素分析输出对象。

```javascript
{
  "totalPrompts": "number",        // 处理的提示词总数
  "analysisTime": "string",        // 分析时间戳 (ISO格式)
  "prompts": "PromptElement[]"     // 提示词要素数组
}
```

## 数据流转

```
输入: analysis/prompt-list.json (第二步输出)
  ↓
读取提示词列表
  ↓
并发AI分析（5个并发）
  ↓
拆分13个框架要素 → PromptElement对象
  ↓
汇总所有要素 → ElementAnalysisOutput对象
  ↓
输出: analysis/prompt-list-elements.json
```

## MVP简化说明

- 所有13个要素字段必须存在（可为空字符串）
- 不记录置信度或质量评分
- 不进行要素验证或优化
- 只关注核心拆分功能