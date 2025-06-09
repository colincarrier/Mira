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
      // Handle text analysis using enhanced Mira Brain prompt
      const prompt = `Analyze this content and provide structured analysis: ${content}`;
      
      console.log("OpenAI analysis with enhanced Mira Brain prompt");
      
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

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000
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
      enhancedContent: result.enhancedContent || content,
      suggestion: cleanSuggestion,
      context: result.context || "General content analysis.",
      complexityScore: result.complexityScore || 5,
      intentType: result.intentType || 'simple-task',
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
    const imageAnalysisPrompt = `Analyze this image with precision. You are an expert visual identification system that can identify multiple items in a single image.

CRITICAL INSTRUCTIONS:
1. IDENTIFY EVERY DISTINCT ITEM: Look for books, products, people, places, menu items, etc. If there are multiple items, identify each one specifically.
2. READ ALL TEXT: Use OCR to extract titles, author names, brand names, prices, labels - everything visible.
3. BE SPECIFIC: Don't say "Book 1, Book 2" - give actual titles like "The Design of Everyday Things by Don Norman"
4. EXTRACT DETAILS: For each item, get: exact title/name, author/brand, publisher, price if visible, ISBN if visible

For BOOKS specifically:
- Read the title exactly as shown on the cover
- Identify the author name
- Note the publisher if visible
- Describe the cover design/theme

For PRODUCTS:
- Exact product name and model
- Brand name
- Price if visible
- Key features visible

User context: ${content}

If the user asks to "add to collection" or mentions collections, set collectionSuggestion based on the item type:
- Books → "Books" collection
- Design items → "Design & Coffee Table Books" collection  
- Products → relevant category collection

For multiple items, create individual extractedItems for each one:

Return JSON with this exact structure:
{
  "enhancedContent": "List of specific items identified (e.g., '1. The Design of Everyday Things 2. Don Norman's Book 3. Another Title')",
  "suggestion": "Actionable next steps based on user request",
  "context": "Category and context of items",
  "complexityScore": 7,
  "intentType": "research-inquiry",
  "urgencyLevel": "medium",
  "todos": ["Research each item individually", "Find purchase links", "Add to appropriate collection"],
  "extractedItems": [
    {
      "title": "Exact title of item 1",
      "description": "Author, publisher, or brand details",
      "category": "book/product/etc",
      "metadata": {"author": "...", "publisher": "...", "isbn": "...", "price": "..."}
    }
  ],
  "collectionSuggestion": {
    "name": "Appropriate Collection Name",
    "icon": "📚",
    "color": "#8B4513"
  },
  "richContext": {
    "recommendedActions": [
      {
        "title": "Find Purchase Links",
        "description": "Search for where to buy each item",
        "links": [{"title": "Amazon", "url": "https://amazon.com"}, {"title": "Barnes & Noble", "url": "https://barnesandnoble.com"}]
      }
    ],
    "researchResults": [
      {
        "title": "Item Details",
        "description": "Specifications and availability",
        "keyPoints": ["Individual item analysis", "Pricing information", "Purchase recommendations"]
      }
    ],
    "quickInsights": ["Each item identified with specific details"]
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
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 4000
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      enhancedContent: result.enhancedContent || result.suggestion || null,
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