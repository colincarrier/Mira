
# AI Modification Protection Rules

## CRITICAL: AI Prompt and Processing Protection

### Files That Require Explicit Approval Before Any Changes:

#### Core AI Processing Files:
- `server/utils/miraAIProcessing.ts` - Mira AI Brain core logic
- `server/utils/fastAIProcessing.ts` - Fast AI processing utilities
- `server/anthropic.ts` - Claude integration and prompts
- `server/openai.ts` - OpenAI integration and prompts
- `server/ai-taxonomy-engine.ts` - AI classification engine

#### AI Documentation and Configuration:
- `AI_PROMPTS_DOCUMENTATION.md` - Core prompt documentation
- `AI_INTELLIGENCE_FRAMEWORK.md` - AI framework specifications
- `COMPLETE_AI_PROMPTS_DOCUMENTATION.md` - Complete prompt reference
- `AI_PROMPTS_COMPARISON.md` - AI comparison data

### Modification Protocol:
1. **NO DIRECT EDITS** - Never modify these files directly
2. **PROPOSAL REQUIRED** - Always propose exact changes with before/after comparison
3. **EXPLICIT APPROVAL** - Wait for explicit "yes, proceed" before implementing
4. **TESTING REQUIRED** - Any approved changes must be tested against known inputs
5. **ROLLBACK PLAN** - Have immediate rollback capability ready

### Safe Modification Areas:
- UI components and styling
- Database schema (with approval)
- Non-AI utility functions
- Frontend state management
- Routing and navigation

### Emergency Rollback:
If AI quality degrades after any change, immediately revert to last known good state.
