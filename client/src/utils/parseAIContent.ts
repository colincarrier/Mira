export function parseAIContent(md: string): string {
  return md
    .replace(/^-\s+(.*)$/gm, '* $1')                               // bullets → markdown list
    .replace(/\[([^\]]+)]\(([^)]+)\)/g, '<a href="$2">$1</a>')     // markdown link
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')            // bold
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');                       // italic
}