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
- RED-GREEN-Refactor cycle enforced? ✅ 严格执行，33个子任务每个都遵循
- Git commits show tests before implementation? ✅ 强制要求🔴→🟢→🔵提交顺序
- Order: Contract→Integration→E2E→Unit strictly followed? ✅ 已在任务序列中体现
- Real dependencies used? ✅ 真实API调用、真实文件系统、真实GPT-5集成
- Integration tests for: ✅ 核心库集成、API集成、端到端工作流、性能基准
- FORBIDDEN: ❌ 绝对禁止：实现先于测试、跳过RED阶段、测试造假

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

### Task Generation Strategy: TDD驱动的开发序列

基于TDD红-绿-重构循环，每个功能都遵循 **测试先行 → 实现 → 重构** 的严格顺序：

#### 第一阶段：核心库TDD开发 [可并行]

**1. file-scanner库开发循环**
```
1.1 🔴 编写file-scanner契约测试 (RED)
    - 测试目录遍历API契约
    - 测试文件过滤规则
    - 测试大文件处理边界
    ⏱️ 预计：30分钟

1.2 🟢 实现file-scanner核心功能 (GREEN)
    - 实现异步目录遍历
    - 实现文件类型检测
    - 实现大文件处理策略
    ⏱️ 预计：2小时

1.3 🔵 重构file-scanner代码 (REFACTOR)
    - 优化内存使用
    - 提取公共函数
    - 添加错误处理
    ⏱️ 预计：30分钟
```

**2. prompt-detector库开发循环**
```
2.1 🔴 编写prompt-detector契约测试 (RED)
    - 测试GPT-5 API集成
    - 测试提示词识别准确率
    - 测试置信度评分算法
    - 测试重试机制
    ⏱️ 预计：45分钟

2.2 🟢 实现prompt-detector核心功能 (GREEN)
    - 集成OpenAI SDK
    - 实现二进制内容过滤
    - 实现置信度评分
    - 实现API限流和重试
    ⏱️ 预计：3小时

2.3 🔵 重构prompt-detector代码 (REFACTOR)
    - 优化API调用效率
    - 抽象prompt模板
    - 改进错误处理
    ⏱️ 预计：45分钟
```

**3. element-analyzer库开发循环**
```
3.1 🔴 编写element-analyzer契约测试 (RED)
    - 测试13要素提取API
    - 测试JSON输出格式验证
    - 测试质量评估算法
    - 测试边缘情况处理
    ⏱️ 预计：60分钟

3.2 🟢 实现element-analyzer核心功能 (GREEN)
    - 实现13要素提取模板
    - 实现结构化JSON输出
    - 实现质量评估算法
    - 实现Zod数据验证
    ⏱️ 预计：4小时

3.3 🔵 重构element-analyzer代码 (REFACTOR)
    - 优化要素识别准确率
    - 重构prompt模板设计
    - 提升性能和可维护性
    ⏱️ 预计：60分钟
```

**4. report-generator库开发循环**
```
4.1 🔴 编写report-generator契约测试 (RED)
    - 测试数据聚合逻辑
    - 测试JSON报告格式
    - 测试CSV导出功能
    - 测试统计计算准确性
    ⏱️ 预计：45分钟

4.2 🟢 实现report-generator核心功能 (GREEN)
    - 实现数据聚合和统计
    - 实现JSON报告格式化
    - 实现CSV导出功能
    - 实现报告模板系统
    ⏱️ 预计：2.5小时

4.3 🔵 重构report-generator代码 (REFACTOR)
    - 优化大数据处理性能
    - 重构报告模板
    - 改进输出格式
    ⏱️ 预计：45分钟
```

#### 第二阶段：集成层TDD开发 [依赖顺序]

**5. CLI框架TDD开发**
```
5.1 🔴 编写CLI接口契约测试 (RED)
    - 测试commander.js集成
    - 测试参数解析和验证
    - 测试子命令路由
    ⏱️ 预计：30分钟

5.2 🟢 实现CLI框架 (GREEN)
    - 集成commander.js
    - 实现参数解析
    - 实现子命令系统
    ⏱️ 预计：1.5小时

5.3 🔵 重构CLI代码 (REFACTOR)
    - 优化用户体验
    - 改进帮助文档
    ⏱️ 预计：30分钟
```

**6. 配置系统TDD开发**
```
6.1 🔴 编写配置系统契约测试 (RED)
    - 测试配置文件加载
    - 测试环境变量处理
    - 测试配置验证
    ⏱️ 预计：30分钟

6.2 🟢 实现配置系统 (GREEN)
    - 实现配置文件处理
    - 实现环境变量集成
    - 实现配置验证和默认值
    ⏱️ 预计：1小时

6.3 🔵 重构配置代码 (REFACTOR)
    - 优化配置加载性能
    - 改进配置验证逻辑
    ⏱️ 预计：30分钟
```

