// Part 1: Enhanced link extraction utility
export function extractLinks(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s)]+/g;
  const urls = Array.from(new Set(text.match(urlRegex) || []));
  
  // Clean up URLs (remove trailing punctuation)
  const cleanUrls = urls.map(url => {
    return url.replace(/[.,;!?]+$/, '');
  });
  
  return cleanUrls.slice(0, 20); // Reasonable limit
}