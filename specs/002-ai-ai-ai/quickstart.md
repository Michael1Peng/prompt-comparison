# Quick Start: AI提示词文件发现和汇总工具

## 3步快速开始

### 1. 设置API密钥
```bash
export OPENAI_API_KEY="your-api-key-here"
```

### 2. 运行扫描
```bash
node scan.js
```

### 3. 查看结果
```bash
cat analysis/prompt-files.json
```

## 预期输出
```json
{
  "totalFiles": 123,
  "promptFiles": 5,
  "files": [
    {
      "filePath": "docs/system-prompt.md",
      "summary": "AI assistant system prompt",
      "startPosition": 1,
      "endPosition": 20,
      "confidence": 0.95,
      "promptType": "system"
    }
  ],
  "scanTime": "2025-09-13T14:30:22Z"
}
```

## 基本测试
```bash
# 检查输出目录和文件
ls -la analysis/prompt-files.json

# 验证JSON格式
cat analysis/prompt-files.json | jq .

# 验证过滤规则生效
echo "检查是否正确忽略了.gitignore中的文件"
echo "检查是否只处理了文本文件(.md, .txt, .js, .py等)"
```

## TDD开发要求
- 每个主要函数先写测试，后写实现
- 只需要2个测试用例：正常情况 + 边界情况