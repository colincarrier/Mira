/**
 * Intelligent Reminder Parser
 * Extracts time-sensitive reminders from natural language input
 */

interface TimeReference {
  originalText: string;
  parsedTime: Date;
  timeType: 'absolute' | 'relative' | 'recurring';
  confidence: number;
}

interface ReminderContext {
  type: 'pickup' | 'appointment' | 'call' | 'meeting' | 'medication' | 'task' | 'general';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  defaultLeadTime: string;
  category: string;
}

interface ParsedReminder {
  isReminder: boolean;
  timeReference?: TimeReference;
  context: ReminderContext;
  action: string;
  subject?: string;
  location?: string;
  recurringPattern?: string;
  explicitLeadTime?: string;
}

export class IntelligentReminderParser {
  private static timePatterns = [
    // Absolute times
    { pattern: /(?:at |@)(\d{1,2}(?::\d{2})?(?:\s*(?:am|pm|AM|PM))?)/, type: 'absolute' },
    { pattern: /(today|tomorrow|yesterday)(?:\s+at\s+(\d{1,2}(?::\d{2})?(?:\s*(?:am|pm|AM|PM))?))?/i, type: 'absolute' },
    { pattern: /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+at\s+(\d{1,2}(?::\d{2})?(?:\s*(?:am|pm|AM|PM))?))?/i, type: 'absolute' },
    { pattern: /(next\s+(?:week|month|year))/i, type: 'absolute' },
    
    // Relative times
    { pattern: /in\s+(\d+)\s+(minutes?|hours?|days?|weeks?|months?)/i, type: 'relative' },
    { pattern: /(\d+)\s+(minutes?|hours?|days?|weeks?|months?)\s+from\s+now/i, type: 'relative' },
    
