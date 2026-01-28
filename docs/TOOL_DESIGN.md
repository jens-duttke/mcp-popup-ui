# Tool Design Best Practices for LLMs

This document summarizes research findings on designing MCP tools that LLMs can reliably use.

## Key Findings

### Multiple Focused Tools vs. Single Composite Tool

| Approach | Pros | Cons |
|----------|------|------|
| **Multiple focused tools** | Clearer intent, easier for LLM to select, simpler schemas | More tools = higher token usage |
| **Single composite tool** | Lower token overhead, fewer routing decisions | Complex nested schemas harder to fill correctly, higher error rate |

**Recommendation:** Use **multiple focused tools** with clear semantic boundaries. OpenAI recommends keeping the total number of tools below 20.

### Schema Complexity and LLM Capabilities

| Schema Type | Success Rate | Notes |
|-------------|--------------|-------|
| Flat properties | High | Preferred for all models |
| Nested objects | Medium | Works with strong models (GPT-4, Claude Opus/Sonnet) |
| Arrays of objects | Lower | More parsing errors, especially with weaker models |
| `oneOf` / Union types | Problematic | Weaker models often choose wrong variant |

**Key Insight:** Weaker/smaller models (7B-13B parameters) struggle with:

- Nested JSON extraction
- Complex `oneOf` schemas
- Freeform types (prefer explicit enums)

### Sources

