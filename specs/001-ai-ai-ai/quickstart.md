# Quick Start Guide: AI 提示词分析工作流

**Version**: 1.0.0 | **Updated**: 2025-09-13 | **Estimated Time**: 15分钟

## Overview

本指南将帮助你在15分钟内快速上手AI提示词分析工具，从安装到生成你的第一个分析报告。

## Prerequisites

- Node.js 18+ (推荐使用 LTS 版本)
- OpenAI API Key (支持GPT-5)
- 至少2GB可用磁盘空间

## Step 1: Installation

### 安装依赖包
```bash
# 克隆项目（如果需要）
git clone <repository-url>
cd prompt-comparison

# 安装依赖
npm install

# 验证安装
npx prompt-analyzer --version
```

### 环境配置
```bash
# 设置API密钥
export OPENAI_API_KEY="your-openai-api-key-here"

# 或创建配置文件
cat > prompt-analyzer.config.json << EOF
{
  "api": {
    "provider": "openai",
    "model": "gpt-5",
    "key": "your-api-key-here"
  }
}
EOF
```

## Step 2: Basic Usage

### 快速分析当前目录
```bash
# 最简单的用法
npx prompt-analyzer .

# 输出示例
[INFO] 正在扫描目录: ./
[INFO] 发现 45 个文件
[PROGRESS] 文件扫描: ████████████████████ 100% (45/45)
[INFO] 开始提示词检测...
[PROGRESS] 提示词检测: ████████████████████ 100% (45/45)
[INFO] 检测到 8 个文件包含提示词
[INFO] 开始要素分析...
[PROGRESS] 要素分析: ████████████████████ 100% (8/8)
[SUCCESS] 分析完成: ./analysis/analysis-report-20250913-103000.json
```

### 查看结果
```bash
# 查看分析报告
cat ./analysis/analysis-report-20250913-103000.json | jq '.summary'

# 输出示例
{
  "totalFiles": 45,
  "promptFiles": 8,
  "totalPrompts": 12,
  "avgQuality": "B",
  "processingTime": 23456
}
```

## Step 3: Advanced Usage

### 指定文件类型
```bash
# 只分析Markdown文件
npx prompt-analyzer . \
  --include "**/*.md" \
  --exclude "**/node_modules/**"
```

### 调整并发和质量阈值
```bash
# 高性能模式
npx prompt-analyzer . \
  --concurrency 20 \
  --min-confidence 0.8 \
  --timeout 60
```

### 生成详细报告
```bash
# 启用详细模式和CSV导出
npx prompt-analyzer . \
  --verbose \
  --format json-pretty \
  --export-csv
```

## Step 4: Understanding Results

### 报告结构解析
```json
{
  "reportId": "uuid-here",
  "summary": {
    "totalFiles": 45,        // 总扫描文件数
    "promptFiles": 8,        // 包含提示词的文件数
    "totalPrompts": 12,      // 识别的提示词总数
    "avgQuality": "B"        // 平均质量等级
  },
  "contentSummary": {
    "byLanguage": {          // 按语言分布
      "zh": 7,              // 中文提示词
      "en": 4,              // 英文提示词
      "mixed": 1            // 中英混合
    },
    "byType": {              // 按类型分布
      "system": 3,          // 系统提示词
      "user": 6,            // 用户提示词
      "documentation": 3    // 文档类提示词
    }
  },
  "files": [...],           // 详细文件信息
  "contents": [...],        // 提示词内容
  "elements": [...]         // 13要素分析结果
}
```

### 质量等级说明
- **A级** (>=90%要素): 优秀，结构完整
- **B级** (>=70%要素): 良好，大部分要素齐全
- **C级** (>=50%要素): 中等，基本要素存在
- **D级** (>=30%要素): 较差，要素不完整
- **F级** (<30%要素): 不合格，需要重构

## Step 5: Common Use Cases

### 用例1：项目提示词审计
```bash
# 全面分析项目中的提示词质量
npx prompt-analyzer ./my-ai-project \
  --include "**/*.md" "**/*.py" "**/*.js" \
  --min-confidence 0.7 \
  --output-dir ./audit-results
```

### 用例2：提示词模板对比
```bash
# 分析多个提示词模板目录
for dir in template1 template2 template3; do
  npx prompt-analyzer "$dir" "./comparison/${dir}-analysis.json"
done

# 生成对比报告
npx prompt-analyzer report ./comparison/*.json --template comparison
```

### 用例3：持续质量监控
```bash
#!/bin/bash
# 定期质量检查脚本
DATE=$(date +%Y%m%d)
npx prompt-analyzer . \
  --quiet \
  --format json \
  --output-dir "./quality-reports/$DATE"

# 检查质量退化
if [ "$(cat ./quality-reports/$DATE/*.json | jq '.summary.avgQuality')" = '"C"' ]; then
  echo "Warning: Prompt quality degraded to C level"
fi
```

## Step 6: Troubleshooting

### 常见问题

#### Q: API限流错误
```bash
# 降低并发数，增加超时时间
npx prompt-analyzer . --concurrency 5 --timeout 60
```

#### Q: 大文件处理失败
```bash
# 限制文件大小
npx prompt-analyzer . --max-file-size 10
```

#### Q: 识别准确率低
```bash
# 调整置信度阈值
npx prompt-analyzer . --min-confidence 0.6
```

#### Q: 内存不足
```bash
# 启用批处理模式
npx prompt-analyzer . --batch-size 20
```

### 诊断命令
```bash
# 检查配置
npx prompt-analyzer --help

# 测试连接
npx prompt-analyzer detect --dry-run ./test-file.md

# 查看详细日志
tail -f ./analysis/processing.log
```

## Expected Results

完成quickstart后，你应该获得：

1. **分析报告**: JSON格式的完整分析结果
2. **质量评估**: 每个提示词的A-F质量等级
3. **要素统计**: 13个框架要素的分布情况
4. **性能指标**: 处理时间、API调用次数等

### 示例输出文件
```
./analysis/
├── analysis-report-20250913-103000.json  # 主报告
├── processing.log                         # 处理日志
└── elements-breakdown.csv                 # 要素分解表（如启用）
```

### 预期性能基准
- **处理速度**: ~50文件/分钟
- **识别准确率**: >95%
- **要素完整率**: >90%
- **内存使用**: <500MB

## Next Steps

1. **深度分析**: 学习[高级配置指南](./advanced-config.md)
2. **自定义规则**: 配置[自定义要素分析](./custom-elements.md)
3. **CI/CD集成**: 设置[自动化质量检查](./ci-cd-integration.md)
4. **报告可视化**: 生成[图表和仪表板](./visualization.md)

## Support

- 📖 完整文档: `docs/`
- 🐛 问题报告: GitHub Issues
- 💬 讨论交流: GitHub Discussions
- 📧 技术支持: support@prompt-analyzer.com

---
*完成时间: 15分钟 | 难度: ⭐⭐☆☆☆ | 成功率: 98%*