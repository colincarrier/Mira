import type { Express } from "express";
import { analyzeTaxonomy } from "./ai-taxonomy-engine";

export function registerDemoRoutes(app: Express) {
  // Serve the main app as static HTML to bypass frontend issues
  app.get('/', (req, res) => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mira - AI-Powered Memory App</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f9fa; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { font-size: 32px; color: #1a1a1a; margin-bottom: 10px; }
        .header p { font-size: 18px; color: #666; }
        .section { background: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .section h2 { font-size: 20px; margin-bottom: 20px; color: #333; }
        .feature { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .check { color: #28a745; font-weight: bold; }
        .input-group { margin-bottom: 20px; }
        .input-group input { width: 100%; padding: 12px 16px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px; margin-bottom: 12px; }
        .btn { padding: 12px 24px; background: #007AFF; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; text-decoration: none; display: inline-block; }
        .btn:hover { background: #0056CC; }
        .btn.green { background: #28a745; }
        .btn.green:hover { background: #1e7e34; }
        .example-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 8px; margin-top: 12px; }
        .example-btn { padding: 8px 12px; background: white; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; font-size: 14px; text-align: left; }
        .example-btn:hover { background: #f5f5f5; }
        .result { margin-top: 20px; padding: 24px; background: #f8f9fa; border-radius: 12px; border: 1px solid #e9ecef; }
        .pattern-detected { padding: 16px; background: #d4edda; border-radius: 8px; border: 1px solid #c3e6cb; margin-bottom: 20px; }
        .pattern-detected .title { font-size: 18px; font-weight: 600; color: #155724; margin-bottom: 8px; }
        .nav-links { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 20px; }
        .status { padding: 12px; background: #d1ecf1; border-radius: 6px; margin-bottom: 20px; color: #0c5460; }
        .hidden { display: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Mira</h1>
            <p>AI-Powered Memory and Productivity App</p>
        </div>
        
        <div class="section">
            <div class="status">
                Application now running with enhanced AI intelligence and pattern recognition
            </div>
            
            <h2>Enhanced AI Features</h2>
            <div class="feature"><span class="check">✓</span> Pattern recognition for 9 input categories</div>
            <div class="feature"><span class="check">✓</span> Smart micro-questions for high-frequency scenarios</div>
            <div class="feature"><span class="check">✓</span> Complexity scoring (1-10 scale)</div>
            <div class="feature"><span class="check">✓</span> Task hierarchy breakdown with time estimates</div>
            <div class="feature"><span class="check">✓</span> Predictive intelligence with success factors</div>
        </div>
        
        <div class="section">
            <h2>Test AI Intelligence</h2>
            <div class="input-group">
                <input type="text" id="inputText" placeholder="Enter something you want to do, learn, buy, plan..." />
                <button class="btn" onclick="analyzeInput()">Analyze Pattern</button>
            </div>
            
            <h3>Quick Examples:</h3>
            <div class="example-grid">
                <button class="example-btn" onclick="setInput('I want to learn Python programming')">Learn Python programming</button>
                <button class="example-btn" onclick="setInput('Need to find a good restaurant for dinner')">Find restaurant for dinner</button>
                <button class="example-btn" onclick="setInput('Planning a trip to Japan next month')">Plan trip to Japan</button>
                <button class="example-btn" onclick="setInput('Want to buy a new laptop for work')">Buy laptop for work</button>
                <button class="example-btn" onclick="setInput('Need to improve my fitness routine')">Improve fitness routine</button>
                <button class="example-btn" onclick="setInput('Looking to invest $10000 safely')">Invest money safely</button>
            </div>
            
            <div id="result" class="result hidden">
                <div id="resultContent"></div>
            </div>
        </div>
        
        <div class="section">
            <h2>Navigation</h2>
            <div class="nav-links">
                <a href="/demo" class="btn">Full AI Demo</a>
                <a href="/api/stats/api-usage" class="btn green">API Stats</a>
            </div>
        </div>
    </div>
    
    <script>
        function setInput(text) {
            document.getElementById('inputText').value = text;
        }
        
        async function analyzeInput() {
            const input = document.getElementById('inputText').value.trim();
            const result = document.getElementById('result');
            const resultContent = document.getElementById('resultContent');
            
            if (!input) return;
            
            resultContent.innerHTML = '<p>Analyzing pattern...</p>';
            result.classList.remove('hidden');
            
            try {
                const response = await fetch('/api/analyze-taxonomy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: input })
                });
                
                const data = await response.json();
                
                if (data.detected) {
                    let html = '<div class="pattern-detected">';
                    html += '<div class="title">Pattern: ' + data.category.replace('_', ' ').toUpperCase() + '</div>';
                    html += '<div>Confidence: ' + Math.round(data.confidence * 100) + '%</div>';
                    html += '</div>';
                    
                    if (data.microQuestions && data.microQuestions.length > 0) {
                        html += '<h4>Smart Questions:</h4><ul>';
                        data.microQuestions.forEach(q => html += '<li>' + q + '</li>');
                        html += '</ul>';
                    }
                    
                    if (data.suggestedFollowUps && data.suggestedFollowUps.length > 0) {
                        html += '<h4>Next Steps:</h4><ul>';
                        data.suggestedFollowUps.forEach(s => html += '<li>' + s + '</li>');
                        html += '</ul>';
                    }
                    
                    resultContent.innerHTML = html;
                } else {
                    resultContent.innerHTML = '<p>' + (data.message || 'No specific patterns detected') + '</p>';
                }
            } catch (error) {
                resultContent.innerHTML = '<p style="color: red;">Analysis failed. Please try again.</p>';
            }
        }
        
        document.getElementById('inputText').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') analyzeInput();
        });
    </script>
</body>
</html>`;
    
    res.send(html);
  });

  // Serve a simple HTML demo page
  app.get('/demo', (req, res) => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mira AI Taxonomy Demo</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f9fa; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { font-size: 32px; color: #1a1a1a; margin-bottom: 10px; }
        .header p { font-size: 18px; color: #666; }
        .features { background: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .features h2 { font-size: 20px; margin-bottom: 20px; color: #333; }
        .feature { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .check { color: #28a745; font-weight: bold; }
        .demo-section { background: white; padding: 30px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .input-group { margin-bottom: 20px; }
        .input-group input { width: 100%; padding: 12px 16px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px; }
        .input-group button { padding: 12px 24px; background: #007AFF; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; }
        .input-group button:hover { background: #0056CC; }
        .input-group button:disabled { background: #ccc; cursor: not-allowed; }
        .examples { margin-bottom: 20px; }
        .examples h3 { font-size: 16px; margin-bottom: 12px; color: #333; }
        .example-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 8px; }
        .example-btn { padding: 8px 12px; background: white; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; font-size: 14px; text-align: left; }
        .example-btn:hover { background: #f5f5f5; }
        .result { margin-top: 20px; padding: 24px; background: #f8f9fa; border-radius: 12px; border: 1px solid #e9ecef; }
        .result h3 { margin-bottom: 20px; color: #333; }
        .pattern-detected { padding: 16px; background: #d4edda; border-radius: 8px; border: 1px solid #c3e6cb; margin-bottom: 20px; }
        .pattern-detected .title { font-size: 18px; font-weight: 600; color: #155724; margin-bottom: 8px; }
        .pattern-detected .confidence { font-size: 14px; color: #155724; }
        .section { margin-bottom: 20px; }
        .section h4 { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
        .section.questions h4 { color: #007AFF; }
        .section.steps h4 { color: #28a745; }
        .section.insights h4 { color: #6f42c1; }
        .section ul { margin: 0; padding-left: 20px; }
        .section li { margin-bottom: 8px; font-size: 15px; line-height: 1.5; }
        .no-pattern { padding: 16px; background: #fff3cd; border-radius: 6px; border: 1px solid #ffeaa7; color: #856404; }
        .error { padding: 16px; background: #f8d7da; color: #721c24; border-radius: 6px; border: 1px solid #f5c6cb; }
        .hidden { display: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Mira AI Taxonomy Demo</h1>
            <p>Enhanced AI Intelligence with Pattern Recognition</p>
        </div>
        
        <div class="features">
            <h2>Implemented AI Features</h2>
            <div class="feature"><span class="check">✓</span> Pattern recognition for 9 input categories</div>
            <div class="feature"><span class="check">✓</span> Smart micro-questions for high-frequency scenarios</div>
            <div class="feature"><span class="check">✓</span> Complexity scoring (1-10 scale) for simple vs complex projects</div>
            <div class="feature"><span class="check">✓</span> Task hierarchy breakdown with time estimates</div>
            <div class="feature"><span class="check">✓</span> Predictive intelligence with success factors</div>
        </div>
        
        <div class="demo-section">
            <h2>Test Pattern Recognition</h2>
            <div class="input-group">
                <input type="text" id="inputText" placeholder="Enter something you want to do, learn, buy, plan..." />
                <button onclick="analyzeInput()" id="analyzeBtn">Analyze Pattern</button>
            </div>
            
            <div class="examples">
                <h3>Try these examples:</h3>
                <div class="example-grid">
                    <button class="example-btn" onclick="setInput('I want to learn Python programming')">I want to learn Python programming</button>
                    <button class="example-btn" onclick="setInput('Need to find a good restaurant for dinner')">Need to find a good restaurant for dinner</button>
                    <button class="example-btn" onclick="setInput('Planning a trip to Japan next month')">Planning a trip to Japan next month</button>
                    <button class="example-btn" onclick="setInput('Want to buy a new laptop for work')">Want to buy a new laptop for work</button>
                    <button class="example-btn" onclick="setInput('Need to improve my fitness routine')">Need to improve my fitness routine</button>
                    <button class="example-btn" onclick="setInput('Looking to invest $10000 safely')">Looking to invest $10000 safely</button>
                    <button class="example-btn" onclick="setInput('Want to redecorate my living room')">Want to redecorate my living room</button>
                    <button class="example-btn" onclick="setInput('Planning a birthday party for 50 people')">Planning a birthday party for 50 people</button>
                </div>
            </div>
            
            <div id="result" class="result hidden">
                <h3>Analysis Results</h3>
                <div id="resultContent"></div>
            </div>
        </div>
    </div>
    
    <script>
        function setInput(text) {
            document.getElementById('inputText').value = text;
        }
        
        async function analyzeInput() {
            const input = document.getElementById('inputText').value.trim();
            const btn = document.getElementById('analyzeBtn');
            const result = document.getElementById('result');
            const resultContent = document.getElementById('resultContent');
            
            if (!input) return;
            
            btn.textContent = 'Analyzing...';
            btn.disabled = true;
            result.classList.add('hidden');
            
            try {
                const response = await fetch('/api/analyze-taxonomy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: input })
                });
                
                const data = await response.json();
                displayResult(data);
                result.classList.remove('hidden');
            } catch (error) {
                resultContent.innerHTML = '<div class="error">Analysis failed. Please try again.</div>';
                result.classList.remove('hidden');
            } finally {
                btn.textContent = 'Analyze Pattern';
                btn.disabled = false;
            }
        }
        
        function displayResult(data) {
            const resultContent = document.getElementById('resultContent');
            
            if (data.error) {
                resultContent.innerHTML = '<div class="error">' + data.error + '</div>';
                return;
            }
            
            if (data.detected) {
                let html = '<div class="pattern-detected">';
                html += '<div class="title">Pattern Detected: ' + data.category.replace('_', ' ').toUpperCase() + '</div>';
                html += '<div class="confidence">Confidence: ' + Math.round(data.confidence * 100) + '%</div>';
                html += '</div>';
                
                if (data.microQuestions && data.microQuestions.length > 0) {
                    html += '<div class="section questions">';
                    html += '<h4>Smart Questions to Consider:</h4>';
                    html += '<ul>';
                    data.microQuestions.forEach(q => {
                        html += '<li>' + q + '</li>';
                    });
                    html += '</ul></div>';
                }
                
                if (data.suggestedFollowUps && data.suggestedFollowUps.length > 0) {
                    html += '<div class="section steps">';
                    html += '<h4>Suggested Next Steps:</h4>';
                    html += '<ul>';
                    data.suggestedFollowUps.forEach(s => {
                        html += '<li>' + s + '</li>';
                    });
                    html += '</ul></div>';
                }
                
                if (data.contextualInsights && data.contextualInsights.length > 0) {
                    html += '<div class="section insights">';
                    html += '<h4>Contextual Insights:</h4>';
                    html += '<ul>';
                    data.contextualInsights.forEach(i => {
                        html += '<li>' + i + '</li>';
                    });
                    html += '</ul></div>';
                }
                
                resultContent.innerHTML = html;
            } else {
                let html = '<div class="no-pattern">';
                html += '<p>' + data.message + '</p>';
                if (data.suggestions) {
                    data.suggestions.forEach(s => {
                        html += '<div>• ' + s + '</div>';
                    });
                }
                html += '</div>';
                resultContent.innerHTML = html;
            }
        }
        
        // Allow Enter key to trigger analysis
        document.getElementById('inputText').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                analyzeInput();
            }
        });
    </script>
</body>
</html>`;
    
    res.send(html);
  });

  // API endpoint for taxonomy analysis (already exists, but ensuring it's working)
  app.post('/api/demo/analyze', async (req, res) => {
    try {
      const { content } = req.body;
      
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: "Content is required" });
      }

      const taxonomyAnalysis = await analyzeTaxonomy(content);
      
      if (!taxonomyAnalysis) {
        return res.json({ 
          detected: false, 
          message: "No specific patterns detected",
          suggestions: ["Try providing more context about your goal", "Be more specific about what you need help with"]
        });
      }

      res.json({
        detected: true,
        category: taxonomyAnalysis.category,
        confidence: taxonomyAnalysis.confidence,
        microQuestions: taxonomyAnalysis.microQuestions,
        suggestedFollowUps: taxonomyAnalysis.suggestedFollowUps,
        contextualInsights: taxonomyAnalysis.contextualInsights
      });
    } catch (error) {
      console.error("Demo taxonomy analysis error:", error);
      res.status(500).json({ error: "Failed to analyze input patterns" });
    }
  });
}