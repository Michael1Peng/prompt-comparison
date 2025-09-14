# Feature Specification: AI提示词框架要素拆分工具 (MVP)

**Feature Branch**: `004-ai-ai-ai`  
**Created**: 2025-09-14  
**Status**: Requirements Clarified  
**Input**: User description: "现在有很多质量非常高的 AI 智能体流程的开源项目，比如说 AI 编码相关的，他们里面有大量优秀的提示词设计。然后仓库里面这些大量的提示词文件，我想把它们都找到。对他们进行统一化的框架层面的要素分析，去分析他们 每个提示词都有哪些元素？最后能够汇总在一个表格里面去做对比。第一步需求已实现: 实现一个 AI agent 工作流能够把当前仓库所有带有提示词内容的文件都找出来，之后汇总到一个固定的文件 `analysis/prompt-files.json` 里面。第二步需求已实现: 读取这个上一个步骤输出的 提示词文件分析 JSON，并发的读取 JSON 里面每一个 item 对应的文件，然后 再用 AI API call 去分析里面有哪些提示词。最后 这些提示词 完整的输出到一个新的 JSON 文件 `analysis/prompt-list.json` 里面。现在帮我实现第三步需求: 读取这个上一个步骤输出的提示词列表 JSON 里面每一个 item，然后 再用 AI API call 拆分每个提示词的框架要素，确保每个提示词被完整的拆分到各个要素里面，同时各个要素里面没有重复的内容。最后 这些拆分后的提示词框架要素 '所在文件 | 角色/能力 | 任务/请求 | 背景/情境 | 指令/行动 | 输出规格 | 示例 | 限制/约束 | 目标/期望 | 信息 | 评估/优化 | 调整 | 受众' 完整的输出到一个新的 JSON 文件 `analysis/prompt-list-elements.json` 里面。注意，你要以最简单的方式来实现这个 MVP 产品，产品方案和技术方案都选择最简单的实现。然后实现的代码也只关注主流程能够跑通。基于集成测试 TDD 的方式来实现每个步骤。MVP产品，最简单实现，主流程能跑通即可。"

## User Scenarios & Testing *(mandatory)*

### Primary User Story
作为AI提示词研究者，我需要将提取出的提示词拆分为13个标准框架要素，生成结构化JSON文件用于对比分析。

### Acceptance Scenarios
1. **Given** prompt-list.json文件存在，**When** 运行拆分工具，**Then** 生成包含13个要素的prompt-list-elements.json文件
2. **Given** 一个提示词，**When** AI分析，**Then** 拆分为13个要素（可以为空）

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: 读取 analysis/prompt-list.json 文件
- **FR-002**: 对每个提示词调用 AI API 拆分为13个框架要素（5个并发）
- **FR-003**: 输出到 analysis/prompt-list-elements.json 文件
- **FR-004**: 13个要素：所在文件、角色/能力、任务/请求、背景/情境、指令/行动、输出规格、示例、限制/约束、目标/期望、信息、评估/优化、调整、受众
- **FR-005**: 不存在的要素设为空字符串 ""
- **FR-006**: 使用独立的 element.js 作为CLI入口

### Key Entities
- **PromptElement**: 提示词要素拆分结果
  - `promptId`: 提示词ID
  - `sourceFile`: 来源文件
  - `originalContent`: 原始内容
  - `elements`: 13个要素对象（所有字段必须存在，可为空字符串）

## Requirements Clarification Summary *(added after Q&A)*

### 输入文件格式 (analysis/prompt-list.json)
```json
{
  "prompts": [
    {
      "promptId": "prompt_001",
      "sourceFile": "docs/ai-prompt.md",
      "content": "提示词完整内容...",
      "startLine": 10,
      "endLine": 25
    }
  ]
}
```

### 输出文件格式 (analysis/prompt-list-elements.json)
```json
{
  "totalPrompts": 2,
  "analysisTime": "2025-09-14T10:30:00Z",
  "prompts": [
    {
      "promptId": "prompt_001",
      "sourceFile": "docs/ai-prompt.md",
      "originalContent": "原始提示词内容...",
      "elements": {
        "source_file": "docs/ai-prompt.md",
        "role_capability": "角色能力描述...",
        "task_request": "任务请求...",
        "background_context": "背景情境...",
        "instruction_action": "指令行动...",
        "output_specification": "输出规格...",
        "examples": "示例...",
        "constraints_limitations": "限制约束...",
        "goals_expectations": "目标期望...",
        "information": "信息资源...",
        "evaluation_optimization": "评估优化...",
        "adjustments": "调整机制...",
        "audience": "目标受众"
      }
    }
  ]
}
```

### 实现决策
- 并发处理：5个并发
- 空要素处理：设为空字符串 ""
- CLI入口：独立的 element.js 文件
- 集成测试TDD：先写测试，后写实现

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details
- [x] Focused on user value
- [x] All mandatory sections completed

### Requirement Completeness
- [x] Requirements are testable and unambiguous  
- [x] Scope is clearly bounded

---

## Execution Status

- [x] User description parsed
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---