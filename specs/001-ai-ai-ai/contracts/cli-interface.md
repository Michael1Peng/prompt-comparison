# CLI Interface Contract

**Feature**: AI 提示词分析工作流 | **Version**: 1.0.0

## Command Structure

所有CLI命令遵循统一的接口规范，支持标准化的输入输出格式。

## Main Command: `prompt-analyzer`

### Synopsis
```bash
prompt-analyzer [options] <directory> [output-file]
```

### Description
扫描指定目录中的所有文件，使用AI智能识别提示词内容，分析13个框架要素，生成结构化的JSON报告。

### Arguments
- `<directory>`: 要分析的目录路径（必需）
- `[output-file]`: 输出文件路径（可选，默认: ./analysis/analysis-report-TIMESTAMP.json）

### Options

#### Global Options
```bash
--version, -v          显示版本信息
--help, -h             显示帮助信息
--config, -c <file>    配置文件路径 (默认: ./prompt-analyzer.config.json)
--verbose              启用详细输出
--quiet                静默模式，只输出错误
--no-color             禁用彩色输出
```

#### Processing Options
```bash
--concurrency <n>      并发处理数量 (默认: 10)
--api-key <key>        OpenAI API密钥 (或使用环境变量 OPENAI_API_KEY)
--model <model>        AI模型名称 (默认: gpt-5)
--max-file-size <mb>   最大文件大小限制，MB (默认: 50)
--timeout <seconds>    API请求超时时间 (默认: 30)
```

#### Filtering Options
```bash
--include <pattern>    包含文件模式 (glob格式, 可多次使用)
--exclude <pattern>    排除文件模式 (glob格式, 可多次使用)
--min-confidence <n>   最小置信度阈值 (0.0-1.0, 默认: 0.7)
--languages <langs>    限制语言类型 (zh,en,mixed,other)
```

#### Output Options
```bash
--format <format>      输出格式 (json|json-pretty|csv, 默认: json-pretty)
--output-dir <dir>     输出目录 (默认: ./analysis)
--no-backup            不创建备份文件
--compress             压缩输出文件
```

## Sub-commands

### 1. scan - 文件扫描

```bash
prompt-analyzer scan [options] <directory>
```

**Purpose**: 只执行文件扫描，不进行AI分析

**Options**:
```bash
--dry-run              模拟运行，不实际处理文件
--show-binary          显示二进制文件信息
--stats                显示扫描统计信息
```

**Output**: 文件列表JSON

**Exit Codes**:
- 0: 成功
- 1: 参数错误
- 2: 目录不存在
- 3: 权限错误

### 2. detect - 提示词检测

```bash
prompt-analyzer detect [options] <file-or-directory>
```

**Purpose**: 检测文件是否包含提示词，不进行要素分析

**Options**:
```bash
--threshold <n>        置信度阈值 (0.0-1.0)
--batch-size <n>       批处理大小 (默认: 50)
--cache                启用检测结果缓存
```

**Output**: 检测结果JSON

### 3. analyze - 要素分析

```bash
prompt-analyzer analyze [options] <prompt-file-list>
```

**Purpose**: 对已识别的提示词文件进行13要素分析

**Options**:
```bash
--quality-filter <grade>  质量过滤 (A,B,C,D,F)
--export-elements         导出要素到单独文件
--validate-schema         验证输出Schema
```

**Output**: 要素分析结果JSON

### 4. report - 报告生成

```bash
prompt-analyzer report [options] <analysis-data>
```

**Purpose**: 从分析数据生成可视化报告

**Options**:
```bash
--template <file>      报告模板文件
--charts               生成图表
--export-csv           同时导出CSV格式
```

**Output**: HTML/PDF报告文件

## Input/Output Contracts

### Standard Input Format
```json
{
  "directory": "/path/to/project",
  "options": {
    "concurrency": 10,
    "minConfidence": 0.7,
    "include": ["**/*.md", "**/*.txt"],
    "exclude": ["node_modules/**", ".git/**"]
  }
}
```

### Standard Output Format
```json
{
  "success": true,
  "reportId": "uuid-v4",
  "timestamp": "2025-09-13T10:30:00Z",
  "summary": {
    "totalFiles": 150,
    "promptFiles": 25,
    "totalPrompts": 32,
    "avgQuality": "B",
    "processingTime": 45000
  },
  "data": {
    "files": [...],
    "contents": [...],
    "elements": [...]
  }
}
```

