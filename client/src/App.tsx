import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/error-boundary";
import { Plus, Mic } from "lucide-react";
import { useState } from "react";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import NoteDetail from "@/pages/note-detail";
import CollectionDetail from "@/pages/collection-detail";
import TodoDetail from "@/pages/todo-detail";
import FullScreenCapture from "@/components/full-screen-capture";

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

function GlobalAddButton() {
  const [location] = useLocation();
  const [isFullScreenCaptureOpen, setIsFullScreenCaptureOpen] = useState(false);
  
  // Show on home page only
  const shouldShow = location === '/';
  
  console.log('GlobalAddButton - location:', location, 'shouldShow:', shouldShow);
  
  if (!shouldShow) return null;
  
  return (
    <>
      {/* Debug element */}
      <div 
        className="fixed top-20 left-4 right-4 bg-red-500 text-white p-2 text-center"
        style={{ zIndex: 99999 }}
      >
        DEBUG: GlobalAddButton rendering - location: {location}
      </div>
      
      <div 
        className="fixed bottom-24 left-4 right-4 transition-transform duration-300"
        style={{ zIndex: 10000 }}
      >
        <div className="border border-gray-300 rounded-full px-4 py-3 shadow-lg flex items-center gap-3 bg-white">
          <input
            type="text"
            placeholder="Add/edit anything..."
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-500 text-gray-900"
            onFocus={() => setIsFullScreenCaptureOpen(true)}
            readOnly
          />
          <button 
            onClick={() => setIsFullScreenCaptureOpen(true)}
            className="w-8 h-8 bg-[#a8bfa1] hover:bg-gray-900 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsFullScreenCaptureOpen(true)}
            className="w-8 h-8 bg-[#a1c4cfcc] hover:bg-gray-600 text-gray-700 rounded-full flex items-center justify-center transition-colors"
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <FullScreenCapture
        isOpen={isFullScreenCaptureOpen}
        onClose={() => setIsFullScreenCaptureOpen(false)}
      />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
          <GlobalAddButton />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
