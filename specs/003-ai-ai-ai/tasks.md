# Tasks: AI提示词文件深度分析和提取工具

**Input**: Design documents from `/specs/003-ai-ai-ai/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Extract: Node.js 18+ ESM, OpenAI SDK, Jest, 基于现有架构扩展
2. Load optional design documents: ✓
   → data-model.md: PromptDetail, PromptList
   → contracts/: CLI interface for extract.js
   → research.md: AI分析策略, 复用现有模块
   → quickstart.md: 测试场景和验证步骤
3. Generate tasks by category: ✓
   → Setup: 扩展现有项目结构
   → Tests: CLI contract test, integration tests
   → Core: prompt-reader, content-extractor, list-generator
   → Integration: 新CLI命令 extract.js
   → Polish: unit tests, performance validation
4. Apply task rules: ✓
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. SUCCESS: 15 tasks ready for execution
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup ✅ ALL COMPLETED
- [x] T001 扩展现有项目结构：创建 src/services/content_extractor.js, src/services/prompt_reader.js, src/services/list_generator.js
- [x] T002 [P] 扩展数据模型：在 src/models/data_models.js 中添加 PromptDetail, PromptList 类
- [x] T003 [P] 创建CLI命令：src/extract.js 主入口文件

## Phase 3.2: Tests First (TDD) ✅ ALL COMPLETED - READY FOR 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T004 [P] Contract test for CLI interface in tests/contract/test_extract_cli.test.js
- [x] T005 [P] Integration test for prompt extraction workflow in tests/integration/test_prompt_extraction.test.js
- [x] T006 [P] Unit test for PromptReader service in tests/unit/test_prompt_reader.test.js (2 test cases)
- [x] T007 [P] Unit test for ContentExtractor service in tests/unit/test_content_extractor.test.js (2 test cases)
- [x] T008 [P] Unit test for ListGenerator service in tests/unit/test_list_generator.test.js (2 test cases)

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [x] T009 [P] PromptDetail and PromptList data models in src/models/data_models.js
- [x] T010 [P] PromptReader service for reading first step JSON output in src/services/prompt_reader.js
- [x] T011 [P] ContentExtractor service with AI boundary detection in src/services/content_extractor.js
- [ ] T012 [P] ListGenerator service for JSON output in src/services/list_generator.js
- [ ] T013 Main CLI extract.js integrating all services

## Phase 3.4: Integration
- [ ] T014 Connect services in extract.js: PromptReader → ContentExtractor → ListGenerator
- [ ] T015 Error handling and logging: 文件处理失败时跳过并继续，统计成功和失败数量

## Phase 3.5: Polish
- [ ] T016 [P] Performance validation: 确保处理时间 < 1分钟，内存使用 < 500MB
- [ ] T017 [P] Update package.json scripts for extract command
- [ ] T018 验证quickstart.md中的完整流程

## Dependencies
- Setup (T001-T003) before Tests (T004-T008)
- Tests (T004-T008) before Implementation (T009-T012)
- Core services (T009-T012) before Integration (T013-T014)
- Implementation before Polish (T016-T018)

## Parallel Example
```bash
# Launch T004-T008 together (Tests First):
# All different files, can run in parallel
Task: "Contract test for CLI interface in tests/contract/test_extract_cli.test.js"
Task: "Integration test for prompt extraction workflow in tests/integration/test_prompt_extraction.test.js"
Task: "Unit test for PromptReader service in tests/unit/test_prompt_reader.test.js"
Task: "Unit test for ContentExtractor service in tests/unit/test_content_extractor.test.js"
Task: "Unit test for ListGenerator service in tests/unit/test_list_generator.test.js"

# Launch T009-T012 together (Core Implementation):
Task: "PromptDetail and PromptList data models in src/models/data_models.js"
Task: "PromptReader service for reading first step JSON output in src/services/prompt_reader.js"
Task: "ContentExtractor service with AI boundary detection in src/services/content_extractor.js"
Task: "ListGenerator service for JSON output in src/services/list_generator.js"
```

## Task Details

### T004: CLI Contract Test
验证基本CLI命令 `node extract.js` 能够:
- 正常情况: 读取 analysis/prompt-files.json，生成 analysis/prompt-list.json
- 边界情况: 处理输入文件不存在的情况

### T005: Prompt Extraction Integration Test
测试完整提取流程:
- 正常情况: 读取包含提示词文件的JSON，提取具体内容，生成列表JSON
- 边界情况: 处理空输入文件或无提示词文件的情况

### T006: PromptReader Unit Test
测试JSON读取功能:
- 正常情况: 解析第一步工具输出的JSON，提取promptFiles数组
- 边界情况: 处理格式错误或缺失字段的JSON文件

### T007: ContentExtractor Unit Test
测试AI提示词提取功能:
- 正常情况: 使用AI API识别文件中的多个提示词，记录位置信息
- 边界情况: 处理AI分析失败或文件读取错误

### T008: ListGenerator Unit Test
测试输出生成功能:
- 正常情况: 生成符合PromptList格式的JSON文件，包含统计信息
- 边界情况: 处理空提示词列表的输出

## Notes
- [P] tasks = different files, no dependencies
- 严格执行TDD: 先写测试，确保测试失败，再实现功能
- 每个单元测试只需要2个测试用例：正常情况 + 边界情况
- 复用现有架构: AIAnalyzer, OutputGenerator等服务模块
- 固定输入输出路径: analysis/prompt-files.json → analysis/prompt-list.json
- AI边界识别: 让AI智能判断提示词的完整性，支持单文件多提示词

## Validation Checklist
*GATE: Checked before execution*

- [x] All contracts have corresponding tests (T004)
- [x] All entities have model tasks (T009: PromptDetail, PromptList)
- [x] All tests come before implementation (T004-T008 → T009-T013)
- [x] Parallel tasks truly independent ([P] tasks use different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] TDD requirement: Each unit test has exactly 2 test cases
- [x] Based on existing architecture: reusing AIAnalyzer, OutputGenerator patterns