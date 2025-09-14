# Quick Start: AI提示词文件深度分析和提取工具

## 前提条件
确保已完成第一步提示词文件发现：
```bash
# 1. 设置API密钥
export OPENAI_API_KEY="your-api-key-here"

# 2. 运行第一步工具
node scan.js

# 3. 确认输出文件存在
ls -la analysis/prompt-files.json
```

## 3步快速开始

### 1. 验证输入文件
```bash
# 检查第一步工具的输出
cat analysis/prompt-files.json | jq .scanResult.promptFiles

# 确认发现了提示词文件
cat analysis/prompt-files.json | jq '.scanResult.promptFiles | length'
```

### 2. 运行深度分析
```bash
# 使用与第一步相同的API密钥
node extract.js
```

### 3. 查看提取结果
```bash
# 查看提取的提示词列表
cat analysis/prompt-list.json

# 统计提示词数量
cat analysis/prompt-list.json | jq '.totalPrompts'

# 查看第一个提示词
cat analysis/prompt-list.json | jq '.prompts[0]'
```

## 预期输出格式
```json
{
  "totalFiles": 3,
  "totalPrompts": 7,
  "prompts": [
    {
      "promptId": "prompt_001",
      "sourceFile": "docs/ai-prompts.md", 
      "content": "You are a helpful AI assistant...\n\nPlease analyze the following code...",
      "startLine": 5,
      "endLine": 12
    },
    {
      "promptId": "prompt_002",
      "sourceFile": "docs/ai-prompts.md",
      "content": "Generate a Python function that handles file I/O...",
      "startLine": 15,
      "endLine": 18
    }
  ],
  "analysisTime": "2025-09-14T14:30:22Z",
  "processingStats": {
    "successFiles": 3,
    "failedFiles": 0
  }
}
```

## 详细输出模式
```bash
# 使用 --verbose 查看详细处理过程
node extract.js --verbose
```

预期输出：
```
🔍 AI提示词深度分析器启动...
配置信息:
- 输入文件: analysis/prompt-files.json
- 输出文件: analysis/prompt-list.json
- 并发数: 5
- GPT模型: gpt-5

📁 读取输入文件: analysis/prompt-files.json
✓ 发现 3 个待处理文件

🤖 开始分析提示词内容...
  1/3 处理文件: docs/ai-prompts.md (发现 3 个提示词)
  2/3 处理文件: src/prompts/system.md (发现 2 个提示词)
  3/3 处理文件: config/templates.yaml (发现 2 个提示词)

✓ 分析完成: 发现 7 个提示词

📊 提取统计:
  总文件数: 3
  成功处理文件数: 3
  失败文件数: 0
  发现提示词总数: 7
  平均每文件提示词数: 2.3

✅ 提取完成! 耗时: 23.45s
📄 分析报告已保存至: analysis/prompt-list.json
```

## 基本验证测试
```bash
# 验证输出文件存在且格式正确
test -f analysis/prompt-list.json && echo "✓ 输出文件存在"

# 验证JSON格式有效
cat analysis/prompt-list.json | jq . > /dev/null && echo "✓ JSON格式有效"

# 验证包含必需字段
cat analysis/prompt-list.json | jq -e '.totalFiles, .totalPrompts, .prompts, .analysisTime, .processingStats' > /dev/null && echo "✓ 数据结构完整"

# 验证提示词数组不为空（如果发现了提示词）
PROMPT_COUNT=$(cat analysis/prompt-list.json | jq '.totalPrompts')
if [ "$PROMPT_COUNT" -gt 0 ]; then
    echo "✓ 发现 $PROMPT_COUNT 个提示词"
else
    echo "⚠️  未发现提示词，检查第一步工具的输出"
fi
```

## 常见问题排查

### 输入文件不存在
```bash
# 检查第一步工具是否已运行
if [ ! -f analysis/prompt-files.json ]; then
    echo "❌ 请先运行第一步工具: node scan.js"
fi
```

### API密钥问题
```bash
# 检查API密钥设置
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ 请设置API密钥: export OPENAI_API_KEY='sk-your-key'"
fi
```

### 无提示词发现
```bash
# 检查第一步的扫描结果
cat analysis/prompt-files.json | jq '.scanResult.promptFiles | length'
# 如果为0，说明第一步未发现提示词文件
```

## TDD开发验证
验证工具符合TDD要求：
1. 每个主要功能都有对应的测试
2. 测试先于实现编写
3. 只关注主流程，保持简单

## 性能基准
- 处理10个文件: < 30秒
- 处理100个文件: < 5分钟  
- 内存使用: < 500MB
- 并发API调用: 5个