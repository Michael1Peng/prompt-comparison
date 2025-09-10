使用 gh 命令新建一个 roo code 仓库，然后把 https://github.com/RooCodeInc/Roo-Code 设为 upstream

---

所有分析找到的这些提测相关的文件路径入境汇总输出到一个文件`prompt-related-path.md` 里面。
接下来根据这个 `prompt-related-path.md` 文件里面记录的所有包含了提示词的文件，把这些提示词按照固定的格式输出到一个新的JSON文件`prompt-collection.json` 文件里面去。
这个JSON是一个array，然后每一个item应该包括 `name`，就是这个提示词的命名，`description`，这个提示词的简介和`original_prompt`，就是这个提示词的完整原文。

不要等你把所有的提示词都收集完一次性输出，而是每找到一个提示词就输出一个提示词，分步骤地把所有的文件都处理完。

---

帮我创建一个JS脚本能够自动的把这个 `prompt-collection.json` 的内容输出成多个table，
这些table的行分别是分别是`name`、`description`和`original_prompt`。
然后每个table一共包括四个提示词。

---

首先帮我逐个修改 JSON 里面的 item，逐个地去翻译 original props，新增一个 `translated prompt ，把对应的提示词翻译成中文。
然后修改 `generated-tables.js` 文件，然后去把这个新增的 translated prompt 给添加到输出的 table 里。

## 分析

新增一个 JS 脚本，来处理 `prompt-collection.json` 文件。从 prompt engineer 的角度分析，把当前列表里面每个 item 的提示词预设拆分这些元素,作为新的字段添加到当前的 JSON item 里。：
所在文件 | 角色/能力 | 任务/请求 | 背景/情境 | 指令/行动 | 输出规格 | 示例 | 限制/约束 | 目标/期望 | 信息 | 评估/优化 | 调整 | 受众

注意，只做原内容的拆分，不要添加任何新的内容。
以下格式输出到文件，没有相关内容的 cell 置空，`original content` 保持 prompt 预设完整的内容:
