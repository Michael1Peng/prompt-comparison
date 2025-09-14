# Research: AI提示词文件深度分析和提取工具

## 核心技术选型

### 架构复用策略
**Decision**: 复用现有Node.js架构和服务模块  
**Rationale**: 保持代码一致性，避免重复实现，降低维护成本  
**Alternatives considered**: 独立实现新架构(增加复杂度和维护成本)

### AI分析策略
**Decision**: 让AI根据任务和设计完整性自动识别提示词边界  
**Rationale**: 更智能的语义分析，能正确识别完整的提示词任务，避免机械分割  
**Alternatives considered**: 正则表达式分割(不够智能)，段落分割(可能切断完整提示词)，固定分隔符(不灵活)

### 数据模型扩展
**Decision**: 基于现有PromptFile模型，新增PromptDetail和PromptList  
**Rationale**: 保持数据结构一致性，便于后续分析和与第一步工具的集成  
**Alternatives considered**: 全新数据结构(不兼容现有架构)，直接修改现有模型(破坏向后兼容性)

### 行号处理策略  
**Decision**: 0-based indexing，包含上下文行，简单处理  
**Rationale**: 符合编程习惯，包含完整语境有助于理解提示词，简单实现减少复杂度  
**Alternatives considered**: 1-based indexing(与编程习惯不符)，严格边界(可能丢失上下文)

### 错误处理策略
**Decision**: 错误日志 + 跳过继续，保持MVP简单性  
**Rationale**: 确保单个文件失败不影响整体流程，符合MVP快速迭代的要求  
**Alternatives considered**: 复杂错误跟踪(增加实现复杂度)，失败即停止(用户体验差)

### 命令行接口设计
**Decision**: 创建新的独立命令工具，固定输入输出路径  
**Rationale**: 职责单一，用户使用简单，与第一步工具形成清晰的流水线关系  
**Alternatives considered**: 集成到scan.js子命令(增加复杂度)，可配置路径(增加用户负担)

## MVP范围确认
基于互动澄清的结果：
- ✅ 读取 analysis/prompt-files.json 的 scanResult.promptFiles 数组
- ✅ 并发处理所有列出的文件，无条件过滤
- ✅ AI自动识别每个文件中的提示词，支持单文件多提示词
- ✅ 保持原始格式，记录精确行号位置信息  
- ✅ 输出到 analysis/prompt-list.json，包含统计信息
- ✅ 错误直接跳过，不阻塞主流程
- ✅ TDD严格执行，测试先于实现

## 核心依赖确认
基于现有架构，复用以下模块：
- **OpenAI SDK**: GPT API调用，复用现有配置
- **AIAnalyzer**: 扩展现有分析器，支持提示词边界识别
- **OutputGenerator**: 复用输出生成逻辑，支持新的数据格式
- **FileScanner**: 复用文件读取逻辑
- **fs-extra, p-limit, chalk**: 复用现有工具库

## 技术风险评估
**低风险**: 基于成熟架构扩展，核心技术栈已验证  
**主要挑战**: AI提示词边界识别的准确性，通过MVP简单策略降低风险  
**缓解策略**: 保持简单实现，错误容错，快速迭代验证