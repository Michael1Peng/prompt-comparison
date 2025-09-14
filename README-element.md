# AI提示词框架要素拆分工具

## 📋 概述

这是一个基于AI的提示词框架要素拆分工具，能够将提示词智能拆分为13个标准框架要素，帮助研究者系统化分析和对比不同的AI提示词设计。

## 🎯 功能特性

- **智能要素拆分**：使用OpenAI GPT API将提示词拆分为13个框架要素
- **并发处理**：支持5个并发API调用，提高处理效率
- **完整覆盖**：确保所有13个要素字段都存在（空要素为空字符串）
- **进度显示**：实时显示处理进度和当前处理的提示词
- **统计分析**：自动统计各要素的覆盖率

## 📦 前置条件

1. Node.js 18+ 环境
2. OpenAI API密钥
3. 已完成前两步：
   - 第一步：文件发现 (`scan.js`) → `analysis/prompt-files.json`
   - 第二步：提示词提取 (`extract.js`) → `analysis/prompt-list.json`

## 🚀 快速开始

### 1. 设置API密钥

```bash
export OPENAI_API_KEY="your-api-key-here"
```

### 2. 运行要素拆分

```bash
node element.js
```

### 3. 查看结果

```bash
cat analysis/prompt-list-elements.json | jq .
```

## 📝 13个框架要素说明

1. **source_file** - 所在文件：提示词的来源文件路径
2. **role_capability** - 角色/能力：定义AI的角色或能力（如"你是..."）
3. **task_request** - 任务/请求：说明要做什么任务
4. **background_context** - 背景/情境：提供背景信息和上下文
5. **instruction_action** - 指令/行动：具体的操作步骤和指令
6. **output_specification** - 输出规格：输出格式、结构等要求
7. **examples** - 示例：提供的示例内容
8. **constraints_limitations** - 限制/约束：限制条件和约束
9. **goals_expectations** - 目标/期望：期望达到的目标和结果
10. **information** - 信息：相关信息资源
11. **evaluation_optimization** - 评估/优化：评估和优化标准
12. **adjustments** - 调整：调整机制
13. **audience** - 受众：目标受众

## 💻 命令行选项

```bash
node element.js [options]

选项：
  -V, --version              输出版本号
  -i, --input <path>         输入文件路径 (默认: analysis/prompt-list.json)
  -o, --output <path>        输出文件路径 (默认: analysis/prompt-list-elements.json)
  --model <name>             GPT模型名称 (默认: gpt-5)
  --concurrency <number>     并发处理数量 (默认: 5)
  -h, --help                 显示帮助信息
```

## 📊 输入格式

输入文件 `analysis/prompt-list.json` 格式：

```json
{
  "totalFiles": 3,
  "totalPrompts": 5,
  "prompts": [
    {
      "promptId": "prompt_001",
      "sourceFile": "docs/prompt.md",
      "content": "提示词完整内容...",
      "startLine": 10,
      "endLine": 25
    }
  ]
}
```

## 📤 输出格式

输出文件 `analysis/prompt-list-elements.json` 格式：

```json
{
  "totalPrompts": 5,
  "analysisTime": "2025-09-14T10:30:00.000Z",
  "prompts": [
    {
      "promptId": "prompt_001",
      "sourceFile": "docs/prompt.md",
      "originalContent": "原始提示词内容...",
      "elements": {
        "source_file": "docs/prompt.md",
        "role_capability": "你是一个AI助手...",
        "task_request": "帮助用户生成代码...",
        "background_context": "",
        "instruction_action": "1. 分析需求 2. 编写代码...",
        "output_specification": "输出Python代码...",
        "examples": "",
        "constraints_limitations": "使用Python 3.8+...",
        "goals_expectations": "生成高质量代码...",
        "information": "",
        "evaluation_optimization": "",
        "adjustments": "",
        "audience": "开发者"
      }
    }
  ]
}
```

## 🔧 技术架构

```
src/
├── element.js                          # CLI入口
├── models/
│   └── element_models.js              # 数据模型（PromptElement, ElementAnalysisOutput）
└── services/
    └── prompt_element_analyzer.js     # 要素分析服务
```

## 🧪 测试

运行测试：

```bash
npm test
```

测试覆盖：
- CLI合约测试：`tests/contract/test_element_cli.test.js`
- 集成测试：`tests/integration/test_element_workflow.test.js`

## 📈 性能

- 并发处理：5个API调用同时进行
- 处理速度：取决于API响应时间，通常每个提示词1-2秒
- 内存使用：轻量级，适合处理大量提示词

## ⚠️ 注意事项

1. **API配额**：注意OpenAI API的调用配额限制
2. **费用**：每次API调用会产生费用，请合理使用
3. **网络**：需要稳定的网络连接访问OpenAI API
4. **数据隐私**：提示词内容会发送到OpenAI API进行分析

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

## 🔗 相关工具

- [第一步：文件发现工具](README-scan.md)
- [第二步：提示词提取工具](README-extract.md)
- [第三步：要素拆分工具](README-element.md) (本文档)

## 📞 支持

如有问题，请提交Issue或联系维护者。

---

*基于TDD开发，MVP实现，专注核心功能*