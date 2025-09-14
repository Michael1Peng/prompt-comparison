# Implementation Plan: AI提示词框架要素拆分工具

**Branch**: `004-ai-ai-ai` | **Date**: 2025-09-14 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-ai-ai-ai/spec.md`

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
创建一个MVP版本的AI提示词框架要素拆分工具，读取第二步生成的提示词列表JSON，使用OpenAI GPT API将每个提示词智能拆分为13个标准框架要素，确保内容完整且无重复，最终输出结构化JSON文件供对比分析。采用Node.js实现，基于集成测试TDD方法，5个并发处理，只关注主流程。

## Technical Context
**Language/Version**: Node.js 18+ with ESM modules  
**Primary Dependencies**: OpenAI SDK, fs-extra, p-limit, commander.js  
**Storage**: File system (JSON input/output)  
**Testing**: Jest testing framework  
**Target Platform**: Linux/macOS command line environment  
**Project Type**: single (extending existing CLI tool)  
**Performance Goals**: 处理100+提示词，5个并发API调用  
**Constraints**: MVP最简实现，只关注核心流程  
**Scale/Scope**: 单次处理一个prompt-list.json文件

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (extending existing CLI tool) ✓
- Using framework directly? ✓ (直接使用Node.js APIs，无封装)
- Single data model? ✓ (PromptElement模型)
- Avoiding patterns? ✓ (直接函数调用，无复杂模式)

**Architecture**:
- EVERY feature as library? ✓ (prompt_element_analyzer服务)
- Libraries listed: prompt_element_analyzer (要素拆分服务)
- CLI per library: element.js --help --version
- Library docs: MVP阶段暂不需要

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? ✓ (集成测试TDD)
- Git commits show tests before implementation? ✓
- Order: Contract→Integration→E2E→Unit strictly followed? ✓
- Real dependencies used? ✓ (真实文件系统、真实OpenAI API)
- Integration tests for: new libraries, contract changes, shared schemas? ✓
- FORBIDDEN: Implementation before test, skipping RED phase ✓

**Observability**:
- Structured logging included? ✓ (console输出进度)
- Frontend logs → backend? N/A (CLI only)
- Error context sufficient? ✓ (简单错误提示即可)

**Versioning**:
- Version number assigned? ✓ (继承现有版本)
- BUILD increments on every change? ✓
- Breaking changes handled? N/A (新功能)

## Project Structure

### Documentation (this feature)
```
specs/004-ai-ai-ai/
├── plan.md              # This file (/plan command output) ✓
├── research.md          # Phase 0 output (/plan command) ✓
├── data-model.md        # Phase 1 output (/plan command) ✓
├── quickstart.md        # Phase 1 output (/plan command) ✓
├── contracts/           # Phase 1 output (/plan command) ✓
│   └── cli.md          # CLI接口合约
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT) - 扩展现有结构
src/
├── models/
│   └── element_models.js    # 新增：PromptElement数据模型
├── services/
│   └── prompt_element_analyzer.js # 新增：要素拆分服务
├── element.js               # 新增：CLI入口文件
└── lib/

tests/
├── integration/
│   └── test_element_workflow.test.js  # 新增：要素拆分流程集成测试
└── unit/

analysis/                    # 输入输出目录
├── prompt-list.json        # 第二步输出（输入）
└── prompt-list-elements.json # 第三步输出
```

**Structure Decision**: Option 1 - 单项目结构，扩展现有CLI工具

## Phase 0: Outline & Research

基于澄清后的需求，无需额外研究。主要技术点：

1. **AI提示词要素拆分策略**:
   - Decision: 使用GPT-5智能识别13个框架要素
   - Rationale: AI理解上下文，准确拆分要素
   - Alternatives considered: 规则匹配(不够智能)

2. **并发控制**:
   - Decision: 复用p-limit，5个并发
   - Rationale: 与前两步保持一致
   - Alternatives considered: 串行(太慢)

3. **空要素处理**:
   - Decision: 不存在的要素设为空字符串
   - Rationale: 保持JSON结构完整性
   - Alternatives considered: null(不便于处理)

**Output**: ✓ research.md 完成

## Phase 1: Design & Contracts

### 数据模型设计

**PromptElement**:
```javascript
{
  promptId: string,
  sourceFile: string,
  originalContent: string,
  elements: {
    source_file: string,
    role_capability: string,
    task_request: string,
    background_context: string,
    instruction_action: string,
    output_specification: string,
    examples: string,
    constraints_limitations: string,
    goals_expectations: string,
    information: string,
    evaluation_optimization: string,
    adjustments: string,
    audience: string
  }
}
```

### API合约设计

**CLI Interface Contract**:
```bash
# 主要命令
node element.js

# 选项
--help, -h          # 帮助信息
--version, -v       # 版本信息
--input <path>      # 输入文件路径 (默认: analysis/prompt-list.json)
--output <path>     # 输出文件路径 (默认: analysis/prompt-list-elements.json)
```

### 集成测试场景

基于用户故事的测试场景：
1. **正常流程测试** → 读取JSON，拆分要素，生成输出
2. **空要素测试** → 确保不存在的要素为空字符串

**Output**: ✓ data-model.md, contracts/cli.md, quickstart.md, CLAUDE.md已规划

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- 基于MVP最简原则生成最少任务
- 集成测试驱动开发(TDD)
- 每个数据模型 → 模型创建任务
- 核心服务 → 服务实现任务
- 主流程 → 集成测试任务

**Ordering Strategy**:
- TDD order: 集成测试先于实现
- Dependency order: Models → Services → CLI
- 标记 [P] 表示可并行执行

**Estimated Output**: 6-8个有序编号任务

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following TDD principles)  
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
- [x] Complexity deviations documented (none)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*