# Prompt Collection 翻译脚本

这个脚本专门用于翻译 prompt collection JSON 文件中的提示词内容。

## 功能特点

- 批量处理 JSON 文件中的所有 prompt items
- 翻译 `original_prompt` 字段为中文，保存为 `translated_prompt`
- 翻译 `description` 字段为中文，保存为 `translated_description`
- 使用阿里云通义千问 API 进行翻译
- 自动添加延迟避免 API 限流
- 错误处理和进度显示

## 环境要求

1. 安装 Node.js
2. 设置阿里云通义千问 API Key:
   ```bash
   export DASHSCOPE_API_KEY="your-api-key-here"
   ```

## 使用方法

### 基本用法
```bash
# 翻译 prompt-collection.json，输出到 prompt-collection-translated.json
node translate-prompts.js prompt-collection.json

# 指定输出文件名
node translate-prompts.js prompt-collection.json my-translated-prompts.json
```

### 高级配置

设置 API 调用延迟（毫秒）：
```bash
export TRANSLATION_DELAY=2000  # 2秒延迟
node translate-prompts.js prompt-collection.json
```

## 输入文件格式

输入的 JSON 文件应该是数组格式，每个元素包含：
```json
[
  {
    "name": "提示词名称",
    "description": "提示词描述",
    "original_prompt": "原始提示词内容"
  }
]
```

## 输出文件格式

输出文件会在原有字段基础上添加翻译字段：
```json
[
  {
    "name": "提示词名称",
    "description": "提示词描述", 
    "original_prompt": "原始提示词内容",
    "translated_description": "翻译后的描述",
    "translated_prompt": "翻译后的提示词内容"
  }
]
```

## 错误处理

- 如果翻译某个项目失败，会在该项目中添加 `translation_error` 字段
- 脚本会继续处理其他项目
- 所有错误信息会在控制台显示

## 示例

```bash
# 设置 API Key
export DASHSCOPE_API_KEY="sk-xxxxx"

# 翻译项目中的 prompt collection
node translate-prompts.js prompt-collection.json

# 输出示例:
# 读取文件: prompt-collection.json
# 开始翻译 152 个 prompt items...
# 
# 翻译第 1/152 项: System Prompt Generator
#   - 翻译 description...
#   ✓ description 翻译完成
#   - 翻译 original_prompt...
#   ✓ original_prompt 翻译完成
# 等待 1000ms...
# 
# 翻译第 2/152 项: Tool Use Instructions Reminder
# ...
# 
# ✅ 翻译完成！结果已保存到: prompt-collection-translated.json
# 🎉 所有翻译任务已完成！
```

## 注意事项

1. API 调用有频率限制，脚本会自动添加延迟
2. 大文件翻译可能需要较长时间
3. 确保网络连接稳定
4. 建议备份原始文件