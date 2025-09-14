# Quick Start: AI提示词深度分析工具

## 前置条件
确保已完成第一步文件发现，存在 `analysis/prompt-files.json` 文件。

## 3步快速开始

### 1. 设置API密钥
```bash
export OPENAI_API_KEY="your-api-key-here"
```

### 2. 运行提取
```bash
node extract.js
```

### 3. 查看结果
```bash
cat analysis/prompt-list.json | jq .
```

## 预期输出示例
```json
{
  "totalFiles": 3,
  "totalPrompts": 7,
  "processingStats": {
    "successfulFiles": 3,
    "failedFiles": 0,
    "errors": []
  },
  "analysisTime": "2025-09-14T10:30:00Z",
  "prompts": [
    {
      "promptId": "prompt_001",
      "sourceFile": "docs/ai-prompt.md",
      "content": "You are an AI assistant...",
      "startLine": 10,
      "endLine": 25
    },
    {
      "promptId": "prompt_002",
      "sourceFile": "docs/ai-prompt.md",
      "content": "Generate a Python function...",
      "startLine": 30,
      "endLine": 35
    }
  ]
}
```

## 基本验证
```bash
# 检查输出文件
ls -la analysis/prompt-list.json

# 验证JSON格式
cat analysis/prompt-list.json | jq '.totalPrompts'

# 查看提取的第一个提示词
cat analysis/prompt-list.json | jq '.prompts[0]'

# 统计每个文件的提示词数量
cat analysis/prompt-list.json | jq '.prompts | group_by(.sourceFile) | map({file: .[0].sourceFile, count: length})'
```

## 集成测试TDD要求
- 先写集成测试，验证端到端流程
- 测试必须先失败（RED）
- 实现功能使测试通过（GREEN）
- 只需要最少的测试覆盖核心流程