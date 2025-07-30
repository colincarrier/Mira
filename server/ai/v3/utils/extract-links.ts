import { EnrichedLink } from '../../../../shared/types';

export function extractLinks(markdown: string): EnrichedLink[] {
  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const links: EnrichedLink[] = [];
  let m;
  while ((m = regex.exec(markdown))) {
    links.push({ title: m[1], url: m[2] });
  }
  return links.slice(0, 20); // Hard cap
}