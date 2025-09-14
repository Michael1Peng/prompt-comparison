## Output Requirements

[IMPORTANT] Always Comunicate and write docs in Chinese.
[IMPORTANT] 记得永远用中文跟我沟通和输出文档。

## Project Context

### History Context

- 第一个 spec: @specs-002.xml
- source code: @src.xml

### Current Feature: AI提示词文件深度分析和提取工具 (Branch: 003-ai-ai-ai)
- **Purpose**: 第二步工具，读取第一步输出的JSON，深度分析提取每个文件中的具体提示词内容
- **Tech Stack**: Node.js 18+ ESM, OpenAI API (gpt-5), Jest测试 (基于现有架构扩展)
- **Architecture**: 扩展现有模块 - prompt-reader, content-extractor, list-generator
- **Key Dependencies**: openai, commander, chalk, fs-extra, p-limit (复用现有依赖)

### Implementation Status
- ✅ Specification complete (specs/003-ai-ai-ai/spec.md) 
- ✅ Plan complete (specs/003-ai-ai-ai/plan.md)
- ✅ Research & design docs complete (research.md, data-model.md, contracts/, quickstart.md)
- ⏳ Next: /tasks command to generate implementation tasks

### Core Requirements Reminder  
- 读取第一步输出: analysis/prompt-files.json 作为输入
- 提取完整提示词内容，支持单文件多提示词场景
- 记录精确位置信息: sourceFile, startLine, endLine
- 输出到 analysis/prompt-list.json，包含统计信息
- 错误直接跳过，不阻塞主流程
- TDD严格执行: 测试先于实现，RED-GREEN-Refactor

### Recent Changes (Last 3)
1. 2025-09-14: Added Feature 003 - 深度分析和提取工具 (第二步)
2. 2025-09-14: Generated complete design docs for prompt content extraction  
3. 2025-09-14: Created data models for PromptDetail and PromptList output
