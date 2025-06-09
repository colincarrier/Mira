/**
 * Location-aware web search for contextual results
 */

export interface WebSearchResult {
  title: string;
  description: string;
  url: string;
  rating?: string;
  keyPoints: string[];
  category: string;
  location?: string;
  distance?: string;
}

export interface LocationContext {
  city: string;
  state: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/**
 * Determines if content should trigger location-aware web search
 */
export function shouldTriggerLocationSearch(content: string): boolean {
  const locationTriggers = [
    // Shopping/commercial
    'buy', 'shop', 'store', 'purchase', 'gift', 'present',
    // Events/venues
    'venue', 'restaurant', 'party', 'event', 'booking', 'reserve',
    // Services
    'find', 'near', 'local', 'around', 'close', 'nearby',
    // Activities
    'visit', 'go to', 'check out', 'explore'
  ];
  
  const contentLower = content.toLowerCase();
  return locationTriggers.some(trigger => contentLower.includes(trigger));
}

/**
 * Generate location-aware search queries
 */
export function generateLocationSearchQueries(content: string, location?: LocationContext): string[] {
  const queries: string[] = [];
  const contentLower = content.toLowerCase();
  
  // Extract key terms for search
  const searchTerms = extractSearchTerms(content);
  
  if (location) {
    const locationString = `${location.city}, ${location.state}`;
    
    // Add location-specific queries
    searchTerms.forEach(term => {
      queries.push(`${term} near ${locationString}`);
      queries.push(`${term} ${location.city}`);
      queries.push(`best ${term} ${locationString}`);
    });
    
    // Add specific business/service queries
    if (contentLower.includes('venue') || contentLower.includes('party')) {
      queries.push(`party venues ${locationString}`);
      queries.push(`event spaces ${locationString}`);
    }
    
    if (contentLower.includes('gift') || contentLower.includes('present')) {
      queries.push(`gift shops ${locationString}`);
      queries.push(`toy stores ${locationString}`);
    }
    
    if (contentLower.includes('cake') || contentLower.includes('bakery')) {
      queries.push(`custom birthday cakes ${locationString}`);
      queries.push(`bakeries ${locationString}`);
    }
    
    if (contentLower.includes('decoration')) {
      queries.push(`party decorations ${locationString}`);
      queries.push(`party supply stores ${locationString}`);
    }
  } else {
    // Generic searches without location
    searchTerms.forEach(term => {
      queries.push(`${term} online`);
      queries.push(`best ${term}`);
    });
  }
  
  return queries.slice(0, 5); // Limit to 5 queries
}

/**
 * Extract meaningful search terms from content
 */
function extractSearchTerms(content: string): string[] {
  const terms: string[] = [];
  const contentLower = content.toLowerCase();
  
  // Common term patterns
  const termPatterns = [
    /\b(venue|restaurant|store|shop|bakery|party supply)\b/gi,
    /\b(birthday cake|gift|present|decoration|balloon)\b/gi,
    /\b(book|movie|travel|hotel|flight)\b/gi
  ];
  
  termPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      terms.push(...matches.map(m => m.toLowerCase()));
    }
  });
  
  // If no specific terms found, use general search terms
  if (terms.length === 0) {
    if (contentLower.includes('party')) terms.push('party supplies');
    if (contentLower.includes('birthday')) terms.push('birthday party');
    if (contentLower.includes('cake')) terms.push('birthday cake');
    if (contentLower.includes('gift')) terms.push('gifts');
  }
  
  return Array.from(new Set(terms)); // Remove duplicates
}

/**
 * Mock web search function (simulates Google/Bing results with location awareness)
 * In production, this would integrate with actual search APIs
 */
export async function performLocationWebSearch(
  queries: string[], 
  location?: LocationContext
): Promise<WebSearchResult[]> {
  const results: WebSearchResult[] = [];
  
  // Simulate location-aware search results
  for (const query of queries) {
    const mockResults = generateMockLocationResults(query, location);
    results.push(...mockResults);
  }
  
  // Remove duplicates and limit results
  const uniqueResults = results.filter((result, index, self) => 
    index === self.findIndex(r => r.title === result.title)
  );
  
  return uniqueResults.slice(0, 8);
}

