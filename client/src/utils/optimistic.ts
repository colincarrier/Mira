// ---------- client/src/utils/optimistic.ts ------------
// Optimistic UI utilities

export function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}