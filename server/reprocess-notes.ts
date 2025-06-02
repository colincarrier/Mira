import { db } from "./db";
import { notes } from "@shared/schema";
import { analyzeNote } from "./anthropic";
import { storage } from "./storage";
import { eq, isNull } from "drizzle-orm";

export async function reprocessAllNotes() {
  try {
    console.log("Starting reprocessing of all notes...");
    
    // Get all notes that don't have a collection assigned
    const unassignedNotes = await db.select().from(notes);
    
    console.log(`Found ${unassignedNotes.length} notes without collections`);
    
    for (const note of unassignedNotes) {
      try {
        console.log(`Processing note ${note.id}...`);
        
        // Analyze the note content to get collection suggestion
        const analysis = await analyzeNote(note.content, note.mode || 'standard');
        
        if (analysis.collectionSuggestion) {
          // Find existing collection or create new one
          const collections = await storage.getCollections();
          const existingCollection = collections.find(
            c => c.name.toLowerCase() === analysis.collectionSuggestion!.name.toLowerCase()
          );
          
          let collectionId = existingCollection?.id;
          if (!existingCollection) {
            const newCollection = await storage.createCollection(analysis.collectionSuggestion);
            collectionId = newCollection.id;
            console.log(`Created new collection: ${analysis.collectionSuggestion.name}`);
          }
          
          // Update the note with the collection
          await storage.updateNote(note.id, { collectionId });
          console.log(`Assigned note ${note.id} to collection: ${analysis.collectionSuggestion.name}`);
        }
        
        // Small delay to avoid overwhelming the AI API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error processing note ${note.id}:`, error);
      }
    }
    
    console.log("Finished reprocessing all notes");
    
  } catch (error) {
    console.error("Error in reprocessAllNotes:", error);
  }
}