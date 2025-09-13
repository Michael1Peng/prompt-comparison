# Quick Start Guide: AI 提示词分析工具

**版本**: 1.0.0  
**更新时间**: 2025-09-13  
**估计完成时间**: 10-15分钟

## 概述

本指南将带您快速了解如何使用AI提示词分析工具来扫描、分析和生成提示词对比报告。整个流程包括四个主要步骤：扫描 → 分析 → 翻译 → 报告生成。

## 前置要求

### 系统要求
- **Node.js**: 18.0+ 
- **操作系统**: Linux, macOS, Windows
- **内存**: 建议2GB以上可用内存
- **磁盘空间**: 100MB可用空间

### API密钥配置
在开始前，您需要配置AI服务的API密钥：

```bash
# 方式1: 环境变量 (推荐)
export DASHSCOPE_API_KEY="your-qwen-api-key"

# 方式2: 配置文件
echo '{"ai": {"qwen": {"apiKey": "your-api-key"}}}' > .prompt-analyzerrc.json
```

## 安装

### 选项1: npm全局安装
```bash
npm install -g prompt-analyzer
```

### 选项2: 独立可执行文件
```bash
# 下载对应平台的可执行文件
curl -L https://github.com/your-org/prompt-analyzer/releases/latest/download/prompt-analyzer-linux -o prompt-analyzer
chmod +x prompt-analyzer
```

### 选项3: 从源码构建
```bash
git clone https://github.com/your-org/prompt-analyzer.git
cd prompt-analyzer
npm install
npm run build
npm link
```

## 验证安装

```bash
prompt-analyzer --version
prompt-analyzer --help
```

预期输出：
```
Prompt Analyzer v1.0.0
AI-powered prompt analysis and comparison tool
```

## 第一个示例：分析单个项目

### 步骤1: 扫描项目文件

```bash
# 扫描当前目录
prompt-analyzer scan

# 或指定特定目录
prompt-analyzer scan ./my-ai-project
```

**预期输出**：
```
🔍 正在扫描文件...
📁 发现 156 个文件，其中 12 个可能包含提示词

扫描完成:
  - 总文件数: 156
  - 提示词文件: 12
  - 发现提示词: 18个
  - 输出文件: ./output/scan-results.json

✅ 扫描用时 3.2秒
```

### 步骤2: 分析提示词要素

```bash
# 使用扫描结果进行分析
prompt-analyzer analyze ./output/scan-results.json
```

**预期输出**：
```
🧠 开始AI分析...
分析进度 |████████████████████| 100% | 18/18 提示词

分析完成:
  - 成功分析: 16个
  - 失败: 2个
  - 平均置信度: 0.83
  - 输出文件: ./output/analyzed-prompts.json

✅ 分析用时 2分15秒，消耗 $0.12
```

### 步骤3: 生成分析报告

```bash
# 生成HTML报告
prompt-analyzer report ./output/analyzed-prompts.json
```

**预期输出**：
```
📊 正在生成报告...

报告生成完成:
  - HTML报告: ./output/prompt-analysis-report.html
  - 对比表格: 4个表格，15个分析要素
  - 统计图表: 5个

🌐 在浏览器中查看: file://./output/prompt-analysis-report.html
```

## 高级用例

### 批量分析多个项目

```bash
# 创建批量分析脚本
cat > batch-analyze.sh << 'EOF'
#!/bin/bash

projects=(
  "./project1"
  "./project2" 
  "./project3"
)

for project in "${projects[@]}"; do
  echo "分析项目: $project"
  prompt-analyzer scan "$project" --output "./output/${project##*/}"
  prompt-analyzer analyze "./output/${project##*/}/scan-results.json"
  prompt-analyzer report "./output/${project##*/}/analyzed-prompts.json"
done

echo "✅ 批量分析完成"
EOF

chmod +x batch-analyze.sh
./batch-analyze.sh
```

### 自定义配置文件

创建 `.prompt-analyzerrc.json`：

```json
{
  "ai": {
    "provider": "qwen",
    "qwen": {
      "model": "qwen-plus"
    }
  },
  "scan": {
    "extensions": [".js", ".ts", ".py", ".md", ".txt"],
    "ignorePatterns": [
      "node_modules/**",
      ".git/**",
      "dist/**"
    ],
    "maxFileSize": "10MB"
  },
  "analyze": {
    "batchSize": 5,
    "concurrency": 3,
    "retryCount": 2
  },
  "output": {
    "directory": "./analysis-output",
    "format": "html"
  }
}
```

