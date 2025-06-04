export default function TestPage() {
  return (
    <div style={{ padding: "20px", fontFamily: "system-ui" }}>
      <h1>Application Test</h1>
      <p>If you can see this page, the basic React application is working.</p>
      
      <div style={{ marginTop: "20px" }}>
        <h2>Enhanced AI Features Implemented:</h2>
        <ul>
          <li>✓ AI taxonomy engine with pattern recognition</li>
          <li>✓ Micro-questions for 9 input categories</li>
          <li>✓ Complexity scoring system (1-10 scale)</li>
          <li>✓ Task hierarchy breakdown for complex projects</li>
          <li>✓ Predictive intelligence with success factors</li>
        </ul>
      </div>

      <div style={{ marginTop: "20px" }}>
        <h2>Navigation:</h2>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <a href="/" style={{ 
            padding: "8px 16px", 
            backgroundColor: "#007AFF", 
            color: "white", 
            textDecoration: "none", 
            borderRadius: "6px" 
          }}>
            Main App
          </a>
          <a href="/ai-demo" style={{ 
            padding: "8px 16px", 
            backgroundColor: "#28a745", 
            color: "white", 
            textDecoration: "none", 
            borderRadius: "6px" 
          }}>
            AI Demo
          </a>
        </div>
      </div>
    </div>
  );
}