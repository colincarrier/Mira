import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Target, Clock, AlertCircle, CheckCircle, Brain } from "lucide-react";

interface TaxonomyAnalysisResult {
  detected: boolean;
  category?: string;
  confidence?: number;
  microQuestions?: string[];
  suggestedFollowUps?: string[];
  contextualInsights?: string[];
  message?: string;
  suggestions?: string[];
}

interface EnhancedAnalysisResult {
  enhancedContent: string;
  complexityScore: number;
  intentType: string;
  urgencyLevel: string;
  todos: string[];
  taskHierarchy?: any[];
  collectionSuggestion?: {
    name: string;
    icon: string;
    color: string;
  };
  nextSteps?: string[];
  timeToComplete?: string;
  successFactors?: string[];
  potentialObstacles?: string[];
  taxonomyInsights?: {
    category: string;
    confidence: number;
    microQuestions: string[];
    suggestedFollowUps: string[];
    contextualInsights: string[];
  };
}

const sampleInputs = [
  "Need to find a good restaurant for dinner tonight",
  "Want to learn Python programming",
  "Planning a trip to Japan next summer",
  "Need to buy a new laptop for work",
  "Starting a workout routine",
  "Looking for a new job in tech",
  "Redecorating my living room",
  "Save money for a house down payment"
];

