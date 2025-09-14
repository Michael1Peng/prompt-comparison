# Implementation Plan: AI提示词文件深度分析和提取工具

**Branch**: `003-ai-ai-ai` | **Date**: 2025-09-14 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-ai-ai-ai/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path ✓
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION) ✓
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type ✓
3. Evaluate Constitution Check section below ✓
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check ✓
4. Execute Phase 0 → research.md ✓
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
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
创建一个最简单的MVP工具，读取第一步生成的提示词文件列表，使用AI智能识别每个文件中的具体提示词内容块，提取每个提示词的完整内容及其行号位置，最终输出到 `analysis/prompt-list.json`。只关注核心流程能跑通，使用集成测试TDD方式开发。

## Technical Context
**Language/Version**: Node.js 18+ with ESM modules  
**Primary Dependencies**: OpenAI SDK, fs-extra, p-limit  
**Storage**: File system (JSON input/output)  
**Testing**: Jest testing framework  
**Target Platform**: Linux/macOS command line environment  
**Project Type**: single (extending existing CLI tool)  
**Performance Goals**: 处理100+文件，5个并发  
**Constraints**: 最简单MVP实现，只关注主流程  
**Scale/Scope**: 单仓库分析，提取提示词内容

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (extending existing CLI tool) ✓
- Using framework directly? ✓ (直接使用Node.js APIs)
- Single data model? ✓ (PromptDetail + PromptList)  
- Avoiding patterns? ✓ (直接函数调用)

**Architecture**:
- EVERY feature as library? ✓ (prompt_extractor服务模块)
- Libraries listed: prompt_extractor (提示词提取服务)
- CLI per library: extend existing scan.js or new extract.js
- Library docs: llms.txt format planned? N/A (MVP scope)

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? ✓ (集成测试TDD)
- Git commits show tests before implementation? ✓
- Order: Contract→Integration→E2E→Unit strictly followed? ✓  
- Real dependencies used? ✓ (真实文件系统、真实AI API)
- Integration tests for: new libraries, contract changes, shared schemas? ✓
- FORBIDDEN: Implementation before test, skipping RED phase ✓

**Observability**:
- Structured logging included? ✓ (控制台输出)
- Frontend logs → backend? N/A (CLI only)
- Error context sufficient? ✓ (错误统计信息)

**Versioning**:
- Version number assigned? ✓ (继承现有版本)
- BUILD increments on every change? ✓
- Breaking changes handled? N/A (new feature)

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
├── models/
│   └── prompt_models.js    # 新增：PromptDetail, PromptList数据模型
├── services/
│   └── prompt_extractor.js # 新增：提示词提取服务
├── cli/
└── lib/

tests/
├── contract/
├── integration/
│   └── test_extract_workflow.test.js  # 新增：提取流程集成测试
└── unit/

analysis/                    # 输出目录
├── prompt-files.json       # 第一步输出（输入）
└── prompt-list.json        # 第二步输出
```

**Structure Decision**: Option 1 - 单项目结构，扩展现有CLI工具

## Phase 0: Outline & Research

基于澄清后的需求，无NEEDS CLARIFICATION项目。主要研究点：

1. **AI提示词内容块识别策略**:
   - Decision: 使用GPT-5智能识别独立提示词块
   - Rationale: 比规则分割更灵活准确
   - Alternatives considered: 正则表达式分割(不够智能)

2. **行号定位实现**:
   - Decision: 使用文件内容按行分割后索引定位
   - Rationale: 简单直接，满足MVP需求
   - Alternatives considered: 字符位置(过于复杂)

3. **并发控制**:
   - Decision: 复用现有p-limit，固定5个并发
   - Rationale: 已验证可行，避免API限流
   - Alternatives considered: 无并发控制(易出错)

**Output**: ✓ research.md 完成

## Phase 1: Design & Contracts

### 数据模型设计

**PromptDetail**:
```javascript
{
  promptId: string,      // 唯一标识符 
  sourceFile: string,    // 来源文件路径
  content: string,       // 完整提示词内容
  startLine: number,     // 起始行号
  endLine: number        // 结束行号
}
```

**PromptList**:
```javascript
{
  totalFiles: number,           // 处理文件总数
  totalPrompts: number,         // 提取提示词总数
  processingStats: {            // 处理统计
    successfulFiles: number,
    failedFiles: number,
    errors: []
  },
  analysisTime: string,         // 分析时间戳
  prompts: PromptDetail[]       // 提示词列表
}
```

### API合约设计

**CLI Interface Contract**:
```bash
# 主要命令
node extract.js  # 或扩展 scan.js --extract

# 输入
- 读取 analysis/prompt-files.json
- 环境变量 OPENAI_API_KEY

# 输出  
- 控制台：处理进度
- 文件：analysis/prompt-list.json
```

### 集成测试场景

基于用户故事的测试场景：
1. **正常流程测试** → 读取JSON，提取提示词，生成输出
2. **空输入测试** → 处理无提示词文件情况
3. **错误处理测试** → API失败时跳过继续

**Output**: ✓ data-model.md, /contracts/cli.md, quickstart.md, CLAUDE.md已规划

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- 基于MVP简化原则生成最少任务
- 集成测试驱动开发(TDD)
- 每个数据模型 → 模型创建任务
- 核心服务 → 服务实现任务
- 主流程 → 集成测试任务

**Ordering Strategy**:
- TDD order: 集成测试先于实现
- Dependency order: Models → Services → CLI
- 标记 [P] 表示可并行执行

**Estimated Output**: 8-10个有序编号任务

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

无违反项 - MVP设计遵循最简原则。

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