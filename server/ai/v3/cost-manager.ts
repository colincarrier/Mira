import { UUID, USDollars } from './v3-foundation.types.js';

export class CostManager {
  static async getWeekSpend(userId: UUID, isoWeek: string): Promise<USDollars> { 
    return 0;                         // stub = always $0 spent
  }

  static async addSpend(userId: UUID, isoWeek: string, amountUsd: USDollars): Promise<void> {
    console.log(`[CostManager.stub] +$${amountUsd.toFixed(4)} for ${userId} ${isoWeek}`);
  }

  /** Rough token estimator (1 token ≈ 4 chars) */
  static estimateTokens(text: string): number { return Math.ceil(text.length / 4); }
}
