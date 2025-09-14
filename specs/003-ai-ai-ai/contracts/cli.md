# CLI Contract: AI提示词文件深度分析和提取工具

## 基本命令
```bash
node extract.js
```

## 输入要求
- 必须存在 `./analysis/prompt-files.json` 文件（第一步工具的输出）
- 设置环境变量: `OPENAI_API_KEY=your-key`
- 自动读取第一步工具识别的提示词文件列表

## 输出
- 控制台: 处理进度信息和统计结果
- 文件: `./analysis/prompt-list.json`

## JSON格式
```json
{
  "totalFiles": 3,
  "totalPrompts": 7,
  "prompts": [
    {
      "promptId": "prompt_001",
      "sourceFile": "docs/ai-prompts.md",
      "content": "You are a helpful AI assistant...\n\nPlease help me with...",
      "startLine": 5,
      "endLine": 12
    }
  ],
  "analysisTime": "2025-09-14T14:30:22Z",
  "processingStats": {
    "successFiles": 3,
    "failedFiles": 0
  }
}
```

## 命令选项
```bash
# 帮助信息
node extract.js --help
node extract.js -h

# 版本信息  
node extract.js --version
node extract.js -v

# 详细输出模式
node extract.js --verbose
```

## 退出码
- `0`: 成功
- `1`: 输入文件不存在或格式错误
- `2`: API密钥未设置或无效
- `3`: 其他运行时错误

## 错误处理
- 输入JSON文件不存在: 提示运行第一步工具
- 单个文件处理失败: 记录警告，继续处理其他文件
- API调用失败: 记录错误，跳过该文件
- 所有文件都失败: 生成空的输出JSON，退出码为1

## 性能要求
- 支持5个并发API调用
- 处理时间 < 1分钟（对于已识别的文件）
- 内存使用 < 500MB

## 日志格式
```
🔍 AI提示词深度分析器启动...
📁 读取输入文件: analysis/prompt-files.json
✓ 发现 3 个待处理文件
🤖 开始分析提示词内容...
  1/3 处理文件: docs/ai-prompts.md
  2/3 处理文件: src/prompts/system.md
  3/3 处理文件: config/templates.yaml
✓ 分析完成: 发现 7 个提示词
📊 生成分析报告...
✅ 提取完成! 耗时: 23.45s
📄 分析报告已保存至: analysis/prompt-list.json
```