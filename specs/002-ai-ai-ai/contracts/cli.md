# CLI Contract: AI提示词文件发现和汇总工具

## 基本命令
```bash
node scan.js
```

## 输入要求
- 当前目录是Git仓库
- 设置环境变量: `OPENAI_API_KEY=your-key`
- 自动遵循 `.gitignore` 规则
- 自动过滤只处理文本文件

## 输出
- 控制台: 简单进度信息
- 文件: `./analysis/prompt-files.json`

## JSON格式
```json
{
  "totalFiles": 123,
  "promptFiles": 5,
  "files": [
    {
      "filePath": "docs/prompt.md",
      "summary": "System prompt for AI assistant",
      "startPosition": 15,
      "endPosition": 45,
      "confidence": 0.95,
      "promptType": "system"
    }
  ],
  "scanTime": "2025-09-13T14:30:22Z"
}
```

## 退出码
- `0`: 成功
- `1`: 错误