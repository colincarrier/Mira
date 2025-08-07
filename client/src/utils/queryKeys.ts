export const queryKeys = {
  notes: {
    all: ['/api/notes'] as const,
    detail: (id: number) => [`/api/notes/${id}`] as const,
    versions: (id: number) => [`/api/notes/${id}/versions`] as const,
  },
  collections: {
    all: ['/api/collections'] as const,
  },
  todos: {
    all: ['/api/todos'] as const,
  }
} as const;