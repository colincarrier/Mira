export function extractLinks(markdown: string): string[] {
  const regex = /\bhttps?:\/\/\S+/gi;
  return markdown.match(regex) || [];
}