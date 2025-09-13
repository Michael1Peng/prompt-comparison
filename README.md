# AI 提示词分析工具 (Prompt Analyzer)

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

一个强大的 AI 驱动的提示词分析工具，用于扫描、分析和比较代码仓库中的所有提示词（prompts）。通过 15 个核心要素框架深度分析每个提示词，生成专业的对比报告。

## ✨ 核心功能

- 🔍 **智能扫描**: 递归扫描仓库，AI 智能识别包含提示词的文件
- 🧠 **深度分析**: 基于 15 个框架要素进行结构化分析
- 🌐 **多语言支持**: 自动翻译中英文提示词
- 📊 **专业报告**: 生成 HTML/Markdown/CSV/JSON 格式的对比报告
- ⚡ **高性能**: 支持并发处理、缓存机制、流式读取大文件
- 🎯 **精准识别**: 使用阿里云通义千问 AI 进行智能识别和分析

## 📋 15 要素分析框架

系统会从以下 15 个维度分析每个提示词：

| 要素 | 说明 |
|------|------|
| 所在文件 | 提示词所在的文件路径 |
| 角色能力 | AI 的身份和角色定义 |
| 任务请求 | 要完成的具体任务 |
| 背景情境 | 相关背景和使用场景 |
| 指令行动 | 具体的执行步骤和操作 |
| 输入格式 | 期望的输入数据格式 |
| 输出规格 | 期望的输出格式和结构 |
| 示例 | 输入输出示例 |
| 限制约束 | 限制条件和规则 |
| 目标期望 | 预期目标和成功标准 |
| 信息 | 需要的知识和参考信息 |
| 评估优化 | 质量评估和优化方向 |
| 调整 | 可配置的参数和选项 |
| 受众 | 目标用户和使用对象 |
| 风格要求 | 语言风格和表达方式 |

## 🚀 快速开始

### 安装

```bash
# 使用 npm 全局安装
npm install -g prompt-analyzer

# 或者从源码构建
git clone https://github.com/Michael1Peng/prompt-comparison.spec-kit.git
cd prompt-comparison.spec-kit
npm install
npm run build
npm link
```

### 配置 API 密钥

```bash
# 设置阿里云通义千问 API 密钥
export DASHSCOPE_API_KEY="your-api-key"

# 或创建配置文件
echo '{"ai": {"qwen": {"apiKey": "your-api-key"}}}' > .prompt-analyzerrc.json
```

### 基本使用

```bash
# 1. 扫描项目中的提示词文件
prompt-analyzer scan ./my-project

# 2. 分析提示词的 15 个要素
prompt-analyzer analyze ./output/scan-results.json

# 3. 生成对比报告
prompt-analyzer report ./output/analyzed-prompts.json

# 一键完成所有步骤
prompt-analyzer scan . | prompt-analyzer analyze | prompt-analyzer report
```

## 📖 命令详解

### `scan` - 扫描仓库文件

```bash
prompt-analyzer scan <path> [options]

Options:
  -o, --output <path>      输出文件路径
  -r, --recursive          递归扫描子目录 (默认: true)
  -i, --include <patterns> 包含的文件模式
  -e, --exclude <patterns> 排除的文件模式
  -f, --format <type>      输出格式 (json|csv|yaml)
  --ai-model <model>       AI识别模型 (默认: qwen-plus)
  -v, --verbose           详细输出
```

### `analyze` - 分析提示词要素

```bash
prompt-analyzer analyze <input> [options]

Options:
  -o, --output <path>      输出文件路径
  -b, --batch-size <n>     批处理大小
  -c, --concurrency <n>    并发数
  --min-confidence <n>     最小置信度阈值
  --language <lang>        目标语言 (zh|en|auto)
  -v, --verbose           详细输出
```

### `report` - 生成分析报告

```bash
prompt-analyzer report <input> [options]

Options:
  -o, --output <path>      输出文件路径
  -f, --format <type>      输出格式 (html|markdown|csv|json|pdf)
  -t, --template <type>    报告模板 (default|detailed|summary|comparison)
  -i, --include <sections> 包含的章节
  -e, --exclude <sections> 排除的章节
  -v, --verbose           详细输出
```

## 🔧 高级配置

创建 `.prompt-analyzerrc.json` 配置文件：

```json
{
  "ai": {
    "provider": "qwen",
    "qwen": {
      "apiKey": "your-api-key",
      "model": "qwen-plus"
    }
  },
  "scan": {
    "extensions": [".js", ".ts", ".py", ".md", ".txt"],
    "ignorePatterns": ["node_modules/**", ".git/**"],
    "maxFileSize": "10MB"
  },
  "analyze": {
    "batchSize": 5,
    "concurrency": 3,
    "retryCount": 2,
    "cacheEnabled": true
  },
  "output": {
    "directory": "./analysis-output",
    "format": "html",
    "includeMetadata": true
  }
}
```

## 🏗️ 项目架构

```
src/
├── cli/                 # CLI 命令实现
│   └── commands/       # 具体命令
├── models/             # 数据模型定义
├── services/           # 核心服务
│   ├── file-scanner.ts     # 文件扫描服务
│   ├── prompt-analyzer.ts  # AI 分析服务
│   └── report-generator.ts # 报告生成服务
└── lib/                # 工具库
    ├── api-utils.ts    # API 重试和并发控制
    ├── cache.ts        # 缓存机制
    ├── logger.ts       # 结构化日志
    └── stream-reader.ts # 流式文件读取
```

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行契约测试
npm run test:contract

# 运行集成测试
npm run test:integration

# 运行单元测试
npm run test:unit

# 生成测试覆盖率报告
npm run test:coverage
```

## 📊 性能特性

- **并发处理**: 支持多文件并发扫描和分析
- **智能缓存**: 两级缓存（内存+文件）减少重复 API 调用
- **流式读取**: 支持大文件流式处理，避免内存溢出
- **批量处理**: 批量调用 AI API，提高效率
- **重试机制**: 自动重试失败的 API 调用
- **进度跟踪**: 实时显示处理进度

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [阿里云通义千问](https://dashscope.aliyun.com/) - AI 分析能力支持
- [Yargs](https://yargs.js.org/) - CLI 框架
- [Vitest](https://vitest.dev/) - 测试框架

## 📮 联系方式

- 作者: Michael1Peng
- GitHub: [@Michael1Peng](https://github.com/Michael1Peng)
- 项目主页: [prompt-comparison.spec-kit](https://github.com/Michael1Peng/prompt-comparison.spec-kit)

---

⭐ 如果这个项目对你有帮助，请给一个星标支持！