# Implementation Plan: AI 提示词分析工作流

**Branch**: `001-ai-ai-ai` | **Date**: 2025-09-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ai-ai-ai/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path ✓
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION) → IN PROGRESS
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
创建一个AI agent工作流系统，能够递归扫描仓库中的所有文件，使用AI智能识别包含提示词的文件，提取提示词内容并进行框架要素分析（15个要素），最后生成JSON格式的汇总文件和对比表格。技术方案基于Node.js/Python脚本，集成大语言模型API进行内容分析。

## Technical Context
**Language/Version**: Node.js 18+ (基于项目历史代码分析)
**Primary Dependencies**: 大语言模型API (Qwen/ChatGPT/Claude), file-system operations, JSON processing
**Storage**: 文件系统 (JSON文件存储分析结果)  
**Testing**: Jest/Mocha 或 pytest (基于最终语言选择)
**Target Platform**: Linux/macOS/Windows (跨平台CLI工具)
**Project Type**: single (standalone CLI工具)  
**Performance Goals**: 处理速度适中，支持大型仓库扫描，AI调用速度为主要瓶颈
**Constraints**: MVP版本简化处理，每文件一个AI请求，内存使用合理
**Scale/Scope**: 支持中大型代码仓库（1000+文件），处理各种文件格式

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (cli tool) ✓
- Using framework directly? ✓ (直接使用Node.js/Python标准库和AI API)
- Single data model? ✓ (提示词数据模型)
- Avoiding patterns? ✓ (简单的脚本架构，无复杂设计模式)

**Architecture**:
- EVERY feature as library? ✓ (核心功能将封装为可复用的库)
- Libraries listed: 
  - file-scanner: 文件扫描和内容提取
  - prompt-analyzer: AI驱动的提示词分析
  - report-generator: JSON和表格生成
- CLI per library: ✓ (提供--help, --version, --format参数)
- Library docs: ✓ (计划使用llms.txt格式)

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? ✓ (将严格遵循)
- Git commits show tests before implementation? ✓ (提交记录将显示测试先行)
- Order: Contract→Integration→E2E→Unit strictly followed? ✓
- Real dependencies used? ✓ (真实文件系统和AI API调用)
- Integration tests for: new libraries, contract changes, shared schemas? ✓
- FORBIDDEN: Implementation before test, skipping RED phase ✓

**Observability**:
- Structured logging included? ✓ (处理进度、错误日志、统计信息)
- Frontend logs → backend? N/A (CLI工具)
- Error context sufficient? ✓ (详细错误信息和调试上下文)

**Versioning**:
- Version number assigned? ✓ (1.0.0)
- BUILD increments on every change? ✓
- Breaking changes handled? ✓ (向后兼容的API设计)

## Project Structure

### Documentation (this feature)
```
specs/001-ai-ai-ai/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/              # 数据模型定义
├── services/            # AI分析、文件扫描服务
├── cli/                 # 命令行接口
└── lib/                 # 核心库函数

tests/
├── contract/            # API契约测试
├── integration/         # 集成测试
└── unit/                # 单元测试
```

**Structure Decision**: Option 1 - 单项目结构，专注于CLI工具开发

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - 大语言模型API选择和集成方案研究
   - 文件扫描性能优化最佳实践
   - JSON数据结构设计模式
   - 跨平台CLI工具开发规范

2. **Generate and dispatch research agents**:
   ```
   Task: "Research LLM API integration options for content analysis (Qwen, OpenAI, Claude)"
   Task: "Find best practices for recursive file scanning in Node.js/Python"
   Task: "Research JSON schema design for prompt analysis data"
   Task: "Find CLI tool development patterns for cross-platform deployment"
   ```

3. **Consolidate findings** in `research.md`

**Output**: research.md with all technical decisions resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - PromptFile: 文件信息和元数据
   - PromptContent: 提取的提示词内容
   - PromptElement: 15个框架要素分析结果
   - AnalysisReport: 最终分析报告
   - ProcessingLog: 处理日志记录

2. **Generate API contracts** from functional requirements:
   - scanRepository(path): 扫描仓库文件
   - identifyPrompts(content): AI识别提示词
   - extractPrompts(file): 提取提示词内容
   - analyzeElements(prompt): 分析框架要素
   - generateReport(prompts): 生成对比报告

3. **Generate contract tests** from contracts:
   - file-scanner.test.js: 文件扫描功能测试
   - prompt-analyzer.test.js: AI分析功能测试
   - report-generator.test.js: 报告生成测试

4. **Extract test scenarios** from user stories:
   - 完整仓库扫描场景
   - 提示词识别和提取场景
   - 要素分析和报告生成场景

5. **Update agent file incrementally**:
   - 更新CLAUDE.md以包含新的技术上下文

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- 基于TDD原则，先生成测试任务，再生成实现任务
- 每个库组件生成独立的契约测试任务
- 按依赖关系排序：数据模型 → 服务层 → CLI层
- AI集成测试作为关键验证点

**Ordering Strategy**:
- TDD order: 测试先行原则
- Dependency order: models → services → cli
- 标记[P]表示可并行执行的独立任务

**Estimated Output**: 20-25个有序任务，涵盖测试编写、核心实现、CLI接口、文档等

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)  
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*