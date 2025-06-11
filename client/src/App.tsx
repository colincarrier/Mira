import React from "react";
import { Router, Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";

// Import pages
import ActivityFeed from "@/components/activity-feed";
import TodosView from "@/components/todos-view";
import CollectionsView from "@/components/collections-view";
import Profile from "@/pages/profile";
import NoteDetail from "@/pages/note-detail";
import CollectionDetail from "@/pages/collection-detail";
import TodoDetail from "@/pages/todo-detail";
import Remind from "@/pages/remind";
import NotFound from "@/pages/not-found";
import BottomNavigation from "@/components/bottom-navigation";

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
          <div className="min-h-screen bg-[#f1efe8] pb-24">
            <Switch>
              <Route path="/" component={ActivityFeed} />
              <Route path="/todos" component={TodosView} />
              <Route path="/collections" component={CollectionsView} />
              <Route path="/profile" component={Profile} />
              <Route path="/note/:id" component={NoteDetail} />
              <Route path="/notes/:id" component={NoteDetail} />
              <Route path="/collection/:id" component={CollectionDetail} />
              <Route path="/collections/:id" component={CollectionDetail} />
              <Route path="/todo/:id" component={TodoDetail} />
              <Route path="/todos/:id" component={TodoDetail} />
              <Route path="/remind" component={Remind} />
              <Route component={NotFound} />
            </Switch>
            <BottomNavigation />
          </div>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}