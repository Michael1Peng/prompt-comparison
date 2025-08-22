# 阿里云千问翻译脚本使用说明

## 环境配置

1. 获取API Key：
   - 登录阿里云百炼平台
   - 获取 DashScope API Key

2. 设置环境变量：
   ```bash
   export DASHSCOPE_API_KEY="your-api-key-here"
   ```

## 使用方法

```bash
node translate.js "要翻译的文本" [目标语言]
```

### 示例

```bash
# 中译英
node translate.js "你好世界" "English"

# 英译中
node translate.js "Hello World" "中文"

# 中译日
node translate.js "今天天气很好" "Japanese"
```

## 特点

- 使用 Node.js 内置模块，无需安装额外依赖
- 基于阿里云千问 Turbo 模型
- 支持多种目标语言
- 环境变量保护 API Key