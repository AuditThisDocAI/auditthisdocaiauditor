const { GoogleGenAI } = require('@google/genai');
const apiKey = process.env.GEMINI_API_KEY;

async function run() {
  const ai = new GoogleGenAI({ 
    apiKey,
    httpOptions: {
      headers: { 'User-Agent': 'aistudio-build' }
    }
  });
  
  try {
    const models = await ai.models.list();
    console.log(models);
  } catch (e) {
    console.error(e);
  }
}

run();
