import { contextPool as pool } from '../context/db-pool.js';

export interface PushSubscription {
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  created_at: Date;
}

export class PushSubscriptionService {
  static async store(userId: string, sub: any): Promise<void> {
    await pool.query(
      `INSERT INTO memory.push_subscriptions (user_id, endpoint, p256dh_key, auth_key)
         VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id) DO UPDATE
         SET endpoint=$2, p256dh_key=$3, auth_key=$4`,
      [userId, sub.endpoint, sub.keys.p256dh, sub.keys.auth]
    );
  }
  static async getByUserId(userId: string): Promise<PushSubscription | null> {
    const { rows } = await pool.query(
      `SELECT * FROM memory.push_subscriptions WHERE user_id=$1`,
      [userId]
    );
    return rows[0] || null;
  }
}