# Quick Start: AI提示词文件深度分析和提取工具

## 前置条件
确保已运行第一步工具，存在 `analysis/prompt-files.json` 文件：
```bash
# 如果还没有，先运行第一步
node scan.js
```

## 3步快速开始

### 1. 验证输入文件
```bash
# 检查输入文件是否存在
ls -la analysis/prompt-files.json

# 查看输入文件内容
cat analysis/prompt-files.json | jq .
```

### 2. 运行深度分析
```bash
# 使用现有API密钥
node extract.js

# 或指定自定义配置
OPENAI_API_KEY="your-key" node extract.js --verbose
```

### 3. 查看提取结果
```bash
# 查看输出文件
cat analysis/prompt-list.json | jq .

# 查看统计信息
cat analysis/prompt-list.json | jq '.processingStats'
```

## 预期输出示例
```json
{
  "totalFiles": 3,
  "totalPrompts": 7,
  "prompts": [
    {
      "promptId": "system-prompt.md_1_001",
      "sourceFile": "docs/system-prompt.md",
      "content": "You are an AI coding assistant...",
      "startLine": 1,
      "endLine": 15
    },
    {
      "promptId": "system-prompt.md_20_002", 
      "sourceFile": "docs/system-prompt.md",
      "content": "Always follow these guidelines...",
      "startLine": 20,
      "endLine": 35
    }
  ],
  "analysisTime": "2025-09-14T15:45:30Z",
  "processingStats": {
    "successfulFiles": 3,
    "failedFiles": 0,
    "totalAPIRequests": 3,
    "averagePromptsPerFile": 2.3
  }
}
```

## 验证结果
```bash
# 检查输出文件格式
cat analysis/prompt-list.json | jq '.prompts[0]'

# 验证提示词内容
echo "检查每个提示词是否包含完整内容"
echo "验证源文件路径是否正确"
echo "确认行号标注是否准确"

# 统计信息验证
echo "总提示词数应该等于prompts数组长度"
cat analysis/prompt-list.json | jq '{totalPrompts, actualCount: (.prompts | length)}'
```

## 常见问题排查

### 输入文件不存在
```bash
# 错误信息: 找不到 analysis/prompt-files.json
# 解决方案: 先运行第一步工具
node scan.js
```

### API密钥问题
```bash
# 错误信息: OPENAI_API_KEY环境变量未设置
# 解决方案: 设置API密钥
export OPENAI_API_KEY="sk-your-api-key"

# 或者临时使用
OPENAI_API_KEY="sk-your-api-key" node extract.js
```

### 个别文件处理失败
```bash
# 查看详细日志
node extract.js --verbose

# 检查失败的文件是否存在
# (工具会自动跳过并继续处理其他文件)
```

## TDD开发流程
- 每个主要函数先写测试，后写实现
- 只需要2个测试用例：正常情况 + 边界情况
- 测试覆盖：数据模型、服务函数、CLI接口

## 下一步
生成的 `prompt-list.json` 文件可以用于：
- 提示词内容对比分析
- 框架层面要素提取
- 质量评估和优化建议