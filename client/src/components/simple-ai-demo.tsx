import { useState } from "react";

export default function SimpleAIDemo() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testTaxonomy = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch("/api/analyze-taxonomy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input.trim() })
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Analysis failed:", error);
      setResult({ error: "Analysis failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "20px" }}>
        <a href="/" style={{ 
          textDecoration: "none", 
          color: "#007AFF", 
          fontSize: "14px",
          display: "inline-block",
          marginBottom: "20px"
        }}>
          ← Back to App
        </a>
        <h1 style={{ margin: "0 0 10px 0", color: "#333" }}>AI Taxonomy Demo</h1>
        <p style={{ color: "#666", margin: "0" }}>
          Test pattern recognition and micro-questions for common input types
        </p>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <div style={{ marginBottom: "10px" }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter something you want to do, learn, buy, plan..."
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              fontSize: "16px",
              boxSizing: "border-box"
            }}
            onKeyPress={(e) => e.key === 'Enter' && testTaxonomy()}
          />
        </div>
        <button
          onClick={testTaxonomy}
          disabled={!input.trim() || loading}
          style={{
            padding: "10px 20px",
            backgroundColor: loading ? "#ccc" : "#007AFF",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "14px"
          }}
        >
          {loading ? "Analyzing..." : "Analyze Pattern"}
        </button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <p style={{ fontSize: "14px", color: "#666", margin: "0 0 10px 0" }}>
          Try these examples:
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {[
            "I want to learn Python programming",
            "Need to find a good restaurant for dinner",
            "Planning a trip to Japan next month",
            "Want to buy a new laptop",
            "Need to improve my fitness routine"
          ].map((example, index) => (
            <button
              key={index}
              onClick={() => setInput(example)}
              style={{
                padding: "6px 12px",
                backgroundColor: "#f5f5f5",
                border: "1px solid #ddd",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
                color: "#333"
              }}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {result && (
        <div style={{
          padding: "20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          border: "1px solid #e9ecef"
        }}>
          <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>Analysis Results</h3>
          
          {result.error ? (
            <p style={{ color: "#dc3545", margin: "0" }}>{result.error}</p>
          ) : result.detected ? (
            <div>
              <div style={{ marginBottom: "15px" }}>
                <strong style={{ color: "#007AFF" }}>
                  Pattern: {result.category?.replace('_', ' ').toUpperCase()}
                </strong>
                <span style={{ marginLeft: "10px", fontSize: "14px", color: "#666" }}>
                  ({Math.round((result.confidence || 0) * 100)}% confidence)
                </span>
              </div>

              {result.microQuestions && result.microQuestions.length > 0 && (
                <div style={{ marginBottom: "15px" }}>
                  <h4 style={{ margin: "0 0 8px 0", color: "#28a745" }}>Smart Questions:</h4>
                  <ul style={{ margin: "0", paddingLeft: "20px" }}>
                    {result.microQuestions.map((question: string, index: number) => (
                      <li key={index} style={{ marginBottom: "4px", fontSize: "14px" }}>
                        {question}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.suggestedFollowUps && result.suggestedFollowUps.length > 0 && (
                <div style={{ marginBottom: "15px" }}>
                  <h4 style={{ margin: "0 0 8px 0", color: "#ffc107" }}>Next Steps:</h4>
                  <ul style={{ margin: "0", paddingLeft: "20px" }}>
                    {result.suggestedFollowUps.map((action: string, index: number) => (
                      <li key={index} style={{ marginBottom: "4px", fontSize: "14px" }}>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.contextualInsights && result.contextualInsights.length > 0 && (
                <div>
                  <h4 style={{ margin: "0 0 8px 0", color: "#6f42c1" }}>Insights:</h4>
                  <ul style={{ margin: "0", paddingLeft: "20px" }}>
                    {result.contextualInsights.map((insight: string, index: number) => (
                      <li key={index} style={{ marginBottom: "4px", fontSize: "14px" }}>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p style={{ margin: "0 0 10px 0", color: "#666" }}>{result.message}</p>
              {result.suggestions && (
                <div>
                  {result.suggestions.map((suggestion: string, index: number) => (
                    <p key={index} style={{ margin: "4px 0", fontSize: "14px", color: "#666" }}>
                      • {suggestion}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}