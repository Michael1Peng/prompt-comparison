# AI提示词分析工具套件

一套用于发现、提取和分析AI提示词的强大命令行工具集。

## 🎯 项目概述

本项目提供两个核心工具：
1. **扫描工具 (scan.js)** - 识别仓库中包含AI提示词的文件
2. **提取工具 (extract.js)** - 深度分析并提取具体的提示词内容块

## 功能特性

### 📋 第一步：文件扫描（scan.js）
- 🔍 **智能扫描**：自动扫描Git仓库中的文本文件
- 🤖 **AI识别**：使用GPT-5 API识别包含提示词的文件
- 📊 **统计报告**：生成包含置信度的文件列表
- 📁 **Git集成**：遵循.gitignore规则

### 🔬 第二步：内容提取（extract.js）
- 📝 **深度分析**：智能识别文件中的独立提示词块
- 📍 **精确定位**：记录每个提示词的起始和结束行号
- 🔄 **错误恢复**：支持重试机制和备用分析策略
- 📈 **详细统计**：包含API调用、处理时间等完整统计信息

## 环境要求

- Node.js 18.0.0 或更高版本
- OpenAI API密钥

## 安装

```bash
npm install
```

## 配置

设置OpenAI API密钥：

```bash
export OPENAI_API_KEY="your-api-key-here"
```

### 环境变量配置

除了命令行选项外，工具还支持以下环境变量：

- **OPENAI_API_KEY** (必需): OpenAI API 密钥
- **OPENAI_API_BASE** (可选): OpenAI API 基础URL，用于Azure OpenAI或其他兼容服务

```bash
# 使用环境变量设置API Base URL
export OPENAI_API_BASE="https://your-resource.openai.azure.com/openai/deployments/your-deployment"
export OPENAI_API_KEY="your-api-key"
node src/scan.js

# 或在单次命令中设置
OPENAI_API_BASE="https://api.openai.com/v1" OPENAI_API_KEY="your-api-key" node src/scan.js
```

## 使用方法

### 🚀 快速开始

完整的提示词分析分为两步：

```bash
# 第一步：扫描文件，识别包含提示词的文件
node src/scan.js

# 第二步：提取具体的提示词内容
node src/extract.js
```

### 📋 第一步：文件扫描 (scan.js)

扫描当前目录下的所有文本文件，识别包含AI提示词的文件。

```bash
node src/scan.js [选项]
```

**可用选项：**
- `-o, --output <path>`: 输出文件路径（默认：./analysis/prompt-files.json）
- `-c, --concurrency <number>`: 并发处理数量（默认：5）
- `--api-base <url>`: OpenAI API 基础URL
- `--model <name>`: GPT模型名称（默认：gpt-5）
- `--no-pretty`: 关闭JSON格式化输出
- `--verbose`: 显示详细输出信息
- `-h, --help`: 显示帮助信息

**示例：**
```bash
# 基本扫描
node src/scan.js

# 指定输出和并发数
node src/scan.js -o ./reports/files.json -c 10

# 使用详细输出
node src/scan.js --verbose
```

### 🔬 第二步：内容提取 (extract.js)

从第一步识别的文件中提取具体的提示词内容块。

```bash
node src/extract.js [选项]
```

**可用选项：**
- `-i, --input <path>`: 输入文件路径（默认：analysis/prompt-files.json）
- `-o, --output <path>`: 输出文件路径（默认：analysis/prompt-list.json）
- `-c, --concurrency <number>`: 并发处理数量（默认：5）
- `--model <name>`: GPT模型名称（默认：gpt-5）
- `--verbose`: 显示详细输出信息
- `-h, --help`: 显示帮助信息

**示例：**
```bash
# 基本提取（使用默认输入输出）
node src/extract.js

# 指定输入输出文件
node src/extract.js -i ./reports/files.json -o ./reports/prompts.json

# 使用详细输出查看统计信息
node src/extract.js --verbose
```

### 📊 完整工作流示例

```bash
# 1. 设置API密钥
export OPENAI_API_KEY="your-api-key"

# 2. 扫描仓库文件
node src/scan.js --verbose

# 3. 提取提示词内容
node src/extract.js --verbose

# 4. 查看结果
cat analysis/prompt-list.json | jq .
```

## 支持的文件类型

工具会扫描以下类型的文本文件：
- `.md` - Markdown文件
- `.txt` - 纯文本文件
- `.js` - JavaScript文件
- `.py` - Python文件
- `.json` - JSON文件
- `.yaml`, `.yml` - YAML文件
- `.ts` - TypeScript文件

## 输出格式

### 📄 第一步输出 (prompt-files.json)

扫描工具生成的文件列表：

```json
{
  "scanResult": {
    "totalFiles": 15,
    "promptFiles": [
      {
        "filePath": "./prompts/example.md",
        "fileName": "example.md",
        "content": "文件完整内容...",
        "isPrompt": true,
        "confidence": 0.95,
        "language": "python",
        "category": "code-generation"
      }
    ],
    "scanTimestamp": "2025-09-14T12:00:00.000Z",
    "scanDuration": 5230
  }
}
```

### 📝 第二步输出 (prompt-list.json)

提取工具生成的提示词详情：

```json
{
  "totalFiles": 15,
  "totalPrompts": 23,
  "processingStats": {
    "successfulFiles": 14,
    "failedFiles": 1,
    "errors": []
  },
  "analysisTime": "2025-09-14T12:05:00.000Z",
  "prompts": [
    {
      "promptId": "prompt_001",
      "sourceFile": "./prompts/example.md",
      "content": "你是一个Python专家，请帮我...",
      "startLine": 10,
      "endLine": 25
    }
  ],
  "statistics": {
    "totalFilesProcessed": 15,
    "totalPromptsExtracted": 23,
    "apiCallsCount": 15,
    "apiCallsSuccess": 14,
    "apiCallsFailed": 1,
    "apiSuccessRate": 93.3,
    "processingTimeSec": 12.5,
    "averageTimePerFile": 833
  }
}
```

