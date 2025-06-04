import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, HelpCircle, ArrowRight, Brain, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface TaxonomyResult {
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
  taskHierarchy?: Array<{
    phase: string;
    description: string;
    tasks: string[];
    estimatedTime: string;
    dependencies?: string[];
  }>;
  taxonomyInsights?: {
    category: string;
    confidence: number;
    microQuestions: string[];
    suggestedFollowUps: string[];
    contextualInsights: string[];
  };
  nextSteps?: string[];
  timeToComplete?: string;
  successFactors?: string[];
  potentialObstacles?: string[];
  relatedTopics?: string[];
  skillsRequired?: string[];
  resourcesNeeded?: string[];
}

export default function SmartInputAnalyzer() {
  const [input, setInput] = useState("");
  const [taxonomyResult, setTaxonomyResult] = useState<TaxonomyResult | null>(null);
  const [enhancedResult, setEnhancedResult] = useState<EnhancedAnalysisResult | null>(null);

  const taxonomyMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/analyze-taxonomy", { content });
      return response.json();
    },
    onSuccess: (data: TaxonomyResult) => {
      setTaxonomyResult(data);
    },
  });

  const enhancedMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/analyze-enhanced", { content, mode: "claude" });
      return response.json();
    },
    onSuccess: (data: EnhancedAnalysisResult) => {
      setEnhancedResult(data);
    },
  });

  const handleTaxonomyAnalysis = () => {
    if (input.trim()) {
      setTaxonomyResult(null);
      setEnhancedResult(null);
      taxonomyMutation.mutate(input.trim());
    }
  };

  const handleEnhancedAnalysis = () => {
    if (input.trim()) {
      setEnhancedResult(null);
      enhancedMutation.mutate(input.trim());
    }
  };

  const getComplexityColor = (score: number) => {
    if (score <= 3) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (score <= 6) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case "critical": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "high": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default: return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </Button>
        </Link>
        <div className="text-center flex-1">
          <h2 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <Brain className="w-8 h-8 text-blue-600" />
            Smart Input Intelligence
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Test the AI taxonomy engine with pattern recognition and micro-questions
          </p>
        </div>
        <div className="w-20"></div> {/* Spacer for centering */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Input Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter something you want to do, learn, buy, plan, etc..."
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleTaxonomyAnalysis()}
            />
            <Button 
              onClick={handleTaxonomyAnalysis}
              disabled={!input.trim() || taxonomyMutation.isPending}
            >
              {taxonomyMutation.isPending ? "Analyzing..." : "Detect Pattern"}
            </Button>
            <Button 
              onClick={handleEnhancedAnalysis}
              disabled={!input.trim() || enhancedMutation.isPending}
              variant="secondary"
            >
              {enhancedMutation.isPending ? "Processing..." : "Full Analysis"}
            </Button>
          </div>

          {/* Example inputs for testing */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-500">Try these examples:</span>
            {[
              "I want to learn Python programming",
              "Need to find a good restaurant for dinner",
              "Planning a trip to Japan next month",
              "Want to buy a new laptop",
              "Need to improve my fitness routine"
            ].map((example, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setInput(example)}
                className="text-xs"
              >
                {example}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Taxonomy Analysis Results */}
      {taxonomyResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Pattern Recognition Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {taxonomyResult.detected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {taxonomyResult.category?.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {Math.round((taxonomyResult.confidence || 0) * 100)}% confidence
                  </span>
                </div>

                {taxonomyResult.microQuestions && taxonomyResult.microQuestions.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-blue-600">Smart Questions to Ask:</h4>
                    <ul className="space-y-1">
                      {taxonomyResult.microQuestions.map((question, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <HelpCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{question}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {taxonomyResult.suggestedFollowUps && taxonomyResult.suggestedFollowUps.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-green-600">Suggested Next Steps:</h4>
                    <ul className="space-y-1">
                      {taxonomyResult.suggestedFollowUps.map((action, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <ArrowRight className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {taxonomyResult.contextualInsights && taxonomyResult.contextualInsights.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-purple-600">Contextual Insights:</h4>
                    <ul className="space-y-1">
                      {taxonomyResult.contextualInsights.map((insight, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600 mb-2">{taxonomyResult.message}</p>
                {taxonomyResult.suggestions && (
                  <div className="space-y-1">
                    {taxonomyResult.suggestions.map((suggestion, index) => (
                      <p key={index} className="text-sm text-gray-500">• {suggestion}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Enhanced Analysis Results */}
      {enhancedResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Full Intelligence Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Complexity and Intent Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Complexity Score</p>
                <Badge className={getComplexityColor(enhancedResult.complexityScore)}>
                  {enhancedResult.complexityScore}/10
                </Badge>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Intent Type</p>
                <Badge variant="outline">
                  {enhancedResult.intentType.replace('-', ' ')}
                </Badge>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Urgency Level</p>
                <Badge className={getUrgencyColor(enhancedResult.urgencyLevel)}>
                  {enhancedResult.urgencyLevel}
                </Badge>
              </div>
            </div>

            {/* Task Hierarchy for Complex Projects */}
            {enhancedResult.taskHierarchy && enhancedResult.taskHierarchy.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 text-blue-600">Project Breakdown:</h4>
                <div className="space-y-3">
                  {enhancedResult.taskHierarchy.map((phase, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium">{phase.phase}</h5>
                        <Badge variant="secondary" className="text-xs">
                          {phase.estimatedTime}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{phase.description}</p>
                      <ul className="text-sm space-y-1">
                        {phase.tasks.map((task, taskIndex) => (
                          <li key={taskIndex} className="flex items-start gap-2">
                            <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Predictive Intelligence */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enhancedResult.successFactors && enhancedResult.successFactors.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-green-600">Success Factors:</h4>
                  <ul className="text-sm space-y-1">
                    {enhancedResult.successFactors.map((factor, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {enhancedResult.potentialObstacles && enhancedResult.potentialObstacles.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-red-600">Potential Obstacles:</h4>
                  <ul className="text-sm space-y-1">
                    {enhancedResult.potentialObstacles.map((obstacle, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-500">⚠</span>
                        {obstacle}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Time and Resource Estimates */}
            {(enhancedResult.timeToComplete || enhancedResult.skillsRequired || enhancedResult.resourcesNeeded) && (
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {enhancedResult.timeToComplete && (
                    <div>
                      <p className="font-medium mb-1">Estimated Time:</p>
                      <p className="text-gray-600">{enhancedResult.timeToComplete}</p>
                    </div>
                  )}
                  {enhancedResult.skillsRequired && enhancedResult.skillsRequired.length > 0 && (
                    <div>
                      <p className="font-medium mb-1">Skills Needed:</p>
                      <div className="flex flex-wrap gap-1">
                        {enhancedResult.skillsRequired.map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {enhancedResult.resourcesNeeded && enhancedResult.resourcesNeeded.length > 0 && (
                    <div>
                      <p className="font-medium mb-1">Resources Needed:</p>
                      <div className="flex flex-wrap gap-1">
                        {enhancedResult.resourcesNeeded.map((resource, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {resource}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}