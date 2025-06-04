import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/error-boundary";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import NoteDetail from "@/pages/note-detail";
import CollectionDetail from "@/pages/collection-detail";
import TodoDetail from "@/pages/todo-detail";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/note/:id" component={NoteDetail} />
      <Route path="/collection/:id" component={CollectionDetail} />
      <Route path="/todo/:id" component={TodoDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
          {/* Test Element at App Level */}
          <div 
            className="fixed bottom-32 left-4 right-4 bg-yellow-500 text-black p-2 text-center rounded-lg"
            style={{ zIndex: 99999 }}
          >
            APP LEVEL TEST: Should appear everywhere
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
