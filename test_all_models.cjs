const { GoogleGenAI } = require('@google/genai');

async function test() {
  const models = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-flash-latest', 'gemini-pro-latest', 'gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash'];
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  for (const m of models) {
    try {
      const response = await ai.models.generateContent({
        model: m,
        contents: 'Hello'
      });
      console.log(m, "SUCCESS:", response.text);
    } catch (err) {
      console.log(m, "ERROR:", err.message);
    }
  }
}
test();
