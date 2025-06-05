
# Agent Operating Instructions

## CRITICAL PROTECTION RULES

### Protected Files - NEVER EDIT WITHOUT EXPLICIT APPROVAL:
- `server/utils/miraAIProcessing.ts`
- `server/anthropic.ts` 
- `server/openai.ts`
- `server/ai-taxonomy-engine.ts`
- `AI_PROMPTS_DOCUMENTATION.md`
- `AI_INTELLIGENCE_FRAMEWORK.md`
- `COMPLETE_AI_PROMPTS_DOCUMENTATION.md`

### Mandatory Protocol:
1. **PROPOSE CHANGES FIRST** - Show exact before/after diffs
2. **WAIT FOR APPROVAL** - Never implement AI-related changes automatically
3. **ASK PERMISSION** - Always confirm before modifying prompts or AI logic

### Safe Areas (No approval needed):
- UI components and styling
- Database schema (non-AI)
- Frontend state management
- Routing and navigation

### Emergency Rule:
If you're unsure whether a file affects AI processing, ASK FIRST.
