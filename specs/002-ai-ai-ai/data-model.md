# Data Model: AI提示词文件发现和汇总工具

## 核心数据结构

### PromptFile
```javascript
{
  "filePath": "string",        // 文件路径
  "summary": "string",         // 提示词内容摘要
  "startPosition": "number",   // 提示词内容起始行号 (1-based)
  "endPosition": "number",     // 提示词内容结束行号 (1-based)
  "confidence": "number",      // AI判断置信度 (0.0-1.0)
  "promptType": "string"       // 类型: "system" | "user" | "assistant" | "unknown"
}
```

### ScanResult  
```javascript
{
  "totalFiles": "number",      // 扫描文件总数
  "promptFiles": "number",     // 提示词文件数量
  "files": "PromptFile[]",     // 提示词文件列表
  "scanTime": "string"         // 扫描时间
}
```

## 处理流程
```
Git仓库扫描 → .gitignore过滤 → 文件类型过滤 → GPT-5分析 → PromptFile → 汇总 → JSON输出到./analysis/
```

## 文件过滤规则
- 遵循 `.gitignore` 规则
- 只处理文本文件: `.md`, `.txt`, `.js`, `.py`, `.json`, `.yaml`, `.yml`, `.ts`
- 输出到固定目录: `./analysis/prompt-files.json`

## TDD测试要求
每个主要函数只需要2个测试用例：
- 正常情况测试
- 边界情况测试