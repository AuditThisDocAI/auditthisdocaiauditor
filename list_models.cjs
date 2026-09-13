const { GoogleGenAI } = require('@google/genai');

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.list();
    for await (const m of response) {
      console.log(m.name);
    }
  } catch (err) {
    console.log("ERROR:", err.message);
  }
}
test();
