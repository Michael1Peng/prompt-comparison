# Quick Start: AI提示词框架要素拆分工具

## 前置条件
确保已完成第二步提示词提取，存在 `analysis/prompt-list.json` 文件。

## 3步快速开始

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

## 预期输出示例
```json
{
  "totalPrompts": 3,
  "analysisTime": "2025-09-14T10:30:00Z",
  "prompts": [
    {
      "promptId": "prompt_001",
      "sourceFile": "docs/ai-prompt.md",
      "originalContent": "You are an AI assistant...",
      "elements": {
        "source_file": "docs/ai-prompt.md",
        "role_capability": "You are an AI assistant specialized in code generation",
        "task_request": "Generate Python functions based on requirements",
        "background_context": "",
        "instruction_action": "1. Analyze requirements 2. Write clean code",
        "output_specification": "Return Python code with docstrings",
        "examples": "",
        "constraints_limitations": "Use Python 3.8+ features only",
        "goals_expectations": "Produce maintainable and efficient code",
        "information": "",
        "evaluation_optimization": "",
        "adjustments": "",
        "audience": "Python developers"
      }
    }
  ]
}
```

## 基本验证
```bash
# 检查输出文件
ls -la analysis/prompt-list-elements.json

# 验证JSON格式
cat analysis/prompt-list-elements.json | jq '.totalPrompts'

# 查看第一个提示词的要素
cat analysis/prompt-list-elements.json | jq '.prompts[0].elements'

# 统计非空要素数量
cat analysis/prompt-list-elements.json | jq '.prompts[0].elements | to_entries | map(select(.value != "")) | length'
```

## 集成测试TDD要求
- 先写集成测试，验证端到端流程
- 测试必须先失败（RED）
- 实现功能使测试通过（GREEN）
- MVP只需最少测试覆盖核心流程