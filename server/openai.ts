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
    const imageAnalysisPrompt = `You are an expert visual analyst with exceptional OCR and object recognition capabilities. Analyze this image with the same level of detail and accuracy as ChatGPT's best image analysis.

COMPREHENSIVE ANALYSIS REQUIREMENTS:

🔍 VISUAL SCANNING:
1. IDENTIFY EVERY VISIBLE ITEM: Books, products, documents, screens, signs, artwork, food, clothing, electronics, furniture, etc.
2. READ ALL TEXT: Titles, author names, brand names, model numbers, prices, labels, signs, computer screens, handwritten notes
3. EXTRACT METADATA: Publishers, ISBN numbers, product codes, dates, addresses, phone numbers
4. DESCRIBE CONTEXT: Room type, lighting, arrangement, background elements, spatial relationships

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

The analysis should be as detailed and accurate as a direct ChatGPT conversation, extracting maximum value from the visual information.

Return comprehensive JSON with this exact structure:
{
  "enhancedContent": "Detailed description of all identified items with complete titles, authors, and context. Be exhaustive in listing everything visible.",
  "suggestion": "Specific actionable recommendations based on the items identified and user context",
  "context": "Rich environmental and contextual description of the scene, setting, and item relationships",
  "complexityScore": 8,
  "intentType": "research-inquiry",
  "urgencyLevel": "medium",
  "todos": ["Specific tasks for each identified item", "Research and categorization actions", "Purchase or organization steps"],
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