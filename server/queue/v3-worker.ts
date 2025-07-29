#!/usr/bin/env tsx
// ---------- server/queue/v3-worker.ts ------------
// V3 Help-First enhancement worker daemon

import { processBatchV3, cleanupV3Queue, getV3QueueStats } from './enhance-v3';

class V3Worker {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly pollingInterval = 5000; // 5 seconds

  async start() {
    if (this.isRunning) {
      console.log('🎯 [V3] Worker already running');
      return;
    }

    this.isRunning = true;
    console.log('🎯 [V3] Starting Help-First enhancement worker...');
    
    // Initial processing
    await this.processBatch();
    
    // Set up polling
    this.intervalId = setInterval(async () => {
      await this.processBatch();
    }, this.pollingInterval);

    // Cleanup old jobs every hour
    setInterval(async () => {
      await cleanupV3Queue();
    }, 60 * 60 * 1000);

    console.log(`✅ [V3] Worker started, polling every ${this.pollingInterval}ms`);
  }

  async stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('🛑 [V3] Worker stopped');
  }

  private async processBatch() {
    try {
      const processed = await processBatchV3(5);
      if (processed > 0) {
        console.log(`🎯 [V3] Processed ${processed} notes`);
      }
    } catch (error) {
      console.error('❌ [V3] Worker batch processing failed:', error);
    }
  }

  async getStats() {
    return await getV3QueueStats();
  }
}

// CLI interface
async function main() {
  const worker = new V3Worker();
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 [V3] Received SIGINT, shutting down gracefully...');
    await worker.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 [V3] Received SIGTERM, shutting down gracefully...');
    await worker.stop();
    process.exit(0);
  });

  // Start worker
  await worker.start();

  // Keep process alive
  process.stdin.resume();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { V3Worker };