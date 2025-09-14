# Implementation Plan: AI提示词文件深度分析和提取工具

**Branch**: `003-ai-ai-ai` | **Date**: 2025-09-14 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-ai-ai-ai/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path ✓
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION) ✓
   → Detect Project Type from context (single CLI tool extending existing)
   → Set Structure Decision based on project type ✓
3. Evaluate Constitution Check section below ✓
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check ✓
4. Execute Phase 0 → research.md ✓
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns" ✓
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md ✓
6. Re-evaluate Constitution Check section ✓
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check ✓
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md) ✓
8. STOP - Ready for /tasks command ✓
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
创建第二步AI提示词深度分析和提取工具，读取第一步输出的JSON文件，使用AI API深度分析每个文件中的具体提示词内容，支持单文件多提示词场景，并将完整提示词内容和位置信息输出到新的JSON文件。基于现有Node.js架构扩展，复用AIAnalyzer和OutputGenerator等模块，采用TDD方法开发。

## Technical Context
**Language/Version**: Node.js 18+ with ESM modules (基于现有架构)  
**Primary Dependencies**: OpenAI SDK, commander.js, chalk, fs-extra, p-limit (复用现有依赖)  
**Storage**: File system (JSON input/output), 读取 analysis/prompt-files.json，输出 analysis/prompt-list.json  
**Testing**: Jest testing framework (复用现有测试框架)  
**Target Platform**: Linux/macOS command line environment  
**Project Type**: single (扩展现有CLI工具)  
**Performance Goals**: 处理已识别的提示词文件，5个并发API调用，<1分钟完成提取  
**Constraints**: 基于第一步工具的输出，复用现有模块，保持MVP简单性  
**Scale/Scope**: 处理第一步工具识别的提示词文件，单文件支持多提示词识别

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (扩展现有CLI工具)
- Using framework directly? ✓ (直接使用Node.js APIs，复用commander.js框架)
- Single data model? ✓ (PromptDetail + PromptList，扩展现有数据模型)
- Avoiding patterns? ✓ (直接函数调用，复用现有服务架构)

**Architecture**:
- EVERY feature as library? ✓ (内容提取器、提示词分析器、输出生成器作为服务模块)
- Libraries listed: prompt-reader(读取第一步JSON), content-extractor(提示词提取), list-generator(输出生成)
- CLI per library: main CLI with extract command or separate extract.js
- Library docs: llms.txt format planned ✓

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? ✓ (TDD严格执行)
- Git commits show tests before implementation? ✓ (测试先行)
- Order: Contract→Integration→E2E→Unit strictly followed? ✓
- Real dependencies used? ✓ (真实文件系统、真实OpenAI API调用)
- Integration tests for: new libraries, contract changes, shared schemas? ✓
- FORBIDDEN: Implementation before test, skipping RED phase ✓

**Observability**:
- Structured logging included? ✓ (使用console with structured format)
- Frontend logs → backend? N/A (CLI only)
- Error context sufficient? ✓ (错误日志记录，跳过失败文件继续处理)

**Versioning**:
- Version number assigned? ✓ (基于现有版本递增)
- BUILD increments on every change? ✓
- Breaking changes handled? N/A (新增功能，不影响现有工具)

## Project Structure

### Documentation (this feature)
```
specs/003-ai-ai-ai/
├── plan.md              # This file (/plan command output) ✓
├── research.md          # Phase 0 output (/plan command) ✓
├── data-model.md        # Phase 1 output (/plan command) ✓
├── quickstart.md        # Phase 1 output (/plan command) ✓
├── contracts/           # Phase 1 output (/plan command) ✓
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT) - 扩展现有结构
src/
├── models/              # 扩展: PromptDetail, PromptList数据模型
├── services/            # 扩展: prompt-reader, content-extractor, list-generator
├── cli/                 # 新增: extract.js命令行工具
└── lib/                 # 复用: 通用工具函数

tests/
├── contract/            # 新增: 提取工具API合约测试
├── integration/         # 新增: 端到端提取测试
└── unit/                # 新增: 新服务的单元测试

analysis/                # 输入输出目录
├── prompt-files.json    # 输入: 第一步工具输出
└── prompt-list.json     # 输出: 第二步工具输出
```

**Structure Decision**: Option 1 - 单项目扩展现有架构，复用现有模块和服务

## Phase 0: Outline & Research

基于Implementation Clarifications中的澄清内容，以及复用现有技术栈的决策：

1. **已澄清的技术决策**:
   - Decision: 复用现有Node.js架构和依赖
   - Rationale: 保持代码一致性，避免重复实现
   - Alternatives considered: 独立实现(增加维护成本)

2. **AI分析策略**:
   - Decision: 让AI根据任务完整性自动识别提示词边界
   - Rationale: 更智能的分割方式，避免机械按段落分割
   - Alternatives considered: 正则表达式分割(不够智能)，段落分割(可能切断完整提示词)

3. **数据模型扩展**:
   - Decision: 基于现有PromptFile模型，新增PromptDetail和PromptList
   - Rationale: 保持数据结构一致性，便于后续分析
   - Alternatives considered: 全新数据结构(不兼容现有架构)

**Output**: ✓ research.md 已通过澄清完成，无未解决的NEEDS CLARIFICATION

## Phase 1: Design & Contracts

### 数据模型设计

基于功能规格中的Key Entities和Implementation Clarifications：

**PromptDetail**:
```typescript
interface PromptDetail {
  promptId: string;         // 自动生成序号 (prompt_001, prompt_002...)
  sourceFile: string;       // 来源文件路径
  content: string;          // 提示词完整内容 (保持原始格式)
  startLine: number;        // 起始行号 (0-based, 包含上下文)
  endLine: number;          // 结束行号 (0-based, 包含上下文)
}
```

**PromptList**:
```typescript
interface PromptList {
  totalFiles: number;       // 处理的文件总数
  totalPrompts: number;     // 发现的提示词总数
  prompts: PromptDetail[];  // 提示词详情数组
  analysisTime: string;     // 分析时间戳
  processingStats: {        // 简单处理统计
    successFiles: number;   // 成功处理的文件数
    failedFiles: number;    // 处理失败的文件数
  };
}
```

### API合约设计

**CLI Interface Contract**:
```bash
# 主要命令 (新工具)
extract.js [options]

# 选项 (保持简单，固定输入输出)
--help, -h             # 帮助信息
--version, -v          # 版本信息
--verbose             # 详细输出 (显示处理进度)

# 固定路径
输入: ./analysis/prompt-files.json
输出: ./analysis/prompt-list.json
```

### 集成测试场景

基于用户故事和边界情况的测试场景：
1. **读取第一步JSON并提取提示词** → 生成正确的提示词列表JSON
2. **处理单文件多提示词场景** → 正确识别和分割多个提示词
3. **处理文件不存在的情况** → 记录警告并跳过，继续处理其他文件

**Output**: ✓ data-model.md, /contracts/cli.md, quickstart.md, CLAUDE.md已生成

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- 每个数据模型 → 模型创建任务 [P]
- 每个服务模块 → 服务实现任务 [P]
- 每个用户场景 → 集成测试任务
- CLI接口 → 命令行接口实现任务

**Ordering Strategy**:
- TDD order: 测试先于实现
- Dependency order: Models → Services → CLI → Integration
- 标记 [P] 表示可并行执行 (独立文件)

**Estimated Output**: 12-15个有序编号任务在tasks.md中

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

无违反项 - 设计符合简单性原则，复用现有架构。

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*