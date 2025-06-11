import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { offlineStorage } from "@/store/offline-storage";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  method: string = "GET",
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    
    // Try to get from offline storage first if offline
    if (!navigator.onLine) {
      try {
        const cachedData = await offlineStorage.retrieve(url, 'api');
        if (cachedData) {
          return cachedData;
        }
      } catch (error) {
        console.warn('Failed to retrieve from offline storage:', error);
      }
    }

    try {
      const res = await fetch(url, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      
      // Store successful API responses in offline storage
      if (res.ok && url.startsWith('/api/')) {
        try {
          await offlineStorage.store(url, data, 'api');
        } catch (error) {
          console.warn('Failed to store in offline storage:', error);
        }
      }
      
      return data;
    } catch (error) {
      // Network error - try offline storage as fallback
      try {
        const cachedData = await offlineStorage.retrieve(url, 'api');
        if (cachedData) {
          console.log('Using cached data due to network error:', url);
          return cachedData;
        }
      } catch (storageError) {
        console.warn('Failed to retrieve fallback data:', storageError);
      }
      
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes instead of Infinity
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
