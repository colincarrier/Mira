import React from "react";
import { Router, Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Notes from "@/pages/notes";
import NoteDetail from "@/pages/note-detail";
import TodoDetail from "@/pages/todo-detail";
import CollectionDetail from "@/pages/collection-detail";
import Remind from "@/pages/remind";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";
import ErrorBoundary from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Switch>
            <Route path="/" component={Notes} />
            <Route path="/remind" component={Remind} />
            <Route path="/profile" component={Profile} />
            <Route path="/note/:id" component={NoteDetail} />
            <Route path="/collection/:id" component={CollectionDetail} />
            <Route path="/todo/:id" component={TodoDetail} />
            <Route component={NotFound} />
          </Switch>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}