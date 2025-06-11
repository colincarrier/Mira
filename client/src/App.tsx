import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/error-boundary";

import Notes from "./pages/notes";
import Remind from "./pages/remind";
import Profile from "./pages/profile";
import NoteDetail from "./pages/note-detail";
import CollectionDetail from "./pages/collection-detail";
import TodoDetail from "./pages/todo-detail";
import NotFound from "./pages/not-found";


function Router() {
  return (
    <Switch>
      <Route path="/" component={Notes} />
      <Route path="/remind" component={Remind} />
      <Route path="/profile" component={Profile} />
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
        <Router />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;