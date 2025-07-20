// Micro-Fix B: Reuse Stage-2A pool instead of creating new one
import { pool } from '../memory/simple-memory.js';

export const contextPool = pool; // Reuse existing pool

/**
 * Get configuration from memory.context_config
 */
export async function getContextConfig(key: string, defaultValue: any): Promise<any> {
  try {
    const result = await contextPool.query(
      'SELECT value FROM memory.context_config WHERE key = $1',
      [key]
    );
    
    if (result.rows.length > 0) {
      const value = result.rows[0].value;
      return typeof value === 'string' ? JSON.parse(value) : value;
    }
    return defaultValue;
  } catch (error) {
    console.warn(`Config fetch failed for ${key}:`, error);
    return defaultValue;
  }
}