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
    
    // TEMPORARILY DISABLED: Offline storage might be causing issues
    // Try to get from offline storage first if offline
    // if (!navigator.onLine) {
    //   try {
    //     const cachedData = await offlineStorage.retrieve(url, 'api');
    //     if (cachedData) {
    //       return cachedData;
    //     }
    //   } catch (error) {
    //     console.warn('Failed to retrieve from offline storage:', error);
    //   }
    // }

    try {
      const res = await fetch(url, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      
      // Log API responses for debugging
      if (url.includes('/api/notes')) {
        console.log(`[QueryClient] API response for ${url}:`, {
          status: res.status,
          ok: res.ok,
          dataType: Array.isArray(data) ? 'array' : typeof data,
          dataLength: Array.isArray(data) ? data.length : 'not array',
          firstItem: Array.isArray(data) && data[0] ? { id: data[0].id, hasContent: !!data[0].content } : 'no data'
        });
      }
      
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
      staleTime: 5 * 1000, // 5 seconds (aggressive refetch)
      gcTime: 60 * 1000, // 1 minute retention
      retry: 1, // Allow 1 retry
    },
    mutations: {
      retry: false,
    },
  },
});
