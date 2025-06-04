function CleanApp() {
  return (
    <div style={{ 
      padding: "20px", 
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      maxWidth: "800px",
      margin: "0 auto"
    }}>
      <header style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ fontSize: "32px", color: "#1a1a1a", marginBottom: "10px" }}>
          Mira
        </h1>
        <p style={{ fontSize: "18px", color: "#666" }}>
          AI-Powered Memory and Productivity App
        </p>
      </header>

      <section style={{ 
        background: "white", 
        padding: "30px", 
        borderRadius: "12px", 
        marginBottom: "30px", 
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)" 
      }}>
        <h2 style={{ fontSize: "20px", marginBottom: "20px", color: "#333" }}>
          Enhanced AI Features
        </h2>
        <div style={{ display: "grid", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#28a745", fontWeight: "bold" }}>✓</span>
            <span>Pattern recognition for 9 input categories (food, shopping, travel, learning, health, career, home, entertainment, financial)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#28a745", fontWeight: "bold" }}>✓</span>
            <span>Smart micro-questions for high-frequency scenarios</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#28a745", fontWeight: "bold" }}>✓</span>
            <span>Complexity scoring (1-10 scale) to distinguish simple tasks from complex projects</span>
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
      </section>

      <section style={{ 
        background: "white", 
        padding: "30px", 
        borderRadius: "12px", 
        marginBottom: "30px", 
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)" 
      }}>
        <h2 style={{ fontSize: "20px", marginBottom: "20px", color: "#333" }}>
          Test AI Intelligence
        </h2>
        <p style={{ marginBottom: "20px", color: "#666" }}>
          The AI can intelligently analyze your input and provide contextual micro-questions based on detected patterns.
        </p>
        
        <div style={{ marginBottom: "20px" }}>
          <input 
            type="text" 
            placeholder="Enter something you want to do, learn, buy, plan..."
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "2px solid #ddd",
              borderRadius: "8px",
              fontSize: "16px",
              marginBottom: "12px"
            }}
            id="testInput"
          />
          <button 
            style={{
              padding: "12px 24px",
              background: "#007AFF",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              cursor: "pointer"
            }}
            onClick={() => {
              const input = (document.getElementById('testInput') as HTMLInputElement)?.value;
              if (input) {
                window.location.href = `/demo?test=${encodeURIComponent(input)}`;
              }
            }}
          >
            Test AI Analysis
          </button>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ fontSize: "16px", marginBottom: "12px", color: "#333" }}>
            Quick Examples:
          </h3>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", 
            gap: "8px" 
          }}>
            {[
              "I want to learn Python programming",
              "Need to find a good restaurant for dinner",
              "Planning a trip to Japan next month",
              "Want to buy a new laptop for work",
              "Need to improve my fitness routine",
              "Looking to invest $10000 safely",
              "Want to redecorate my living room",
              "Planning a birthday party for 50 people"
            ].map((example, index) => (
              <button
                key={index}
                style={{
                  padding: "8px 12px",
                  background: "white",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  textAlign: "left"
                }}
                onClick={() => {
                  window.location.href = `/demo?test=${encodeURIComponent(example)}`;
                }}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section style={{ 
        background: "white", 
        padding: "30px", 
        borderRadius: "12px", 
        marginBottom: "30px", 
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)" 
      }}>
        <h2 style={{ fontSize: "20px", marginBottom: "20px", color: "#333" }}>
          Navigation
        </h2>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <a 
            href="/demo" 
            style={{
              padding: "10px 20px",
              background: "#007AFF",
              color: "white",
              textDecoration: "none",
              borderRadius: "6px"
            }}
          >
            AI Demo Page
          </a>
          <a 
            href="/api/stats/api-usage" 
            style={{
              padding: "10px 20px",
              background: "#28a745",
              color: "white",
              textDecoration: "none",
              borderRadius: "6px"
            }}
          >
            API Usage Stats
          </a>
        </div>
      </section>

      <footer style={{ textAlign: "center", color: "#666", fontSize: "14px" }}>
        <p>Mira - Enhanced with AI taxonomy engine and intelligent pattern recognition</p>
      </footer>
    </div>
  );
}

export default CleanApp;