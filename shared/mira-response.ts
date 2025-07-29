export interface MiraResponse {
  /** The living-document markdown returned by the model */
  content: string;

  /** Structured data the UI/API can rely on */
  tasks?: Array<{ title: string; priority: 'low' | 'normal' | 'high' }>;
  reminders?: Array<{ timeISO: string; leadMins?: number }>;
  entities?: Array<{ value: string; type: string; relevance?: number }>;
  links?: Array<{ url: string; title?: string; description?: string; image?: string }>;
  media?: Array<{ url: string; type: 'image' | 'video' }>;

  /** Processing metadata */
  meta: {
    model: string;
    confidence: number;
    processingTimeMs: number;
    intentType: 'research' | 'reminder' | 'shopping' | 'general';
  };

  /** Optional threaded messages for iterative enhancement */
  thread?: Array<{ author: 'user' | 'mira'; text: string; ts: string }>;
}