### 过滤和筛选

```bash
# 只分析高置信度的提示词
prompt-analyzer analyze scan-results.json --min-confidence 0.8

# 按分类生成报告
prompt-analyzer report analyzed-prompts.json --group-by category

# 生成多种格式的报告
prompt-analyzer report analyzed-prompts.json --format html,markdown,csv
```

## 常见用例模板

### 1. 代码仓库审查
```bash
# 快速分析代码仓库中的AI提示词使用情况
prompt-analyzer scan . --extensions .py,.js,.ts
prompt-analyzer analyze ./output/scan-results.json --depth standard  
prompt-analyzer report ./output/analyzed-prompts.json --report-type executive
```

### 2. 提示词质量评估
```bash
# 深度分析并生成质量评估报告
prompt-analyzer analyze prompts.json --depth detailed --min-confidence 0.7
prompt-analyzer report analyzed-prompts.json --include-charts --sort-by completeness
```

### 3. 多语言项目分析
```bash
# 分析并翻译为中文
prompt-analyzer scan ./multilang-project
prompt-analyzer analyze ./output/scan-results.json --language auto
prompt-analyzer translate ./output/analyzed-prompts.json --target-lang zh
prompt-analyzer report ./output/analyzed-prompts.json --include-translations
```

## 故障排除

### 常见问题

**Q: 扫描速度很慢怎么办？**
```bash
# 增加并发数，排除大文件
prompt-analyzer scan --concurrency 20 --max-size 1MB
```

**Q: AI分析失败率高？**
```bash
# 检查API密钥和网络连接
prompt-analyzer config ai.provider qwen
prompt-analyzer analyze --retry-count 3 --timeout 60
```

**Q: 生成的报告打不开？**
```bash
# 检查输出目录权限，使用绝对路径
prompt-analyzer report prompts.json --output /tmp/reports
```

**Q: 内存使用过高？**
```bash
# 减小批处理大小
prompt-analyzer analyze --batch-size 2 --concurrency 1
```

### 调试模式

```bash
# 启用详细输出
prompt-analyzer scan --verbose

# 查看配置信息
prompt-analyzer config --list

# 测试API连接
prompt-analyzer analyze sample.json --batch-size 1 --verbose
```

### 日志文件

默认情况下，详细日志保存在：
- **Linux/macOS**: `~/.prompt-analyzer/logs/`
- **Windows**: `%APPDATA%/prompt-analyzer/logs/`

## 性能优化建议

### 扫描优化
- 使用 `--ignore` 排除无关目录
- 设置合理的 `--max-size` 限制
- 为大型项目使用 `--extensions` 精确匹配

### 分析优化
- 根据API限制调整 `--batch-size`
- 使用 `--min-confidence` 跳过低质量结果
- 启用 `--save-partial` 避免重复分析

### 成本控制
- 使用 qwen-flash 模型降低成本
- 设置 `--timeout` 避免长时间API调用
- 启用缓存避免重复分析相同内容

## 集成到CI/CD

### GitHub Actions示例

```yaml
name: Prompt Analysis
on: [push, pull_request]

jobs:
  analyze-prompts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Prompt Analyzer
        run: npm install -g prompt-analyzer
        
      - name: Analyze Prompts
        env:
          DASHSCOPE_API_KEY: ${{ secrets.DASHSCOPE_API_KEY }}
        run: |
          prompt-analyzer scan
          prompt-analyzer analyze ./output/scan-results.json
          prompt-analyzer report ./output/analyzed-prompts.json
      
      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: prompt-analysis-report
          path: ./output/
```

## 下一步

完成快速开始后，您可以：

1. **深入学习**: 阅读完整文档了解所有功能
2. **自定义配置**: 根据项目需求调整分析参数
3. **自动化集成**: 将分析流程集成到开发工作流中
4. **贡献反馈**: 报告问题或建议新功能

## 支持和反馈

- **文档**: [完整文档链接]
- **问题报告**: [GitHub Issues]
- **社区讨论**: [GitHub Discussions]
- **更新日志**: [CHANGELOG.md]

---

🎉 **恭喜！您已经成功完成了第一个提示词分析项目。开始探索更多高级功能吧！**