export default function AITaxonomyDemo() {
  const [input, setInput] = useState("");
  const [taxonomyResult, setTaxonomyResult] = useState<TaxonomyAnalysisResult | null>(null);
  const [enhancedResult, setEnhancedResult] = useState<EnhancedAnalysisResult | null>(null);

  const taxonomyMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/analyze-taxonomy", { content });
      return response.json();
    },
    onSuccess: (data) => {
      setTaxonomyResult(data);
    },
  });

  const enhancedMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/analyze-enhanced", { content, mode: "claude" });
      return response.json();
    },
    onSuccess: (data) => {
      setEnhancedResult(data);
    },
  });

  const handleAnalyze = () => {
    if (input.trim()) {
      setTaxonomyResult(null);
      setEnhancedResult(null);
      taxonomyMutation.mutate(input.trim());
      enhancedMutation.mutate(input.trim());
    }
  };

  const handleSampleInput = (sample: string) => {
    setInput(sample);
    setTaxonomyResult(null);
    setEnhancedResult(null);
  };

  const getComplexityColor = (score: number) => {
    if (score <= 3) return "text-green-600 bg-green-50";
    if (score <= 6) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case "critical": return "text-red-600 bg-red-50";
      case "high": return "text-orange-600 bg-orange-50";
      case "medium": return "text-yellow-600 bg-yellow-50";
      case "low": return "text-green-600 bg-green-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">AI Intelligence Framework Demo</h2>
        <p className="text-gray-600">
          Test Mira's enhanced pattern recognition, complexity analysis, and contextual micro-questions
        </p>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Input Analysis
          </CardTitle>
          <CardDescription>
            Enter any text to see how Mira's AI analyzes patterns and provides intelligent assistance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Type anything here... e.g., 'Need to find a restaurant', 'Learning a new skill', 'Planning a trip'"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-20"
          />
          
          <div className="flex flex-wrap gap-2">
            <p className="text-sm text-gray-600 w-full mb-2">Try these examples:</p>
            {sampleInputs.map((sample, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSampleInput(sample)}
                className="text-xs"
              >
                {sample}
              </Button>
            ))}
          </div>
          
          <Button 
            onClick={handleAnalyze}
            disabled={!input.trim() || taxonomyMutation.isPending || enhancedMutation.isPending}
            className="w-full"
          >
            {taxonomyMutation.isPending || enhancedMutation.isPending ? "Analyzing..." : "Analyze with AI"}
          </Button>
        </CardContent>
      </Card>

      {/* Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Taxonomy Pattern Detection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Pattern Detection
            </CardTitle>
            <CardDescription>
              Automatic recognition of common input patterns and contextual assistance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {taxonomyMutation.isPending && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Detecting patterns...</p>
              </div>
            )}
            
            {taxonomyResult && (
              <div className="space-y-4">
                {taxonomyResult.detected ? (
                  <>
                    <div className="flex items-center justify-between">
                      <Badge variant="default" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Pattern Detected
                      </Badge>
                      <Badge variant="outline">
                        {Math.round((taxonomyResult.confidence || 0) * 100)}% confidence
                      </Badge>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Category: {taxonomyResult.category}</h4>
                    </div>

                    {taxonomyResult.microQuestions && taxonomyResult.microQuestions.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                          <Lightbulb className="h-4 w-4" />
                          Smart Questions
                        </h4>
                        <ul className="space-y-1">
                          {taxonomyResult.microQuestions.map((question, index) => (
                            <li key={index} className="text-sm bg-blue-50 p-2 rounded border-l-2 border-blue-300">
                              {question}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {taxonomyResult.suggestedFollowUps && taxonomyResult.suggestedFollowUps.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Suggested Actions</h4>
                        <ul className="space-y-1">
                          {taxonomyResult.suggestedFollowUps.map((action, index) => (
                            <li key={index} className="text-sm bg-green-50 p-2 rounded border-l-2 border-green-300">
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {taxonomyResult.contextualInsights && taxonomyResult.contextualInsights.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Pro Tips</h4>
                        <ul className="space-y-1">
                          {taxonomyResult.contextualInsights.map((insight, index) => (
                            <li key={index} className="text-sm bg-yellow-50 p-2 rounded border-l-2 border-yellow-300">
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">{taxonomyResult.message}</p>
                    {taxonomyResult.suggestions && (
                      <ul className="mt-2 space-y-1">
                        {taxonomyResult.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-xs text-gray-500">• {suggestion}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced AI Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Intelligence Analysis
            </CardTitle>
            <CardDescription>
              Complexity scoring, intent recognition, and predictive assistance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {enhancedMutation.isPending && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Running AI analysis...</p>
              </div>
            )}
            
            {enhancedResult && (
              <div className="space-y-4">
                {/* Intelligence Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Complexity Score</p>
                    <Badge className={getComplexityColor(enhancedResult.complexityScore)}>
                      {enhancedResult.complexityScore}/10
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Urgency Level</p>
                    <Badge className={getUrgencyColor(enhancedResult.urgencyLevel)}>
                      {enhancedResult.urgencyLevel}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-1">Intent Type</p>
                  <Badge variant="outline">{enhancedResult.intentType}</Badge>
                </div>

                {enhancedResult.timeToComplete && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Estimated time: {enhancedResult.timeToComplete}</span>
                  </div>
                )}

                {enhancedResult.todos && enhancedResult.todos.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Action Items</h4>
                    <ul className="space-y-1">
                      {enhancedResult.todos.map((todo, index) => (
                        <li key={index} className="text-sm bg-blue-50 p-2 rounded flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 mt-1 text-blue-600 flex-shrink-0" />
                          {todo}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {enhancedResult.nextSteps && enhancedResult.nextSteps.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Predicted Next Steps</h4>
                    <ul className="space-y-1">
                      {enhancedResult.nextSteps.map((step, index) => (
                        <li key={index} className="text-sm bg-purple-50 p-2 rounded border-l-2 border-purple-300">
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {enhancedResult.successFactors && enhancedResult.successFactors.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Success Factors</h4>
                    <ul className="space-y-1">
                      {enhancedResult.successFactors.map((factor, index) => (
                        <li key={index} className="text-sm bg-green-50 p-2 rounded border-l-2 border-green-300">
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {enhancedResult.collectionSuggestion && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Suggested Collection</h4>
                    <Badge variant="outline" className="flex items-center gap-1 w-fit">
                      <span className="text-xs">📁</span>
                      {enhancedResult.collectionSuggestion.name}
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full Enhanced Analysis */}
      {enhancedResult?.enhancedContent && (
        <Card>
          <CardHeader>
            <CardTitle>Enhanced Content</CardTitle>
            <CardDescription>
              AI-processed and structured version of your input
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded border text-sm whitespace-pre-wrap">
              {enhancedResult.enhancedContent}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}