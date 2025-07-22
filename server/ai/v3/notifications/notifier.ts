import { sendPush } from './channel-push.js';
import { sendSMS } from './channel-sms.js';
import { contextPool as pool } from '../context/db-pool.js';
import { NotificationPayload } from './types.js';
import { v4 as uuid } from 'uuid';

export async function notify(task: any, due: Date, explanation: string): Promise<void> {
  const payload: NotificationPayload = {
    title: task.title,
    body: `Due ${due.toLocaleString()}`,
    data: { taskId: task.id, explanation }
  };

  try {
    await sendPush(task.user_id, payload);
    await log('push', true, null);
  } catch (e: any) {
    console.warn('[Notify] push failed, trying SMS:', e.message);
    try {
      await sendSMS(task.user_id, payload);
      await log('sms', true, null);
    } catch (smsErr: any) {
      console.error('[Notify] sms failed:', smsErr.message);
      await log('sms', false, smsErr.message);
    }
  }

  async function log(channel: 'push'|'sms', ok: boolean, err: string|null) {
    await pool.query(
      `INSERT INTO memory.notifications
         (id,task_id,user_id,channel,payload,success,error_message)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [uuid(), task.id, task.user_id, channel, payload, ok, err]
    );
  }
}