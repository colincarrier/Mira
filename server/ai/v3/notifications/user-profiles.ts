import { contextPool as pool } from '../context/db-pool.js';

export async function getPhone(userId: string): Promise<string | null> {
  const { rows } = await pool.query(
    `SELECT phone_number FROM memory.user_profiles WHERE user_id=$1`,
    [userId]
  );
  return rows[0]?.phone_number || null;
}