    // Recurring patterns
    { pattern: /(daily|every\s+day)/i, type: 'recurring' },
    { pattern: /(weekly|every\s+week)/i, type: 'recurring' },
    { pattern: /(monthly|every\s+month)/i, type: 'recurring' },
    { pattern: /every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i, type: 'recurring' },
    { pattern: /every\s+(\d+(?:st|nd|rd|th)?)\s+of\s+(?:the\s+)?month/i, type: 'recurring' }
  ];

  private static contextPatterns = [
    { pattern: /pick\s*up|collect|get|fetch/i, type: 'pickup', urgency: 'medium', leadTime: '10 minutes' },
    { pattern: /appointment|doctor|dentist|meeting/i, type: 'appointment', urgency: 'high', leadTime: '30 minutes' },
    { pattern: /call|phone|ring|contact/i, type: 'call', urgency: 'medium', leadTime: '5 minutes' },
    { pattern: /meeting|conference|session/i, type: 'meeting', urgency: 'high', leadTime: '15 minutes' },
    { pattern: /medication|medicine|pills?|take|dose/i, type: 'medication', urgency: 'critical', leadTime: 'immediate' },
    { pattern: /flight|travel|departure|airport/i, type: 'task', urgency: 'critical', leadTime: '2 hours' },
    { pattern: /workout|gym|exercise/i, type: 'task', urgency: 'medium', leadTime: '15 minutes' },
    { pattern: /pay|payment|bill|rent/i, type: 'task', urgency: 'high', leadTime: '1 day' }
  ];

  private static explicitReminderPatterns = [
    /remind\s+me\s+(\d+)\s+(minutes?|hours?|days?)\s+before/i,
    /(?:alert|notify)\s+me\s+(\d+)\s+(minutes?|hours?|days?)\s+(?:before|early)/i,
    /set\s+(?:a\s+)?reminder\s+for\s+(\d+)\s+(minutes?|hours?|days?)\s+before/i
  ];

  public static parseReminder(content: string): ParsedReminder {
    const normalizedContent = content.toLowerCase().trim();
    
    // Check if this looks like a reminder
    const reminderIndicators = [
      /(?:remind|alert|notify)/i,
      /(?:at|@)\s*\d+/,
      /(?:today|tomorrow|next)/i,
      /(?:pick\s*up|appointment|call|meeting)/i,
      /in\s+\d+\s+(?:minutes?|hours?|days?)/i,
      /(?:daily|weekly|monthly|every)/i
    ];

    const isReminder = reminderIndicators.some(pattern => pattern.test(content));
    
    if (!isReminder) {
      return {
        isReminder: false,
        context: { type: 'general', urgency: 'low', defaultLeadTime: '10 minutes', category: 'general' },
        action: content
      };
    }

    // Parse time references
    const timeReference = this.extractTimeReference(content);
    
    // Determine context and urgency
    const context = this.determineContext(content);
    
    // Check for explicit lead time instructions
    const explicitLeadTime = this.extractExplicitLeadTime(content);
    
    // Extract action and subject
    const action = this.extractAction(content);
    const subject = this.extractSubject(content);
    const location = this.extractLocation(content);
    const recurringPattern = this.extractRecurringPattern(content);

    return {
      isReminder: true,
      timeReference,
      context,
      action,
      subject,
      location,
      recurringPattern,
      explicitLeadTime
    };
  }

  private static extractTimeReference(content: string): TimeReference | undefined {
    for (const timePattern of this.timePatterns) {
      const match = content.match(timePattern.pattern);
      if (match) {
        const originalText = match[0];
        const parsedTime = this.parseTimeToDate(originalText, timePattern.type);
        
        if (parsedTime) {
          return {
            originalText,
            parsedTime,
            timeType: timePattern.type as 'absolute' | 'relative' | 'recurring',
            confidence: 0.8
          };
        }
      }
    }
    return undefined;
  }

  private static parseTimeToDate(timeText: string, timeType: string): Date | null {
    const now = new Date();
    
    try {
      if (timeType === 'relative') {
        const relativeMatch = timeText.match(/(\d+)\s+(minutes?|hours?|days?|weeks?|months?)/i);
        if (relativeMatch) {
          const amount = parseInt(relativeMatch[1]);
          const unit = relativeMatch[2].toLowerCase();
          
          const futureTime = new Date(now);
          
          switch (unit.charAt(0)) {
            case 'm': // minutes
              futureTime.setMinutes(futureTime.getMinutes() + amount);
              break;
            case 'h': // hours
              futureTime.setHours(futureTime.getHours() + amount);
              break;
            case 'd': // days
              futureTime.setDate(futureTime.getDate() + amount);
              break;
            case 'w': // weeks
              futureTime.setDate(futureTime.getDate() + (amount * 7));
              break;
            case 'M': // months (capital M to distinguish from minutes)
              futureTime.setMonth(futureTime.getMonth() + amount);
              break;
          }
          
          return futureTime;
        }
      } else if (timeType === 'absolute') {
        // Handle today/tomorrow with time
        if (timeText.includes('today')) {
          const timeMatch = timeText.match(/(\d{1,2}(?::\d{2})?(?:\s*(?:am|pm|AM|PM))?)/);
          if (timeMatch) {
            const time = this.parseTimeString(timeMatch[1]);
            if (time) {
              const todayWithTime = new Date(now);
              todayWithTime.setHours(time.hours, time.minutes, 0, 0);
              return todayWithTime;
            }
          }
        }
        
        if (timeText.includes('tomorrow')) {
          const timeMatch = timeText.match(/(\d{1,2}(?::\d{2})?(?:\s*(?:am|pm|AM|PM))?)/);
          if (timeMatch) {
            const time = this.parseTimeString(timeMatch[1]);
            if (time) {
              const tomorrowWithTime = new Date(now);
              tomorrowWithTime.setDate(tomorrowWithTime.getDate() + 1);
              tomorrowWithTime.setHours(time.hours, time.minutes, 0, 0);
              return tomorrowWithTime;
            }
          }
        }
        
        // Handle day of week
        const dayMatch = timeText.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
        if (dayMatch) {
          const targetDay = dayMatch[1].toLowerCase();
          const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const targetDayIndex = days.indexOf(targetDay);
          const currentDayIndex = now.getDay();
          
          let daysUntilTarget = targetDayIndex - currentDayIndex;
          if (daysUntilTarget <= 0) {
            daysUntilTarget += 7; // Next week
          }
          
          const targetDate = new Date(now);
          targetDate.setDate(targetDate.getDate() + daysUntilTarget);
          
          const timeMatch = timeText.match(/(\d{1,2}(?::\d{2})?(?:\s*(?:am|pm|AM|PM))?)/);
          if (timeMatch) {
            const time = this.parseTimeString(timeMatch[1]);
            if (time) {
              targetDate.setHours(time.hours, time.minutes, 0, 0);
            }
          }
          
          return targetDate;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing time:', error);
      return null;
    }
  }

  private static parseTimeString(timeStr: string): { hours: number; minutes: number } | null {
    const timeMatch = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)?/);
    if (!timeMatch) return null;
    
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2] || '0');
    const meridiem = timeMatch[3]?.toLowerCase();
    
    if (meridiem === 'pm' && hours !== 12) {
      hours += 12;
    } else if (meridiem === 'am' && hours === 12) {
      hours = 0;
    }
    
    return { hours, minutes };
  }

  private static determineContext(content: string): ReminderContext {
    for (const contextPattern of this.contextPatterns) {
      if (contextPattern.pattern.test(content)) {
        return {
          type: contextPattern.type as any,
          urgency: contextPattern.urgency as any,
          defaultLeadTime: contextPattern.leadTime,
          category: contextPattern.type
        };
      }
    }
    
    return {
      type: 'general',
      urgency: 'medium',
      defaultLeadTime: '10 minutes',
      category: 'general'
    };
  }

  private static extractExplicitLeadTime(content: string): string | undefined {
    for (const pattern of this.explicitReminderPatterns) {
      const match = content.match(pattern);
      if (match) {
        return `${match[1]} ${match[2]}`;
      }
    }
    return undefined;
  }

  private static extractAction(content: string): string {
    // Remove time references and reminder keywords to get core action
    let action = content
      .replace(/remind\s+me\s+.*?(?:before|early)/i, '')
      .replace(/(?:at|@)\s*\d{1,2}(?::\d{2})?(?:\s*(?:am|pm|AM|PM))?/i, '')
      .replace(/(?:today|tomorrow|yesterday)/i, '')
      .replace(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i, '')
      .replace(/in\s+\d+\s+(?:minutes?|hours?|days?|weeks?|months?)/i, '')
      .trim();
    
    return action || content;
  }

  private static extractSubject(content: string): string | undefined {
    // Extract person names or specific subjects
    const personMatch = content.match(/(?:with|call|meet|see)\s+([a-zA-Z]+)/i);
    if (personMatch) {
      return personMatch[1];
    }
    
    const subjectMatch = content.match(/(?:pick\s*up|get|fetch)\s+([^at]+?)(?:\s+at|\s+from|$)/i);
    if (subjectMatch) {
      return subjectMatch[1].trim();
    }
    
    return undefined;
  }

  private static extractLocation(content: string): string | undefined {
    const locationMatch = content.match(/(?:at|from|in)\s+([^0-9]+?)(?:\s+at\s+\d|$)/i);
    if (locationMatch && !locationMatch[1].match(/\d{1,2}(?::\d{2})?/)) {
      return locationMatch[1].trim();
    }
    return undefined;
  }

  private static extractRecurringPattern(content: string): string | undefined {
    if (/daily|every\s+day/i.test(content)) return 'daily';
    if (/weekly|every\s+week/i.test(content)) return 'weekly';
    if (/monthly|every\s+month/i.test(content)) return 'monthly';
    
    const weeklyMatch = content.match(/every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
    if (weeklyMatch) return `weekly_${weeklyMatch[1].toLowerCase()}`;
    
    const monthlyMatch = content.match(/every\s+(\d+(?:st|nd|rd|th)?)\s+of\s+(?:the\s+)?month/i);
    if (monthlyMatch) return `monthly_${monthlyMatch[1]}`;
    
    return undefined;
  }
}