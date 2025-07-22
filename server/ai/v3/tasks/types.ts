// Stage‑3A Task domain types

export interface Task {
  id: string;
  user_id: string;
  title: string;
  natural_text: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed' | 'archived';
  parsed_due_date: Date | null;
  due_date_confidence: number;
  confidence: number;
  source_reasoning_log_id: string | null;
  created_at: Date;
  completed_at: Date | null;
}