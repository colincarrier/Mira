/**
 * Data Protection Service for Note Versioning and Content Preservation
 * 
 * This service analyzes content changes to determine risk levels and
 * protect valuable user-input data from AI overwrites.
 */

import { db } from "./db";
import { notes, noteVersions, type Note, type InsertNoteVersion } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface ContentAnalysis {
  riskLevel: "low" | "medium" | "high";
  userValueSections: string[];
  preservedContent: string[];
  changeDescription: string;
  confidence: number;
}

export interface VersioningOptions {
  changeType: "user_edit" | "ai_enhancement" | "ai_suggestion_applied" | "manual_rollback";
  changedBy: "user" | "ai_openai" | "ai_claude" | "system";
  userApproved?: boolean;
  forcePreserve?: string[];
}

export class DataProtectionService {
  
  /**
   * Analyzes content to identify valuable user-input sections
   */
  static analyzeContentValue(originalContent: string, newContent: string): ContentAnalysis {
    const analysis: ContentAnalysis = {
      riskLevel: "low",
      userValueSections: [],
      preservedContent: [],
      changeDescription: "",
      confidence: 85
    };

    // Identify high-value content patterns
    const highValuePatterns = [
      /\b\d{1,2}:\d{2}\s*(am|pm|AM|PM)\b/g, // Specific times
      /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, // Dates
      /\$\d+(\.\d{2})?\b/g, // Money amounts
      /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, // Proper names
      /\b\d{3}-\d{3}-\d{4}\b/g, // Phone numbers
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Emails
      /\b\d+\s+(st|nd|rd|th|Street|Ave|Avenue|Blvd|Boulevard)\b/gi, // Addresses
    ];

    // Check for high-value content
    let hasHighValueContent = false;
    for (const pattern of highValuePatterns) {
      const matches = originalContent.match(pattern);
      if (matches && matches.length > 0) {
        hasHighValueContent = true;
        analysis.userValueSections.push(...matches);
      }
    }

    // Analyze content length and complexity
    const originalLength = originalContent.length;
    const lengthDifference = Math.abs(newContent.length - originalLength);
    const significantChange = lengthDifference > originalLength * 0.3; // 30% change

    // Determine risk level
    if (hasHighValueContent && significantChange) {
      analysis.riskLevel = "high";
      analysis.confidence = 95;
    } else if (hasHighValueContent || significantChange) {
      analysis.riskLevel = "medium";
      analysis.confidence = 88;
    } else {
      analysis.riskLevel = "low";
      analysis.confidence = 85;
    }

    // Generate change description
    if (lengthDifference > originalLength * 0.5) {
      analysis.changeDescription = "Major content restructuring detected";
    } else if (hasHighValueContent) {
      analysis.changeDescription = "Changes detected in content with specific details";
    } else {
      analysis.changeDescription = "Minor content enhancement";
    }

    // Preserve high-value sections
    analysis.preservedContent = analysis.userValueSections;

    return analysis;
  }

  /**
   * Creates a version entry before making changes
   */
  static async createVersion(
    noteId: number, 
    currentContent: string, 
    newContent: string,
    options: VersioningOptions
  ): Promise<void> {
    try {
      // Get current version number
      const currentNote = await db
        .select({ version: notes.version })
        .from(notes)
        .where(eq(notes.id, noteId))
        .limit(1);

      const currentVersion = currentNote[0]?.version || 1;
      const newVersion = currentVersion + 1;

      // Analyze content changes
      const analysis = this.analyzeContentValue(currentContent, newContent);

      // Create version entry
      const versionData: InsertNoteVersion = {
        noteId,
        version: currentVersion,
        content: currentContent,
        changeType: options.changeType,
        changeDescription: analysis.changeDescription,
        changedBy: options.changedBy,
        preservedSections: analysis.preservedContent,
        confidence: analysis.confidence,
        userApproved: options.userApproved || false,
        riskLevel: analysis.riskLevel
      };

      await db.insert(noteVersions).values(versionData);

      // Update note version
      await db
        .update(notes)
        .set({ 
          version: newVersion,
          originalContent: currentNote[0] ? undefined : currentContent // Preserve original only once
        })
        .where(eq(notes.id, noteId));

    } catch (error) {
      console.error("Failed to create version:", error);
      throw new Error("Version creation failed");
    }
  }

