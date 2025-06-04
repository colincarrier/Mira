import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2, Brain, Zap } from "lucide-react";

interface ComparisonResult {
  original: string;
  openAI: {
    success: boolean;
    result: any;
    error: string | null;
  };
  claude: {
    success: boolean;
    result: any;
    error: string | null;
  };
}

export default function AIComparison() {
  const [content, setContent] = useState("");
  const [results, setResults] = useState<ComparisonResult | null>(null);

  const compareMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/compare-ai", { content, mode: "enhanced" });
      return response.json();
    },
    onSuccess: (data) => {
      setResults(data);
    },
  });

  const handleCompare = () => {
    if (content.trim()) {
      compareMutation.mutate(content.trim());
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">AI Comparison Tool</h2>
        <p className="text-gray-600">Test the same input with both OpenAI and Claude to compare their results</p>
      </div>

      <div className="space-y-4">
        <Textarea
          placeholder="Enter your note content here to compare AI processing..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="w-full"
        />
        
        <Button 
          onClick={handleCompare} 
          disabled={!content.trim() || compareMutation.isPending}
          className="w-full"
        >
          {compareMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing with both AIs...
            </>
          ) : (
            "Compare AI Results"
          )}
        </Button>
      </div>

      {results && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* OpenAI Results */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold">OpenAI Results</h3>
            </div>
            
            {results.openAI.success ? (
              <div className="space-y-4">
                {results.openAI.result.enhancedContent && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-600 mb-2">Enhanced Content:</h4>
                    <p className="text-sm bg-gray-50 p-3 rounded">{results.openAI.result.enhancedContent}</p>
                  </div>
                )}
                
                {results.openAI.result.todos && results.openAI.result.todos.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-600 mb-2">Extracted Tasks:</h4>
                    <ul className="text-sm space-y-1">
                      {results.openAI.result.todos.map((todo: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-gray-400">•</span>
                          {todo}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {results.openAI.result.collectionSuggestion && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-600 mb-2">Collection Suggestion:</h4>
                    <p className="text-sm bg-blue-50 p-2 rounded">
                      {results.openAI.result.collectionSuggestion.name} ({results.openAI.result.collectionSuggestion.icon})
                    </p>
                  </div>
                )}
                
                {results.openAI.result.richContext && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-600 mb-2">Key Insights:</h4>
                    <div className="text-sm bg-gray-50 p-3 rounded space-y-2">
                      <p><strong>Summary:</strong> {results.openAI.result.richContext.summary}</p>
                      {results.openAI.result.richContext.keyInsights && results.openAI.result.richContext.keyInsights.length > 0 && (
                        <div>
                          <strong>Insights:</strong>
                          <ul className="mt-1 space-y-1">
                            {results.openAI.result.richContext.keyInsights.map((insight: string, index: number) => (
                              <li key={index} className="ml-4">• {insight}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-600 text-sm">
                Error: {results.openAI.error || "Analysis failed"}
              </div>
            )}
          </Card>

          {/* Claude Results */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-orange-500 opacity-20" />
              <h3 className="text-lg font-semibold">Claude Results</h3>
            </div>
            
            {results.claude.success ? (
              <div className="space-y-4">
                {results.claude.result.enhancedContent && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-600 mb-2">Enhanced Content:</h4>
                    <p className="text-sm bg-gray-50 p-3 rounded">{results.claude.result.enhancedContent}</p>
                  </div>
                )}
                
                {results.claude.result.todos && results.claude.result.todos.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-600 mb-2">Extracted Tasks:</h4>
                    <ul className="text-sm space-y-1">
                      {results.claude.result.todos.map((todo: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-gray-400">•</span>
                          {todo}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {results.claude.result.collectionSuggestion && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-600 mb-2">Collection Suggestion:</h4>
                    <p className="text-sm bg-orange-50 p-2 rounded">
                      {results.claude.result.collectionSuggestion.name} ({results.claude.result.collectionSuggestion.icon})
                    </p>
                  </div>
                )}
                
                {results.claude.result.richContext && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-600 mb-2">Key Insights:</h4>
                    <div className="text-sm bg-gray-50 p-3 rounded space-y-2">
                      <p><strong>Summary:</strong> {results.claude.result.richContext.summary}</p>
                      {results.claude.result.richContext.keyInsights && results.claude.result.richContext.keyInsights.length > 0 && (
                        <div>
                          <strong>Insights:</strong>
                          <ul className="mt-1 space-y-1">
                            {results.claude.result.richContext.keyInsights.map((insight: string, index: number) => (
                              <li key={index} className="ml-4">• {insight}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-600 text-sm">
                Error: {results.claude.error || "Analysis failed"}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}