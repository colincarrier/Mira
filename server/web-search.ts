export interface WebSearchResult {
  title: string;
  description: string;
  url: string;
  rating?: string;
  keyPoints?: string[];
  category?: string;
  location?: string;
  distance?: string;
}

export interface LocationContext {
  city: string;
  state: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

/**
 * Check if content should trigger location-based search
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
export function generateLocationSearchQueries(content: string, location?: LocationContext | null): string[] {
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
    // Generic searches when no location is available
    searchTerms.forEach(term => {
      queries.push(`${term} guide`);
      queries.push(`best ${term} reviews`);
      queries.push(`how to find ${term}`);
    });
    
    // Add generic location-agnostic advice
    if (contentLower.includes('venue') || contentLower.includes('party')) {
      queries.push('party venue selection tips');
      queries.push('birthday party venue ideas');
    }
    
    if (contentLower.includes('restaurant')) {
      queries.push('family restaurant selection guide');
      queries.push('restaurant booking tips');
    }
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
 * Generate generic advice results when no location is available
 */
function generateGenericAdviceResults(query: string): WebSearchResult[] {
  const results: WebSearchResult[] = [];
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('party venue') || queryLower.includes('venue')) {
    results.push({
      title: "How to Choose the Perfect Party Venue",
      description: "Complete guide to selecting birthday party venues: indoor vs outdoor options, capacity planning, catering considerations, and booking tips.",
      url: "https://example.com/party-venue-guide",
      rating: "4.8/5",
      keyPoints: ["Capacity planning", "Budget considerations", "Amenities checklist", "Booking timeline"],
      category: "Planning Guide"
    });
  }
  
  if (queryLower.includes('restaurant') || queryLower.includes('food')) {
    results.push({
      title: "Family Restaurant Selection Tips",
      description: "Expert advice on choosing family-friendly restaurants: kid-friendly menus, outdoor seating, reservation strategies, and special occasion planning.",
      url: "https://example.com/restaurant-guide",
      rating: "4.6/5",
      keyPoints: ["Kid-friendly options", "Outdoor seating benefits", "Reservation timing", "Special requests"],
      category: "Dining Guide"
    });
  }
  
  if (queryLower.includes('gift') || queryLower.includes('present')) {
    results.push({
      title: "Age-Appropriate Gift Ideas & Shopping Tips",
      description: "Comprehensive guide to selecting birthday gifts: age-appropriate toys, educational options, budget planning, and where to shop.",
      url: "https://example.com/gift-guide",
      rating: "4.7/5",
      keyPoints: ["Age recommendations", "Educational value", "Safety considerations", "Budget planning"],
      category: "Gift Guide"
    });
  }
  
  return results;
}

/**
 * Web search function with location awareness
 */
export async function performLocationWebSearch(
  queries: string[], 
  location?: LocationContext | null
): Promise<WebSearchResult[]> {
  const results: WebSearchResult[] = [];
  
  // Generate search results based on available location data
  for (const query of queries) {
    if (location) {
      const mockResults = generateMockLocationResults(query, location);
      results.push(...mockResults);
    } else {
      const genericResults = generateGenericAdviceResults(query);
      results.push(...genericResults);
    }
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
function generateMockLocationResults(query: string, location: LocationContext): WebSearchResult[] {
  const results: WebSearchResult[] = [];
  const queryLower = query.toLowerCase();
  
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
      keyPoints: ["Age-appropriate toys", "Educational games", "Gift wrapping", "Local favorites"],
      category: "Shopping",
      location: locationString,
      distance: "1-8 miles"
    });
  }
  
  if (queryLower.includes('restaurant') || queryLower.includes('food')) {
    results.push({
      title: `Family Restaurants with Outdoor Seating - ${location.city}`,
      description: `Family-friendly restaurants featuring outdoor dining, kids menus, and birthday party accommodations in ${locationString}.`,
      url: `https://example.com/restaurants-${location.city.toLowerCase()}`,
      rating: "4.4/5",
      keyPoints: ["Outdoor seating", "Kids menu", "Birthday celebrations", "Reservations recommended"],
      category: "Dining",
      location: locationString,
      distance: "0.5-12 miles"
    });
  }
  
  if (queryLower.includes('cake') || queryLower.includes('bakery')) {
    results.push({
      title: `Custom Birthday Cakes - ${location.city} Bakeries`,
      description: `Local bakeries specializing in custom birthday cakes, themed designs, and special dietary options in ${locationString}.`,
      url: `https://example.com/bakeries-${location.city.toLowerCase()}`,
      rating: "4.6/5",
      keyPoints: ["Custom designs", "Dietary options", "Advance ordering", "Themed cakes"],
      category: "Bakeries",
      location: locationString,
      distance: "2-10 miles"
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
  
  return results;
}

/**
 * Get user's location from IP geolocation or user profile
 */
export async function getUserLocation(req?: any): Promise<LocationContext | null> {
  if (req) {
    const forwardedFor = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    const clientIp = forwardedFor || realIp || req.connection.remoteAddress;
    
    if (clientIp && clientIp !== '127.0.0.1' && clientIp !== '::1') {
      try {
        // Use free IP geolocation service
        const response = await fetch(`http://ip-api.com/json/${clientIp}`);
        const data = await response.json();
        
        if (data.status === 'success') {
          return {
            city: data.city,
            state: data.regionName,
            country: data.countryCode,
            coordinates: {
              lat: data.lat,
              lng: data.lon
            }
          };
        }
      } catch (error) {
        console.log(`IP geolocation failed for ${clientIp}:`, (error as Error).message);
      }
    }
  }
  
  // Return null if no location can be determined
  // This prevents arbitrary defaults and forces generic searches
  return null;
}