export default function SimpleHome() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Mira - AI Intelligence Demo</h1>
      
      <div className="space-y-4">
        <p className="text-gray-600">
          Test the enhanced AI intelligence system with predictive fragment completion and ambiguous input detection.
        </p>
        
        <div className="flex gap-4">
          <button 
            onClick={() => window.location.href = "/test-ai"}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Simple AI Test
          </button>
          
          <button 
            onClick={() => window.location.href = "/ai-demo"}
            className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Full AI Demo
          </button>
        </div>
        
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">What to Test:</h3>
          <ul className="text-sm space-y-1">
            <li>• Fragment completion: "restaurant tonight" → "Find and book a restaurant for dinner tonight"</li>
            <li>• Pickup reminders: "Atlas 3pm" → "Reminder to pick up Atlas at 3pm"</li>
            <li>• Ambiguous inputs: "chicago" → Multiple interpretations with actions</li>
            <li>• Complex analysis: Task hierarchies and predictive next steps</li>
          </ul>
        </div>
      </div>
    </div>
  );
}