import Anthropic from '@anthropic-ai/sdk';
import type { AIAnalysisResult } from "@/shared/schema";

// the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function enhancedAnalysis(content: string, userContext?: any): Promise<AIAnalysisResult> {
  const prompt = `As Mira's deep intelligence engine, provide comprehensive contextual analysis of this content.

DEEP ANALYSIS FRAMEWORK:

1. CONTEXTUAL UNDERSTANDING:
   - What is the deeper meaning or significance?
   - What assumptions or context is implicit?
   - What broader themes or patterns are present?
   - How does this connect to larger goals or projects?

2. KNOWLEDGE MAPPING:
   - What domain knowledge is required?
   - What skills need to be developed or applied?
   - What resources or tools would be most helpful?
   - What experts or communities could provide support?

3. STRATEGIC THINKING:
   - What are the long-term implications?
   - How does this fit into bigger picture planning?
   - What strategic decisions need to be made?
   - What trade-offs or priorities should be considered?

4. RESEARCH INTELLIGENCE:
   - What questions should be investigated further?
   - What information would change the approach?
   - What data or evidence would be most valuable?
   - What alternative perspectives should be considered?

5. WISDOM SYNTHESIS:
   - What lessons from similar situations apply?
   - What mental models or frameworks are relevant?
   - What counterintuitive insights might be valuable?
   - What would an expert in this field recommend?

Content for analysis: "${content}"
User context: ${JSON.stringify(userContext || {})}

Provide your analysis in a structured format covering complexity scoring (1-10), intent classification, urgency level, actionable todos, and predictive insights.`;

  try {
    const message = await anthropic.messages.create({
      max_tokens: 2048,
      messages: [{ 
        role: 'user', 
        content: prompt
      }],
      model: 'claude-3-sonnet-20240229',
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    // Parse Claude's response and structure it
    return parseClaudeResponse(responseText, content);
  } catch (error) {
    console.error("Claude analysis error:", error);
    throw new Error("Failed to analyze content with Claude");
  }
}

function parseClaudeResponse(responseText: string, originalContent: string): AIAnalysisResult {
  // Extract structured data from Claude's response
  // This is a simplified parser - in production, you'd want more robust parsing
  
  const todos = extractTodos(responseText);
  const complexity = extractComplexity(responseText);
  const urgency = extractUrgency(responseText);
  const intent = extractIntent(responseText);
  
  return {
    enhancedContent: responseText,
    complexityScore: complexity,
    intentType: intent,
    urgencyLevel: urgency,
    todos,
    nextSteps: extractNextSteps(responseText),
    successFactors: extractSuccessFactors(responseText),
    potentialObstacles: extractObstacles(responseText),
    timeToComplete: extractTimeEstimate(responseText),
    relatedTopics: extractRelatedTopics(responseText),
    skillsRequired: extractSkills(responseText),
    resourcesNeeded: extractResources(responseText),
  };
}

function extractTodos(text: string): string[] {
  const todoPatterns = [
    /(?:todo|task|action|step):\s*(.+)/gi,
    /(?:^|\n)[-*]\s*(.+)/gm,
    /(?:should|need to|must)\s+(.+?)(?:\.|$)/gi
  ];
  
  const todos: string[] = [];
  
  todoPatterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].trim().length > 5) {
        todos.push(match[1].trim());
      }
    }
  });
  
  return [...new Set(todos)].slice(0, 10); // Limit and dedupe
}

function extractComplexity(text: string): number {
  const complexityKeywords = {
    simple: 1,
    basic: 2,
    moderate: 4,
    challenging: 6,
    complex: 7,
    difficult: 8,
    expert: 9,
    masterful: 10
  };
  
  let score = 5; // Default
  
  Object.entries(complexityKeywords).forEach(([keyword, value]) => {
    if (text.toLowerCase().includes(keyword)) {
      score = value;
    }
  });
  
  return score;
}

