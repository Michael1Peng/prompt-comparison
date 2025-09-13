# Research: AI提示词文件发现和汇总工具

## 核心技术选型

### OpenAI API选择
**Decision**: 使用 gpt-5  
**Rationale**: 最新发布，提示词识别准确度最高

### Node.js架构
**Decision**: 简单的ESM模块  
**Rationale**: 现代标准，支持top-level await

### 核心依赖
1. **openai**: API调用
2. **fs**: 文件读取（Node.js内置）
3. **path**: 路径处理（Node.js内置）

### 文件过滤策略
**Decision**: 基于扩展名白名单过滤文本文件  
**Rationale**: 只处理可能包含提示词的文本文件，避免处理二进制文件

### Git规则支持
**Decision**: 遵循 `.gitignore` 规则  
**Rationale**: 避免处理不应该被版本控制的文件

### MVP范围
- ✅ 扫描Git仓库文件（遵循.gitignore）
- ✅ 过滤文本文件（.md, .txt, .js, .py等）
- ✅ 调用GPT-5识别提示词
- ✅ 输出JSON到 `./analysis/` 目录
- ✅ TDD测试（每个函数只需2个用例）
- ❌ 复杂错误处理（后续版本）
- ❌ 并发控制（后续版本）
- ❌ 进度条显示（后续版本）