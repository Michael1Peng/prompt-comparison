# Tasks: AI提示词框架要素拆分工具

**Input**: Design documents from `/specs/004-ai-ai-ai/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Extract: Node.js 18+ ESM, OpenAI SDK, Jest, p-limit
2. Load optional design documents: ✓
   → data-model.md: PromptElement, ElementAnalysisOutput
   → contracts/cli.md: CLI interface (element.js)
   → research.md: 13个框架要素, 5个并发
   → quickstart.md: 测试场景
3. Generate tasks by category: ✓
   → Setup: 准备项目结构
   → Tests: CLI合约测试, 集成测试 (TDD)
   → Core: 数据模型, 服务实现, CLI入口
   → Integration: 端到端流程
4. Apply task rules: ✓
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. SUCCESS: 10 tasks ready for execution
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup
- [x] T001 Create project directories: src/models/, src/services/, tests/integration/
- [x] T002 [P] Create test fixture: tests/fixtures/sample-prompt-list.json

## Phase 3.2: Tests First (TDD)
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T003 [P] Contract test for CLI interface in tests/contract/test_element_cli.test.js
- [x] T004 [P] Integration test for element extraction workflow in tests/integration/test_element_workflow.test.js

## Phase 3.3: Core Implementation
- [x] T005 [P] PromptElement data model in src/models/element_models.js
- [x] T006 [P] Element analyzer service in src/services/prompt_element_analyzer.js with analyzeElements method
- [x] T007 Main CLI entry point in src/element.js integrating all services

## Phase 3.4: Integration
- [ ] T008 Handle JSON input/output in prompt_element_analyzer.js for analysis/prompt-list-elements.json

## Phase 3.5: Polish
- [ ] T009 [P] Add progress logging to element.js CLI
- [ ] T010 [P] Create README documentation for element extraction feature

## Dependencies
- Setup (T001-T002) before Tests (T003-T004)
- Tests (T003-T004) before Implementation (T005-T007)
- Core services (T005-T006) before Integration (T007-T008)
- Implementation before Polish (T009-T010)

## Parallel Example
```bash
# Launch T003-T004 together (Tests First):
Task: "Contract test for CLI interface in tests/contract/test_element_cli.test.js"
Task: "Integration test for element extraction workflow in tests/integration/test_element_workflow.test.js"

# Launch T005-T006 together (Core Implementation):
Task: "PromptElement data model in src/models/element_models.js"
Task: "Element analyzer service in src/services/prompt_element_analyzer.js"
```

## Task Details

### T003: CLI Contract Test
验证element.js CLI接口:
- 正常情况: 读取prompt-list.json，生成prompt-list-elements.json
- 边界情况: 处理缺少OPENAI_API_KEY的情况

### T004: Element Workflow Integration Test
测试完整要素拆分流程:
- 正常情况: 拆分提示词为13个要素
- 边界情况: 空要素设为空字符串

### T005: PromptElement Model
创建数据模型:
```javascript
class PromptElement {
  constructor(promptId, sourceFile, originalContent, elements)
  toJSON()
  static fromJSON(json)
}
```

### T006: Element Analyzer Service
实现要素拆分服务:
- analyzeElements(prompts) - 主方法
- 5个并发API调用 (p-limit)
- AI提示词拆分13个要素
- 返回ElementAnalysisOutput格式

### T007: CLI Entry Point
element.js实现:
- 解析命令行参数 (--input, --output, --help, --version)
- 读取analysis/prompt-list.json
- 调用prompt_element_analyzer服务
- 输出analysis/prompt-list-elements.json

### T008: JSON I/O
处理输入输出:
- 读取prompt-list.json格式
- 生成prompt-list-elements.json格式
- 包含totalPrompts, analysisTime, prompts[]

## Notes
- [P] tasks = different files, no dependencies
- 严格执行TDD: 先写测试，确保失败，再实现
- MVP最简实现: 只关注核心流程
- 使用真实OpenAI API调用
- 所有13个要素字段必须存在（可为空字符串）

## Validation Checklist
*GATE: Checked before execution*

- [x] All contracts have corresponding tests (T003)
- [x] All entities have model tasks (T005: PromptElement)
- [x] All tests come before implementation (T003-T004 → T005-T007)
- [x] Parallel tasks truly independent ([P] tasks use different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] TDD requirement: Tests must fail first