## Output Requirements

[IMPORTANT] Always Comunicate and write docs in Chinese.
[IMPORTANT] 记得永远用中文跟我沟通和输出文档。

## Project Context

### History Context

- 第一个 spec: @specs-002.xml
- 第二个 spec: @specs-003.xml
- source code: @src.xml

### Current Feature: AI提示词深度分析和提取工具 (Branch: 003-ai-ai-ai)
- **Purpose**: 第二步MVP工具，读取已识别文件，AI智能提取具体提示词内容块
- **Tech Stack**: Node.js 18+ ESM, OpenAI API (gpt-5), Jest测试
- **Architecture**: 扩展现有模块 - prompt_extractor服务
- **Key Dependencies**: openai, fs-extra, p-limit (复用现有)

### Implementation Status
- ✅ Requirements clarified (specs/003-ai-ai-ai/spec.md)
- ✅ Plan complete (specs/003-ai-ai-ai/plan.md)
- ✅ Research & design docs complete
- ⏳ Next: /tasks command to generate implementation tasks

### Core Requirements Reminder
- MVP最简实现: 只关注核心流程能跑通
- 集成测试TDD: 先写集成测试，RED-GREEN流程
- 5个并发文件读取和API调用
- 输入: analysis/prompt-files.json，输出: analysis/prompt-list.json
- AI智能识别提示词块，记录行号位置

### Recent Changes (Last 3)
1. 2025-09-14: Clarified requirements for prompt extraction feature
2. 2025-09-14: Generated plan for second step implementation
3. 2025-09-14: Created research, data-model, contracts docs for prompt extraction
