import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

async function createNote(payload: any) {
  return apiRequest('/api/notes', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' }
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createNote,
    onMutate: async (payload) => {
      const temp = {
        id: `temp-${crypto.randomUUID()}`,
        content: payload.content,
        createdAt: new Date().toISOString(),
        aiEnhanced: false,
        isProcessing: true,
        todos: []
      };
      qc.setQueryData(['notes'], (old: any = []) => [temp, ...old]);
      return { tempId: temp.id };
    },
    onSuccess: (note, _, ctx) => {
      qc.setQueryData(['notes'], (old: any[]) =>
        old.map(n => n.id === ctx?.tempId ? note : n)
      );
    }
  });
}