- [OpenAI Function Calling Guide](https://platform.openai.com/docs/guides/function-calling) - "Keep the number of functions small for higher accuracy"
- [Anthropic Tool Use Documentation](https://docs.anthropic.com/en/docs/build-with-claude/tool-use) - Recommends `strict: true` for guaranteed schema validation
- [MCP Tools Specification](https://modelcontextprotocol.io/docs/concepts/tools) - Protocol-level tool definitions
- ToolLLM Paper (arXiv:2307.16789) - Research on 16,000+ real-world APIs

## Tool Description Best Practices

### 1. Action-Oriented Naming

```markdown
✅ "ask_user" - Clear verb + target
✅ "get_weather" - Clear action
❌ "user_dialog" - Ambiguous
❌ "form_handler" - Implementation-focused
```

### 2. "When to Use" Sections

Include explicit scenarios:

```markdown
WHEN TO USE THIS TOOL:
- You are about to list numbered options and ask "which do you prefer?"
- You need user confirmation on a specific choice
```

### 3. "When NOT to Use" Contrasts

Help LLMs distinguish between similar tools:

```markdown
DO NOT use this tool for:
- Simple yes/no questions (just ask in plain text)
- Cases where only one option exists
- Free-form text input (use ask_user_text instead)
```

### 4. Concrete Examples

```markdown
EXAMPLES:
- "Should I use A, B, or C?" → Use this tool
- "Which framework?" → Use this tool
```

### 5. Anti-Pattern Examples (CRITICAL)

**Key Finding:** Showing the exact wrong pattern is MORE effective than only showing the correct format. LLMs learn better from explicit "don't do this" examples that match their common failure modes.

```markdown
⚠️ CRITICAL: Each parameter MUST be passed SEPARATELY. Do NOT combine them!

❌ WRONG (options contains title/description - WILL FAIL):
  options: [{"label": "A"}, {"label": "B"}], "title": "...", "description": "..."

✅ CORRECT (each parameter separate):
  options: [{"label": "A"}, {"label": "B"}]
  title: "Pick one"
  description: "Choose your preference"
```

**Why this works:**

| Approach | Effectiveness | Reason |
|----------|---------------|--------|
| Only showing correct format | Medium | LLM may still make mistakes without knowing what to avoid |
| Showing wrong pattern with ❌ | High | LLM recognizes and avoids the specific anti-pattern |
| Using ⚠️ CRITICAL prefix | High | Signals importance, increases attention weight |

**Common LLM mistakes with multi-parameter tools:**

1. **Trailing parameters in array value:** `options: [...], "title": "..."` — LLM appends extra JSON after the array
2. **Nested object instead of flat parameters:** `options: {"items": [...], "title": "..."}` — LLM wraps everything in one object
3. **String-escaped JSON:** `options: "[{\"label\": \"A\"}]"` — LLM double-encodes the array

**Recommendation:** Always include the most common anti-pattern with ❌ WRONG directly in the tool description, not just in documentation.

### 6. Schema Simplification

Avoid `oneOf` unions when possible. Prefer:

```typescript
// ✅ Preferred: Single object type
options: {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      label: { type: 'string' },      // required
      description: { type: 'string' }, // optional
      recommended: { type: 'boolean' } // optional
    },
    required: ['label']
  }
}

// ❌ Avoid: oneOf with string | object
options: {
  type: 'array',
  items: {
    oneOf: [
      { type: 'string' },
      { type: 'object', ... }
    ]
  }
}
```

## Planned Tool Expansion

Based on these principles, the following tools are planned:

| Tool | Purpose | Priority |
|------|---------|----------|
| `ask_user_text` | Single/multi-line text input with validation | High |
| `ask_user_confirm` | Simple yes/no confirmation | High |
| `ask_user_number` | Numeric input with min/max/step | Medium |
| `ask_user_date` | Date or date-range selection | Medium |
| `ask_user_search` | Searchable dropdown for large option lists | Low |

Each tool will have:

- Clear semantic scope
- Simple, flat schema
- Comprehensive description with use/don't-use guidance
- Minimal required parameters

## Token Considerations

Tool definitions count against the model's context limit. To optimize:

1. **Keep descriptions concise but complete** - Include all necessary guidance
2. **Use enums over freeform strings** - Smaller token footprint
3. **Avoid redundant properties** - Each property adds tokens
4. **Consider fine-tuning** for frequently-used tool sets (reduces schema overhead)

## Implementation in mcp-popup-ui

This project follows these principles:

1. **Separate tools** for single (`ask_user`) vs. multiple (`ask_user_multiple`) selection
2. **Simplified schemas** using only object items (strings normalized server-side)
3. **Rich descriptions** with WHEN TO USE, EXAMPLES, and DO NOT USE sections
4. **Strict typing** with TypeScript for implementation safety

## Strict Mode and Schema Validation

Both OpenAI and Anthropic recommend using **strict mode** for production tools:

```json
{
  "strict": true,
  "parameters": {
    "type": "object",
    "properties": { ... },
    "required": ["..."],
    "additionalProperties": false
  }
}
```

**Requirements for strict mode:**

- `additionalProperties` must be `false` for all objects
- All properties must be listed in `required`
- Optional fields expressed as `type: ["string", "null"]`

**Benefits:**

- Guaranteed schema conformance
- No type mismatches or missing fields
- Eliminates parsing errors in production

## Human-in-the-Loop Considerations

The MCP specification emphasizes that **humans should always be able to deny tool invocations**:

> "For trust & safety and security, there SHOULD always be a human in the loop with the ability to deny tool invocations."

**Implementation requirements:**

- Provide UI that shows which tools are exposed to the AI
- Insert visual indicators when tools are invoked
- Present confirmation prompts for sensitive operations

This project implements human-in-the-loop via:

- Browser popup requiring explicit user action
- Skip button to decline any request
- Visual display of all options before selection

## Error Handling Patterns

MCP defines two error types:

### 1. Protocol Errors (JSON-RPC)

For tool infrastructure issues:

```json
{
  "error": {
    "code": -32602,
    "message": "Unknown tool: invalid_tool_name"
  }
}
```

### 2. Tool Execution Errors

For business logic failures (returned in result with `isError: true`):

```json
{
  "result": {
    "content": [{ "type": "text", "text": "User cancelled the dialog" }],
    "isError": true
  }
}
```

**Best practice:** Use protocol errors for invalid tool calls, execution errors for runtime failures.

## Parallel Tool Calling

Modern LLMs (GPT-4+, Claude 3+) can call multiple tools in a single turn:

```json
[
  { "name": "get_weather", "arguments": {"location": "Paris"} },
  { "name": "get_weather", "arguments": {"location": "London"} }
]
```

**Implications for UI tools:**

- Multiple popups could overwhelm users
- Consider queuing or batching requests
- This project handles one popup at a time (sequential execution)

## Output Schema Definition

Tools can define an `outputSchema` for structured results:

```json
{
  "name": "ask_user",
  "outputSchema": {
    "type": "object",
    "properties": {
      "action": { "type": "string", "enum": ["submit", "skip"] },
      "selection": { "type": "string" }
    },
    "required": ["action"]
  }
}
```

**Benefits:**

- LLMs understand expected response structure
- Enables client-side validation
- Better integration with typed languages

## Tool Annotations (MCP 2025-06-18)

The MCP specification includes optional **annotations** for tool metadata:

```json
{
  "name": "ask_user",
  "annotations": {
    "audience": ["user"],
    "priority": 0.9
  }
}
```

| Annotation | Purpose |
|------------|---------|
| `audience` | Who should see results: `["user"]`, `["assistant"]`, or both |
| `priority` | Hint for ordering/importance (0.0-1.0) |

**Note:** Clients should treat annotations as untrusted unless from verified servers.

## Prompt Engineering for Tool Selection

To ensure LLMs reliably use tools, consider these prompt strategies:

### In System Prompts

```markdown
When you need user input, ALWAYS use the appropriate tool:
- ask_user → single choice
- ask_user_multiple → multiple choices

NEVER list options in text when a tool is available.
```

### In Tool Descriptions

Include the "intern test": Can someone unfamiliar with the system correctly use this tool given only the description?

Questions an intern might ask → answers should be in the description:

- "When should I use this vs. that tool?"
- "What format should options be in?"
- "What happens if the user cancels?"

## Future Considerations

### Dynamic Tool Loading

For applications with many tools (>20), consider:

- Loading tools on-demand based on context
- Using a "meta-tool" that lists available specialized tools
- Pre-filtering with semantic search before presenting to LLM

### Fine-Tuning for Tool Use

OpenAI and others offer fine-tuning specifically for function calling:

- Reduces token overhead from verbose descriptions
- Improves accuracy for domain-specific tools
- Requires representative training data

### MCP Connector Pattern

Anthropic's MCP Connector allows direct connection to remote MCP servers:

- No client implementation needed
- Server-side tool execution
- Simplified architecture for cloud deployments
