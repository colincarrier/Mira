// Part 1: Improved optimistic ID generation using crypto.randomUUID()
export function generateTempId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `temp-${crypto.randomUUID()}`;
  }
  // Fallback for environments without crypto.randomUUID
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isTempId(id: string): boolean {
  return id.startsWith('temp-');
}