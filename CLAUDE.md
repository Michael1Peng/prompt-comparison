## Output Requirements

[IMPORTANT] Always Comunicate and write docs in Chinese.
[IMPORTANT] 记得永远用中文跟我沟通和输出文档。

## Project Context

### Current Feature: AI提示词文件发现和汇总工具 (Branch: 002-ai-ai-ai)
- **Purpose**: MVP工具，扫描Git仓库识别AI提示词文件，生成JSON分析报告
- **Tech Stack**: Node.js 18+ ESM, OpenAI API (gpt-5), Jest测试
- **Architecture**: 模块化设计 - file-scanner, ai-analyzer, output-generator
- **Key Dependencies**: openai, commander, chalk, fs-extra, ignore, p-limit

### Implementation Status
- ✅ Specification complete (specs/002-ai-ai-ai/spec.md) 
- ✅ Plan complete (specs/002-ai-ai-ai/plan.md)
- ✅ Research & design docs complete
- ⏳ Next: /tasks command to generate implementation tasks

### Core Requirements Reminder
- TDD严格执行: 测试先于实现，RED-GREEN-Refactor
- 5个并发API调用处理文件
- 支持常见文本格式: .md, .txt, .js, .py, .json, .yaml, .ts
- JSON输出到 ./analysis/ 目录
- CLI界面with进度条和详细错误处理

### Recent Changes (Last 3)
1. 2025-09-13: Updated research to use GPT-5 (released Aug 2025) instead of gpt-3.5-turbo
2. 2025-09-13: Generated implementation plan with Phase 0-1 complete  
3. 2025-09-13: Added research, data-model, contracts, and quickstart docs
