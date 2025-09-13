# Tasks: AI 提示词分析工作流

**Input**: Design documents from `/specs/001-ai-ai-ai/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech Stack: Node.js 18+, Commander.js, TypeScript, GPT-5, Zod, Jest
   → Structure: Single project with 4 core libraries
   → Libraries: file-scanner, prompt-detector, element-analyzer, report-generator
2. Load design documents:
   → data-model.md: 5 entities → model tasks
   → contracts/: CLI interface, API schema → contract test tasks
   → research.md: Technology decisions → setup tasks
3. Generate tasks by TDD category:
   → Setup: Project init, dependencies, tooling
   → Tests: Contract tests, integration tests (RED phase)
   → Core: Library implementations (GREEN phase)
   → Refactor: Code quality improvements (REFACTOR phase)
   → Integration: End-to-end workflow
   → Polish: Performance, documentation
4. Apply TDD rules:
   → Tests MUST fail before implementation
   → Each feature follows RED → GREEN → REFACTOR
   → Parallel [P] for different files/libraries
   → Sequential for dependent tasks
5. Number tasks sequentially (T001-T033)
6. Generate TDD execution examples
```

## Format: `[ID] [P?] Description [TDD Phase]`
- **[P]**: Can run in parallel (different files, no dependencies)
- **TDD Phases**: [RED] Tests fail → [GREEN] Minimal implementation → [REFACTOR] Quality improvements

## Path Conventions
Single project structure at repository root:
```
src/
├── models/          # Data models and validation
├── services/        # Core business logic libraries
├── cli/            # Commander.js CLI interface
└── utils/          # Shared utilities

tests/
├── contract/       # Contract tests (API/CLI interface)
├── integration/    # End-to-end workflow tests
└── unit/          # Individual component tests
```

## Phase 3.1: Project Setup
- [ ] T001 Create Node.js project structure with TypeScript configuration
- [ ] T002 Install core dependencies (commander, openai, zod, jest) and configure tooling
- [ ] T003 [P] Configure ESLint, Prettier, and Git hooks for code quality

## Phase 3.2: Library Contract Tests (RED Phase) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### File Scanner Library Tests
- [ ] T004 [P] Contract test for file scanning API in tests/contract/test_file_scanner.js
- [ ] T005 [P] Contract test for file filtering rules in tests/contract/test_file_filters.js
- [ ] T006 [P] Contract test for large file handling in tests/contract/test_large_files.js

### Prompt Detector Library Tests
- [ ] T007 [P] Contract test for GPT-5 API integration in tests/contract/test_prompt_detector.js
- [ ] T008 [P] Contract test for confidence scoring in tests/contract/test_confidence_score.js
- [ ] T009 [P] Contract test for retry mechanisms in tests/contract/test_api_retry.js

### Element Analyzer Library Tests
- [ ] T010 [P] Contract test for 13-elements extraction in tests/contract/test_element_analyzer.js
- [ ] T011 [P] Contract test for JSON output validation in tests/contract/test_json_output.js
- [ ] T012 [P] Contract test for quality assessment in tests/contract/test_quality_score.js

### Report Generator Library Tests
- [ ] T013 [P] Contract test for data aggregation in tests/contract/test_report_generator.js
- [ ] T014 [P] Contract test for CSV export functionality in tests/contract/test_csv_export.js

### CLI Interface Tests
- [ ] T015 [P] Contract test for main command interface in tests/contract/test_cli_main.js
- [ ] T016 [P] Contract test for subcommands (scan, detect, analyze) in tests/contract/test_cli_subcommands.js

## Phase 3.3: Core Library Implementation (GREEN Phase - ONLY after tests are failing)

### File Scanner Library Implementation
- [ ] T017 [P] Implement file scanning service in src/services/file-scanner.js
- [ ] T018 [P] Implement file filtering logic in src/utils/file-filters.js
- [ ] T019 [P] Implement large file handling in src/utils/stream-processor.js

### Prompt Detector Library Implementation
- [ ] T020 [P] Implement GPT-5 API client in src/services/prompt-detector.js
- [ ] T021 [P] Implement confidence scoring algorithm in src/utils/confidence-calculator.js
- [ ] T022 [P] Implement API retry logic in src/utils/api-retry.js

### Element Analyzer Library Implementation
- [ ] T023 [P] Implement 13-elements analyzer in src/services/element-analyzer.js
- [ ] T024 [P] Implement JSON output formatter in src/utils/json-formatter.js
- [ ] T025 [P] Implement quality assessment in src/utils/quality-evaluator.js

### Report Generator Library Implementation
- [ ] T026 [P] Implement report aggregation in src/services/report-generator.js
- [ ] T027 [P] Implement CSV export functionality in src/utils/csv-exporter.js

