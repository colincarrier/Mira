import React, { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { AppBootstrap } from "./app-bootstrap";
import { FeatureErrorBoundary } from "./components/feature-error-boundary";

// Lazy load all components to prevent dependency issues
const SimpleHome = lazy(() => import("./pages/simple-home"));
const NoteDetail = lazy(() => import("./pages/note-detail"));
const CollectionDetail = lazy(() => import("./pages/collection-detail"));
const TodoDetail = lazy(() => import("./pages/todo-detail"));
const NotFound = lazy(() => import("./pages/not-found"));
const AIDemoPage = lazy(() => import("./pages/ai-demo"));
const TestAIPage = lazy(() => import("./pages/test-ai"));

function PageLoader() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}

function SafeRoute({ path, Component, featureName }: { 
  path?: string; 
  Component: React.LazyExoticComponent<() => JSX.Element>;
  featureName: string;
}) {
  return (
    <FeatureErrorBoundary 
      featureName={featureName}
      fallback={
        <div className="p-6 text-center max-w-md mx-auto mt-20">
          <h2 className="text-xl font-bold mb-2">{featureName} Unavailable</h2>
          <p className="text-gray-600 mb-4">This feature is temporarily unavailable, but the rest of your app is still working.</p>
          <button 
            onClick={() => window.location.href = "/"}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      }
    >
      <Suspense fallback={<PageLoader />}>
        <Component />
      </Suspense>
    </FeatureErrorBoundary>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <SafeRoute Component={SimpleHome} featureName="Home Page" />
      </Route>
      
      <Route path="/note/:id">
        <SafeRoute Component={NoteDetail} featureName="Note Detail" />
      </Route>
      
      <Route path="/collection/:id">
        <SafeRoute Component={CollectionDetail} featureName="Collection Detail" />
      </Route>
      
      <Route path="/todo/:id">
        <SafeRoute Component={TodoDetail} featureName="Todo Detail" />
      </Route>
      
      <Route path="/ai-demo">
        <SafeRoute Component={AIDemoPage} featureName="AI Demo" />
      </Route>
      
      <Route path="/test-ai">
        <SafeRoute Component={TestAIPage} featureName="AI Test" />
      </Route>
      
      <Route>
        <SafeRoute Component={NotFound} featureName="404 Page" />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <AppBootstrap>
      <Router />
    </AppBootstrap>
  );
}

export default App;
