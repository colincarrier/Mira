import { Switch, Route } from "wouter";

function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mira</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">AI-Powered Memory Assistant</h2>
          <p className="text-gray-600 mb-4">
            Your intelligent note-taking companion that understands context and helps you capture ideas effortlessly.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded">
              <h3 className="font-medium text-blue-900 mb-2">Smart Capture</h3>
              <p className="text-sm text-blue-700">AI understands incomplete thoughts and completes your intent</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded">
              <h3 className="font-medium text-green-900 mb-2">Organized Collections</h3>
              <p className="text-sm text-green-700">Automatically categorizes and organizes your notes</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <p className="text-gray-500">Your notes and todos will appear here once you start capturing ideas.</p>
        </div>
      </div>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
        <button 
          onClick={() => window.location.href = "/"}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route component={NotFoundPage} />
    </Switch>
  );
}

export default App;
