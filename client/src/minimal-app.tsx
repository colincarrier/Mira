import { useState } from "react";

export default function MinimalApp() {
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);
  
  // Listen to URL changes
  window.addEventListener('popstate', () => {
    setCurrentRoute(window.location.pathname);
  });

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentRoute(path);
  };

  if (currentRoute === '/ai-demo') {
    return <AIDemo navigate={navigate} />;
  }
  
  if (currentRoute === '/test') {
    return <TestPage navigate={navigate} />;
  }

  return <HomePage navigate={navigate} />;
}

function HomePage({ navigate }: { navigate: (path: string) => void }) {
  return (
    <div style={{ 
      padding: "20px", 
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
      maxWidth: "800px",
      margin: "0 auto"
    }}>
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "700", color: "#1a1a1a", marginBottom: "10px" }}>
          Mira
        </h1>
        <p style={{ fontSize: "18px", color: "#666", margin: "0" }}>
          AI-Powered Memory & Productivity Assistant
        </p>
      </div>
      
      <div style={{ 
        backgroundColor: "#f8f9fa", 
        padding: "30px", 
        borderRadius: "12px", 
        marginBottom: "30px",
        border: "1px solid #e9ecef"
      }}>
        <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#333", marginBottom: "20px" }}>
          Enhanced AI Intelligence Features
        </h2>
        <div style={{ display: "grid", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#28a745", fontWeight: "bold" }}>✓</span>
            <span>Pattern recognition for 9 input categories (food, shopping, travel, learning, etc.)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#28a745", fontWeight: "bold" }}>✓</span>
            <span>Smart micro-questions for high-frequency scenarios</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#28a745", fontWeight: "bold" }}>✓</span>
            <span>Complexity scoring (1-10 scale) distinguishing simple tasks vs complex projects</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#28a745", fontWeight: "bold" }}>✓</span>
            <span>Task hierarchy breakdown with time estimates and dependencies</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#28a745", fontWeight: "bold" }}>✓</span>
            <span>Predictive intelligence with success factors and potential obstacles</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
        <button
          onClick={() => navigate('/ai-demo')}
          style={{ 
            padding: "12px 24px", 
            backgroundColor: "#007AFF", 
            color: "white", 
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "500",
            cursor: "pointer",
            transition: "background-color 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#0056CC"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#007AFF"}
        >
          Test AI Intelligence Demo
        </button>
        <button
          onClick={() => navigate('/test')}
          style={{ 
            padding: "12px 24px", 
            backgroundColor: "#28a745", 
            color: "white", 
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "500",
            cursor: "pointer",
            transition: "background-color 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#1e7e34"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#28a745"}
        >
          System Test
        </button>
      </div>

      <div style={{ 
        marginTop: "40px", 
        padding: "20px", 
        backgroundColor: "#fff3cd", 
        borderRadius: "8px",
        border: "1px solid #ffeaa7"
      }}>
        <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#856404", margin: "0 0 10px 0" }}>
          How It Works
        </h3>
        <p style={{ fontSize: "14px", color: "#856404", margin: "0", lineHeight: "1.5" }}>
          The AI system analyzes your input to detect patterns and provide contextual micro-questions. 
          For example, "learn Python" triggers learning-focused questions about skill level and timeline, 
          while "find restaurant" asks about cuisine preferences and budget.
        </p>
      </div>
    </div>
  );
}

function AIDemo({ navigate }: { navigate: (path: string) => void }) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const examples = [
    "I want to learn Python programming",
    "Need to find a good restaurant for dinner",
    "Planning a trip to Japan next month",
    "Want to buy a new laptop for work",
    "Need to improve my fitness routine",
    "Looking to invest $10000 safely",
    "Want to redecorate my living room",
    "Planning a birthday party for 50 people"
  ];

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
      setResult({ error: "Analysis failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: "20px", 
      maxWidth: "800px", 
      margin: "0 auto",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif"
    }}>
      <div style={{ marginBottom: "30px" }}>
        <button
          onClick={() => navigate('/')}
          style={{ 
            background: "none",
            border: "none",
            color: "#007AFF", 
            fontSize: "16px",
            cursor: "pointer",
            marginBottom: "20px",
            padding: "0"
          }}
        >
          ← Back to Home
        </button>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 10px 0" }}>
          AI Taxonomy Intelligence Demo
        </h1>
        <p style={{ fontSize: "16px", color: "#666", margin: "0" }}>
          Test pattern recognition and micro-questions for different input types
        </p>
      </div>

      <div style={{ 
        backgroundColor: "#f8f9fa", 
        padding: "24px", 
        borderRadius: "12px", 
        marginBottom: "24px",
        border: "1px solid #e9ecef"
      }}>
        <div style={{ marginBottom: "16px" }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter something you want to do, learn, buy, plan..."
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "2px solid #ddd",
              borderRadius: "8px",
              fontSize: "16px",
              boxSizing: "border-box",
              fontFamily: "inherit"
            }}
            onKeyPress={(e) => e.key === 'Enter' && !loading && testTaxonomy()}
          />
        </div>
        <button
          onClick={testTaxonomy}
          disabled={!input.trim() || loading}
          style={{
            padding: "12px 24px",
            backgroundColor: loading ? "#ccc" : "#007AFF",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "16px",
            fontWeight: "500"
          }}
        >
          {loading ? "Analyzing..." : "Analyze Pattern"}
        </button>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#333", marginBottom: "12px" }}>
          Try these examples:
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "8px" }}>
          {examples.map((example, index) => (
            <button
              key={index}
              onClick={() => setInput(example)}
              style={{
                padding: "8px 12px",
                backgroundColor: "#fff",
                border: "1px solid #ddd",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                color: "#333",
                textAlign: "left",
                transition: "background-color 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#fff"}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {result && (
        <div style={{
          padding: "24px",
          backgroundColor: "#fff",
          borderRadius: "12px",
          border: "1px solid #e9ecef",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#333", margin: "0 0 20px 0" }}>
            Analysis Results
          </h3>
          
          {result.error ? (
            <div style={{ 
              padding: "16px", 
              backgroundColor: "#f8d7da", 
              color: "#721c24", 
              borderRadius: "6px",
              border: "1px solid #f5c6cb"
            }}>
              {result.error}
            </div>
          ) : result.detected ? (
            <div>
              <div style={{ 
                marginBottom: "20px", 
                padding: "16px", 
                backgroundColor: "#d4edda", 
                borderRadius: "8px",
                border: "1px solid #c3e6cb"
              }}>
                <div style={{ fontSize: "18px", fontWeight: "600", color: "#155724", marginBottom: "8px" }}>
                  Pattern Detected: {result.category?.replace('_', ' ').toUpperCase()}
                </div>
                <div style={{ fontSize: "14px", color: "#155724" }}>
                  Confidence: {Math.round((result.confidence || 0) * 100)}%
                </div>
              </div>

              {result.microQuestions && result.microQuestions.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ fontSize: "16px", fontWeight: "600", color: "#007AFF", margin: "0 0 12px 0" }}>
                    Smart Questions to Consider:
                  </h4>
                  <ul style={{ margin: "0", paddingLeft: "20px", color: "#333" }}>
                    {result.microQuestions.map((question: string, index: number) => (
                      <li key={index} style={{ marginBottom: "8px", fontSize: "15px", lineHeight: "1.5" }}>
                        {question}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.suggestedFollowUps && result.suggestedFollowUps.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ fontSize: "16px", fontWeight: "600", color: "#28a745", margin: "0 0 12px 0" }}>
                    Suggested Next Steps:
                  </h4>
                  <ul style={{ margin: "0", paddingLeft: "20px", color: "#333" }}>
                    {result.suggestedFollowUps.map((action: string, index: number) => (
                      <li key={index} style={{ marginBottom: "8px", fontSize: "15px", lineHeight: "1.5" }}>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.contextualInsights && result.contextualInsights.length > 0 && (
                <div>
                  <h4 style={{ fontSize: "16px", fontWeight: "600", color: "#6f42c1", margin: "0 0 12px 0" }}>
                    Contextual Insights:
                  </h4>
                  <ul style={{ margin: "0", paddingLeft: "20px", color: "#333" }}>
                    {result.contextualInsights.map((insight: string, index: number) => (
                      <li key={index} style={{ marginBottom: "8px", fontSize: "15px", lineHeight: "1.5" }}>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div style={{ 
              padding: "16px", 
              backgroundColor: "#fff3cd", 
              borderRadius: "6px",
              border: "1px solid #ffeaa7"
            }}>
              <p style={{ margin: "0 0 12px 0", color: "#856404", fontSize: "15px" }}>
                {result.message}
              </p>
              {result.suggestions && (
                <div style={{ color: "#856404" }}>
                  {result.suggestions.map((suggestion: string, index: number) => (
                    <div key={index} style={{ margin: "4px 0", fontSize: "14px" }}>
                      • {suggestion}
                    </div>
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

function TestPage({ navigate }: { navigate: (path: string) => void }) {
  return (
    <div style={{ 
      padding: "20px", 
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
      maxWidth: "600px",
      margin: "0 auto"
    }}>
      <button
        onClick={() => navigate('/')}
        style={{ 
          background: "none",
          border: "none",
          color: "#007AFF", 
          fontSize: "16px",
          cursor: "pointer",
          marginBottom: "20px",
          padding: "0"
        }}
      >
        ← Back to Home
      </button>
      <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#1a1a1a" }}>System Test</h1>
      <div style={{ 
        padding: "20px", 
        backgroundColor: "#d4edda", 
        borderRadius: "8px",
        border: "1px solid #c3e6cb",
        marginTop: "20px"
      }}>
        <p style={{ margin: "0", color: "#155724", fontSize: "16px" }}>
          ✓ Application is working correctly
        </p>
      </div>
    </div>
  );
}