# Tasks: AI提示词深度分析和提取工具

**Input**: Design documents from `/specs/003-ai-ai-ai/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Extract: Node.js 18+ ESM, OpenAI SDK, Jest
2. Load optional design documents: ✓
   → data-model.md: PromptDetail, PromptList
   → contracts/: CLI interface
   → research.md: GPT-5智能识别, 5个并发
3. Generate tasks by category: ✓
   → Setup: 准备测试环境
   → Core: 数据模型 + 集成测试
   → Services: 提取服务 + 集成测试
   → CLI: 命令行接口 + 集成测试
   → Polish: 最终验证
4. Apply task rules: ✓
   → 每个实现后立即测试
   → TDD: 测试先于实现
5. SUCCESS: 16 tasks ready for execution
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions
- 每个代码步骤后跟随对应集成测试

## Phase 3.1: Setup
- [x] T001 创建项目基础目录结构：src/models/, src/services/, tests/integration/
- [x] T002 准备测试数据文件：创建 tests/fixtures/ 目录和示例 prompt-files.json

## Phase 3.2: 数据模型实现与测试
- [ ] T003 创建 PromptDetail 和 PromptList 数据模型在 src/models/prompt_models.js
- [ ] T004 编写集成测试验证数据模型在 tests/integration/test_models.test.js (必须先失败)

## Phase 3.3: 提取服务核心功能
- [ ] T005 创建 prompt_extractor.js 基础结构在 src/services/prompt_extractor.js
- [ ] T006 编写集成测试验证文件读取功能在 tests/integration/test_file_reading.test.js

## Phase 3.4: AI分析功能实现
- [ ] T007 实现 AI 提示词识别功能在 prompt_extractor.js 的 analyzePrompts 方法
- [ ] T008 编写集成测试验证 AI 分析功能在 tests/integration/test_ai_analysis.test.js

## Phase 3.5: 行号定位功能
- [ ] T009 实现行号定位功能在 prompt_extractor.js 的 locateLineNumbers 方法
- [ ] T010 编写集成测试验证行号定位在 tests/integration/test_line_location.test.js

## Phase 3.6: JSON输出功能
- [ ] T011 实现 JSON 输出功能在 prompt_extractor.js 的 generateOutput 方法
- [ ] T012 编写集成测试验证输出格式在 tests/integration/test_json_output.test.js

## Phase 3.7: CLI接口实现
- [ ] T013 创建 extract.js CLI 入口文件在 src/extract.js
- [ ] T014 编写端到端集成测试在 tests/integration/test_extract_workflow.test.js

## Phase 3.8: 错误处理和统计
- [ ] T015 实现错误处理和统计功能在 prompt_extractor.js
- [ ] T016 编写集成测试验证错误处理在 tests/integration/test_error_handling.test.js

## Dependencies
- Setup (T001-T002) 必须首先完成
- 数据模型 (T003-T004) → 服务实现 (T005-T012)
- 服务完成后 → CLI接口 (T013-T014)
- 最后完成错误处理 (T015-T016)

## 测试驱动开发(TDD)流程说明
```bash
# 每个测试步骤的执行方式：
1. 先写测试（T004, T006, T008, T010, T012, T014, T016）
2. 运行测试，确保失败（RED）
3. 实现对应功能（T003, T005, T007, T009, T011, T013, T015）
4. 运行测试，确保通过（GREEN）
5. 重构代码（如需要）
```

## 并行执行示例
由于采用"实现-测试"交替模式，大部分任务需要串行执行。但以下可以并行：

```bash
# 初始设置可并行
Task T001 & Task T002

# 各模块的初始结构可并行创建
Task T003 & Task T005
```

## Task Details

### T003-T004: 数据模型
- 创建 PromptDetail 类：promptId, sourceFile, content, startLine, endLine
- 创建 PromptList 类：totalFiles, totalPrompts, processingStats, prompts[]
- 测试数据结构的创建和验证

### T005-T006: 文件读取
- 读取 analysis/prompt-files.json
- 解析 scanResult.promptFiles 数组
- 并发读取文件内容（5个并发）

### T007-T008: AI分析
- 调用 OpenAI GPT-5 API
- 识别文件中的独立提示词块
- 返回提示词内容数组

### T009-T010: 行号定位
- 将文件内容按行分割
- 定位每个提示词的起始和结束行号
- 支持多个提示词块的定位

### T011-T012: JSON输出
- 生成符合规格的 PromptList JSON
- 包含统计信息和错误记录
- 输出到 analysis/prompt-list.json

### T013-T014: CLI接口
- 命令行参数解析
- 环境变量检查（OPENAI_API_KEY）
- 调用核心服务并显示进度

### T015-T016: 错误处理
- 捕获和记录单个文件处理错误
- 继续处理其他文件
- 在 processingStats.errors 中记录所有错误

## Notes
- MVP最简实现，只关注核心流程
- 严格执行集成测试TDD
- 每个实现步骤后立即验证
- 使用真实文件系统和API调用
- 固定5个并发处理

## Validation Checklist
*GATE: Checked before execution*

- [x] 所有核心功能都有对应测试
- [x] 测试在实现之前或紧随其后
- [x] 数据模型对应 data-model.md
- [x] CLI接口对应 contracts/cli.md
- [x] 每个任务指定确切文件路径
- [x] TDD流程：测试必须先失败