export function normalizeNote(raw: any) {
  return {
    ...raw,
    aiEnhanced: !!(raw.aiEnhanced ?? raw.ai_enhanced),
    createdAt: raw.createdAt ?? raw.created_at ?? null,
    updatedAt: raw.updatedAt ?? raw.updated_at ?? null,
    miraResponse: raw.miraResponse ?? raw.mira_response ?? null,
    richContext: raw.richContext ?? raw.rich_context ?? null,
  };
}