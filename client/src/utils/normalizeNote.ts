export function normalizeNote(raw: any) {
  return {
    ...raw,
    aiEnhanced: !!(raw.aiEnhanced ?? raw.ai_enhanced),
    createdAt: raw.createdAt ?? raw.created_at ?? null,
    updatedAt: raw.updatedAt ?? raw.updated_at ?? null,
    miraResponse: raw.miraResponse ?? raw.mira_response ?? null,
    richContext: raw.richContext ?? raw.rich_context ?? null,
    aiGeneratedTitle: raw.aiGeneratedTitle ?? raw.ai_generated_title ?? null,
    aiSuggestion: raw.aiSuggestion ?? raw.ai_suggestion ?? null,
    aiContext: raw.aiContext ?? raw.ai_context ?? null,
    isProcessing: (
      raw?.isProcessing === true ||
      raw?.is_processing === true ||
      raw?.isProcessing === 't' ||
      raw?.is_processing === 't' ||
      raw?.isProcessing === 1 ||
      raw?.is_processing === 1
    ),
    audioUrl: raw.audioUrl ?? raw.audio_url ?? null,
    mediaUrl: raw.mediaUrl ?? raw.media_url ?? null,
    lastUserEdit: raw.lastUserEdit ?? raw.last_user_edit ?? null,
    shareId: raw.shareId ?? raw.share_id ?? null,
    privacyLevel: raw.privacyLevel ?? raw.privacy_level ?? 'private',
    collectionId: raw.collectionId ?? raw.collection_id ?? null,
    originalContent: raw.originalContent ?? raw.original_content ?? null,
    protectedContent: raw.protectedContent ?? raw.protected_content ?? null,
    miraResponseCreatedAt: raw.miraResponseCreatedAt ?? raw.mira_response_created_at ?? null,
    richContextBackup: raw.richContextBackup ?? raw.rich_context_backup ?? null,
    imageData: raw.imageData ?? raw.image_data ?? null,
    tokenUsage: raw.tokenUsage ?? raw.token_usage ?? null,
    userId: raw.userId ?? raw.user_id ?? null,
    migratedAt: raw.migratedAt ?? raw.migrated_at ?? null,
    docJson: raw.docJson ?? raw.doc_json ?? null,
    processingPath: raw.processingPath ?? raw.processing_path ?? null,
    classificationScores: raw.classificationScores ?? raw.classification_scores ?? null,
    vectorDense: raw.vectorDense ?? raw.vector_dense ?? null,
    vectorSparse: raw.vectorSparse ?? raw.vector_sparse ?? null,
    intentVector: raw.intentVector ?? raw.intent_vector ?? null,
    isShared: !!(raw.isShared ?? raw.is_shared),
  };
}