
import { GoogleGenAI } from "@google/genai";

export const generatePostCaption = async (userPrompt: string): Promise<string> => {
  if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set.");
    return "API key not configured. Please check your environment variables.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-2.5-flash';
    
    const fullPrompt = `Generate a short, engaging, and cool social media caption.
    The user is writing about: "${userPrompt}". 
    Make it sound natural and add 2-3 relevant hashtags.
    Do not wrap the response in markdown. Just return the plain text caption.`;

    const response = await ai.models.generateContent({
        model: model,
        contents: fullPrompt,
    });
    
    return response.text.trim();
  } catch (error) {
    console.error("Error generating caption with Gemini API:", error);
    return "Sorry, I couldn't come up with a caption right now.";
  }
};
