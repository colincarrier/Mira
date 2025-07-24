/**
 * Stage-4A Response Validator
 * Prevents malformed AI responses from reaching the database
 */

import { z } from 'zod';

export interface ValidationResult {
  isValid: boolean;
  sanitized?: string;
  errors: string[];
}

// Expected Stage-4A response format
const Stage4ASchema = z.object({
  answer: z.string().default(''),
  task: z.object({
    task: z.string(),
    timing_hint: z.string().optional(),
    dueDate: z.string().optional(),
    details: z.string().optional(),
    confidence: z.number().min(0).max(1).optional()
  }).optional(),
  meta: z.object({
    confidence: z.number().min(0).max(1).default(0.5),
    latencyMs: z.number().optional(),
    model: z.string().optional(),
    cached: z.boolean().optional(),
    tokenUsage: z.object({
      prompt_tokens: z.number(),
      completion_tokens: z.number(),
      total_tokens: z.number()
    }).optional()
  }).optional()
});

export class Stage4AValidator {
  
  /**
   * Validates and sanitizes Stage-4A response before database storage
   */
  static validate(rawResponse: string): ValidationResult {
    const errors: string[] = [];
    
    if (!rawResponse || rawResponse.trim().length === 0) {
      return {
        isValid: false,
        errors: ['Empty response']
      };
    }

    let parsed: unknown;
    try {
      // Try direct parsing first
      parsed = JSON.parse(rawResponse);
    } catch {
      try {
        // Try double-parsing for escaped JSON
        parsed = JSON.parse(JSON.parse(rawResponse));
      } catch {
        // Try extracting from malformed response
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch?.[0]) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch {
            return {
              isValid: false,
              errors: ['Invalid JSON format', 'Could not extract valid JSON from response']
            };
          }
        } else {
          return {
            isValid: false,
            errors: ['No JSON structure found in response']
          };
        }
      }
    }

    // Validate against schema
    const validation = Stage4ASchema.safeParse(parsed);
    if (!validation.success) {
      const schemaErrors = validation.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      errors.push(...schemaErrors);
      
      // Try to salvage partial data
      if (typeof parsed === 'object' && parsed !== null) {
        const salvaged = this.salvagePartialResponse(parsed);
        if (salvaged) {
          return {
            isValid: true,
            sanitized: JSON.stringify(salvaged),
            errors: [`Partial recovery: ${errors.join(', ')}`]
          };
        }
      }
      
      return {
        isValid: false,
        errors
      };
    }

    // Additional validation for answer quality
    const data = validation.data;
    const hasAnswer = data.answer && data.answer.trim().length > 0;
    const hasTask = data.task && data.task.task && data.task.task.trim().length > 0;
    
    if (!hasAnswer && !hasTask) {
      errors.push('Response contains neither meaningful answer nor task');
      return {
        isValid: false,
        errors
      };
    }

    // Generate meaningful answer if missing but task exists
    if (!hasAnswer && hasTask) {
      const taskName = data.task!.task;
      const timing = data.task!.timing_hint;
      
      if (timing && timing !== 'null' && timing !== 'later') {
        data.answer = `I'll help you with "${taskName}". When would you like to be reminded?`;
      } else {
        data.answer = `I've captured "${taskName}" as a task.`;
      }
    }

    return {
      isValid: true,
      sanitized: JSON.stringify(data),
      errors: errors.length > 0 ? errors : []
    };
  }

  /**
   * Attempts to salvage meaningful data from malformed responses
   */
  private static salvagePartialResponse(obj: any): any | null {
    const result: any = {
      answer: '',
      meta: { confidence: 0.3 } // Lower confidence for salvaged data
    };

    // Extract answer from various possible locations
    if (typeof obj.answer === 'string') {
      result.answer = obj.answer;
    } else if (typeof obj.response === 'string') {
      result.answer = obj.response;
    } else if (typeof obj.text === 'string') {
      result.answer = obj.text;
    }

    // Extract task information
    if (obj.task && typeof obj.task === 'object') {
      if (obj.task.task || obj.task.title || obj.task.description) {
        result.task = {
          task: obj.task.task || obj.task.title || obj.task.description,
          timing_hint: obj.task.timing_hint,
          confidence: obj.task.confidence || 0.3
        };
      }
    }

    // Must have at least answer or task
    if (!result.answer && !result.task) {
      return null;
    }

    return result;
  }

  /**
   * Quick validation for empty or obviously broken responses
   */
  static isObviouslyBroken(rawResponse: string): boolean {
    if (!rawResponse || rawResponse.trim().length < 10) return true;
    if (rawResponse.includes('[AI Analysis:')) return true;
    if (rawResponse.includes('You are Mira')) return true;
    if (!rawResponse.includes('{') && !rawResponse.includes('}')) return true;
    
    return false;
  }
}