### 字段说明

**扫描结果字段：**
- `totalFiles`: 扫描的总文件数
- `promptFiles`: 识别出的提示词文件数组
- `confidence`: AI判断的置信度（0.0-1.0）
- `category`: 提示词类别

**提取结果字段：**
- `totalPrompts`: 提取的提示词总数
- `promptId`: 提示词唯一标识符
- `startLine/endLine`: 提示词在文件中的行号范围
- `statistics`: 详细的处理统计信息

## 开发

### 运行测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

### 项目结构

```
src/
├── models/
│   ├── data_models.js       # 扫描工具数据模型
│   └── prompt_models.js     # 提取工具数据模型
├── services/
│   ├── file_scanner.js      # 文件扫描服务
│   ├── ai_analyzer.js       # AI分析服务（扫描）
│   ├── output_generator.js  # 输出生成服务
│   └── prompt_extractor.js  # 提示词提取服务
├── scan.js                  # 扫描工具CLI入口
└── extract.js               # 提取工具CLI入口

tests/
├── integration/             # 集成测试
│   ├── test_scan_workflow.test.js    # 扫描流程测试
│   ├── test_extract_workflow.test.js # 提取流程测试
│   ├── test_error_handling.test.js   # 错误处理测试
│   └── ...                           # 其他测试文件
└── fixtures/                # 测试数据

analysis/                    # 输出目录
├── prompt-files.json        # 第一步：文件列表
└── prompt-list.json         # 第二步：提示词详情
```

### 核心模块说明

**数据模型：**
- `PromptFile`: 提示词文件信息
- `ScanResult`: 扫描结果汇总
- `PromptDetail`: 单个提示词详情
- `PromptList`: 提示词列表汇总

**服务模块：**
- `FileScanner`: 遍历文件系统，支持.gitignore
- `AIAnalyzer`: 调用GPT API识别提示词文件
- `PromptExtractor`: 深度分析提取具体提示词
- `OutputGenerator`: 生成格式化JSON输出

## 🆕 高级特性

### 错误处理和恢复
- **智能重试机制**：API调用失败时自动重试（默认3次）
- **备用分析策略**：当API不可用时使用启发式规则
- **错误继续处理**：单个文件失败不影响整体流程
- **详细错误记录**：所有错误记录在输出JSON中

### 性能优化
- **并发处理**：支持自定义并发数（1-10）
- **流式处理**：大文件分块处理，避免内存溢出
- **智能缓存**：避免重复API调用

### 统计和监控
提取工具提供详细的执行统计：
- API调用次数和成功率
- 处理时间和平均速度
- 重试次数和错误统计
- 提示词提取数量统计

## 故障排除

### 常见问题

1. **API密钥未设置**
   ```
   错误: OPENAI_API_KEY环境变量未设置
   解决: 
   export OPENAI_API_KEY="sk-your-actual-api-key"
   
   或者直接运行:
   OPENAI_API_KEY="sk-your-actual-api-key" node src/scan.js
   ```

2. **API密钥格式错误**
   ```
   错误: OPENAI_API_KEY格式无效
   解决: 确保API密钥以 "sk-" 开头且长度至少40字符
   获取密钥: https://platform.openai.com/account/api-keys
   ```

3. **API密钥无效**
   ```
   错误: 401 Incorrect API key provided
   解决: 
   - 检查API密钥是否正确
   - 确保账户有足够余额
   - 验证API密钥权限设置
   ```

4. **模型不可用**
   ```
   错误: The model 'gpt-5' does not exist
   解决: 检查OpenAI账户是否有权限访问GPT-5模型
   或使用: node src/scan.js --model gpt-4o
   ```

5. **Node.js版本过低**
   ```
   错误: 需要Node.js 18+版本
   解决: 升级到Node.js 18.0.0或更高版本
   ```

6. **权限问题**
   ```
   错误: 无法写入输出文件
   解决: 检查输出目录的写入权限
   chmod 755 analysis/
   ```

### 调试模式

启用详细输出以获取更多诊断信息：

```bash
node src/scan.js --verbose
```

## 测试覆盖

项目采用TDD（测试驱动开发）方法，包含完整的测试套件：

### 集成测试覆盖
- ✅ 文件扫描工作流 (`test_scan_workflow.test.js`)
- ✅ 提示词提取工作流 (`test_extract_workflow.test.js`) 
- ✅ 数据模型验证 (`test_models.test.js`)
- ✅ 文件读取功能 (`test_file_reading.test.js`)
- ✅ AI分析功能 (`test_ai_analysis.test.js`)
- ✅ 行号定位功能 (`test_line_location.test.js`)
- ✅ JSON输出功能 (`test_json_output.test.js`)
- ✅ 错误处理和统计 (`test_error_handling.test.js`)

### 运行测试
```bash
# 运行所有测试
NODE_OPTIONS='--experimental-vm-modules' npm test

# 运行特定测试文件
NODE_OPTIONS='--experimental-vm-modules' npm test -- tests/integration/test_error_handling.test.js

# 生成覆盖率报告
NODE_OPTIONS='--experimental-vm-modules' npm run test:coverage
```

## 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

### 开发规范
- 使用 ESM 模块语法
- 遵循 TDD 开发流程
- 确保所有测试通过
- 添加适当的错误处理
- 更新相关文档

## 许可证

MIT License

## 作者

Michael Peng

## 致谢

- OpenAI GPT-5 API
- Node.js 社区
- 所有贡献者