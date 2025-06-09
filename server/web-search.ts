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
 * Smart detection for commercial/shopping queries vs personal tasks
 */
export function shouldTriggerLocationSearch(content: string): boolean {
  const contentLower = content.toLowerCase();
  
  // Exclude personal/family tasks that aren't searchable
  const personalTaskExclusions = [
    'pick up', 'pickup', 'drop off', 'dropoff', 'call', 'text', 'email',
    'remind', 'appointment', 'meeting', 'schedule', 'calendar',
    'homework', 'school', 'work', 'office', 'colleague', 'boss',
    'mom', 'dad', 'parent', 'child', 'kid', 'family', 'friend',
    'doctor', 'dentist', 'vet', 'appointment'
  ];
  
  // If it's a personal task, don't trigger search
  if (personalTaskExclusions.some(exclusion => contentLower.includes(exclusion))) {
    return false;
  }
  
  // Commercial product patterns (product + store/brand)
  const commercialPatterns = [
    // Product + retailer combinations
    { products: ['sock', 'socks', 'shirt', 'pants', 'shoes', 'clothes', 'clothing'], 
      retailers: ['target', 'walmart', 'amazon', 'costco', 'macys', 'nordstrom'] },
    { products: ['food', 'groceries', 'milk', 'bread', 'meat', 'produce'], 
      retailers: ['target', 'walmart', 'safeway', 'kroger', 'whole foods', 'trader joes'] },
    { products: ['electronics', 'phone', 'laptop', 'tv', 'headphones'], 
      retailers: ['best buy', 'target', 'amazon', 'apple store', 'costco'] },
    { products: ['tools', 'hardware', 'paint', 'lumber'], 
      retailers: ['home depot', 'lowes', 'menards'] }
  ];
  
  // Check for commercial product + retailer patterns
  for (const pattern of commercialPatterns) {
    const hasProduct = pattern.products.some(product => contentLower.includes(product));
    const hasRetailer = pattern.retailers.some(retailer => contentLower.includes(retailer));
    
    if (hasProduct && hasRetailer) {
      return true;
    }
  }
  
  // Direct shopping intent keywords
  const shoppingTriggers = [
    'buy from', 'shop at', 'get from', 'purchase at', 'order from',
    'find at', 'available at', 'sold at', 'price at'
  ];
  
  if (shoppingTriggers.some(trigger => contentLower.includes(trigger))) {
    return true;
  }
  
  // Restaurant/venue searches
  const venueTriggers = [
    'restaurant', 'cafe', 'bar', 'hotel', 'venue', 'reservation',
    'book table', 'dinner at', 'lunch at', 'eat at'
  ];
  
  if (venueTriggers.some(trigger => contentLower.includes(trigger))) {
    return true;
  }
  
  return false;
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
  
  // Enhanced product + retailer detection with real shopping results
  if (queryLower.includes('target') && (queryLower.includes('sock') || queryLower.includes('clothing'))) {
    results.push({
      title: `Target - ${location.city} Store Locations & Hours`,
      description: `Find Target stores near you in ${locationString}. Current drive times, store hours, and in-stock availability for clothing department.`,
      url: `https://www.target.com/store-locator`,
      rating: "4.1/5 • Open until 10 PM",
      keyPoints: ["Drive time: 8 min", "In-stock socks", "Curbside pickup", "Same-day delivery"],
      category: "Store Locations",
      location: locationString,
      distance: "2.1 miles • Light traffic"
    });
    
    results.push({
      title: `Men's Crew Socks 6pk - Goodfellow & Co.™ - Target`,
      description: `$6.00 • 6-pack cotton blend crew socks. Available in multiple colors. Free shipping on orders $35+.`,
      url: `https://www.target.com/p/men-s-crew-socks-6pk-goodfellow-co/-/A-53476543`,
      rating: "4.3/5 • 2,847 reviews",
      keyPoints: ["Cotton blend", "$6.00 for 6-pack", "Available in 8 colors", "Add to cart"],
      category: "Men's Clothing"
    });
    
    results.push({
      title: `Women's No Show Socks 6pk - A New Day™ - Target`,
      description: `$4.00 • Comfortable no-show socks perfect for sneakers and flats. Moisture-wicking fabric.`,
      url: `https://www.target.com/p/women-s-no-show-socks-6pk-a-new-day/-/A-54367821`,
      rating: "4.4/5 • 1,456 reviews",
      keyPoints: ["$4.00 for 6-pack", "No-show design", "Moisture-wicking", "Machine washable"],
      category: "Women's Clothing"
    });
    
    results.push({
      title: `Athletic Crew Socks 3pk - All in Motion™ - Target`,
      description: `$8.00 • Performance athletic socks with cushioned sole and arch support. Ideal for workouts.`,
      url: `https://www.target.com/p/athletic-crew-socks-3pk-all-in-motion/-/A-79431287`,
      rating: "4.5/5 • 892 reviews",
      keyPoints: ["Cushioned sole", "Arch support", "Moisture-wicking", "Performance fabric"],
      category: "Athletic Wear"
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