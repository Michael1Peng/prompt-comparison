# Research: AI提示词框架要素拆分工具

## 核心技术研究

### AI提示词要素拆分策略
**Decision**: 使用GPT-5智能识别13个框架要素  
**Rationale**: 
- AI能理解提示词语义，准确识别各要素
- 自动处理不同格式和风格的提示词
- 确保内容完整拆分，无重复

**Alternatives considered**:
- 规则匹配：不够智能，难以处理复杂提示词
- 关键词提取：过于简单，容易遗漏重要内容

### 13个框架要素定义
**Decision**: 标准化13个要素，所有字段必须存在  
**要素列表**:
1. `source_file`: 所在文件路径
2. `role_capability`: 角色/能力定义
3. `task_request`: 任务/请求说明
4. `background_context`: 背景/情境信息
5. `instruction_action`: 指令/行动步骤
6. `output_specification`: 输出规格要求
7. `examples`: 示例内容
8. `constraints_limitations`: 限制/约束条件
9. `goals_expectations`: 目标/期望结果
10. `information`: 相关信息资源
11. `evaluation_optimization`: 评估/优化标准
12. `adjustments`: 调整机制
13. `audience`: 目标受众

### 并发控制
**Decision**: 复用p-limit，5个并发  
**Rationale**:
- 与前两步保持一致
- 平衡处理速度和API限流

### 空要素处理
**Decision**: 不存在的要素设为空字符串 ""  
**Rationale**:
- 保持JSON结构完整性
- 便于后续处理和对比分析

### MVP实现范围
**Decision**: 最简化实现，只关注核心流程  
**核心功能**:
- ✅ 读取prompt-list.json
- ✅ 5个并发调用AI API
- ✅ 拆分13个框架要素
- ✅ 输出prompt-list-elements.json
- ❌ 复杂错误处理（MVP不需要）
- ❌ 进度条显示（MVP不需要）
- ❌ 要素质量评分（后续版本）

### 集成测试策略
**Decision**: 集成测试驱动开发  
**Rationale**:
- MVP关注端到端流程
- 快速验证功能完整性

**测试重点**:
- 完整流程测试
- 空要素处理测试