  /**
   * Safely applies AI changes with content protection
   */
  static async safeApplyAIChanges(
    noteId: number,
    currentContent: string,
    aiSuggestions: any,
    options: Partial<VersioningOptions> = {}
  ): Promise<{ success: boolean; appliedChanges: string; warnings: string[] }> {
    const warnings: string[] = [];
    
    // Analyze the proposed changes
    const proposedContent = aiSuggestions.enhancedContent || currentContent;
    const analysis = this.analyzeContentValue(currentContent, proposedContent);

    // High-risk changes require user approval
    if (analysis.riskLevel === "high" && !options.userApproved) {
      warnings.push("High-risk changes detected - requires user approval");
      warnings.push(`Protected content: ${analysis.userValueSections.join(", ")}`);
      
      return {
        success: false,
        appliedChanges: currentContent,
        warnings
      };
    }

    // For medium risk, preserve specific sections
    let finalContent = proposedContent;
    if (analysis.riskLevel === "medium") {
      // Preserve high-value sections by merging them back
      for (const section of analysis.userValueSections) {
        if (!proposedContent.includes(section)) {
          warnings.push(`Preserved user data: ${section}`);
          // Add preserved content as a note at the end
          finalContent += `\n\n[Preserved]: ${section}`;
        }
      }
    }

    // Create version before applying changes
    await this.createVersion(noteId, currentContent, finalContent, {
      changeType: "ai_enhancement",
      changedBy: options.changedBy || "ai_openai",
      userApproved: options.userApproved || false,
      ...options
    });

    return {
      success: true,
      appliedChanges: finalContent,
      warnings
    };
  }

  /**
   * Gets version history for a note
   */
  static async getVersionHistory(noteId: number): Promise<any[]> {
    try {
      const versions = await db
        .select()
        .from(noteVersions)
        .where(eq(noteVersions.noteId, noteId))
        .orderBy(desc(noteVersions.version));

      return versions;
    } catch (error) {
      console.error("Failed to get version history:", error);
      return [];
    }
  }

  /**
   * Rolls back to a specific version
   */
  static async rollbackToVersion(noteId: number, targetVersion: number): Promise<boolean> {
    try {
      // Get the target version content
      const versionData = await db
        .select()
        .from(noteVersions)
        .where(eq(noteVersions.noteId, noteId))
        .where(eq(noteVersions.version, targetVersion))
        .limit(1);

      if (versionData.length === 0) {
        throw new Error("Version not found");
      }

      const targetContent = versionData[0].content;

      // Get current content for versioning
      const currentNote = await db
        .select()
        .from(notes)
        .where(eq(notes.id, noteId))
        .limit(1);

      if (currentNote.length === 0) {
        throw new Error("Note not found");
      }

      // Create version entry for current state before rollback
      await this.createVersion(noteId, currentNote[0].content, targetContent, {
        changeType: "manual_rollback",
        changedBy: "user"
      });

      // Apply rollback
      await db
        .update(notes)
        .set({ content: targetContent })
        .where(eq(notes.id, noteId));

      return true;
    } catch (error) {
      console.error("Rollback failed:", error);
      return false;
    }
  }

  /**
   * Identifies if instruction suggests safe minor changes
   */
  static isMinorChange(instruction: string): boolean {
    const minorChangePatterns = [
      /change.*time.*from.*to/i,
      /update.*date.*from.*to/i,
      /replace.*\b\w+\b.*with.*\b\w+\b/i,
      /fix.*typo/i,
      /correct.*spelling/i,
      /add.*reminder/i,
      /remove.*completed/i
    ];

    return minorChangePatterns.some(pattern => pattern.test(instruction));
  }

  /**
   * Identifies if instruction suggests potentially risky changes
   */
  static isRiskyChange(instruction: string): boolean {
    const riskyChangePatterns = [
      /rewrite/i,
      /completely.*change/i,
      /start.*over/i,
      /delete.*everything/i,
      /replace.*all/i,
      /summarize.*everything/i
    ];

    return riskyChangePatterns.some(pattern => pattern.test(instruction));
  }
}