function extractUrgency(text: string): 'low' | 'medium' | 'high' | 'critical' {
  const urgencyKeywords = {
    critical: ['urgent', 'critical', 'emergency', 'asap', 'immediately'],
    high: ['important', 'priority', 'soon', 'deadline'],
    medium: ['moderate', 'normal', 'scheduled'],
    low: ['later', 'someday', 'eventually', 'low priority']
  };
  
  const lowerText = text.toLowerCase();
  
  for (const [level, keywords] of Object.entries(urgencyKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return level as 'low' | 'medium' | 'high' | 'critical';
    }
  }
  
  return 'medium';
}

function extractIntent(text: string): 'simple-task' | 'complex-project' | 'research-inquiry' | 'personal-reflection' | 'reference-material' {
  const intentKeywords = {
    'simple-task': ['task', 'do', 'complete', 'finish'],
    'complex-project': ['project', 'plan', 'develop', 'build', 'create'],
    'research-inquiry': ['research', 'investigate', 'study', 'learn', 'explore'],
    'personal-reflection': ['think', 'feel', 'reflect', 'consider', 'personal'],
    'reference-material': ['reference', 'documentation', 'information', 'data']
  };
  
  const lowerText = text.toLowerCase();
  
  for (const [intent, keywords] of Object.entries(intentKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return intent as any;
    }
  }
  
  return 'simple-task';
}

function extractNextSteps(text: string): string[] {
  const stepPatterns = [
    /next step[s]?:\s*(.+)/gi,
    /(?:first|then|next|finally),?\s+(.+?)(?:\.|$)/gi
  ];
  
  const steps: string[] = [];
  
  stepPatterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].trim().length > 5) {
        steps.push(match[1].trim());
      }
    }
  });
  
  return steps.slice(0, 5);
}

function extractSuccessFactors(text: string): string[] {
  const factorPatterns = [
    /success factor[s]?:\s*(.+)/gi,
    /key to success:\s*(.+)/gi,
    /important for success:\s*(.+)/gi
  ];
  
  const factors: string[] = [];
  
  factorPatterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        factors.push(match[1].trim());
      }
    }
  });
  
  return factors.slice(0, 5);
}

function extractObstacles(text: string): string[] {
  const obstaclePatterns = [
    /obstacle[s]?:\s*(.+)/gi,
    /challenge[s]?:\s*(.+)/gi,
    /potential (?:problem|issue)[s]?:\s*(.+)/gi
  ];
  
  const obstacles: string[] = [];
  
  obstaclePatterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        obstacles.push(match[1].trim());
      }
    }
  });
  
  return obstacles.slice(0, 5);
}

function extractTimeEstimate(text: string): string {
  const timePatterns = [
    /(?:will take|requires?|estimated?)\s+(?:about\s+)?(\d+\s*(?:minutes?|hours?|days?|weeks?|months?))/gi,
    /timeline:\s*(.+?)(?:\.|$)/gi
  ];
  
  for (const pattern of timePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return "Time estimate not specified";
}

function extractRelatedTopics(text: string): string[] {
  const topicPatterns = [
    /related to:\s*(.+)/gi,
    /similar to:\s*(.+)/gi,
    /connects to:\s*(.+)/gi
  ];
  
  const topics: string[] = [];
  
  topicPatterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        topics.push(match[1].trim());
      }
    }
  });
  
  return topics.slice(0, 5);
}

function extractSkills(text: string): string[] {
  const skillPatterns = [
    /skills?\s+(?:needed|required):\s*(.+)/gi,
    /expertise in:\s*(.+)/gi,
    /knowledge of:\s*(.+)/gi
  ];
  
  const skills: string[] = [];
  
  skillPatterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        skills.push(match[1].trim());
      }
    }
  });
  
  return skills.slice(0, 5);
}

function extractResources(text: string): string[] {
  const resourcePatterns = [
    /resources?\s+(?:needed|required):\s*(.+)/gi,
    /tools?\s+(?:needed|required):\s*(.+)/gi,
    /equipment:\s*(.+)/gi
  ];
  
  const resources: string[] = [];
  
  resourcePatterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        resources.push(match[1].trim());
      }
    }
  });
  
  return resources.slice(0, 5);
}