**7. 错误处理和日志TDD开发**
```
7.1 🔴 编写错误处理契约测试 (RED)
    - 测试结构化日志输出
    - 测试错误分类和处理
    - 测试日志轮转机制
    ⏱️ 预计：45分钟

7.2 🟢 实现错误处理和日志 (GREEN)
    - 实现结构化日志系统
    - 实现错误分类和上下文
    - 实现日志文件管理
    ⏱️ 预计：2小时

7.3 🔵 重构错误处理代码 (REFACTOR)
    - 优化日志性能
    - 改进错误消息质量
    ⏱️ 预计：30分钟
```

**8. 进度跟踪UI TDD开发**
```
8.1 🔴 编写进度跟踪契约测试 (RED)
    - 测试进度条显示
    - 测试状态更新机制
    - 测试用户交互响应
    ⏱️ 预计：30分钟

8.2 🟢 实现进度跟踪UI (GREEN)
    - 实现终端进度条
    - 实现实时状态更新
    - 实现用户友好的消息
    ⏱️ 预计：1.5小时

8.3 🔵 重构进度跟踪代码 (REFACTOR)
    - 优化显示性能
    - 改进用户体验
    ⏱️ 预计：30分钟
```

#### 第三阶段：集成测试和验收 [顺序执行]

**9. 端到端集成TDD验证**
```
9.1 🔴 编写端到端集成测试 (RED)
    - 测试完整工作流程
    - 测试真实文件处理
    - 测试API集成稳定性
    ⏱️ 预计：60分钟

9.2 🟢 实现端到端集成 (GREEN)
    - 集成所有库和CLI
    - 实现完整数据流
    - 解决集成问题
    ⏱️ 预计：2小时

9.3 🔵 重构集成代码 (REFACTOR)
    - 优化整体性能
    - 改进错误恢复
    ⏱️ 预计：45分钟
```

**10. 性能基准TDD验证**
```
10.1 🔴 编写性能基准测试 (RED)
     - 测试1000+文件处理性能
     - 测试内存使用限制
     - 测试API调用效率
     ⏱️ 预计：45分钟

10.2 🟢 达成性能基准 (GREEN)
     - 优化文件处理性能
     - 优化内存使用
     - 优化API调用策略
     ⏱️ 预计：3小时

10.3 🔵 重构性能优化 (REFACTOR)
     - 细化性能监控
     - 改进资源管理
     ⏱️ 预计：60分钟
```

**11. 用户验收TDD验证**
```
11.1 🔴 编写用户验收测试 (RED)
     - 测试quickstart.md场景
     - 测试常见用例覆盖
     - 测试错误恢复能力
     ⏱️ 预计：45分钟

11.2 🟢 通过用户验收 (GREEN)
     - 修复用户体验问题
     - 完善文档和帮助
     - 确保功能完整性
     ⏱️ 预计：2小时

11.3 🔵 重构用户体验 (REFACTOR)
     - 优化CLI交互设计
     - 改进错误提示质量
     ⏱️ 预计：45分钟
```

### TDD执行策略和质量门控

#### 并行执行策略:
- **第一阶段**: 4个核心库可完全并行开发 (任务1-4)
- **第二阶段**: 集成层按依赖顺序串行 (任务5-8)
- **第三阶段**: 验收测试顺序执行 (任务9-11)

#### TDD质量门控:
```
每个子任务必须通过以下门控：

🔴 RED阶段门控:
  ✅ 测试必须失败 (确保测试有效)
  ✅ 测试覆盖所有契约要求
  ✅ 测试包含边缘情况
  ✅ 错误消息清晰明确

🟢 GREEN阶段门控:
  ✅ 所有测试必须通过
  ✅ 代码覆盖率 >= 90%
  ✅ 无重复代码 (DRY原则)
  ✅ 满足性能基准要求

🔵 REFACTOR阶段门控:
  ✅ 测试仍然全部通过
  ✅ 代码可读性提升
  ✅ 遵循SOLID原则
  ✅ 文档和注释完整
```

#### Git提交策略 (证明TDD):
```
对于每个功能，必须按顺序提交：

Commit 1: "🔴 Add failing tests for [feature]"
  - 只包含测试文件
  - 所有测试失败
  - 提交消息包含 🔴 标记

Commit 2: "🟢 Implement [feature] to pass tests"
  - 包含最小实现代码
  - 所有测试通过
  - 提交消息包含 🟢 标记

Commit 3: "🔵 Refactor [feature] for better design"
  - 重构后的优化代码
  - 测试仍然通过
  - 提交消息包含 🔵 标记
```

### 预计时间和资源分配

#### 总体时间估算:
- **第一阶段** (并行): 最长路径4小时 (element-analyzer)
- **第二阶段** (串行): 累计6.5小时
- **第三阶段** (串行): 累计6.5小时
- **总计**: ~17小时 (约2-3工作日)

