# Data Model: AI提示词文件深度分析和提取工具

## 核心数据结构

### PromptDetail
```javascript
{
  "promptId": "string",        // 提示词唯一标识符 (格式: file_line_index, 如 "scan.js_15_001")
  "sourceFile": "string",      // 来源文件路径 (相对于项目根目录)
  "content": "string",         // 提示词完整内容
  "startLine": "number",       // 在文件中的起始行号 (1-based)
  "endLine": "number"          // 在文件中的结束行号 (1-based)
}
```

### PromptList  
```javascript
{
  "totalFiles": "number",      // 处理的文件总数
  "totalPrompts": "number",    // 发现的提示词总数
  "prompts": "PromptDetail[]", // 提示词详情数组
  "analysisTime": "string",    // 分析时间戳 (ISO格式)
  "processingStats": {         // 处理统计信息
    "successfulFiles": "number",     // 成功处理文件数
    "failedFiles": "number",         // 失败文件数
    "totalAPIRequests": "number",    // API调用总数
    "averagePromptsPerFile": "number" // 平均每文件提示词数量
  }
}
```

### InputFile (来自第一步输出)
```javascript
{
  "filePath": "string",        // 文件路径
  "fileName": "string",        // 文件名
  "content": "string",         // 文件内容
  "isPrompt": "boolean",       // 是否为提示词文件
  "confidence": "number",      // AI判断置信度
  "language": "string|null",   // 相关编程语言
  "category": "string"         // 提示词类别
}
```

### ScanResultInput (第一步输出格式)
```javascript
{
  "scanResult": {
    "totalFiles": "number",
    "promptFiles": "InputFile[]",
    "scanTimestamp": "string",
    "scanDuration": "number"
  }
}
```

## 处理流程
```
读取prompt-files.json → 解析输入文件列表 → 并发读取文件内容 → GPT-5提示词提取 → PromptDetail生成 → PromptList汇总 → JSON输出到analysis/prompt-list.json
```

## 数据验证规则
- `promptId`: 必须唯一，格式为 "filename_startLine_index"
- `sourceFile`: 必须存在且可读
- `content`: 不能为空字符串
- `startLine`: 必须 >= 1
- `endLine`: 必须 >= startLine
- `totalPrompts`: 必须等于 prompts 数组长度

## 输入输出关系
- **输入**: `./analysis/prompt-files.json` (第一步工具输出)
- **输出**: `./analysis/prompt-list.json` (本工具输出)
- **依赖**: 输入文件必须存在，且格式符合ScanResultInput结构

## TDD测试要求
每个数据模型操作只需要2个测试用例：
- 正常情况测试：有效数据的创建和验证
- 边界情况测试：无效数据的错误处理

## 扩展考虑
为后续版本预留的可选字段：
- `promptType`: 提示词类型 (system, user, assistant等)
- `complexity`: 提示词复杂度评分
- `tokens`: 提示词token数量统计