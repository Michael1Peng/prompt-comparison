# CLI Contract: AI提示词文件深度分析和提取工具

## 基本命令
```bash
node extract.js
# 或者
prompt-finder extract
```

## 输入要求
- 存在文件: `./analysis/prompt-files.json` (第一步工具的输出)
- 设置环境变量: `OPENAI_API_KEY=your-key`
- 可选环境变量: `OPENAI_API_BASE=custom-url` (自定义API基础URL)
- JSON文件中引用的源文件必须存在且可读

## 输出
- 控制台: 处理进度和统计信息
- 文件: `./analysis/prompt-list.json`

## JSON输入格式 (来自第一步)
```json
{
  "scanResult": {
    "totalFiles": 123,
    "promptFiles": [
      {
        "filePath": "src/prompts/system.md",
        "fileName": "system.md",
        "content": "...",
        "isPrompt": true,
        "confidence": 0.95,
        "language": null,
        "category": "system"
      }
    ],
    "scanTimestamp": "2025-09-14T14:30:22Z",
    "scanDuration": 5420
  }
}
```

## JSON输出格式
```json
{
  "totalFiles": 5,
  "totalPrompts": 12,
  "prompts": [
    {
      "promptId": "system.md_15_001",
      "sourceFile": "src/prompts/system.md",
      "content": "You are an AI assistant...",
      "startLine": 15,
      "endLine": 25
    }
  ],
  "analysisTime": "2025-09-14T15:45:30Z",
  "processingStats": {
    "successfulFiles": 5,
    "failedFiles": 0,
    "totalAPIRequests": 5,
    "averagePromptsPerFile": 2.4
  }
}
```

## 命令行选项
```bash
# 基本用法
node extract.js

# 指定输入输出路径  
node extract.js --input ./custom/prompt-files.json --output ./custom/prompt-list.json

# 设置并发数
node extract.js --concurrency 3

# 显示详细信息
node extract.js --verbose

# 使用自定义API配置
node extract.js --api-base https://custom-api.com/v1 --model gpt-5

# 帮助信息
node extract.js --help

# 版本信息
node extract.js --version
```

## 退出码
- `0`: 成功完成分析
- `1`: 输入文件不存在或格式错误
- `2`: API密钥问题
- `3`: 所有文件处理失败
- `4`: 其他系统错误

## 错误处理行为
- **输入JSON不存在**: 退出并提示运行第一步工具
- **个别文件处理失败**: 记录警告，跳过该文件，继续处理
- **API调用失败**: 记录错误，跳过该文件，继续处理
- **输出目录不存在**: 自动创建
- **输出文件已存在**: 完全覆盖

## 性能预期
- 5个并发API调用
- 每个文件处理时间: 1-3秒
- 内存使用: <200MB
- 支持处理100+个文件