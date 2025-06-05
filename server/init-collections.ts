import { storage } from "./storage";

const standardCollections = [
  { name: "To-dos", icon: "checklist", color: "blue" },
  { name: "Personal", icon: "heart", color: "pink" },
  { name: "Home", icon: "home", color: "green" },
  { name: "Work", icon: "briefcase", color: "purple" },
  { name: "Family", icon: "star", color: "yellow" },
  { name: "Books", icon: "book", color: "orange" },
  { name: "Movies & TV", icon: "play", color: "red" },
  { name: "Restaurants", icon: "utensils", color: "teal" },
  { name: "Travel", icon: "plane", color: "blue" },
  { name: "Other", icon: "help-circle", color: "gray" }
];

export async function initializeStandardCollections() {
  try {
    const existingCollections = await storage.getCollections();
    
    for (const standardCollection of standardCollections) {
      const exists = existingCollections.find(
        c => c.name.toLowerCase() === standardCollection.name.toLowerCase()
      );
      
      if (!exists) {
        await storage.createCollection(standardCollection);
        console.log(`Created standard collection: ${standardCollection.name}`);
      }
    }
    
    console.log("Standard collections initialized");
  } catch (error) {
    console.error("Error initializing standard collections:", error);
  }
}