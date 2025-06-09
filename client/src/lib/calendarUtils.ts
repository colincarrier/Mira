/**
 * Calendar Integration Utilities
 * Handles Google Calendar integration and time parsing
 */

export interface CalendarEvent {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
}

/**
 * Parse time from text (e.g., "7p", "7pm", "7:30p", "19:00")
 */
export function parseTimeFromText(text: string): Date | null {
  const timePatterns = [
    // 7p, 7pm, 11p, 11pm
    /\b(\d{1,2})p(?:m)?\b/i,
    // 7a, 7am, 11a, 11am
    /\b(\d{1,2})a(?:m)?\b/i,
    // 7:30p, 7:30pm, 11:30p, 11:30pm
    /\b(\d{1,2}):(\d{2})p(?:m)?\b/i,
    // 7:30a, 7:30am, 11:30a, 11:30am
    /\b(\d{1,2}):(\d{2})a(?:m)?\b/i,
    // 19:00, 07:00 (24-hour format)
    /\b(\d{1,2}):(\d{2})\b/,
  ];

  const lowerText = text.toLowerCase();
  
  for (const pattern of timePatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2] ? parseInt(match[2]) : 0;
      
      // Handle PM/AM conversion
      if (pattern.source.includes('p')) {
        // PM time
        if (hours !== 12) hours += 12;
      } else if (pattern.source.includes('a')) {
        // AM time
        if (hours === 12) hours = 0;
      }
      
      // Create date for today with the parsed time
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      
      // If the time has already passed today, schedule for tomorrow
      if (date < new Date()) {
        date.setDate(date.getDate() + 1);
      }
      
      return date;
    }
  }
  
  return null;
}

/**
 * Extract location from text
 */
export function extractLocationFromText(text: string): string | null {
  const locationPatterns = [
    /\bat\s+([^,\n]+)/i,
    /\b(?:in|near|@)\s+([^,\n]+)/i,
  ];
  
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return null;
}

/**
 * Create Google Calendar URL
 */
export function createGoogleCalendarUrl(event: CalendarEvent): string {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDate(event.startTime)}/${formatDate(event.endTime)}`,
    details: event.description || '',
    location: event.location || '',
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Parse todo/note content and create calendar event
 */
export function createCalendarEventFromContent(content: string, title?: string): CalendarEvent | null {
  const startTime = parseTimeFromText(content);
  if (!startTime) return null;
  
  // Default 1-hour duration
  const endTime = new Date(startTime);
  endTime.setHours(endTime.getHours() + 1);
  
  const location = extractLocationFromText(content);
  
  return {
    title: title || content.slice(0, 50),
    description: `Created from Mira note: ${content}`,
    startTime,
    endTime,
    location: location || undefined,
  };
}

/**
 * Open Google Calendar with event details
 */
export function addToGoogleCalendar(event: CalendarEvent): void {
  const url = createGoogleCalendarUrl(event);
  window.open(url, '_blank');
}