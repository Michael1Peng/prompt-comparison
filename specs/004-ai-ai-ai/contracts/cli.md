# CLI Contract: AI提示词框架要素拆分工具

## 基本命令
```bash
node element.js
```

## 输入要求
- 必须存在 `analysis/prompt-list.json` 文件（第二步输出）
- 设置环境变量: `OPENAI_API_KEY=your-key`

## 输出
- 控制台: 处理进度信息
- 文件: `analysis/prompt-list-elements.json`

## JSON输入格式 (analysis/prompt-list.json)
```json
{
  "prompts": [
    {
      "promptId": "prompt_001",
      "sourceFile": "docs/ai-prompt.md",
      "content": "提示词完整内容...",
      "startLine": 10,
      "endLine": 25
    }
  ]
}
```

## JSON输出格式 (analysis/prompt-list-elements.json)
```json
{
  "totalPrompts": 2,
  "analysisTime": "2025-09-14T10:30:00Z",
  "prompts": [
    {
      "promptId": "prompt_001",
      "sourceFile": "docs/ai-prompt.md",
      "originalContent": "原始提示词内容...",
      "elements": {
        "source_file": "docs/ai-prompt.md",
        "role_capability": "角色能力描述",
        "task_request": "任务请求",
        "background_context": "背景情境",
        "instruction_action": "指令行动",
        "output_specification": "输出规格",
        "examples": "示例",
        "constraints_limitations": "限制约束",
        "goals_expectations": "目标期望",
        "information": "信息资源",
        "evaluation_optimization": "评估优化",
        "adjustments": "调整机制",
        "audience": "目标受众"
      }
    }
  ]
}
```

## 命令行选项
```bash
# 显示帮助信息
node element.js --help
node element.js -h

# 显示版本信息  
node element.js --version
node element.js -v

# 指定输入文件（可选）
node element.js --input <path>

# 指定输出文件（可选）
node element.js --output <path>
```

## 退出码
- `0`: 成功完成
- `1`: 输入文件不存在
- `2`: API密钥未设置
- `3`: 处理错误