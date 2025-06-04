import { useState } from "react";

function SimpleApp() {
  const [currentPage, setCurrentPage] = useState("home");

  const renderPage = () => {
    switch (currentPage) {
      case "ai-demo":
        return <AIDemo />;
      case "test":
        return <TestPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div>
      {renderPage()}
    </div>
  );
}

function HomePage() {
  return (
    <div style={{ padding: "20px", fontFamily: "system-ui" }}>
      <h1>Mira - AI-Powered Memory App</h1>
      <p>Enhanced AI taxonomy system with intelligent pattern recognition</p>
      
      <div style={{ marginTop: "20px" }}>
        <h2>AI Features Implemented:</h2>
        <ul>
          <li>✓ Pattern recognition for 9 input categories</li>
          <li>✓ Micro-questions for high-frequency scenarios</li>
          <li>✓ Complexity scoring (1-10 scale)</li>
          <li>✓ Task hierarchy for complex projects</li>
          <li>✓ Predictive intelligence with success factors</li>
        </ul>
      </div>

      <div style={{ marginTop: "20px" }}>
        <a href="/ai-demo" style={{ 
          padding: "10px 20px", 
          backgroundColor: "#007AFF", 
          color: "white", 
          textDecoration: "none", 
          borderRadius: "6px",
          marginRight: "10px"
        }}>
          Test AI Demo
        </a>
        <a href="/test" style={{ 
          padding: "10px 20px", 
          backgroundColor: "#28a745", 
          color: "white", 
          textDecoration: "none", 
          borderRadius: "6px" 
        }}>
          Test Page
        </a>
      </div>
    </div>
  );
}

function AIDemo() {
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
            </div>
          ) : (
            <p style={{ margin: "0", color: "#666" }}>{result.message}</p>
          )}
        </div>
      )}
    </div>
  );
}

function TestPage() {
  return (
    <div style={{ padding: "20px", fontFamily: "system-ui" }}>
      <a href="/" style={{ color: "#007AFF", textDecoration: "none" }}>← Back</a>
      <h1>Test Page</h1>
      <p>Application is working correctly.</p>
    </div>
  );
}

export default SimpleApp;