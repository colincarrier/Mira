export const NOTIFY_CFG = {
  scanIntervalMs: parseInt(process.env.SCHEDULER_SCAN_MS || '60000'),
  maxQueueSize:   parseInt(process.env.SCHEDULER_MAX_QUEUE || '1000'),
  bootstrapLimit: parseInt(process.env.SCHEDULER_BOOTSTRAP_LIMIT || '200'),
  failureBackoff: parseInt(process.env.NOTIFY_MAX_FAILURES || '5')
};