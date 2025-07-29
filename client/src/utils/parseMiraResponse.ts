/**
 * V3 MiraResponse Parser
 * Parses the unified V3 MiraResponse format from the database
 */

export interface MiraResponse {
  content: string;
  summary?: string;
  tasks?: Array<{
    title: string;
    priority: 'low' | 'medium' | 'high';
    confidence: number;
    timing?: string;
  }>;
  entities?: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
  links?: Array<{
    url: string;
    title?: string;
    description?: string;
  }>;
  metadata?: {
    intent?: string;
    confidence?: number;
    processingPath?: 'clarify' | 'evolve';
    tokenUsage?: number;
  };
}

export interface ParsedMiraResponse {
  content: string;
  summary?: string;
  tasks: Array<{
    title: string;
    priority: 'low' | 'medium' | 'high';
    confidence: number;
    timing?: string;
  }>;
  entities: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
  links: Array<{
    url: string;
    title?: string;
    description?: string;
  }>;
  metadata: {
    intent: string;
    confidence: number;
    processingPath: 'clarify' | 'evolve';
    tokenUsage: number;
  };
}

export function parseMiraResponse(miraResponseText?: string | null): ParsedMiraResponse | null {
  if (!miraResponseText) {
    return null;
  }

  try {
    const response: MiraResponse = JSON.parse(miraResponseText);
    
    return {
      content: response.content || '',
      summary: response.summary,
      tasks: response.tasks || [],
      entities: response.entities || [],
      links: response.links || [],
      metadata: {
        intent: response.metadata?.intent || 'unknown',
        confidence: response.metadata?.confidence || 0,
        processingPath: response.metadata?.processingPath || 'evolve',
        tokenUsage: response.metadata?.tokenUsage || 0
      }
    };
  } catch (error) {
    console.error('Failed to parse MiraResponse:', error);
    return null;
  }
}