export const GENERIC_REGEX = /(visit (?:the )?official)|(check (?:their|the) website)|(various options)|(prices may vary)|(consult with)|(explore different)|(research available)/i;

export function isGenericResponse(content: string): boolean {
  return GENERIC_REGEX.test(content);
}

export async function validateResponse(content: string, retryFn?: () => Promise<string>): Promise<string> {
  if (isGenericResponse(content) && retryFn) {
    console.log('[Quality Guard] Generic response detected, retrying...');
    return await retryFn();
  }
  return content;
}