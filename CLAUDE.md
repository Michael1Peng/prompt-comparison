# Claude Code Configuration

## Project-specific Hooks

Claude Code hooks are configured in `.claude/settings.json` and run automatically at specific events.

### Current Hook Configuration

The project is configured with the following hooks in `.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "echo '📚 Loading project brainstorm content using repomix...' && npx repomix .brainstorm -o brainstorm.xml"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "echo '💡 Reminder: Write brainstorm and documentation files to .brainstorm/ directory for better organization'"
          }
        ]
      }
    ]
  }
}
```

### Hook Behavior

1. **SessionStart Hook**: Uses `npx repomix` to pack all files in `.brainstorm/` directory into a single AI-friendly format and displays the content at the beginning of each conversation session
2. **PostToolUse Hook**: Shows a reminder after any Write or MultiEdit operation to encourage writing documentation to `.brainstorm/`

### Repomix Integration

The SessionStart hook uses repomix to:
- Pack all `.brainstorm/` files into a single, structured format
- Include file summaries and token counts
- Provide AI-optimized content for better context understanding
- Output in plain text format for easy reading

### Configuration Management

- Use `/hooks` command in Claude Code for interactive configuration
- Or directly edit `.claude/settings.json`
- Changes take effect on next session restart

## Original Requirements

I'm brainstorming about this new prompt comparison product.
Every time we start the conversation session, read all the files in @.brainstorm/.
Every time you need to write files, write to @.brainstorm/.

## Brainstorm Context 

@brainstorm.xml
