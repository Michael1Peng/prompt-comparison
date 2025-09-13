# AI提示词文件发现和汇总工具

一个用于扫描Git仓库识别AI提示词文件，并生成JSON分析报告的命令行工具。

## 功能特性

- 🔍 **智能扫描**：自动扫描Git仓库中的文本文件
- 🤖 **AI分析**：使用GPT-5 API识别提示词文件内容
- 📊 **JSON报告**：生成详细的分析报告和统计信息
- ⚡ **并发处理**：支持5个并发API调用，提高处理效率
- 📁 **Git集成**：遵循.gitignore规则，忽略不需要的文件
- 🎨 **美观输出**：彩色命令行界面，支持详细日志

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

### 基本用法

```bash
node src/scan.js
```

这将扫描当前目录下的所有文本文件，并将分析结果保存到 `./analysis/prompt-files.json`。

### 命令行选项

```bash
node src/scan.js [选项]
```

**可用选项：**

- `-o, --output <path>`: 指定输出文件路径（默认：./analysis/prompt-files.json）
- `-c, --concurrency <number>`: 设置并发处理数量（默认：5）
- `--api-base <url>`: OpenAI API 基础URL（默认：https://api.openai.com/v1）
- `--model <name>`: GPT模型名称（默认：gpt-5）
- `--no-pretty`: 关闭JSON格式化输出
- `--verbose`: 显示详细输出信息
- `-V, --version`: 显示版本号
- `-h, --help`: 显示帮助信息

### 使用示例

```bash
# 基本扫描
node src/scan.js

# 指定输出文件
node src/scan.js -o ./reports/my-analysis.json

# 增加并发数并启用详细输出
node src/scan.js -c 10 --verbose

# 使用自定义API基础URL（如Azure OpenAI）
node src/scan.js --api-base https://your-resource.openai.azure.com/openai/deployments/your-deployment

# 使用不同的GPT模型
node src/scan.js --model gpt-3.5-turbo

# 生成非格式化的紧凑JSON
node src/scan.js --no-pretty

# 组合使用多个选项
node src/scan.js -c 8 --model gpt-5 --api-base https://api.openai.com/v1 --verbose
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

生成的JSON报告包含以下信息：

```json
{
  "scanResult": {
    "totalFiles": 15,
    "promptFiles": [
      {
        "filePath": "./prompts/example.md",
        "fileName": "example.md",
        "content": "请帮我写一个Python函数...",
        "isPrompt": true,
        "confidence": 0.95,
        "language": "python",
        "category": "code-generation"
      }
    ],
    "scanTimestamp": "2025-09-13T12:00:00.000Z",
    "scanDuration": 5230
  }
}
```

### 字段说明

- `totalFiles`: 扫描的总文件数
- `promptFiles`: 识别出的提示词文件数组
- `confidence`: AI判断的置信度（0.0-1.0）
- `language`: 提示词相关的编程语言
- `category`: 提示词类别（如 'code-generation', 'tutorial'）

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
│   └── data_models.js      # 数据模型定义
├── services/
│   ├── file_scanner.js     # 文件扫描服务
│   ├── ai_analyzer.js      # AI分析服务
│   └── output_generator.js # 输出生成服务
└── scan.js                 # 主CLI入口点

tests/
├── contract/               # 契约测试
├── integration/            # 集成测试
└── unit/                   # 单元测试

analysis/                   # 输出目录
└── prompt-files.json       # 分析报告
```

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

## 许可证

MIT License

## 作者

Michael Peng