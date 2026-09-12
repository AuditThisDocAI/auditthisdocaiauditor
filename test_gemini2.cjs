const { GoogleGenAI } = require('@google/genai');
const apiKey = process.env.GEMINI_API_KEY;

async function testModel(modelName) {
  try {
    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' }
      }
    });
    
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: "say hi" }] }],
    });
    console.log(`Success with ${modelName}: ${response.text}`);
    return true;
  } catch (e) {
    console.log(`Failed with ${modelName}:`, e.message);
    return false;
  }
}

async function run() {
  await testModel('gemini-3.6-flash');
  await testModel('gemini-3.5-flash');
  await testModel('gemini-3.8-flash');
  await testModel('gemini-3.8-pro');
}

run();
