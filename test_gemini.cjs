const { GoogleGenAI } = require('@google/genai');

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: 'Hello'
    });
    console.log("SUCCESS:", response.text);
  } catch (err) {
    console.log("ERROR:", err.message);
  }
}
test();
