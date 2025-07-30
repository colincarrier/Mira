export interface Task {
  id?: string;
  title: string;
  priority: 'low' | 'normal' | 'high';
  completed?: boolean;
}

export interface MiraTask {
  id?: string;
  title: string;
  priority: 'low' | 'normal' | 'high';
  completed?: boolean;
  action?: string;
  details?: string;
}

export interface EnrichedLink {
  url: string;
  title?: string;
  favicon?: string;
}

export interface MiraResponse {
  content: string;
  tasks: MiraTask[];
  links: string[];
  reminders: any[];
  entities: any[];
  media: any[];
  enrichedLinks: EnrichedLink[];
  meta: {
    model: string;
    confidence: number;
    processingTimeMs: number;
    intent: string;
    v: 3;
  };
  thread: any[];
}

export interface NoteEvent {
  type: 'enhancement_complete' | 'ai_error' | 'processing_start';
  content?: string;
  tasks?: Task[];
  timestamp: number;
  processingTime?: number;
  error?: string;
}