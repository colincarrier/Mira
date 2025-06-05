// Quick test to verify OpenAI API connection
import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

async function testOpenAI() {
  try {
    console.log("Testing OpenAI connection...");
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: "Hello, respond with just 'OK'" }],
      max_tokens: 10
    });
    console.log("OpenAI test successful:", response.choices[0].message.content);
  } catch (error) {
    console.error("OpenAI test failed:", error.message);
    console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
  }
}

testOpenAI();