// ⚠️  CRITICAL: AI PROMPT PROTECTION - DO NOT MODIFY WITHOUT APPROVAL ⚠️
// This file contains OpenAI integration and core prompts.
// See AI_MODIFICATION_RULES.md for modification protocol.

import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

export interface AIAnalysisResult {
  enhancedContent?: string;
  suggestion?: string;
  context?: string;
  
  // Complexity Analysis
  complexityScore: number; // 1-10 scale
  intentType: 'simple-task' | 'complex-project' | 'research-inquiry' | 'personal-reflection' | 'reference-material';
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  
  // Enhanced Task Structure
  todos: string[];
  taskHierarchy?: {
    phase: string;
    description: string;
    tasks: string[];
    estimatedTime: string;
    dependencies?: string[];
  }[];
  
  collectionSuggestion?: {
    name: string;
    icon: string;
    color: string;
  };
  
  // Intelligence Context
  richContext?: {
    recommendedActions: {
      title: string;
      description: string;
      links?: { title: string; url: string }[];
    }[];
    researchResults: {
      title: string;
      description: string;
      rating?: string;
      keyPoints: string[];
      contact?: string;
    }[];
    quickInsights: string[];
  };
  
  // Predictive Intelligence
  nextSteps?: string[];
  timeToComplete?: string;
  successFactors?: string[];
  potentialObstacles?: string[];
  
  // Knowledge Connections
  relatedTopics?: string[];
  skillsRequired?: string[];
  resourcesNeeded?: string[];
  
  // Individual Item Extraction
  extractedItems?: {
    title: string;
    description?: string;
    category: string;
    metadata?: Record<string, any>;
  }[];
}

