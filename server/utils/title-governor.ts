export const makeTitle = (raw: string): string => {
  const clean = raw.trim().replace(/\s+/g, ' ');
  return clean.length > 55 ? clean.slice(0, 52) + '…' : clean || 'Untitled';
};