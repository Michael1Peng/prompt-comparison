# Implementation Plan: AI提示词文件深度分析和提取工具

**Branch**: `003-ai-ai-ai` | **Date**: 2025-09-14 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-ai-ai-ai/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path ✓
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION) ✓
   → Detect Project Type from context (single - CLI tool continuation) 
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
创建AI提示词文件深度分析和提取工具，作为第一步文件发现工具的后续功能。该工具读取 `analysis/prompt-files.json` 中已识别的提示词文件，并发分析每个文件的完整内容，使用AI API提取其中包含的具体提示词，输出包含提示词完整内容、来源文件和位置信息的 `analysis/prompt-list.json` 文件。采用Node.js实现，基于TDD方法，关注主流程可运行。

## Technical Context
**Language/Version**: Node.js 18+ with ESM modules  
**Primary Dependencies**: OpenAI SDK, fs-extra, p-limit, commander.js, chalk  
**Storage**: File system (JSON input/output), 读取现有的prompt-files.json  
**Testing**: Jest testing framework  
**Target Platform**: Linux/macOS command line environment  
**Project Type**: single (CLI tool continuation)  
**Performance Goals**: 处理已识别的提示词文件，5个并发API调用，快速提取提示词内容  
**Constraints**: 简单MVP实现，基于现有架构扩展，遇到错误直接跳过，确保主流程顺利  
**Scale/Scope**: 处理第一步输出的提示词文件列表，支持多提示词文件，精确位置标注

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (cli tool continuation)
- Using framework directly? ✓ (继续使用Node.js APIs，commander.js CLI框架)
- Single data model? ✓ (PromptDetail + PromptList)
- Avoiding patterns? ✓ (直接函数调用，复用现有模块化架构)

**Architecture**:
- EVERY feature as library? ✓ (扩展现有服务模块架构)
- Libraries listed: prompt-reader(JSON解析), content-extractor(提示词提取), list-generator(输出生成)
- CLI per library: 新增 extract 命令，复用现有 --help, --version, --format 等选项
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
- Error context sufficient? ✓ (详细错误信息和堆栈)

**Versioning**:
- Version number assigned? ✓ (1.1.0 - 新功能版本)
- BUILD increments on every change? ✓
- Breaking changes handled? N/A (新增功能，向后兼容)

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
# Option 1: Single project (DEFAULT - 扩展现有结构)
src/
├── models/              # 扩展PromptDetail, PromptList数据模型
├── services/            # 新增prompt-reader, content-extractor, list-generator
├── cli/                 # 扩展现有CLI，新增extract命令
└── lib/                 # 通用工具函数

tests/
├── contract/            # API合约测试  
├── integration/         # 端到端集成测试
└── unit/                # 单元测试

analysis/                # 输入输出目录
├── prompt-files.json    # 输入文件（第一步输出）
└── prompt-list.json     # 输出文件（本步输出）
```

**Structure Decision**: Option 1 - 单项目结构，扩展现有CLI工具架构

## Phase 0: Outline & Research

基于Technical Context中的技术选型大部分已明确（复用现有架构），主要研究重点：

1. **提示词内容提取策略**:
   - Decision: 使用GPT-5进行文件内容深度分析，识别并分离多个提示词
   - Rationale: 复用现有AI API配置，专注于提取完整提示词内容而非结构化分析
   - Alternatives considered: 基于规则的文本分割，NLP库处理

2. **多提示词文件处理方案**:
   - Decision: AI API调用时要求返回数组格式，每个提示词包含内容和位置信息
   - Rationale: 一次API调用处理整个文件，获得准确的上下文和位置标注
   - Alternatives considered: 分段处理，正则表达式匹配

3. **位置信息标注方法**:
   - Decision: 基于行号的精确位置标注（startLine, endLine）
   - Rationale: 简单准确，便于后续文件定位和内容验证
   - Alternatives considered: 字符位置，段落索引

**Output**: ✓ research.md 已通过内嵌研究完成，无未解决的NEEDS CLARIFICATION

## Phase 1: Design & Contracts

### 数据模型设计

基于功能规格中的Key Entities：

**PromptDetail**:
```typescript
interface PromptDetail {
  promptId: string;         // 提示词唯一标识符
  sourceFile: string;       // 来源文件路径
  content: string;          // 提示词完整内容
  startLine: number;        // 在文件中的起始行号
  endLine: number;          // 在文件中的结束行号
}
```

**PromptList**:
```typescript
interface PromptList {
  totalFiles: number;       // 处理的文件总数
  totalPrompts: number;     // 发现的提示词总数
  prompts: PromptDetail[];  // 提示词详情数组
  analysisTime: string;     // 分析时间戳
  processingStats: object;  // 处理统计信息
}
```

### API合约设计

**CLI Interface Contract**:
```bash
# 主要命令
prompt-finder extract [options]

# 选项
--input, -i <path>     # 输入JSON文件路径 (default: ./analysis/prompt-files.json)
--output, -o <path>    # 输出文件路径 (default: ./analysis/prompt-list.json) 
--concurrency, -c <n>  # 并发处理数量 (default: 5)
--help, -h             # 帮助信息
--version, -v          # 版本信息
--format <type>        # 输出格式: json|yaml (default: json)
```

### 集成测试场景

基于用户故事的测试场景：
1. **读取prompt-files.json并提取提示词** → 生成正确的prompt-list.json输出
2. **处理多提示词文件** → 正确识别和分离每个提示词及其位置
3. **处理文件读取错误和API调用失败** → 记录错误并继续处理其他文件

**Output**: ✓ data-model.md, /contracts/cli.md, quickstart.md, CLAUDE.md已生成

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- 每个数据模型 → 模型扩展任务 [P]
- 每个服务模块 → 服务实现任务 [P]  
- 每个用户场景 → 集成测试任务
- CLI接口 → 命令行接口扩展任务

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

无违反项 - 设计符合简单性原则，扩展现有架构。

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