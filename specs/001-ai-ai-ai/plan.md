# Implementation Plan: AI 提示词分析工作流

**Branch**: `001-ai-ai-ai` | **Date**: 2025-09-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ai-ai-ai/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
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
构建一个AI提示词分析工作流，通过并发AI API调用智能扫描仓库中所有文件，识别包含提示词内容的文件，提取完整提示词并分析13个框架要素，最终生成JSON格式的结构化对比数据保存至 `./analysis/` 目录。

## Technical Context
**Language/Version**: Node.js 18+ (LTS)
**Primary Dependencies**: commander.js, fs/promises, openai SDK (GPT-5), zod
**Storage**: JSON文件存储到 `./analysis/` 目录
**Testing**: Jest + @types/jest
**Target Platform**: 跨平台命令行工具
**Project Type**: single - 单一CLI工具项目
**Performance Goals**: 支持并发文件处理，处理1000+文件仓库
**Constraints**: 需要API调用成本控制，处理任意大小文件
**Scale/Scope**: 支持扫描整个Git仓库，处理各种文件格式

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (cli工具)
- Using framework directly? 是 (直接使用asyncio/openai)
- Single data model? 是 (PromptAnalysis统一模型)
- Avoiding patterns? 是 (直接函数式设计，无复杂抽象)

**Architecture**:
- EVERY feature as library? 是
- Libraries listed:
  - file-scanner: 文件扫描和过滤 (Node.js fs/promises)
  - prompt-detector: AI提示词识别服务
  - element-analyzer: 13要素分析引擎
  - report-generator: JSON报告生成
- CLI per library: scan --help, detect --help, analyze --help, report --help
- Library docs: 是，计划llms.txt格式

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? 是
- Git commits show tests before implementation? 将确保
- Order: Contract→Integration→E2E→Unit strictly followed? 是
- Real dependencies used? 是 (真实API调用，真实文件系统)
- Integration tests for: 新库、AI API集成、JSON输出格式
- FORBIDDEN: Implementation before test, skipping RED phase

**Observability**:
- Structured logging included? 是
- Frontend logs → backend? N/A (CLI工具)
- Error context sufficient? 是

**Versioning**:
- Version number assigned? 0.1.0
- BUILD increments on every change? 是
- Breaking changes handled? N/A (首次实现)

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
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/
```

**Structure Decision**: Option 1 - 单一项目结构，适合CLI工具

## Phase 0: Outline & Research

### Research Tasks Identified:
1. **Node.js AI SDK集成**: 对比@anthropic-ai/sdk、openai、@google/generative-ai等官方SDK
2. **Node.js异步文件处理**: fs/promises、stream API、大文件处理最佳实践
3. **CLI框架选择**: commander.js vs yargs vs oclif性能和功能对比
4. **并发控制**: p-limit、p-queue等流控库，API限流策略
5. **类型安全**: TypeScript + Zod数据验证，JSON Schema生成
6. **提示词识别策略**: AI判断提示词的prompt模板设计
7. **13要素分析模板**: 结构化要素提取prompt和输出验证

正在执行Node.js版本研究任务...