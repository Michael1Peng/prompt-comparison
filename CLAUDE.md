## Output Requirements

[IMPORTANT] Always Comunicate and write docs in Chinese.
[IMPORTANT] 记得永远用中文跟我沟通和输出文档。

## Project Context

### History Context

- 第一个 spec: @specs-002.xml
- 第二个 spec: @specs-003.xml
- source code: @src.xml

### Current Feature: AI提示词框架要素拆分工具 (Branch: 004-ai-ai-ai)
- **Purpose**: 第三步MVP工具，拆分提示词为13个标准框架要素
- **Tech Stack**: Node.js 18+ ESM, OpenAI API (gpt-5), Jest测试
- **Architecture**: 新增模块 - prompt_element_analyzer服务
- **Key Dependencies**: openai, fs-extra, p-limit (复用现有)

### Implementation Status
- ✅ Requirements clarified (specs/004-ai-ai-ai/spec.md)
- ✅ Plan complete (specs/004-ai-ai-ai/plan.md)
- ✅ Research & design docs complete
- ⏳ Next: /tasks command to generate implementation tasks

### Core Requirements Reminder
- MVP最简实现: 只关注核心流程能跑通
- 集成测试TDD: 先写集成测试，RED-GREEN流程
- 5个并发API调用拆分要素
- 输入: analysis/prompt-list.json，输出: analysis/prompt-list-elements.json
- AI智能拆分13个框架要素，空要素设为空字符串

### Recent Changes (Last 3)
1. 2025-09-14: Clarified requirements for element extraction feature (第三步)
2. 2025-09-14: Generated plan for third step implementation
3. 2025-09-14: Created research, data-model, contracts docs for element extraction
