export function parseAIContent(md: string): string {
  return md
    // Convert bullet lists
    .replace(/^- (.+)$/gm, '* $1')
    // Convert links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
      '<a href="$2" class="text-primary-600 underline">$1</a>')
    // Convert bold text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Convert italic text  
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}