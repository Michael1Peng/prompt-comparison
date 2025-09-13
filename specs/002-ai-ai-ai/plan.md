# Implementation Plan: AI提示词文件发现和汇总工具

**Branch**: `002-ai-ai-ai` | **Date**: 2025-09-13 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-ai-ai-ai/spec.md`

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
创建一个MVP版本的AI提示词文件发现和汇总工具，能够扫描Git仓库中的所有文件，使用OpenAI GPT-5 API智能识别包含AI提示词内容的文件，并将结果汇总为JSON格式输出到固定目录。采用Node.js实现，基于TDD方法，关注主流程可运行。

## Technical Context
**Language/Version**: Node.js 18+ with ESM modules  
**Primary Dependencies**: OpenAI SDK, commander.js, chalk, fs-extra, ignore  
**Storage**: File system (JSON output), Git repository scanning  
**Testing**: Jest testing framework  
**Target Platform**: Linux/macOS command line environment  
**Project Type**: single (CLI tool)  
**Performance Goals**: 处理1000+文件，5个并发API调用，<30秒完成扫描  
**Constraints**: 简单MVP实现，只关注核心流程，避免过度设计  
**Scale/Scope**: 单仓库扫描，支持常见文本文件格式

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (cli tool only)
- Using framework directly? ✓ (直接使用Node.js APIs，commander.js CLI框架)
- Single data model? ✓ (PromptFile + ScanResult)
- Avoiding patterns? ✓ (直接函数调用，无Repository/UoW模式)

**Architecture**:
- EVERY feature as library? ✓ (文件扫描、AI分析、输出生成作为独立模块)
- Libraries listed: file-scanner(文件遍历), ai-analyzer(提示词识别), output-generator(JSON输出)
- CLI per library: main CLI with --scan, --help, --version, --format options
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
- Version number assigned? ✓ (1.0.0)
- BUILD increments on every change? ✓
- Breaking changes handled? N/A (initial version)

## Project Structure

### Documentation (this feature)
```
specs/002-ai-ai-ai/
├── plan.md              # This file (/plan command output) ✓
├── research.md          # Phase 0 output (/plan command) ✓
├── data-model.md        # Phase 1 output (/plan command) ✓
├── quickstart.md        # Phase 1 output (/plan command) ✓
├── contracts/           # Phase 1 output (/plan command) ✓
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/              # PromptFile, ScanResult数据模型
├── services/            # file-scanner, ai-analyzer, output-generator
├── cli/                 # 命令行界面
└── lib/                 # 通用工具函数

tests/
├── contract/            # API合约测试
├── integration/         # 端到端集成测试  
└── unit/                # 单元测试

analysis/                # 输出目录
└── prompt-files.json    # 分析结果
```

**Structure Decision**: Option 1 - 单项目结构，符合CLI工具的简单性原则

## Phase 0: Outline & Research

基于Technical Context中的所有技术选型都已明确，无NEEDS CLARIFICATION项目需要研究。主要研究重点：

1. **OpenAI API最佳实践**:
   - Decision: 使用gpt-5 (2025年8月7日正式发布的统一模型)
   - Rationale: 最新统一模型，结合推理能力和快速响应，更高的提示词识别准确度
   - Alternatives considered: gpt-4, gpt-3.5-turbo, claude-3.5-sonnet

2. **并发控制策略**:
   - Decision: 使用p-limit控制5个并发调用
   - Rationale: 避免API限流，平衡速度和稳定性
   - Alternatives considered: 全并发(易触发限制)，串行(太慢)

3. **文件类型过滤**:
   - Decision: 基于扩展名白名单(.md,.txt,.js,.py,.json等)
   - Rationale: 简单高效，覆盖常见提示词文件格式
   - Alternatives considered: 内容检测(复杂)，黑名单(可能遗漏)

**Output**: ✓ research.md 已通过内嵌研究完成，无未解决的NEEDS CLARIFICATION

## Phase 1: Design & Contracts

### 数据模型设计

基于功能规格中的Key Entities：

**PromptFile**:
```typescript
interface PromptFile {
  filePath: string;         // 文件路径
  summary: string;          // 提示词内容摘要  
  startPosition: number;    // 提示词内容起始位置
  endPosition: number;      // 提示词内容结束位置
  confidence: number;       // AI判断置信度 (0-1)
  promptType: string;       // 提示词类型
}
```

**ScanResult**:
```typescript
interface ScanResult {
  totalFiles: number;       // 扫描总文件数
  promptFiles: number;      // 发现提示词文件数量  
  files: PromptFile[];      // 提示词文件详情
  scanTime: string;         // 扫描时间戳
}
```

### API合约设计

**CLI Interface Contract**:
```bash
# 主要命令
prompt-finder scan [options]

# 选项
--output, -o <path>    # 输出文件路径 (default: ./analysis/prompt-files.json)
--help, -h             # 帮助信息
--version, -v          # 版本信息
--format <type>        # 输出格式: json|yaml (default: json)
```

### 集成测试场景

基于用户故事的测试场景：
1. **扫描包含提示词的仓库** → 生成正确的JSON输出
2. **扫描空仓库** → 生成空结果文件
3. **处理API调用失败** → 记录错误并继续处理

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

**Estimated Output**: 15-20个有序编号任务在tasks.md中

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

无违反项 - 设计符合简单性原则。

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