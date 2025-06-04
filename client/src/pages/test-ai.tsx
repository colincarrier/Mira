import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function TestAIPage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<any>(null);

  const testMutation = useMutation({
    mutationFn: async (content: string) => {
      console.log("Testing with content:", content);
      const response = await apiRequest("POST", "/api/analyze-taxonomy", { content });
      const data = await response.json();
      console.log("Response:", data);
      return data;
    },
    onSuccess: (data) => {
      console.log("Success:", data);
      setResult(data);
    },
    onError: (error) => {
      console.error("Error:", error);
      setResult({ error: error.message });
    },
  });

  const handleTest = () => {
    console.log("Test button clicked");
    if (input.trim()) {
      testMutation.mutate(input.trim());
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">AI Test Page</h1>
      
      <div className="space-y-4">
        <Textarea
          placeholder="Enter test input..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-20"
        />
        
        <Button 
          onClick={handleTest}
          disabled={!input.trim() || testMutation.isPending}
          className="w-full"
        >
          {testMutation.isPending ? "Testing..." : "Test AI Analysis"}
        </Button>

        {result && (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h3 className="font-semibold mb-2">Result:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      <div className="mt-6">
        <Button 
          variant="outline" 
          onClick={() => window.location.href = "/"}
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
}