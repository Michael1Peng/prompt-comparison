# Tasks: AI 提示词分析工作流

**Input**: Design documents from `/specs/001-ai-ai-ai/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Extract: Node.js 18+, Yargs CLI, Qwen API, single project structure
2. Load optional design documents ✓:
   → data-model.md: FileMetadata, PromptContent, PromptAnalysis, ProcessingLog, AnalysisReport
   → contracts/: file-scanner.json, prompt-analyzer.json, report-generator.json, cli-commands.json
   → research.md: Qwen API, fast-glob, JSON Schema, Yargs/Ora/Chalk
3. Generate tasks by category ✓:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests  
   → Core: models, services, CLI commands
   → Integration: AI API, file system, logging
   → Polish: unit tests, performance, docs
4. Apply task rules ✓:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...) ✓
6. Generate dependency graph ✓
7. Create parallel execution examples ✓
8. Validate task completeness ✓:
   → All contracts have tests ✓
   → All entities have models ✓
   → All services implemented ✓
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Single project**: `src/`, `tests/` at repository root
- Paths shown below assume single project structure per plan.md

## Phase 3.1: Setup
- [ ] T001 创建项目结构 src/{models,services,cli,lib}, tests/{contract,integration,unit}
- [ ] T002 初始化Node.js项目并安装核心依赖 (yargs, chalk, ora, fast-glob, cosmiconfig)
- [ ] T003 [P] 配置ESLint和Prettier工具 (.eslintrc.cjs, .prettierrc)
- [ ] T004 [P] 配置Vitest测试框架 (vitest.config.ts)
- [ ] T005 [P] 设置TypeScript配置 (tsconfig.json) 和路径别名

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### 契约测试 (Contract Tests)
- [ ] T006 [P] FileScanner契约测试 scanRepository方法 tests/contract/file-scanner.test.ts
- [ ] T007 [P] FileScanner契约测试 identifyPromptFiles方法 tests/contract/file-scanner-identify.test.ts  
- [ ] T008 [P] FileScanner契约测试 extractPromptContent方法 tests/contract/file-scanner-extract.test.ts
- [ ] T009 [P] PromptAnalyzer契约测试 analyzePromptElements方法 tests/contract/prompt-analyzer.test.ts
- [ ] T010 [P] PromptAnalyzer契约测试 translatePrompt方法 tests/contract/prompt-analyzer-translate.test.ts
- [ ] T011 [P] ReportGenerator契约测试 generateSummaryReport方法 tests/contract/report-generator.test.ts
- [ ] T012 [P] ReportGenerator契约测试 generateComparisonTable方法 tests/contract/report-generator-table.test.ts
- [ ] T013 [P] ReportGenerator契约测试 exportToFormat方法 tests/contract/report-generator-export.test.ts
- [ ] T014 [P] CLI命令契约测试 scan命令 tests/contract/cli-commands.test.ts
- [ ] T015 [P] CLI命令契约测试 analyze命令 tests/contract/cli-analyze.test.ts
- [ ] T016 [P] CLI命令契约测试 report命令 tests/contract/cli-report.test.ts

### 集成测试 (Integration Tests)
- [ ] T017 [P] 集成测试 完整文件扫描流程 tests/integration/full-scan.test.ts
- [ ] T018 [P] 集成测试 AI分析完整流程 tests/integration/ai-analysis.test.ts
- [ ] T019 [P] 集成测试 报告生成完整流程 tests/integration/report-generation.test.ts
- [ ] T020 [P] 集成测试 CLI端到端测试 tests/integration/cli-e2e.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### 数据模型 (Data Models)
- [ ] T021 [P] FileMetadata模型 src/models/file-metadata.ts
- [ ] T022 [P] PromptContent模型 src/models/prompt-content.ts
- [ ] T023 [P] PromptAnalysis模型 src/models/prompt-analysis.ts
- [ ] T024 [P] ProcessingLog模型 src/models/processing-log.ts
- [ ] T025 [P] AnalysisReport模型 src/models/analysis-report.ts

### 核心服务 (Core Services)
- [ ] T026 FileScanner服务 scanRepository实现 src/services/file-scanner.ts
- [ ] T027 FileScanner服务 identifyPromptFiles实现 (同文件，续T026)
- [ ] T028 FileScanner服务 extractPromptContent实现 (同文件，续T027)
- [ ] T029 [P] QianwenAnalyzer服务 基础类和API集成 src/services/qianwen-analyzer.ts
- [ ] T030 QianwenAnalyzer服务 analyzePromptElements实现 (同文件，续T029)
- [ ] T031 QianwenAnalyzer服务 translatePrompt实现 (同文件，续T030)
- [ ] T032 [P] ReportGenerator服务 generateSummaryReport实现 src/services/report-generator.ts
- [ ] T033 ReportGenerator服务 generateComparisonTable实现 (同文件，续T032)
- [ ] T034 ReportGenerator服务 exportToFormat实现 (同文件，续T033)

### CLI命令实现 (CLI Commands)
- [ ] T035 [P] CLI主入口和命令注册 src/cli/index.ts
- [ ] T036 [P] scan命令实现 src/cli/commands/scan.ts
- [ ] T037 [P] analyze命令实现 src/cli/commands/analyze.ts
- [ ] T038 [P] translate命令实现 src/cli/commands/translate.ts
- [ ] T039 [P] report命令实现 src/cli/commands/report.ts

### 库函数 (Library Functions)
- [ ] T040 [P] 文件操作工具库 src/lib/file-utils.ts
- [ ] T041 [P] JSON Schema验证库 src/lib/validators.ts
- [ ] T042 [P] 进度显示工具库 src/lib/progress.ts
- [ ] T043 [P] 错误处理工具库 src/lib/errors.ts
- [ ] T044 [P] 配置管理库 src/lib/config.ts

## Phase 3.4: Integration

### API集成 (API Integration)
- [ ] T045 集成Qwen API客户端配置和错误处理 src/services/qianwen-analyzer.ts
- [ ] T046 实现API重试机制和并发控制 src/lib/api-utils.ts
- [ ] T047 [P] 实现API调用缓存机制 src/lib/cache.ts

### 文件系统集成 (File System Integration)
- [ ] T048 实现.gitignore规则解析 src/lib/ignore-patterns.ts
- [ ] T049 [P] 实现大文件流式读取 src/lib/stream-reader.ts
- [ ] T050 [P] 实现批量文件处理队列 src/lib/batch-processor.ts

### 日志和监控 (Logging & Monitoring)
- [ ] T051 [P] 实现结构化日志系统 src/lib/logger.ts
- [ ] T052 [P] 实现处理进度跟踪 src/services/progress-tracker.ts
- [ ] T053 [P] 实现错误上报和统计 src/lib/telemetry.ts

## Phase 3.5: Polish

### 单元测试 (Unit Tests)
- [ ] T054 [P] FileUtils单元测试 tests/unit/file-utils.test.ts
- [ ] T055 [P] Validators单元测试 tests/unit/validators.test.ts
- [ ] T056 [P] Config单元测试 tests/unit/config.test.ts
- [ ] T057 [P] BatchProcessor单元测试 tests/unit/batch-processor.test.ts
- [ ] T058 [P] Cache单元测试 tests/unit/cache.test.ts

### 性能优化 (Performance)
- [ ] T059 优化文件扫描性能 (<100ms/1000文件)
- [ ] T060 优化AI批处理请求 (减少API调用次数)
- [ ] T061 优化报告生成性能 (<2秒/100提示词)

### 文档和示例 (Documentation)
- [ ] T062 [P] 编写API文档 docs/api.md
- [ ] T063 [P] 编写配置指南 docs/configuration.md
- [ ] T064 [P] 创建示例项目 examples/sample-project/
- [ ] T065 [P] 更新README.md和贡献指南

### 最终验证 (Final Validation)
- [ ] T066 执行quickstart.md中的所有示例场景
- [ ] T067 运行代码覆盖率检查 (目标>90%)
- [ ] T068 执行性能基准测试
- [ ] T069 检查并修复所有ESLint警告
- [ ] T070 发布npm包到registry

## Dependencies
- Setup (T001-T005) 必须首先完成
- Tests (T006-T020) 必须在实现前完成并失败
- Models (T021-T025) 阻塞 Services (T026-T034)
- Services (T026-T034) 阻塞 CLI (T035-T039)
- Core实现完成后才能进行Integration (T045-T053)
- 所有实现完成后进行Polish (T054-T070)

## Parallel Execution Examples

### 并行执行契约测试 (T006-T016)
```bash
# 使用Task agent并行执行所有契约测试
Task: "编写FileScanner scanRepository契约测试 tests/contract/file-scanner.test.ts"
Task: "编写FileScanner identifyPromptFiles契约测试 tests/contract/file-scanner-identify.test.ts"
Task: "编写PromptAnalyzer analyzePromptElements契约测试 tests/contract/prompt-analyzer.test.ts"
Task: "编写ReportGenerator generateSummaryReport契约测试 tests/contract/report-generator.test.ts"
Task: "编写CLI scan命令契约测试 tests/contract/cli-commands.test.ts"
```

### 并行执行数据模型创建 (T021-T025)
```bash
# 所有模型文件独立，可并行创建
Task: "创建FileMetadata模型 src/models/file-metadata.ts"
Task: "创建PromptContent模型 src/models/prompt-content.ts"
Task: "创建PromptAnalysis模型 src/models/prompt-analysis.ts"
Task: "创建ProcessingLog模型 src/models/processing-log.ts"
Task: "创建AnalysisReport模型 src/models/analysis-report.ts"
```

### 并行执行CLI命令实现 (T035-T039)
```bash
# 每个命令独立文件，可并行实现
Task: "实现CLI主入口 src/cli/index.ts"
Task: "实现scan命令 src/cli/commands/scan.ts"
Task: "实现analyze命令 src/cli/commands/analyze.ts"
Task: "实现translate命令 src/cli/commands/translate.ts"
Task: "实现report命令 src/cli/commands/report.ts"
```

## Notes
- [P] 任务表示可并行执行（不同文件，无依赖）
- 严格遵循TDD：测试必须先写且必须失败
- 每个任务完成后立即提交
- 避免：模糊任务描述，同文件冲突，跳过测试

## Validation Checklist
*GATE: 执行前必须检查*

- [x] 所有4个契约文件都有对应的测试任务
- [x] 所有5个实体都有模型任务
- [x] 所有测试任务在实现任务之前
- [x] 并行任务确实相互独立
- [x] 每个任务都指定了确切的文件路径
- [x] 没有[P]任务修改同一个文件

## 任务统计
- **总任务数**: 70个
- **Setup任务**: 5个
- **测试任务**: 15个契约测试 + 4个集成测试
- **实现任务**: 5个模型 + 9个服务 + 5个CLI + 5个库函数
- **集成任务**: 9个
- **Polish任务**: 17个

---

✅ **任务列表生成完成，准备执行Phase 3-4实现阶段**