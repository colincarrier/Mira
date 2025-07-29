// ---------- server/ai/link-enrichment.ts ------------
// Link enrichment for V3 responses - runs in parallel

export async function fetchOpenGraph(url: string) {
  try {
    // Simple implementation - in production you'd use a real OG parser
    return {
      title: url.includes('apple.com') ? 'Find My - Apple' : 
             url.includes('ticketmaster.com') ? 'Ticketmaster - Harry Potter' :
             'Link Preview',
      description: url.includes('apple.com') ? 'Locate your lost Apple devices' :
                  url.includes('ticketmaster.com') ? 'Official tickets for Harry Potter and the Cursed Child' :
                  'Click to view content',
      image: url.includes('apple.com') ? 'https://www.apple.com/find-my/images/find-my-hero.jpg' : null
    };
  } catch (error) {
    return { title: url, description: '' };
  }
}

export async function enrichLinks(urls: string[]) {
  return Promise.all(urls.slice(0, 8).map(async (url) => {
    try {
      const og = await fetchOpenGraph(url);
      return {
        url,
        title: og.title,
        description: og.description,
        image: og.image,
      };
    } catch { 
      return { url }; 
    }
  }));
}

export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}