/**
 * Generate realistic mock search results based on location context
 */
function generateMockLocationResults(query: string, location?: LocationContext): WebSearchResult[] {
  const results: WebSearchResult[] = [];
  const queryLower = query.toLowerCase();
  
  if (location) {
    const locationString = `${location.city}, ${location.state}`;
    
    if (queryLower.includes('party venue') || queryLower.includes('event space')) {
      results.push({
        title: `Top 10 Party Venues in ${location.city}`,
        description: `Best event spaces and party venues for birthdays, celebrations, and special events in ${locationString}.`,
        url: `https://example.com/party-venues-${location.city.toLowerCase()}`,
        rating: "4.5/5",
        keyPoints: ["Indoor/outdoor options", "Catering available", "Kid-friendly", "Booking required"],
        category: "Venues",
        location: locationString,
        distance: "2-15 miles"
      });
    }
    
    if (queryLower.includes('gift') || queryLower.includes('toy')) {
      results.push({
        title: `Best Gift Shops in ${location.city}`,
        description: `Top-rated toy stores and gift shops for children's presents and birthday gifts in ${locationString}.`,
        url: `https://example.com/gift-shops-${location.city.toLowerCase()}`,
        rating: "4.3/5",
        keyPoints: ["Age-appropriate toys", "Gift wrapping", "Local favorites", "Online ordering"],
        category: "Shopping",
        location: locationString,
        distance: "1-8 miles"
      });
    }
    
    if (queryLower.includes('cake') || queryLower.includes('bakery')) {
      results.push({
        title: `Custom Birthday Cakes - ${location.city} Bakeries`,
        description: `Local bakeries offering custom birthday cakes, cupcakes, and desserts for celebrations in ${locationString}.`,
        url: `https://example.com/birthday-cakes-${location.city.toLowerCase()}`,
        rating: "4.7/5",
        keyPoints: ["Custom designs", "Advance ordering", "Allergy-friendly options", "Delivery available"],
        category: "Food & Bakery",
        location: locationString,
        distance: "0.5-12 miles"
      });
    }
    
    if (queryLower.includes('decoration') || queryLower.includes('party supply')) {
      results.push({
        title: `Party City & Local Party Supply Stores - ${location.city}`,
        description: `Party decorations, balloons, and supplies for birthday parties and celebrations in ${locationString}.`,
        url: `https://example.com/party-supplies-${location.city.toLowerCase()}`,
        rating: "4.2/5",
        keyPoints: ["Theme decorations", "Balloon arrangements", "Same-day pickup", "Bulk discounts"],
        category: "Party Supplies",
        location: locationString,
        distance: "1-10 miles"
      });
    }
  }
  
  return results;
}

/**
 * Get user's location from IP geolocation or browser geolocation
 */
export async function getUserLocation(req?: any): Promise<LocationContext> {
  // Try to get location from request headers (IP-based geolocation)
  if (req) {
    const forwardedFor = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    const clientIp = forwardedFor || realIp || req.connection.remoteAddress;
    
    // In production, you would use a service like ip-api.com or ipinfo.io
    // For now, try to detect common geographic indicators
    const userAgent = req.headers['user-agent'] || '';
    const acceptLanguage = req.headers['accept-language'] || '';
    
    // Basic location detection from language/timezone hints
    if (acceptLanguage.includes('en-GB') || acceptLanguage.includes('en-UK')) {
      return {
        city: "London",
        state: "England",
        country: "UK",
        coordinates: { lat: 51.5074, lng: -0.1278 }
      };
    }
    
    if (acceptLanguage.includes('en-CA')) {
      return {
        city: "Toronto",
        state: "ON",
        country: "CA",
        coordinates: { lat: 43.6532, lng: -79.3832 }
      };
    }
    
    if (acceptLanguage.includes('en-AU')) {
      return {
        city: "Sydney",
        state: "NSW",
        country: "AU",
        coordinates: { lat: -33.8688, lng: 151.2093 }
      };
    }
  }
  
  // Default to major US metropolitan area
  return {
    city: "New York",
    state: "NY", 
    country: "US",
    coordinates: {
      lat: 40.7128,
      lng: -74.0060
    }
  };
}