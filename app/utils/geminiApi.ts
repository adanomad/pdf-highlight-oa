import { GoogleGenAI } from "@google/genai";
import { apiKey } from "./env";

const ai = new GoogleGenAI({ apiKey: apiKey })

export async function getGeminiResponse(query: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: query }] }],
    })

    console.log(response.text);
    return response.text || "Sorry, I couldn't find an answer."
  } catch (error) {
    console.error("Error fetching response from Gemini:", error)
    return "Error: Unable to fetch response."
  }
}