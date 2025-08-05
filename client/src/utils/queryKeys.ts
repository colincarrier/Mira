export const queryKeys = {
  notes: {
    all: ['/api/notes'] as const,
    detail: (id: number) => [`/api/notes/${id}`] as const,
  }
} as const;