### Error Output Format
```json
{
  "success": false,
  "error": {
    "code": "API_LIMIT_EXCEEDED",
    "message": "API调用超出限制，请稍后重试",
    "details": {
      "retryAfter": 3600,
      "remainingQuota": 0
    }
  },
  "partial": {
    "processedFiles": 45,
    "failedFiles": ["file1.md", "file2.txt"]
  }
}
```

## Progress and Logging

### Progress Output (--verbose)
```
[INFO] 正在扫描目录: /project
[INFO] 发现 150 个文件
[PROGRESS] 文件扫描: ████████████████████ 100% (150/150)
[INFO] 开始提示词检测...
[PROGRESS] 提示词检测: ████████░░░░░░░░░░░░ 40% (60/150)
[WARN] 跳过大文件: large-file.md (52MB)
[ERROR] API调用失败: timeout.txt (超时)
[INFO] 检测完成: 25个文件包含提示词
[INFO] 开始要素分析...
[PROGRESS] 要素分析: ████████████████████ 100% (25/25)
[SUCCESS] 分析完成: ./analysis/analysis-report-20250913-103000.json
```

### Log File Format (processing.log)
```
2025-09-13T10:30:00.123Z [INFO] CLI启动: prompt-analyzer --verbose /project
2025-09-13T10:30:00.145Z [DEBUG] 配置加载: concurrency=10, model=gpt-5
2025-09-13T10:30:01.234Z [INFO] 文件扫描完成: 150个文件
2025-09-13T10:30:15.567Z [WARN] API限流触发: 等待5秒
2025-09-13T10:30:45.890Z [SUCCESS] 分析完成: 32个提示词, 平均质量B
```

## Configuration File

### Default Config: `prompt-analyzer.config.json`
```json
{
  "api": {
    "provider": "openai",
    "model": "gpt-5",
    "timeout": 30000,
    "retries": 3,
    "concurrency": 10
  },
  "processing": {
    "maxFileSize": 52428800,
    "minConfidence": 0.7,
    "batchSize": 50,
    "enableCache": true
  },
  "output": {
    "directory": "./analysis",
    "format": "json-pretty",
    "createBackup": true,
    "compress": false
  },
  "filters": {
    "include": ["**/*.md", "**/*.txt", "**/*.py", "**/*.js"],
    "exclude": ["node_modules/**", ".git/**", "dist/**"],
    "languages": ["zh", "en", "mixed"]
  },
  "logging": {
    "level": "info",
    "file": "./analysis/processing.log",
    "maxSize": "10MB",
    "maxFiles": 5
  }
}
```

## Environment Variables

```bash
# API配置
OPENAI_API_KEY=your-api-key-here
PROMPT_ANALYZER_MODEL=gpt-5
PROMPT_ANALYZER_TIMEOUT=30

# 输出配置
PROMPT_ANALYZER_OUTPUT_DIR=./analysis
PROMPT_ANALYZER_LOG_LEVEL=info

# 性能配置
PROMPT_ANALYZER_CONCURRENCY=10
PROMPT_ANALYZER_MAX_FILE_SIZE=50
```

## Exit Codes

| Code | Description | Retry |
|------|-------------|--------|
| 0 | 成功完成 | - |
| 1 | 参数错误 | No |
| 2 | 输入错误（目录不存在等） | No |
| 3 | 权限错误 | No |
| 4 | API认证失败 | No |
| 5 | API限流 | Yes (after delay) |
| 6 | 网络错误 | Yes |
| 7 | 内存不足 | No |
| 8 | 配置错误 | No |
| 9 | 输出错误（磁盘空间等） | No |
| 10 | 部分失败（某些文件处理失败） | Partial |

## Examples

### Basic Usage
```bash
# 分析当前目录
prompt-analyzer .

# 指定输出文件
prompt-analyzer ./project ./reports/analysis.json

# 使用配置文件
prompt-analyzer -c ./config.json ./project
```

### Advanced Usage
```bash
# 高并发处理
prompt-analyzer --concurrency 20 --timeout 60 ./large-project

# 过滤特定文件
prompt-analyzer --include "**/*.md" --exclude "**/node_modules/**" ./project

# 只检测不分析
prompt-analyzer detect --threshold 0.8 ./project

# 生成CSV报告
prompt-analyzer --format csv ./project
```

---
*Contract version 1.0.0 - Compatible with functional requirements FR-001 to FR-010*