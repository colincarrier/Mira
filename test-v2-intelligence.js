/**
 * Test script for v2.0 Intelligence Layer
 * Verifies that the new processNote function works correctly
 */

import { processNote } from './server/utils/brain/miraAIProcessing.ts';

async function testV2Intelligence() {
  console.log("🧠 Testing v2.0 Intelligence Layer...");
  
  try {
    // Test simple task processing
    const simpleTaskInput = {
      content: "Buy groceries tomorrow at 3pm - milk, eggs, bread",
      mode: "text",
      timestamp: new Date().toISOString(),
      context: {
        timeOfDay: "morning",
        recentActivity: []
      }
    };
    
    console.log("\n📝 Testing simple task processing...");
    const result = await processNote(simpleTaskInput);
    
    console.log("✅ v2.0 Intelligence Layer Results:");
    console.log("📋 Title:", result.title);
    console.log("📄 Summary:", result.summary);
    console.log("🎯 Intent:", result.intent);
    console.log("🚨 Urgency:", result.urgency);
    console.log("🔢 Complexity:", result.complexity);
    console.log("📋 Todos:", result.todos?.length || 0);
    console.log("⚡ Smart Actions:", result.smartActions?.length || 0);
    console.log("🔗 Entities:", result.entities?.length || 0);
    console.log("💡 Collection Hint:", result.collectionHint?.name || "None");
    
    if (result.todos && result.todos.length > 0) {
      console.log("\n📋 Todo Details:");
      result.todos.forEach((todo, i) => {
        console.log(`  ${i + 1}. ${todo.title}`);
        if (todo.due) console.log(`     Due: ${todo.due}`);
        if (todo.priority) console.log(`     Priority: ${todo.priority}`);
      });
    }
    
    if (result.smartActions && result.smartActions.length > 0) {
      console.log("\n⚡ Smart Actions:");
      result.smartActions.forEach((action, i) => {
        console.log(`  ${i + 1}. ${action.label} (${action.action})`);
      });
    }
    
    console.log("\n✅ v2.0 Intelligence Layer test completed successfully!");
    
  } catch (error) {
    console.error("❌ v2.0 Intelligence Layer test failed:");
    console.error(error.message);
    console.error(error.stack);
  }
}

// Run the test
testV2Intelligence();