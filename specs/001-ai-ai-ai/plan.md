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

✅ **Research完成** - 详见 `research.md`

## Phase 1: Design & Contracts

✅ **已完成** - 2025-09-13

### Generated Artifacts:

1. **数据模型设计** (`data-model.md`):
   - 5个核心实体: PromptFile, PromptContent, PromptElements, AnalysisReport, ProcessingLog
   - 13要素结构化定义
   - TypeScript接口和验证规则

2. **API契约定义** (`contracts/`):
   - CLI接口规范 (`cli-interface.md`)
   - JSON Schema定义 (`api-schema.json`)
   - 标准输入输出格式

3. **快速开始指南** (`quickstart.md`):
   - 15分钟上手流程
   - 基本和高级使用示例
   - 故障排除指南

4. **Claude Code配置更新** (`CLAUDE.md`):
   - 添加技术栈信息
   - 13要素框架说明
   - 项目状态跟踪

### 架构决策:
- **二阶段分析**: 识别 → 深度分析，节省50%成本
- **并发控制**: p-limit(10) + 指数退避重试
- **数据验证**: Zod运行时验证 + JSON Schema
- **错误处理**: 结构化日志 + 详细错误上下文

## Phase 2: Task Planning Approach

✅ **策略定义完成** - 此阶段由/tasks命令执行

### Task Generation Strategy:
从Phase 1设计文档自动生成任务序列：

**核心库任务** (并行执行标记[P]):
1. **file-scanner库** [P]
   - 递归目录遍历
   - 文件类型检测
   - 大文件处理策略

2. **prompt-detector库** [P]
   - GPT-5集成
   - 二进制内容过滤
   - 置信度评分

3. **element-analyzer库** [P]
   - 13要素提取模板
   - 结构化JSON输出
   - 质量评估算法

4. **report-generator库** [P]
   - 数据聚合和统计
   - JSON报告格式化
   - CSV导出功能

**集成任务** (依赖顺序):
5. CLI框架搭建 (commander.js)
6. 配置文件处理
7. 错误处理和日志
8. 进度跟踪UI
9. 端到端集成

**测试任务** (TDD红绿重构):
10. 契约测试套件 (每个API)
11. 集成测试 (真实文件+API)
12. 性能基准测试
13. 端到端验收测试

### Ordering Strategy:
- **P1**: 并行开发核心库 (任务1-4)
- **P2**: 串行集成 (任务5-9)
- **P3**: 测试驱动验证 (任务10-13)

### Estimated Output:
13个详细任务，预计开发时间2-3天

**任务模板示例**:
```
Task 1: 实现file-scanner库 [P]
- TDD: 编写契约测试
- 实现: 异步目录遍历
- 验证: 处理1000+文件基准
- 集成: CLI接口暴露
```

## Complexity Tracking

无复杂性偏离 - 所有设计遵循Constitution原则:
- ✅ 单一项目结构
- ✅ 直接使用框架API
- ✅ 简单数据模型
- ✅ 4个独立库，职责清晰

## Progress Tracking

**Phase Status**:
- [x] Phase 0: Research complete (research.md)
- [x] Phase 1: Design complete (data-model.md, contracts/, quickstart.md)
- [x] Phase 2: Task planning approach defined
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS (简单架构)
- [x] Post-Design Constitution Check: PASS (4库设计)
- [x] All NEEDS CLARIFICATION resolved (research.md)
- [x] No complexity deviations required

**Ready for**: `/tasks` 命令生成具体实现任务

---
*Plan完成 - 基于Constitution v2.1.1原则 | 所有设计文档已生成*