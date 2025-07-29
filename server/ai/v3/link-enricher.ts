// ---------- server/ai/v3/link-enricher.ts ------------
import type { EnrichedLink } from '../../../shared/mira-response';

const linkCache = new Map<string, EnrichedLink>();

export async function enrichLinks(urls: string[]): Promise<EnrichedLink[]> {
  if (!urls || urls.length === 0) return [];
  
  const enrichmentPromises = urls.map(url => enrichSingleLink(url));
  
  // Timeout protection - don't block UI for slow links
  const timeoutPromise = new Promise<EnrichedLink[]>((resolve) => {
    setTimeout(() => resolve(urls.map(url => ({ url, domain: new URL(url).hostname }))), 5000);
  });
  
  try {
    return await Promise.race([
      Promise.all(enrichmentPromises),
      timeoutPromise
    ]);
  } catch (error) {
    console.error('Link enrichment failed:', error);
    return urls.map(url => ({ url, domain: getDomain(url) }));
  }
}

async function enrichSingleLink(url: string): Promise<EnrichedLink> {
  // Check cache first
  if (linkCache.has(url)) {
    return linkCache.get(url)!;
  }
  
  try {
    // Basic domain extraction for now
    // In production, this would fetch metadata from the URL
    const domain = getDomain(url);
    const enriched: EnrichedLink = {
      url,
      domain,
      title: `Link to ${domain}`
    };
    
    linkCache.set(url, enriched);
    return enriched;
  } catch (error) {
    console.error(`Failed to enrich link ${url}:`, error);
    return { url, domain: getDomain(url) };
  }
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
}