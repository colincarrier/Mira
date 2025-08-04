/**
 * Parse AI content for better markdown rendering
 * Handles bullets, links, bold, italic formatting
 */
export function parseAIContent(md: string): string {
  if (!md) return '';
  
  return md
    // Convert dash bullets to asterisk bullets
    .replace(/^- (.+)$/gm, '* $1')
    // Convert links to HTML
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
      '<a href="$2" class="text-primary-600 underline" target="_blank" rel="noopener">$1</a>')
    // Convert bold text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Convert italic text (but not list items)
    .replace(/(?<!\*)(\*)([^*]+)\1(?!\*)/g, '<em>$2</em>');
}