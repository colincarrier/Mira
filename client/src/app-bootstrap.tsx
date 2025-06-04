import React, { useEffect, useState } from 'react';
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { FeatureErrorBoundary } from "@/components/feature-error-boundary";
import { queryClient } from "./lib/queryClient";
import { initializeStore, setupNetworkMonitoring, useAppStore } from "./store/app-store";

interface AppBootstrapProps {
  children: React.ReactNode;
}

export function AppBootstrap({ children }: AppBootstrapProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { isOffline, isLoading } = useAppStore();

  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize offline storage and network monitoring
        await initializeStore();
        setupNetworkMonitoring();
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // App should still work with basic functionality
        setIsInitialized(true);
      }
    };

    initialize();
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing Mira...</p>
        </div>
      </div>
    );
  }

  return (
    <FeatureErrorBoundary featureName="Application Core">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen bg-gray-50">
            {isOffline && (
              <div className="bg-yellow-500 text-white text-center py-2 px-4 text-sm">
                You're offline. Changes will sync when connection returns.
              </div>
            )}
            {isLoading && (
              <div className="bg-blue-500 text-white text-center py-1 px-4 text-xs">
                Syncing...
              </div>
            )}
            {children}
          </div>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </FeatureErrorBoundary>
  );
}