export const SCHEDULER_CFG = {
  scanIntervalMs  : parseInt(process.env.SCHEDULER_SCAN_MS  ?? '60000', 10), // 1 min
  bootstrapLimit  : parseInt(process.env.SCHEDULER_BOOTSTRAP_LIMIT ?? '200', 10),
  maxQueueSize    : parseInt(process.env.SCHEDULER_MAX_QUEUE ?? '1000', 10),
  maxFailures     : parseInt(process.env.SCHEDULER_MAX_FAIL  ?? '5', 10)
} as const;