export async function analyzeWithOpenAI(content: string, mode: string): Promise<AIAnalysisResult> {
  try {
    const isImageContent = content.startsWith('data:image/') && content.includes('base64,');
    
    let messages: any[];
    
    if (isImageContent && mode === 'image') {
      // Handle image analysis with enhanced prompt
      const imagePrompt = 'Analyze this image and provide comprehensive insights.';

      messages = [
        {
          role: "system",
          content: "You are Mira, an intelligent analysis system. Always respond with valid JSON following the exact structure provided in the prompt."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: imagePrompt
            },
            {
              type: "image_url",
              image_url: {
                url: content
              }
            }
          ]
        }
      ];
    } else {
      // Handle text analysis - use the content as-is if it's already a structured prompt
      console.log("OpenAI analysis with enhanced Mira Brain prompt");
      
      if (content.includes("SYSTEM:") && content.includes("REQUIRED_JSON_OUTPUT:")) {
        // This is a structured prompt from the orthogonal AI system - extract the core query and enhance it
        const queryMatch = content.match(/USER_QUERY: "([^"]+)"/);
        const userQuery = queryMatch ? queryMatch[1] : content;
        
        // Create comprehensive product analysis prompt
        messages = [
          {
            role: "system",
            content: "You are an expert product research assistant. Generate comprehensive, detailed product analysis with specific models, exact pricing, expert reviews, and organized comparisons. Match ChatGPT's depth and quality. Always respond with valid JSON only."
          },
          {
            role: "user", 
            content: `Research and analyze: "${userQuery}"

Create a comprehensive product guide with MARKDOWN FORMATTING and CLICKABLE LINKS:

FORMAT REQUIREMENTS:
- Use **bold** for product names and prices
- Use [Link Text](URL) format for all external links
- Include [Amazon](https://amazon.com/s?k=product+name) links for each product
- Include [TechRadar](https://techradar.com) and [WIRED](https://wired.com) expert review links
- Use markdown tables with | separators
- Use ### for section headers

CONTENT STRUCTURE:
1. PREMIUM OPTIONS (🏆): 2-3 top-tier models with [Amazon](URL) links
2. VALUE OPTIONS (💼): 2-3 mid-range models with shopping links
3. BUDGET OPTIONS (💰): 2-3 affordable models with purchase links
4. COMPARISON TABLE: | Model | Price | Features | [Amazon](URL) |
5. USE CASE RECOMMENDATIONS with expert review links

EXAMPLE FORMAT:
### 🏆 Premium Options
1. **Sony WH-1000XM5**
   - **Price**: $399
   - **Link**: [Amazon](https://amazon.com/s?k=Sony+WH-1000XM5)
   - **Expert Review**: [TechRadar](https://techradar.com) rates 4.8/5

Respond with JSON:
{
  "title": "Product category (3-5 words)",
  "summary": "Generate comprehensive ChatGPT-style markdown content with proper formatting: Use **bold** for product names, ### headings for sections, bullet points with - for lists, | tables | with | separators |, and [clickable links](URLs). Include comparison tables, expert review links, and detailed analysis (400+ words).",
  "intent": "product-query",
  "complexity": 8,
  "todos": [
    {"title": "Research specific models mentioned", "priority": "medium"},
    {"title": "Compare prices across retailers", "priority": "medium"},
    {"title": "Check expert reviews", "priority": "medium"}
  ],
  "smartActions": [
    {"label": "Amazon Search", "action": "openLink", "url": "https://amazon.com/s?k=${userQuery.replace(/\s/g, '+')}"},
    {"label": "Review Comparison", "action": "openLink", "url": "https://www.google.com/search?q=${userQuery.replace(/\s/g, '+')}+reviews+2025"},
    {"label": "Price Check", "action": "openLink", "url": "https://www.google.com/search?q=${userQuery.replace(/\s/g, '+')}+price+comparison"}
  ],
  "assistantAddendum": "I've provided comprehensive product analysis with clickable Amazon links and expert review sources for easy shopping and research."
}`
          }
        ];
      } else {
        // Legacy general analysis
        const prompt = `Analyze this content and provide structured analysis: ${content}`;
        messages = [
          {
            role: "system",
            content: "You are Mira, an intelligent analysis system. Always respond with valid JSON following the exact structure provided in the prompt."
          },
          {
            role: "user",
            content: prompt
          }
        ];
      }
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 8000  // Increased for comprehensive product analysis
    });

    console.log("OpenAI raw response:", (response.choices[0].message.content || '').substring(0, 200) + "...");

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    console.log("OpenAI analysis completed successfully");
    
    // Clean up suggestion to avoid returning prompt text
    let cleanSuggestion = result.suggestion || "";
    if (cleanSuggestion.includes("You are Mira") || cleanSuggestion.length > 200) {
      cleanSuggestion = "";
    }

    // Return complete AIAnalysisResult structure
    return {
      enhancedContent: result.title || result.enhancedContent || content,
      suggestion: cleanSuggestion,
      context: result.summary || result.context || "Note processed successfully.",
      complexityScore: result.complexityScore || result.complexity || 5,
      intentType: result.intentType || result.intent || 'simple-task',
      urgencyLevel: result.urgencyLevel || 'medium',
      todos: Array.isArray(result.todos) ? result.todos : [],
      taskHierarchy: result.taskHierarchy,
      collectionSuggestion: result.collectionSuggestion,
      richContext: result.richContext,
      nextSteps: result.nextSteps,
      timeToComplete: result.timeToComplete,
      successFactors: result.successFactors,
      potentialObstacles: result.potentialObstacles,
      relatedTopics: result.relatedTopics,
      skillsRequired: result.skillsRequired,
      resourcesNeeded: result.resourcesNeeded
    };
  } catch (error) {
    console.error("OpenAI analysis error:", error);
    throw new Error(`OpenAI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function analyzeImageContent(imageBase64: string, content: string): Promise<AIAnalysisResult> {
  try {
    // Import company intelligence for enhanced analysis
    const { getCompanyIntelligence, enhanceWithCompanyIntelligence } = await import('./company-intelligence');
    
    const imageAnalysisPrompt = `You are an expert visual analyst with comprehensive knowledge across technology, business, culture, and current events. Provide the same level of detailed analysis and contextual intelligence as ChatGPT's best responses.

MISSION: Deliver exhaustive analysis combining visual recognition with deep domain knowledge.

🎯 ENHANCED ANALYSIS PROTOCOL:
1. PRECISE TEXT EXTRACTION: Read all visible text word-for-word, including subtle details, fonts, styling, foreign languages
2. ENTITY RECOGNITION WITH INTELLIGENCE: Identify brands, companies, products with comprehensive background research
3. BUSINESS INTELLIGENCE: For any company/brand mentioned, provide detailed profiles including:
   - Core business model and primary products/services
   - Industry position, competitive landscape, market cap/valuation
   - Founding story, key executives, notable investors
   - Recent developments, product launches, strategic direction
   - Cultural significance, brand positioning, target demographics
   - Technical architecture or unique differentiators
4. CONTEXTUAL RESEARCH: Connect visual elements to broader trends, cultural movements, or industry insights
5. COMPREHENSIVE SCENE ANALYSIS: Environmental details, composition, artistic choices, implied narratives

📚 FOR BOOKS & PUBLICATIONS:
- Exact title (word-for-word from spine/cover)
- Complete author name(s)  
- Publisher name if visible
- Edition/year if shown
- ISBN if readable
- Book condition and format (hardcover/paperback)
- Cover art description and color scheme
- Genre indicators from cover design

🛍️ FOR PRODUCTS & ITEMS:
- Precise product name and model number
- Brand/manufacturer 
- Visible specifications or features
- Price tags or labels
- Condition assessment
- Color, size, material descriptions
- Packaging details if applicable

💡 CONTEXTUAL INTELLIGENCE:
- Assess the setting (home office, bookstore, library, etc.)
- Understand user intent from context: "${content}"
- Identify organizational patterns
- Suggest logical categorization
- Recommend actionable next steps

🎯 ENHANCED EXTRACTION:
For each distinct item, provide:
- Exact identification (not generic descriptions)
- Purchasing information (where typically sold)
- Related items or accessories
- Estimated value range if recognizable
- Condition and usability assessment

Provide the same depth and intelligence as ChatGPT's most comprehensive image analysis responses.

SPECIAL FOCUS: If any company names, brands, or business entities are visible, provide extensive business intelligence including:
- Complete company profile with founding details, key personnel, funding history
- Business model, primary products/services, target market, competitive position
- Recent developments, strategic direction, cultural significance
- Technical architecture, unique differentiators, industry impact

USER QUERY CONTEXT: "${content}"

Return comprehensive JSON with this exact structure:
{
  "enhancedContent": "Exhaustive analysis combining visual details with deep business intelligence. For companies mentioned, include comprehensive profiles with founding details, business model, key personnel, recent developments, and industry position.",
  "suggestion": "Specific actionable recommendations based on identified entities and deep contextual understanding",
  "context": "Rich environmental analysis plus comprehensive business context for any companies/brands identified",
  "complexityScore": 9,
  "intentType": "research-inquiry", 
  "urgencyLevel": "medium",
  "todos": ["Deep research tasks for identified companies", "Specific investigation actions", "Business intelligence gathering steps"],
  "extractedItems": [
    {
      "title": "Complete exact title as shown",
      "description": "Detailed description including author, condition, distinguishing features",
      "category": "book|product|document|electronics|artwork|food|clothing|furniture",
      "metadata": {
        "author": "Full author name if book",
        "publisher": "Publisher name if visible", 
        "isbn": "ISBN if readable",
        "brand": "Brand name for products",
        "model": "Model number if visible",
        "price": "Price if shown",
        "condition": "New/Used/Fair assessment",
        "location": "Where in image (left shelf, center table, etc)",
        "estimatedValue": "Price range estimate",
        "purchaseLocations": ["Common places to buy this item"]
      }
    }
  ],
  "collectionSuggestion": {
    "name": "Specific collection name based on item types",
    "icon": "Appropriate emoji",
    "color": "Hex color code"
  },
  "richContext": {
    "environmentalContext": "Detailed description of setting, lighting, organization",
    "itemRelationships": "How items relate to each other",
    "organizationalInsights": "Patterns in arrangement or categorization",
    "recommendedActions": [
      {
        "title": "Specific action title",
        "description": "Detailed explanation of recommended action",
        "priority": "high|medium|low",
        "estimatedTime": "Time estimate",
        "links": [{"title": "Resource name", "url": "Relevant URL"}]
      }
    ],
    "researchResults": [
      {
        "title": "Item or topic research",
        "description": "Detailed information about items",
        "rating": "Assessment or rating",
        "keyPoints": ["Specific insights", "Technical details", "Recommendations"],
        "contact": "Relevant contact info if applicable"
      }
    ],
    "quickInsights": ["Detailed observations", "Key findings", "Actionable takeaways"]
  }
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: imageAnalysisPrompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 4000,
      temperature: 0.1
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Extract company names and enhance with intelligence
    const companyNames: string[] = [];
    const text = (result.enhancedContent || content || '').toLowerCase();
    
    // Look for Pinata Farms specifically and other companies
    if (text.includes('pinata') || text.includes('piñata')) {
      companyNames.push('pinata farms');
    }
    
    // Enhance content with comprehensive company intelligence
    let enhancedContent = result.enhancedContent || result.suggestion || content;
    
    if (companyNames.length > 0) {
      enhancedContent = enhanceWithCompanyIntelligence(enhancedContent, companyNames);
    }
    
    return {
      enhancedContent,
      suggestion: result.suggestion || null,
      context: result.context || null,
      complexityScore: result.complexityScore || 5,
      intentType: result.intentType || 'reference-material',
      urgencyLevel: result.urgencyLevel || 'low',
      todos: result.todos || [],
      richContext: result.richContext || {
        recommendedActions: [],
        researchResults: [],
        quickInsights: ["Image analysis complete"]
      }
    };
  } catch (error) {
    console.error('Error analyzing image with GPT-4o:', error);
    
    return {
      enhancedContent: "Image Review",
      suggestion: "Visual analysis temporarily unavailable",
      context: "Image processing",
      complexityScore: 5,
      intentType: 'reference-material',
      urgencyLevel: 'low',
      todos: [],
      richContext: {
        recommendedActions: [],
        researchResults: [],
        quickInsights: ["Analysis pending"]
      }
    };
  }
}

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    // Create a temporary file for the audio
    const fs = await import('fs');
    const path = await import('path');
    const tempPath = path.join('/tmp', `audio_${Date.now()}.webm`);
    
    fs.writeFileSync(tempPath, audioBuffer);
    
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempPath),
      model: "whisper-1",
      language: "en"
    });
    
    // Clean up temp file
    fs.unlinkSync(tempPath);
    
    return transcription.text;
  } catch (error) {
    console.error("OpenAI transcription error:", error);
    throw new Error(`Audio transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}