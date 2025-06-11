import React from "react";
import { Router, Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";

// Import pages
import Notes from "@/pages/notes";
import Remind from "@/pages/remind";
import Profile from "@/pages/profile";
import NoteDetail from "@/pages/note-detail";
import CollectionDetail from "@/pages/collection-detail";
import TodoDetail from "@/pages/todo-detail";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen bg-[#f1efe8]">
            <Switch>
              <Route path="/" component={Notes} />
              <Route path="/remind" component={Remind} />
              <Route path="/profile" component={Profile} />
              <Route path="/notes/:id" component={NoteDetail} />
              <Route path="/collection/:id" component={CollectionDetail} />
              <Route path="/todo/:id" component={TodoDetail} />
              <Route component={NotFound} />
            </Switch>
          </div>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}