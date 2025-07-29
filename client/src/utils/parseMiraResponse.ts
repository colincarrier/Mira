import type { MiraResponse } from '@shared/mira-response';

export function parseMiraResponse(raw: unknown): MiraResponse | null {
  if (!raw) return null;

  try {
    const data =
      typeof raw === 'string'
        ? (JSON.parse(raw) as MiraResponse)
        : (raw as MiraResponse);

    if (!data.content || !data.meta) return null;
    return data;
  } catch {
    return null;
  }
}