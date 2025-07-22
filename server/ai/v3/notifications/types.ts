export interface NotificationPayload {
  title: string;
  body: string;
  data: {
    taskId: string;
    explanation: string;
    nextReminder?: string;
  };
  actions?: { action: string; title: string; icon?: string }[];
}