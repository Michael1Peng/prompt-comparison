# Data Model: AI提示词文件深度分析和提取工具

## 核心数据结构

### PromptDetail
```javascript
{
  "promptId": "string",         // 提示词唯一标识符 (prompt_001, prompt_002...)
  "sourceFile": "string",       // 来源文件路径
  "content": "string",          // 提示词完整内容（保持原始格式）
  "startLine": "number",        // 在文件中的起始行号 (0-based, 包含上下文)
  "endLine": "number"           // 在文件中的结束行号 (0-based, 包含上下文)
}
```

### PromptList
```javascript
{
  "totalFiles": "number",       // 处理的文件总数
  "totalPrompts": "number",     // 发现的提示词总数
  "prompts": "PromptDetail[]",  // 提示词详情数组
  "analysisTime": "string",     // 分析时间戳 (ISO格式)
  "processingStats": {          // 简单处理统计信息
    "successFiles": "number",   // 成功处理的文件数
    "failedFiles": "number"     // 处理失败的文件数
  }
}
```

## 输入数据结构

### InputFile (第一步工具输出)
```javascript
{
  "scanResult": {
    "totalFiles": "number",
    "promptFiles": [
      {
        "filePath": "string",      // 文件路径 (用于读取文件内容)
        "fileName": "string",      // 文件名
        "content": "string",       // 文件完整内容
        "isPrompt": "boolean",     // 是否为提示词文件
        "confidence": "number",    // AI判断置信度
        "language": "string",      // 编程语言
        "category": "string"       // 分类
      }
    ],
    "scanTimestamp": "string",
    "scanDuration": "number"
  }
}
```

## 处理流程
```
读取 analysis/prompt-files.json
  ↓ 解析 scanResult.promptFiles 数组
并发处理每个文件
  ↓ AI分析识别提示词边界
提取 PromptDetail 对象
  ↓ 记录行号位置信息
汇总 PromptList 结果
  ↓ 生成统计信息
输出到 analysis/prompt-list.json
```

## 数据验证规则
- **promptId**: 必须唯一，格式为 "prompt_{序号}"
- **sourceFile**: 必须是有效的文件路径字符串
- **content**: 不能为空字符串
- **startLine/endLine**: 必须是非负整数，endLine >= startLine
- **totalFiles/totalPrompts**: 必须与实际数据一致
- **processingStats**: successFiles + failedFiles = totalFiles

## 错误处理策略
- 文件读取失败: 跳过该文件，failedFiles +1
- AI分析失败: 跳过该文件，记录警告
- 行号计算错误: 使用默认值 (0, 文件总行数-1)
- 数据格式错误: 记录错误日志，继续处理

## TDD测试要求
每个数据模型只需要2个测试用例：
- 正常情况: 验证数据结构完整性和字段类型
- 边界情况: 验证错误数据的处理和默认值

## 输出示例
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
    },
    {
      "promptId": "prompt_002", 
      "sourceFile": "docs/ai-prompts.md",
      "content": "Generate a Python function that...",
      "startLine": 15,
      "endLine": 20
    }
  ],
  "analysisTime": "2025-09-14T14:30:22Z",
  "processingStats": {
    "successFiles": 3,
    "failedFiles": 0
  }
}
```