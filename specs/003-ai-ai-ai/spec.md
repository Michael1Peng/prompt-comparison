# Feature Specification: AI提示词文件深度分析和提取工具

**Feature Branch**: `003-ai-ai-ai`  
**Created**: 2025-09-14  
**Status**: Requirements Clarified  
**Input**: User description: "现在有很多质量非常高的 AI 智能体流程的开源项目，比如说 AI 编码相关的，他们里面有大量优秀的提示词设计。
然后仓库里面这些大量的提示词文件，我想把它们都找到。对他们进行统一化的框架层面的要素分析，去分析他们 每个提示词都有哪些元素？最后能够汇总在一个表格里面去做对比。
第一步需求已实现: 实现一个 AI agent 工作流能够把当前仓库所有带有提示词内容的文件都找出来，之后汇总到一个固定的文件 `analysis/prompt-files.json` 里面。
现在帮我实现第二步需求: 读取这个上一个步骤输出的 提示词文件分析 JSON，并发的读取 JSON 里面每一个 item 对应的文件，然后 再用 AI API call 去分析里面有哪些提示词。最后 这些提示词 完整的输出到一个新的 JSON 文件 `analysis/prompt-list.json` 里面
注意，你要以最简单的方式来实现这个 MVP 产品，产品方案和技术方案都选择最简单的实现。然后实现的代码也只关注主流程能够跑通。
基于 TDD 的方式来实现每个步骤。"

## User Scenarios & Testing *(mandatory)*

### Primary User Story
作为一个AI提示词研究者，在完成第一步文件发现后，我需要一个工具能够读取已识别的提示词文件列表，深度分析每个文件中具体包含哪些提示词内容，提取每个提示词的详细信息和结构化要素，并将这些提示词信息汇总到一个新的JSON文件中，以便进行后续的框架层面要素分析和对比。

### Acceptance Scenarios
1. **Given** 存在 `analysis/prompt-files.json` 文件包含已识别的提示词文件，**When** 运行深度分析工具，**Then** 系统应该读取该JSON文件并并发处理每个文件进行提示词提取
2. **Given** 单个文件中包含多个独立的提示词，**When** AI分析文件内容，**Then** 系统应该识别并分别输出每个提示词的完整内容和位置信息
3. **Given** 所有文件都已分析完成，**When** 执行汇总操作，**Then** 系统应该生成包含所有提示词完整内容、来源文件和行号的 `analysis/prompt-list.json` 文件

### Edge Cases
- **输入JSON文件不存在**: 提示用户先运行第一步文件发现工具
- **文件路径在JSON中存在但文件已被删除**: 记录警告并跳过该文件
- **AI API调用失败**: 记录错误日志并跳过该文件，继续处理其他文件
- **输出JSON文件已存在**: 完全覆盖重新生成
- **任何文件处理错误**: 记录错误并跳过该文件，不阻塞整体流程

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: 系统必须能够读取和解析 `analysis/prompt-files.json` 文件，获取需要分析的文件列表
- **FR-002**: 系统必须并发读取JSON中列出的每个文件的完整内容，支持5个并发文件读取操作
- **FR-003**: 系统必须使用AI API调用来深度分析每个文件，识别其中包含的具体提示词内容
- **FR-004**: 系统必须提取每个文件中的所有提示词完整内容，一个文件可能包含多个独立的提示词
- **FR-005**: 系统必须为每个提示词记录其来源文件路径以及在文件中的起始和结束行号
- **FR-006**: 系统必须将所有提示词信息汇总到 `analysis/prompt-list.json` 文件中，包含统计信息
- **FR-007**: 系统必须提供单个命令行命令执行完整的深度分析流程，显示处理进度
- **FR-008**: 系统必须处理文件读取和API调用中的错误，确保单个失败不影响整体流程
- **FR-009**: 系统必须基于现有的Node.js架构继续实现，保持代码结构一致性
- **FR-010**: 系统必须包含基础的单元测试覆盖，遵循TDD开发方法

### Key Entities *(include if feature involves data)*
- **PromptDetail**: 代表一个具体的提示词内容
  - `promptId`: 提示词唯一标识符
  - `sourceFile`: 来源文件路径
  - `content`: 提示词完整内容
  - `startLine`: 在文件中的起始行号
  - `endLine`: 在文件中的结束行号
- **PromptList**: 代表所有提示词的汇总结果
  - `totalFiles`: 处理的文件总数
  - `totalPrompts`: 发现的提示词总数
  - `prompts`: PromptDetail对象数组
  - `analysisTime`: 分析时间戳
  - `processingStats`: 处理统计信息

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous  
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities resolved
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---

## Requirements Clarification Summary *(added after user interaction)*

通过互动问答澄清的实现细节：

### 核心实现决策
1. **提示词识别方式**: 使用AI智能识别不同的提示词内容块（非规则分割）
2. **提取信息范围**: 仅提取基础信息（完整内容、文件路径、起始结束行号）
3. **位置记录格式**: 行号格式（startLine, endLine）
4. **并发处理配置**: 固定5个并发文件读取
5. **错误处理策略**: 在最终JSON中包含错误统计信息
6. **代码架构选择**: 在现有 `src/services/` 下添加新的服务模块

### 最终输出JSON结构
```json
{
  "totalFiles": 5,
  "totalPrompts": 12,
  "processingStats": {
    "successfulFiles": 4,
    "failedFiles": 1,
    "errors": [...]
  },
  "analysisTime": "2025-09-14T...",
  "prompts": [
    {
      "promptId": "prompt_001", 
      "sourceFile": "docs/ai-prompt.md",
      "content": "完整提示词内容...",
      "startLine": 5,
      "endLine": 15
    }
  ]
}
```

### 技术实现要点
- **输入**: `analysis/prompt-files.json`（第一步输出）
- **处理**: 5个并发 + AI智能分析
- **输出**: `analysis/prompt-list.json`
- **架构**: 扩展现有Node.js项目结构
- **测试**: 严格TDD开发方式

---