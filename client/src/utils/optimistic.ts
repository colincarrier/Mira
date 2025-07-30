export const generateTempId = () =>
  `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const isTemporary = (id: string) => id.startsWith('temp-');