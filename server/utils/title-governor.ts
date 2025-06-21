/**
 * Title Governor - Smart Title Generation with Shorthand and Emojis
 */

const shorthandMap: Record<string, string> = {
  'recommendations': 'recs',
  'information': 'info',
  'guide': '',
  'tutorial': 'how-to',
  'shopping': 'shop',
  'reminder': 'remind',
  'appointment': 'appt',
  'meeting': 'meet',
  'discussion': 'chat',
  'analysis': 'breakdown',
  'review': 'thoughts',
  'comparison': 'vs',
  'investigation': 'look into'
};

const categoryEmojis: Record<string, string> = {
  'shop': '🛒',
  'food': '🍕',
  'travel': '✈️',
  'health': '💊',
  'work': '💼',
  'reminder': '⏰',
  'research': '🔍',
  'helmet': '⛑️',
  'tech': '💻',
  'music': '🎵',
  'book': '📚',
  'movie': '🎬',
  'exercise': '💪',
  'call': '📞',
  'doctor': '👩‍⚕️',
  'prescription': '💊',
  'grocery': '🛒',
  'meeting': '👥',
  'birthday': '🎂',
  'flight': '✈️',
  'hotel': '🏨'
};

export const makeTitle = (content: string, mode: string = 'text'): string => {
  if (!content || content.trim().length === 0) {
    return 'Untitled Note';
  }

  const cleanContent = content.trim().toLowerCase();
  
  // Detect category and get emoji
  let emoji = '';
  for (const [keyword, emojiChar] of Object.entries(categoryEmojis)) {
    if (cleanContent.includes(keyword)) {
      emoji = emojiChar + ' ';
      break;
    }
  }
  
  // Apply shorthand replacements
  let processedContent = cleanContent;
  for (const [full, short] of Object.entries(shorthandMap)) {
    if (short) { // Only replace if replacement exists
      processedContent = processedContent.replace(new RegExp(`\\b${full}\\b`, 'g'), short);
    }
  }
  
  // Generate title based on content type
  let title = '';
  
  if (processedContent.includes('remind') || processedContent.includes('remember')) {
    const match = processedContent.match(/(call|buy|pick up|get|take|do)\s+([^,]+)/);
    if (match) {
      title = match[1].charAt(0).toUpperCase() + match[1].slice(1) + ' ' + match[2];
    } else {
      title = 'Reminder';
    }
  } else if (processedContent.includes('research') || processedContent.includes('find') || processedContent.includes('look')) {
    const subject = processedContent.replace(/^(research|find|look\s+up|look\s+into)\s+/, '').split(' ').slice(0, 3).join(' ');
    title = subject.charAt(0).toUpperCase() + subject.slice(1) + ' Research';
  } else if (processedContent.includes('buy') || processedContent.includes('shop') || processedContent.includes('get')) {
    const item = processedContent.replace(/^(buy|shop\s+for|get)\s+/, '').split(' ').slice(0, 2).join(' ');
    title = item.charAt(0).toUpperCase() + item.slice(1) + ' Shop';
  } else if (processedContent.length <= 40) {
    title = processedContent.charAt(0).toUpperCase() + processedContent.slice(1);
  } else {
    const words = processedContent.split(/\s+/).slice(0, 4);
    title = words.join(' ').charAt(0).toUpperCase() + words.join(' ').slice(1);
  }
  
  // Clean up and limit length
  title = title.replace(/\s+/g, ' ').trim();
  if (title.length > 50) {
    title = title.substring(0, 47) + '...';
  }
  
  return emoji + title;
};