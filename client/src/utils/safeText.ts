export const safeText = (v: any): string =>
  typeof v === 'string'
    ? v
    : v && typeof v === 'object'
    ? v.description ?? v.task ?? v.title ?? JSON.stringify(v)
    : String(v ?? '');