## Phase 3.4: CLI and Integration (GREEN Phase continued)
- [ ] T028 Implement main CLI interface using Commander.js in src/cli/main.js
- [ ] T029 Implement configuration system in src/services/config-manager.js
- [ ] T030 Implement error handling and logging in src/utils/logger.js

## Phase 3.5: Integration Tests and Workflow (RED-GREEN-REFACTOR)
- [ ] T031 [P] End-to-end integration test for complete workflow in tests/integration/test_full_workflow.js
- [ ] T032 [P] Performance benchmark tests (<30s for 1000 files) in tests/integration/test_performance.js

## Phase 3.6: Code Quality and Polish (REFACTOR Phase)
- [ ] T033 [P] Refactor all libraries for optimal performance and maintainability

## Dependencies
**Strict TDD Order Requirements:**
- Contract Tests (T004-T016) MUST complete and FAIL before implementation (T017-T030)
- T017-T019 (file-scanner) can run in parallel
- T020-T022 (prompt-detector) can run in parallel
- T023-T025 (element-analyzer) can run in parallel
- T026-T027 (report-generator) can run in parallel
- T028 depends on T017-T027 (CLI needs all libraries)
- T029-T030 support all libraries
- T031-T032 depend on complete implementation (T017-T030)
- T033 refactoring comes after all GREEN phase tasks

## Parallel Execution Examples

### Phase 3.2 - Contract Tests (can run simultaneously):
```bash
# Launch all contract tests in parallel:
Task: "Contract test for file scanning API in tests/contract/test_file_scanner.js"
Task: "Contract test for GPT-5 API integration in tests/contract/test_prompt_detector.js"
Task: "Contract test for 13-elements extraction in tests/contract/test_element_analyzer.js"
Task: "Contract test for data aggregation in tests/contract/test_report_generator.js"
Task: "Contract test for main command interface in tests/contract/test_cli_main.js"
```

### Phase 3.3 - Library Implementation (can run simultaneously by library):
```bash
# File scanner library:
Task: "Implement file scanning service in src/services/file-scanner.js"
Task: "Implement file filtering logic in src/utils/file-filters.js"
Task: "Implement large file handling in src/utils/stream-processor.js"

# Prompt detector library:
Task: "Implement GPT-5 API client in src/services/prompt-detector.js"
Task: "Implement confidence scoring algorithm in src/utils/confidence-calculator.js"
Task: "Implement API retry logic in src/utils/api-retry.js"
```

## TDD Quality Gates

### RED Phase Gates (Tests MUST fail):
- [ ] Test fails for correct reasons (not syntax errors)
- [ ] Test covers all contract requirements
- [ ] Test includes edge cases and error conditions
- [ ] Error messages are clear and descriptive

### GREEN Phase Gates (Minimal implementation):
- [ ] All contract tests pass
- [ ] Code coverage ≥ 90% for implemented features
- [ ] No code duplication (DRY principle)
- [ ] Performance meets basic requirements

### REFACTOR Phase Gates (Quality improvements):
- [ ] All tests still pass after refactoring
- [ ] Code readability and maintainability improved
- [ ] SOLID principles followed
- [ ] Documentation and comments complete

## Git Commit Strategy (Proving TDD)
For each library/feature, commits MUST follow this pattern:

```bash
# RED commits (tests fail)
Commit 1: "🔴 Add failing contract tests for file-scanner API"
Commit 2: "🔴 Add failing tests for prompt detection confidence scoring"

# GREEN commits (tests pass)
Commit 3: "🟢 Implement file-scanner to pass contract tests"
Commit 4: "🟢 Implement prompt detector with confidence scoring"

# REFACTOR commits (improve quality)
Commit 5: "🔵 Refactor file-scanner for better performance and readability"
Commit 6: "🔵 Refactor prompt detector error handling and API efficiency"
```

## Success Criteria
Upon completion, the system should deliver:
- **File Processing**: Scan 1000+ files in <30 seconds
- **Prompt Detection**: >95% accuracy with confidence scoring
- **Element Analysis**: Extract all 13 framework elements with >90% completeness
- **Report Generation**: JSON and CSV formats with performance metrics
- **Quality Assurance**: 90%+ test coverage, all TDD gates passed
- **User Experience**: Interactive CLI with progress bars and detailed logging

## Validation Checklist
*GATE: Checked before task execution*

- [x] All contracts have corresponding tests (T004-T016)
- [x] All libraries have implementation tasks (T017-T027)
- [x] All tests come before implementation (RED → GREEN → REFACTOR)
- [x] Parallel tasks are truly independent (different files/libraries)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] TDD workflow strictly enforced with Git commit strategy
- [x] 33 tasks total following 11 feature × 3 TDD phase structure

---
*33 TDD-driven tasks ready for execution | Estimated: 17 hours over 2-3 days*