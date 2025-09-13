我当前在设计一套 AI agent 分析当前代码仓库里面所有提示词的工作流。

## 当前项目状态 (2025-09-13)
- **功能规范**: 已完成 (`@specs/001-ai-ai-ai/spec.md`)
- **实现计划**: 已完成 (`@specs/001-ai-ai-ai/plan.md`)
- **技术选型**: Node.js + TypeScript + GPT-5
- **架构设计**: CLI工具，13要素分析框架

## 项目资源
@./brainstorm/ 这个目录下面有大量的针对这个提示词对比平台的脑爆内容，包括了产品和技术两个层次的一些讨论过程的思考。
当前脑暴的文案内容还是要保持在 @./brainstorm/ 文件夹下面

之前实现过的历史 Demo 相关的提示词和对应的一些脚本，可以参考里面的 思路: @history.xml

## 技术栈和依赖
- **运行环境**: Node.js 18+ (LTS)
- **核心依赖**: commander.js, fs/promises, openai SDK (GPT-5), zod
- **测试框架**: Jest + @types/jest
- **目标**: 跨平台CLI工具
- **输出格式**: JSON报告保存到 `./analysis/` 目录

## 核心功能库
- **file-scanner**: 文件扫描和过滤 (Node.js fs/promises)
- **prompt-detector**: AI提示词识别服务
- **element-analyzer**: 13要素分析引擎
- **report-generator**: JSON报告生成

## 13个提示词要素
所在文件 | 角色/能力 | 任务/请求 | 背景/情境 | 指令/行动 | 输出规格 | 示例 | 限制/约束 | 目标/期望 | 信息 | 评估/优化 | 调整 | 受众

[IMPORTANT] Always Comunicate and write docs in Chinese.
[IMPORTANT] 记得永远用中文跟我沟通和输出文档。