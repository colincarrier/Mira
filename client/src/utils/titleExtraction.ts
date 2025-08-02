import { JSONContent } from '@shared/types';

export function extractTitle(doc: JSONContent): string | null {
  if (!doc || !doc.content) return null;

  // Look for first H1 heading
  const h1 = doc.content.find((node: any) => 
    node.type === 'heading' && node.attrs?.level === 1
  );

  if (h1 && h1.content && h1.content[0]) {
    return h1.content[0].text || null;
  }

  // Fallback to first paragraph's first line
  const firstParagraph = doc.content.find((node: any) => 
    node.type === 'paragraph' && node.content?.length > 0
  );

  if (firstParagraph && firstParagraph.content && firstParagraph.content[0]) {
    const text = firstParagraph.content[0].text || '';
    // Take first line, max 100 chars
    const firstLine = text.split('\n')[0].slice(0, 100);
    return firstLine || null;
  }

  return null;
}