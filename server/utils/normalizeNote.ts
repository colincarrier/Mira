/**
 * Normalize database row to consistent camelCase API response
 * Maps snake_case database columns to camelCase properties
 */
export function normalizeNote(row: any) {
  return {
    id: row.id,
    content: row.content ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    todos: row.todos ?? [],
    miraResponse: row.mira_response,
    aiGeneratedTitle: row.ai_generated_title,
    tokenUsage: row.token_usage,
    isProcessing: row.is_processing,
    mode: row.mode,
    userId: row.user_id,
    isShared: row.is_shared,
    shareId: row.share_id,
    privacyLevel: row.privacy_level,
    audioUrl: row.audio_url,
    mediaUrl: row.media_url,
    transcription: row.transcription,
    imageData: row.image_data,
    aiEnhanced: row.ai_enhanced,
    aiSuggestion: row.ai_suggestion,
    aiContext: row.ai_context,
    richContext: row.rich_context,
    richContextBackup: row.rich_context_backup,
    migratedAt: row.migrated_at,
    miraResponseCreatedAt: row.mira_response_created_at,
    collectionId: row.collection_id,
    vectorDense: row.vector_dense,
    vectorSparse: row.vector_sparse,
    intentVector: row.intent_vector,
    version: row.version,
    originalContent: row.original_content,
    lastUserEdit: row.last_user_edit,
    protectedContent: row.protected_content,
    processingPath: row.processing_path,
    classificationScores: row.classification_scores,
    docJson: row.doc_json
  };
}

/**
 * Normalize todo row to consistent camelCase
 */
export function normalizeTodo(row: any) {
  return {
    id: row.id,
    title: row.title,
    priority: row.priority,
    completed: row.completed,
    noteId: row.note_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    timeDue: row.time_due,
    timeOffset: row.time_offset,
    extractedDateTime: row.extracted_date_time,
    isActiveReminder: row.is_active_reminder,
    timingHint: row.timing_hint,
    confidence: row.confidence,
    naturalLanguageTime: row.natural_language_time
  };
}

/**
 * Normalize collection row to consistent camelCase
 */
export function normalizeCollection(row: any) {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    priority: row.priority,
    settings: row.settings,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}