#### 详细时间分解:
```
核心库开发 (并行最大值):
- file-scanner:      3小时
- prompt-detector:   4.5小时  ← 关键路径
- element-analyzer:  6小时    ← 关键路径
- report-generator:  4小时

集成层开发 (串行累计):
- CLI框架:          2.5小时
- 配置系统:         2小时
- 错误处理:         3小时
- 进度跟踪:         2.5小时

验收测试 (串行累计):
- 端到端集成:       3.75小时
- 性能基准:         5.75小时
- 用户验收:         3.5小时
```

#### 风险缓解策略:
- **API限流风险**: element-analyzer预留额外1小时调试时间
- **性能调优风险**: 性能基准预留额外2小时优化时间
- **集成问题风险**: 端到端集成预留额外1小时故障排除

### 任务输出格式 (33个子任务)

每个子任务将生成为独立的可追踪任务：

**示例任务格式**:
```
Task 1.1: 🔴 编写file-scanner契约测试 [RED]
Priority: P1 | Parallel: Yes | Estimated: 30min
Prerequisites: Phase 1设计文档
Acceptance Criteria:
- [ ] 目录遍历API测试失败
- [ ] 文件过滤规则测试失败
- [ ] 大文件边界测试失败
- [ ] 错误处理测试失败
Quality Gates: 测试失败证明、覆盖率检查
Git Strategy: 提交仅包含测试文件

Task 1.2: 🟢 实现file-scanner核心功能 [GREEN]
Priority: P1 | Parallel: Yes | Estimated: 2h
Prerequisites: Task 1.1完成
Acceptance Criteria:
- [ ] 所有Task 1.1测试通过
- [ ] 异步目录遍历实现
- [ ] 文件类型检测实现
- [ ] 大文件处理策略实现
Quality Gates: 测试通过、覆盖率>=90%
Git Strategy: 最小实现，测试全部通过

Task 1.3: 🔵 重构file-scanner代码 [REFACTOR]
Priority: P1 | Parallel: Yes | Estimated: 30min
Prerequisites: Task 1.2完成
Acceptance Criteria:
- [ ] 测试仍然全部通过
- [ ] 内存使用优化
- [ ] 代码重复消除
- [ ] 错误处理改进
Quality Gates: 测试稳定、代码质量提升
Git Strategy: 重构提交，测试保持绿色
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
- [x] Phase 2: TDD task planning complete (33个子任务定义)
- [ ] Phase 3: Tasks generated (/tasks command → tasks.md)
- [ ] Phase 4: TDD implementation complete (17小时预估)
- [ ] Phase 5: Validation passed (性能+用户验收)

**TDD Compliance Status**:
- [x] RED-GREEN-Refactor 强制执行策略 ✅
- [x] Git提交策略定义 (🔴→🟢→🔵标记)
- [x] 质量门控检查点设置
- [x] 33个子任务TDD流程设计
- [x] 测试覆盖率要求 (≥90%)
- [x] 真实依赖集成测试计划

**Constitution Gate Status**:
- [x] Initial Constitution Check: PASS (简单架构)
- [x] Post-Design Constitution Check: PASS (4库设计)
- [x] TDD Requirements Check: PASS ✅ (严格TDD流程)
- [x] All NEEDS CLARIFICATION resolved (research.md)
- [x] No complexity deviations required

**Ready for**: `/tasks` 命令生成33个TDD子任务详细规格

## TDD验证总结

### 🔴 RED-GREEN-REFACTOR 保证

每个功能的开发都严格遵循TDD三阶段循环：

1. **🔴 RED (测试先行)**：
   - 编写失败的测试，证明功能不存在
   - 确保测试覆盖所有契约要求
   - Git提交只包含测试文件

2. **🟢 GREEN (最小实现)**：
   - 编写最少代码使测试通过
   - 达到90%+代码覆盖率要求
   - Git提交包含功能实现代码

3. **🔵 REFACTOR (质量优化)**：
   - 在测试保护下改进代码质量
   - 遵循SOLID原则和最佳实践
   - Git提交包含重构后的代码

### 📊 TDD指标和追踪

- **总任务数**: 33个子任务 (11个功能 × 3个TDD阶段)
- **预计时间**: 17小时 (~2-3工作日)
- **质量要求**: 90%+测试覆盖率，100%功能契约通过
- **Git提交**: 99个TDD提交 (每个子任务3个提交)

### 🛡️ 质量保证机制

- **自动化门控**: 每个阶段都有明确的验收标准
- **真实集成**: 使用真实API、文件系统、数据库
- **性能基准**: 1000+文件处理、<500MB内存使用
- **用户验收**: quickstart.md场景全覆盖

这种严格的TDD流程确保了：
- ✅ 高质量代码（测试驱动设计）
- ✅ 完整功能覆盖（契约测试保证）
- ✅ 可维护性（重构阶段优化）
- ✅ 文档化进度（Git历史证明）

---
*TDD-Plan完成 - 严格遵循Constitution v2.1.1测试要求 | 33个子任务TDD流程就绪*