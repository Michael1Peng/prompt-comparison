# Feature Specification: AI提示词文件发现和汇总工具

**Feature Branch**: `002-ai-ai-ai`  
**Created**: 2025-09-13  
**Status**: Requirements Clarified  
**Input**: User description: "现在有很多质量非常高的 AI 智能体流程的开源项目，比如说 AI 编码相关的，他们里面有大量优秀的提示词设计。然后仓库里面这些大量的提示词文件，我想把它们都找到。对他们进行统一化的框架层面的要素分析，去分析他们每个提示词都有哪些元素？最后能够汇总在一个表格里面去做对比。先帮我实现第一步需求，实现一个AI agent工作流能够把当前仓库所有带有提示词内容的文件都找出来，之后汇总到一个固定的文件里面。注意，你要以最简单的方式来实现这个MVP产品，产品方案和技术方案都选择最简单的实现。然后实现的代码也只关注主流程能够跑通。基于TDD的方式来实现每个步骤。"

## User Scenarios & Testing *(mandatory)*

### Primary User Story
作为一个AI提示词研究者，我需要一个工具能够自动扫描Git仓库中的所有文件，识别并提取包含AI提示词内容的文件，然后将这些文件的信息汇总到一个统一的输出文件中，以便进行后续的分析和对比工作。

### Acceptance Scenarios
1. **Given** 一个包含多种文件类型的Git仓库，**When** 运行提示词发现工具，**Then** 系统应该扫描所有文件并识别包含提示词内容的文件
2. **Given** 找到的提示词文件列表，**When** 执行汇总操作，**Then** 系统应该生成一个包含所有发现文件路径和基本信息的汇总文件  
3. **Given** 空仓库或无提示词文件的仓库，**When** 运行工具，**Then** 系统应该生成一个空的汇总文件并提示无发现内容

### Edge Cases
- **文件权限不足**: 记录错误日志并跳过，不阻塞整体流程
- **API调用失败**: 记录失败日志并跳过该文件，继续处理其他文件
- **输出文件存在**: 每次执行都完全重新生成，覆盖之前结果
- **二进制文件处理**: 预先过滤掉非文本文件（多媒体、二进制文件等）

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: 系统必须能够遍历当前Git仓库的所有文件
- **FR-002**: 系统必须使用OpenAI GPT-5 API来智能识别包含AI提示词内容的文件，支持5个并发API调用
- **FR-003**: 系统必须提取每个提示词文件的详细信息：文件路径、提示词内容摘要、内容位置信息、AI置信度、提示词类型分类
- **FR-004**: 系统必须将发现的所有提示词文件信息汇总到固定目录 `./analysis/` 下的JSON文件中
- **FR-005**: 系统必须提供单个命令行命令执行完整流程，显示进度条和当前处理文件信息
- **FR-006**: 系统必须忽略Git忽略的文件和目录（.gitignore规则）
- **FR-007**: 输出JSON文件必须包含扫描统计信息（总文件数、发现提示词文件数量）和详细的文件分析结果
- **FR-008**: 系统必须过滤掉非文本文件，只处理可能包含提示词的文本文件
- **FR-009**: 系统必须基于Node.js实现，采用模块化架构设计
- **FR-010**: 系统必须包含基础的单元测试覆盖（每个主要函数至少2个测试用例）

### Key Entities *(include if feature involves data)*
- **PromptFile**: 代表一个包含AI提示词的文件
  - `filePath`: 文件路径
  - `summary`: 提示词内容摘要
  - `startPosition`: 提示词内容起始位置
  - `endPosition`: 提示词内容结束位置
  - `confidence`: AI判断的置信度
  - `promptType`: 提示词类型（system, user, assistant等）
- **ScanResult**: 代表整个扫描结果
  - `totalFiles`: 扫描的总文件数
  - `promptFiles`: 发现的提示词文件数量
  - `files`: PromptFile对象数组
  - `scanTime`: 扫描时间戳
- **技术实现**: Node.js, OpenAI SDK, 模块化架构

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
- [x] Requirements clarified through Q&A
- [x] Technical implementation details confirmed

---
