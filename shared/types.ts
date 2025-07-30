export interface Task {
  id?: string;
  title: string;
  priority: 'low' | 'normal' | 'high';
  completed?: boolean;
}

export interface EnrichedLink {
  url: string;
  title?: string;
  description?: string;
  image?: string;
}

export interface NoteEvent {
  type: 'enhancement_complete' | 'ai_error' | 'processing_start';
  content?: string;
  tasks?: Task[];
  timestamp: number;
  processingTime?: number;
  error?: string;
}