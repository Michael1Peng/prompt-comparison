# Data Model: AI提示词文件深度分析和提取工具

## 核心数据结构

### PromptDetail
提示词详细信息对象，表示一个独立的提示词内容块。

```javascript
{
  "promptId": "string",      // 唯一标识符 (格式: "prompt_001")
  "sourceFile": "string",    // 来源文件路径
  "content": "string",       // 提示词完整内容
  "startLine": "number",     // 起始行号 (1-based)
  "endLine": "number"        // 结束行号 (1-based)
}
```

### PromptList
提示词列表汇总对象，包含所有提取的提示词和统计信息。

```javascript  
{
  "totalFiles": "number",           // 处理的文件总数
  "totalPrompts": "number",         // 提取的提示词总数
  "processingStats": {              // 处理统计信息
    "successfulFiles": "number",    // 成功处理文件数
    "failedFiles": "number",        // 失败文件数
    "errors": [                     // 错误列表
      {
        "file": "string",           // 文件路径
        "error": "string"           // 错误信息
      }
    ]
  },
  "analysisTime": "string",         // 分析时间戳 (ISO格式)
  "prompts": "PromptDetail[]"       // 提示词详情数组
}
```

## 数据流转

```
输入: analysis/prompt-files.json (第一步输出)
  ↓
读取文件列表
  ↓
并发读取文件内容
  ↓
AI分析提取提示词 → PromptDetail对象
  ↓
汇总所有提示词 → PromptList对象
  ↓
输出: analysis/prompt-list.json
```

## MVP简化说明

- 不存储提示词元数据（类型、难度等）
- 不进行提示词分类
- 不保存中间处理状态
- 只关注核心信息提取