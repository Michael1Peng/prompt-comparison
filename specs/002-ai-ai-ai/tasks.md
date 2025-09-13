# Tasks: AI提示词文件发现和汇总工具

**Input**: Design documents from `/specs/002-ai-ai-ai/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Extract: Node.js 18+ ESM, OpenAI SDK, Jest
2. Load optional design documents: ✓
   → data-model.md: PromptFile, ScanResult
   → contracts/: CLI interface
   → research.md: GPT-5, TDD requirements  
3. Generate tasks by category: ✓
   → Setup: Node.js project, dependencies
   → Tests: CLI contract test, integration tests
   → Core: scanner, analyzer, output generator
   → Integration: main CLI entry point
   → Polish: unit tests
4. Apply task rules: ✓
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. SUCCESS: 15 tasks ready for execution
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup ✅ COMPLETED
- [x] T001 Create project structure: src/, tests/, analysis/ directories
- [x] T002 Initialize Node.js ESM project with package.json and dependencies (openai, jest)
- [x] T003 [P] Configure Jest testing framework in jest.config.js

## Phase 3.2: Tests First (TDD) ✅ COMPLETED - ALL TESTS FAILING AS REQUIRED
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T004 [P] Contract test for CLI interface in tests/contract/test_cli.test.js
- [x] T005 [P] Integration test for file scanning workflow in tests/integration/test_scan_workflow.test.js
- [x] T006 [P] Unit test for file scanner in tests/unit/test_file_scanner.test.js (2 test cases)
- [x] T007 [P] Unit test for AI analyzer in tests/unit/test_ai_analyzer.test.js (2 test cases)
- [x] T008 [P] Unit test for output generator in tests/unit/test_output_generator.test.js (2 test cases)

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [x] T009 [P] PromptFile and ScanResult data models in src/models/data_models.js
- [x] T010 [P] File scanner service with .gitignore support in src/services/file_scanner.js
- [x] T011 [P] AI analyzer service with GPT-5 integration in src/services/ai_analyzer.js
- [x] T012 [P] Output generator service for JSON output in src/services/output_generator.js
- [x] T013 Main CLI entry point integrating all services in src/scan.js

## Phase 3.4: Integration ✅ COMPLETED
- [x] T014 Create analysis/ directory and handle JSON output to ./analysis/prompt-files.json

## Phase 3.5: Polish ✅ COMPLETED  
- [x] T015 [P] Create basic usage documentation in README.md

## Dependencies
- Setup (T001-T003) before Tests (T004-T008)
- Tests (T004-T008) before Implementation (T009-T012)
- Core services (T009-T012) before Integration (T013-T014)
- Implementation before Polish (T015)

## Parallel Example
```bash
# Launch T004-T008 together (Tests First):
# All different files, can run in parallel
Task: "Contract test for CLI interface in tests/contract/test_cli.test.js"
Task: "Integration test for file scanning workflow in tests/integration/test_scan_workflow.test.js" 
Task: "Unit test for file scanner in tests/unit/test_file_scanner.test.js"
Task: "Unit test for AI analyzer in tests/unit/test_ai_analyzer.test.js"
Task: "Unit test for output generator in tests/unit/test_output_generator.test.js"

# Launch T009-T012 together (Core Implementation):
Task: "PromptFile and ScanResult data models in src/models/data_models.js"
Task: "File scanner service with .gitignore support in src/services/file_scanner.js"
Task: "AI analyzer service with GPT-5 integration in src/services/ai_analyzer.js"
Task: "Output generator service for JSON output in src/services/output_generator.js"
```

## Task Details

### T004: CLI Contract Test
验证基本CLI命令 `node scan.js` 能够:
- 正常情况: 生成 analysis/prompt-files.json 文件
- 边界情况: 处理缺少OPENAI_API_KEY的情况

### T005: Scan Workflow Integration Test
测试完整扫描流程:
- 正常情况: 扫描包含提示词的测试文件，验证JSON输出格式
- 边界情况: 扫描空目录，验证空结果输出

### T006: File Scanner Unit Test
测试文件扫描功能:
- 正常情况: 扫描Git仓库，遵循.gitignore规则，过滤文本文件
- 边界情况: 处理无.gitignore文件的情况

### T007: AI Analyzer Unit Test  
测试GPT-5分析功能:
- 正常情况: 识别包含提示词的文件内容，返回PromptFile对象
- 边界情况: 处理不包含提示词的文件

### T008: Output Generator Unit Test
测试JSON输出功能:
- 正常情况: 生成符合ScanResult格式的JSON文件
- 边界情况: 处理空的提示词文件列表

## Notes
- [P] tasks = different files, no dependencies
- 严格执行TDD: 先写测试，确保测试失败，再实现功能
- 每个单元测试只需要2个测试用例：正常情况 + 边界情况
- 输出目录固定为 ./analysis/prompt-files.json
- 使用GPT-5 API进行提示词识别

## Validation Checklist
*GATE: Checked before execution*

- [x] All contracts have corresponding tests (T004)
- [x] All entities have model tasks (T009: PromptFile, ScanResult)
- [x] All tests come before implementation (T004-T008 → T009-T013)
- [x] Parallel tasks truly independent ([P] tasks use different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] TDD requirement: Each unit test has exactly 2 test cases