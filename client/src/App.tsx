import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

import SimpleHome from "@/pages/simple-home";
import NotFound from "@/pages/not-found";
import NoteDetail from "@/pages/note-detail";
import CollectionDetail from "@/pages/collection-detail";
import TodoDetail from "@/pages/todo-detail";
import DebugCollections from "@/pages/debug-collections";


function Router() {
  return (
    <Switch>
      <Route path="/" component={SimpleHome} />
      <Route path="/debug" component={DebugCollections} />
      <Route path="/note/:id" component={NoteDetail} />
      <Route path="/collection/:id" component={CollectionDetail} />
      <Route path="/todo/:id" component={TodoDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  );
}

export default App;
