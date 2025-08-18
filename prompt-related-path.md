# Prompt Related Files in RooCodeInc/roo-code

## Core System Prompt Files

### Main System Prompt Generator
```
RooCodeInc/roo-code/src/core/prompts/system.ts
```

### Prompt Sections (Modular Components)
```
RooCodeInc/roo-code/src/core/prompts/sections/index.ts
RooCodeInc/roo-code/src/core/prompts/sections/objective.ts
RooCodeInc/roo-code/src/core/prompts/sections/rules.ts
RooCodeInc/roo-code/src/core/prompts/sections/capabilities.ts
RooCodeInc/roo-code/src/core/prompts/sections/custom-instructions.ts
RooCodeInc/roo-code/src/core/prompts/sections/custom-system-prompt.ts
RooCodeInc/roo-code/src/core/prompts/sections/markdown-formatting.ts
RooCodeInc/roo-code/src/core/prompts/sections/mcp-servers.ts
RooCodeInc/roo-code/src/core/prompts/sections/modes.ts
```

### Prompt Types and Utilities
```
RooCodeInc/roo-code/src/core/prompts/types.ts
RooCodeInc/roo-code/src/core/prompts/responses.ts
```

## Mode Definitions and Configurations

### Default Modes
```
RooCodeInc/roo-code/packages/types/src/mode.ts
RooCodeInc/roo-code/src/shared/modes.ts
```

## Tool Prompt Definitions

### Individual Tool Instructions
```
RooCodeInc/roo-code/src/core/tools/readFileTool.ts
RooCodeInc/roo-code/src/core/tools/writeToFileTool.ts
RooCodeInc/roo-code/src/core/tools/searchFilesTool.ts
RooCodeInc/roo-code/src/core/tools/listFilesTool.ts
RooCodeInc/roo-code/src/core/tools/executeCommandTool.ts
RooCodeInc/roo-code/src/core/tools/browserActionTool.ts
RooCodeInc/roo-code/src/core/tools/askFollowupQuestionTool.ts
RooCodeInc/roo-code/src/core/tools/attemptCompletionTool.ts
RooCodeInc/roo-code/src/core/tools/codebaseSearchTool.ts
RooCodeInc/roo-code/src/core/tools/accessMcpResourceTool.ts
RooCodeInc/roo-code/src/core/tools/useMcpToolTool.ts
RooCodeInc/roo-code/src/core/tools/switchModeTool.ts
RooCodeInc/roo-code/src/core/tools/newTaskTool.ts
RooCodeInc/roo-code/src/core/tools/insertContentTool.ts
RooCodeInc/roo-code/src/core/tools/searchAndReplaceTool.ts
RooCodeInc/roo-code/src/core/tools/multiApplyDiffTool.ts
RooCodeInc/roo-code/src/core/tools/applyDiffTool.ts
RooCodeInc/roo-code/src/core/tools/listCodeDefinitionNamesTool.ts
RooCodeInc/roo-code/src/core/tools/updateTodoListTool.ts
RooCodeInc/roo-code/src/core/tools/fetchInstructionsTool.ts
```

## Support Prompt Templates

### Context-Specific Prompts
```
RooCodeInc/roo-code/src/shared/support-prompt.ts
```

## Instruction Generation Templates

### Dynamic Instruction Creation
```
RooCodeInc/roo-code/src/core/prompts/instructions/instructions.ts
RooCodeInc/roo-code/src/core/prompts/instructions/create-mcp-server.ts
RooCodeInc/roo-code/src/core/prompts/instructions/create-mode.ts
```

## Test Files and Examples

### Prompt Tests and Snapshots
```
RooCodeInc/roo-code/src/core/prompts/__tests__/system-prompt.spec.ts
RooCodeInc/roo-code/src/core/prompts/__tests__/sections.spec.ts
RooCodeInc/roo-code/src/core/prompts/__tests__/custom-system-prompt.spec.ts
RooCodeInc/roo-code/src/core/prompts/__tests__/add-custom-instructions.spec.ts
RooCodeInc/roo-code/src/core/prompts/__tests__/responses-rooignore.spec.ts
RooCodeInc/roo-code/src/core/prompts/__tests__/get-prompt-component.spec.ts
RooCodeInc/roo-code/src/core/prompts/__tests__/__snapshots__/
```

