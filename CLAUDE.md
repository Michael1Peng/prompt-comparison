我当前在设计一套 AI agent 分析当前代码仓库里面所有提示词的工作流。

@./brainstorm/ 这个目录下面有大量的针对这个提示词对比平台的脑爆内容，包括了产品和技术两个层次的一些讨论过程的思考。
当前脑暴的文案内容还是要保持在 @./brainstorm/ 文件夹下面

之前实现过的历史 Demo 相关的提示词和对应的一些脚本，可以参考里面的 思路: @history.xml

## 当前项目状态 (2025-09-13)

### 功能分支: 001-ai-ai-ai
- **状态**: Phase 1 设计完成，准备进入任务创建阶段
- **核心功能**: AI 提示词分析工作流系统
- **技术栈**: Node.js + Yargs CLI + Qwen API + 多格式输出

### 技术架构决策
- **主要编程语言**: Node.js 18+
- **CLI框架**: Yargs (处理复杂命令结构)
- **AI服务**: 阿里云通义千问 (qwen-plus模型)
- **数据存储**: JSON文件 + 模块化Schema设计
- **输出格式**: HTML, Markdown, CSV, JSON
- **测试框架**: Vitest

### 核心工作流程
1. **文件扫描** (`scan`): 递归扫描仓库，AI智能识别提示词文件
2. **要素分析** (`analyze`): 15个框架要素的结构化分析
3. **内容翻译** (`translate`): 中英文翻译支持
4. **报告生成** (`report`): 生成对比表格和分析报告

### 15个分析要素框架
所在文件 | 角色/能力 | 任务/请求 | 背景/情境 | 指令/行动 | 输入格式 | 输出规格 | 示例 | 
限制/约束 | 目标/期望 | 信息 | 评估/优化 | 调整 | 受众 | 风格要求

### 已完成的设计文档
- `specs/001-ai-ai-ai/research.md`: 技术调研报告
- `specs/001-ai-ai-ai/data-model.md`: 数据模型设计
- `specs/001-ai-ai-ai/contracts/`: API契约定义
- `specs/001-ai-ai-ai/quickstart.md`: 快速开始指南

### 现有可复用代码
- `translate.js`: QianwenTranslator类 (翻译功能)
- `analyze-prompt.js`: 15要素分析逻辑 (需要重构)
- `generate-tables.js`: HTML/Markdown表格生成

### 下一步行动
- 运行 `/tasks` 命令生成具体实现任务列表
- 按照TDD原则先编写测试，后实现功能
- 重构现有代码为库结构 (src/lib/)

[IMPORTANT] Always Comunicate and write docs in Chinese.
[IMPORTANT] 记得永远用中文跟我沟通和输出文档。