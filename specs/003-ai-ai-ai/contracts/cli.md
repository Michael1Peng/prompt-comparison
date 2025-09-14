# CLI Contract: AI提示词深度分析工具

## 基本命令
```bash
node extract.js
```

## 输入要求
- 必须存在 `analysis/prompt-files.json` 文件（第一步输出）
- 设置环境变量: `OPENAI_API_KEY=your-key`
- 文件系统可读写权限

## 输出
- 控制台: 处理进度信息
- 文件: `analysis/prompt-list.json`

## JSON输入格式 (analysis/prompt-files.json)
```json
{
  "scanResult": {
    "totalFiles": 123,
    "promptFiles": [
      {
        "filePath": "docs/prompt.md",
        "fileName": "prompt.md",
        "content": "file content...",
        "isPrompt": true,
        "confidence": 0.95
      }
    ]
  }
}
```

## JSON输出格式 (analysis/prompt-list.json)
```json
{
  "totalFiles": 5,
  "totalPrompts": 12,
  "processingStats": {
    "successfulFiles": 4,
    "failedFiles": 1,
    "errors": [
      {
        "file": "path/to/file.md",
        "error": "Error message"
      }
    ]
  },
  "analysisTime": "2025-09-14T10:30:00Z",
  "prompts": [
    {
      "promptId": "prompt_001",
      "sourceFile": "docs/prompt.md",
      "content": "Complete prompt content...",
      "startLine": 5,
      "endLine": 15
    }
  ]
}
```

## 退出码
- `0`: 成功完成
- `1`: 输入文件不存在
- `2`: API密钥未设置
- `3`: 处理错误

## 错误处理
- 单个文件处理失败不影响整体流程
- 所有错误记录在输出JSON的 `processingStats.errors` 中
- 控制台显示警告信息