### Mode Tests
```
RooCodeInc/roo-code/src/shared/__tests__/modes.spec.ts
RooCodeInc/roo-code/src/shared/__tests__/modes-empty-prompt-component.spec.ts
```

### Support Prompt Tests
```
RooCodeInc/roo-code/src/shared/__tests__/support-prompts.spec.ts
```

## Internationalization Files

### Multi-language Prompt Content
```
RooCodeInc/roo-code/webview-ui/src/i18n/locales/en/prompts.json
RooCodeInc/roo-code/webview-ui/src/i18n/locales/es/prompts.json
RooCodeInc/roo-code/webview-ui/src/i18n/locales/fr/prompts.json
RooCodeInc/roo-code/webview-ui/src/i18n/locales/de/prompts.json
RooCodeInc/roo-code/webview-ui/src/i18n/locales/it/prompts.json
RooCodeInc/roo-code/webview-ui/src/i18n/locales/pt-BR/prompts.json
RooCodeInc/roo-code/webview-ui/src/i18n/locales/nl/prompts.json
RooCodeInc/roo-code/webview-ui/src/i18n/locales/pl/prompts.json
RooCodeInc/roo-code/webview-ui/src/i18n/locales/ru/prompts.json
RooCodeInc/roo-code/webview-ui/src/i18n/locales/tr/prompts.json
RooCodeInc/roo-code/webview-ui/src/i18n/locales/vi/prompts.json
RooCodeInc/roo-code/webview-ui/src/i18n/locales/id/prompts.json
RooCodeInc/roo-code/webview-ui/src/i18n/locales/hi/prompts.json
RooCodeInc/roo-code/webview-ui/src/i18n/locales/ja/prompts.json
RooCodeInc/roo-code/webview-ui/src/i18n/locales/ko/prompts.json
RooCodeInc/roo-code/webview-ui/src/i18n/locales/zh-CN/prompts.json
RooCodeInc/roo-code/webview-ui/src/i18n/locales/zh-TW/prompts.json
RooCodeInc/roo-code/webview-ui/src/i18n/locales/ca/prompts.json
```

## Webview Message Handling

### Prompt Generation in UI
```
RooCodeInc/roo-code/src/core/webview/generateSystemPrompt.ts
RooCodeInc/roo-code/src/core/webview/webviewMessageHandler.ts
```

## Configuration and Settings

### Prompt-related Configuration
```
RooCodeInc/roo-code/src/core/config/CustomModesManager.ts
RooCodeInc/roo-code/src/core/config/ProviderSettingsManager.ts
```

## Assistant Message Processing

### Message Parsing and Presentation
```
RooCodeInc/roo-code/src/core/assistant-message/AssistantMessageParser.ts
RooCodeInc/roo-code/src/core/assistant-message/parseAssistantMessage.ts
RooCodeInc/roo-code/src/core/assistant-message/parseAssistantMessageV2.ts
RooCodeInc/roo-code/src/core/assistant-message/presentAssistantMessage.ts
```

## Integration Files

### Claude Code Integration
```
RooCodeInc/roo-code/src/integrations/claude-code/message-filter.ts
RooCodeInc/roo-code/src/integrations/claude-code/run.ts
RooCodeInc/roo-code/src/integrations/claude-code/types.ts
```

## API Provider Templates

### Provider-specific Prompt Handling
```
RooCodeInc/roo-code/src/api/transform/anthropic.ts
RooCodeInc/roo-code/src/api/transform/openai-format.ts
RooCodeInc/roo-code/src/api/transform/gemini-format.ts
RooCodeInc/roo-code/src/api/transform/mistral-format.ts
RooCodeInc/roo-code/src/api/transform/simple-format.ts
RooCodeInc/roo-code/src/api/transform/r1-format.ts
RooCodeInc/roo-code/src/api/transform/reasoning.ts
```

## Total Files: 90+

This represents a comprehensive prompt engineering system with modular architecture, multi-language support, and extensive tool integration capabilities.