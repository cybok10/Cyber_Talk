import { GoogleGenAI } from "@google/genai";

export async function getGeminiResponse(prompt: string) {
  try {
    // Fixed: Initializing GoogleGenAI with the API key directly from process.env.API_KEY as required by the latest SDK guidelines.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are 'CipherBot', a security-conscious participant in an end-to-end encrypted chat. You provide helpful, slightly tech-focused answers. Keep responses concise and informative about security protocols.",
        temperature: 0.7,
      }
    });

    // Fixed: Accessing the text property directly on the response object.
    return response.text;
  } catch (error) {
    console.error("Gemini Service Error:", error);
    return "Error communicating with the security bot. Please check your connection.";
  }
}
///