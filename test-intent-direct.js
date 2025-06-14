
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function testIntentClassifier() {
  const text = 'What is this image? How much is it worth? Remind me to take my other money to currency exchange.';
  
  const prompt = `
You are Mira's intent classifier. 
Classify the NOTE into the IntentVector JSON with keys:
primaryActions, domainContexts, temporalClass, collaborationScope, affectTone.
Respond with ONLY valid JSON.
NOTE: """${text}"""
`.trim();

  try {
    console.log('🧠 Testing intent classification...');
    
    const chat = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2
    });

    const raw = chat.choices[0]?.message?.content ?? '{}';
    console.log('✅ Raw response:', raw);
    
    const parsed = JSON.parse(raw);
    console.log('✅ Parsed result:');
    console.log(JSON.stringify(parsed, null, 2));
    
  } catch (error) {
    console.error('❌ Classification failed:', error);
  }
}

testIntentClassifier();
