import { storage } from "./storage";

export async function createWelcomeNote() {
  const welcomeContent = `🎉 Welcome to Mira - Your AI-Powered Memory Assistant!

Think of me as your personal research assistant who's always two steps ahead. Here's what makes Mira special:

🎤 VOICE-TO-INTELLIGENCE
Say: "Research the best Italian restaurants in San Francisco with outdoor seating"
→ I'll transcribe, research actual restaurants, find reviews, get contact info, and create actionable todos

📸 VISUAL UNDERSTANDING  
Take a photo of a recipe, business card, or whiteboard
→ I'll extract text, provide context, and organize everything intelligently

🧠 SMART ORGANIZATION
Everything gets automatically sorted into 10 collections:
• Personal, Work, Home, Family
• Travel, Ideas, Movies & TV, Books
• Health & Fitness, and Undefined (for edge cases)

🔍 GOOGLE-STYLE RESEARCH
I don't just summarize - I research! Ask about:
• "Best homeschooling curriculum for 8-year-olds"
• "Compare Tesla Model 3 vs BMW i4"
• "Plan a 5-day Tokyo itinerary"

And I'll find real data, compare options, provide ratings, and suggest next steps.

✅ AUTO-TODO EXTRACTION
From any note, I automatically create actionable items:
"Research vacation rentals in Tuscany" becomes:
→ "Compare Airbnb vs VRBO prices"
→ "Check flight costs to Florence"
→ "Read reviews for top 5 properties"

💡 TRY THIS NOW:
Voice record: "I want to start learning photography - recommend beginner cameras under $800"

Watch as I research actual camera models, compare specs, find current prices, and create a shopping checklist!

Ready to see what your AI memory can do? 🚀`;

  try {
    const note = await storage.createNote({
      content: welcomeContent,
      mode: "standard"
    });

    // Create some welcome todos
    await storage.createTodo({
      title: "Try voice recording a research question",
      noteId: note.id,
      priority: "normal"
    });

    await storage.createTodo({
      title: "Take a photo of something interesting to analyze",
      noteId: note.id,
      priority: "normal"
    });

    await storage.createTodo({
      title: "Ask Mira to plan something you're curious about",
      noteId: note.id,
      priority: "normal"
    });

    console.log("Welcome note created successfully!");
    return note;
  } catch (error) {
    console.error("Failed to create welcome note:", error);
  }
}