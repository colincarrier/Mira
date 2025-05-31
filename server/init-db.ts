import { storage } from "./storage";

export async function initializeDatabase() {
  try {
    // Check if collections already exist
    const existingCollections = await storage.getCollections();
    
    if (existingCollections.length === 0) {
      // Create default collections
      await storage.createCollection({ 
        name: "Coffee & Food Spots", 
        icon: "coffee", 
        color: "orange" 
      });
      
      await storage.createCollection({ 
        name: "Project Ideas", 
        icon: "lightbulb", 
        color: "purple" 
      });
      
      await storage.createCollection({ 
        name: "Reading List", 
        icon: "book", 
        color: "green" 
      });
      
      console.log("Default collections created");
    }
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
}