# Diagnosis of Three Critical Issues

## Issue 1: Preview Stuck in Blank Loading State

### Current State
- API is responding correctly on port 5000
- Server is running and processing requests

### Likely Causes
1. **Initial data fetch race condition**: The ActivityFeed's aggressive cache settings (gcTime: 10000) may be clearing data too quickly
2. **Query invalidation on mount**: While we fixed the `removeQueries`, the frequent invalidations may still cause loading states

### Evidence
```javascript
// activity-feed.tsx line 25-32
gcTime: 10000, // Keep in cache for 10 seconds only
refetchOnWindowFocus: true,
refetchOnMount: true,
```

## Issue 2: New Note Disappears After Creation

### Root Cause Identified
When a new note is created:
1. Note appears immediately (optimistic update)
2. Real-time notification triggers `invalidateQueries` 
3. The refetch returns the list WITHOUT the new note if it's still processing
4. Note disappears from view

### Evidence Path
```javascript
// use-realtime-updates.ts line 43-45
case 'note_created':
  console.log('[RealTime] Note created:', data.noteId);
  // Immediately invalidate notes query to show new note
  queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
```

The problem: `invalidateQueries` triggers a refetch that may not include the processing note.

### Required Behavior
- Note should remain visible with processing indicator
- User should be able to navigate to it
- User should be able to edit it while processing
- Updates should queue until AI returns

## Issue 3: Manual Edits Not Saving

### Diagnosis
The save path appears correct but there's a mismatch in the payload:

1. **SavePayload sends**: `{ content, doc_json: docJson }`
2. **Server expects**: Either `content` or `doc_json` 
3. **Server handler**: Returns current note if both are null/undefined

### Evidence
```javascript
// saveNote.ts line 14
body: JSON.stringify({ content, doc_json: docJson })

// server/routes.ts line 2626
if (content == null && doc_json == null) {
  // Return current note to avoid 500s and cache poisoning
  const current = await storage.getNote(id);
```

### Potential Issues
1. When `content` is empty string "", it's not null, so save proceeds with empty content
2. The `doc_json` field name mismatch (docJson vs doc_json) is handled but may cause issues
3. The blur handler may not be firing correctly

## Recommended Fixes

### Fix 1: Prevent Note Disappearance
Instead of invalidating queries on note_created, use `setQueryData` to add the note optimistically:

```javascript
case 'note_created':
  // Add note to cache without refetch
  queryClient.setQueryData(queryKeys.notes.all, (old) => {
    if (!old) return [data.noteData];
    return [data.noteData, ...old];
  });
```

### Fix 2: Fix Save Payload Handling
Ensure empty strings are treated as null:

```javascript
// In saveNote.ts
body: JSON.stringify({ 
  content: content || undefined,
  doc_json: docJson || undefined 
})
```

### Fix 3: Extend Cache Time
Increase `gcTime` to prevent aggressive cache clearing:

```javascript
gcTime: 5 * 60 * 1000, // 5 minutes instead of 10 seconds
```

### Fix 4: Add Processing State Management
Ensure notes with `is_processing: true` remain visible and interactive:
- Don't filter them out
- Show processing indicator
- Allow navigation and editing
- Queue updates for when processing completes

## Next Steps

1. **Immediate**: Fix the real-time update to not remove processing notes
2. **Critical**: Fix save payload to handle empty strings correctly  
3. **Important**: Extend cache time to prevent data loss
4. **Enhancement**: Implement update queueing for processing notes