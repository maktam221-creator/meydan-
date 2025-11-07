import { GoogleGenAI } from "@google/genai";
import { fileToBase64 } from "../utils/fileUtils";

// A single function to get the AI client to avoid repetition and handle API key check
const getGenAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Generates a caption based on user-provided text
export const generateCaptionFromText = async (userPrompt: string): Promise<string> => {
  if (!userPrompt) {
    return "Please provide some text to generate a caption.";
  }
  try {
    const ai = getGenAI();
    const model = 'gemini-flash-latest';
    
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
    console.error("Error generating caption from text with Gemini API:", error);
    return "Sorry, I couldn't come up with a caption right now.";
  }
};

// Generates a caption by analyzing an image, with optional text context
export const generateCaptionFromImage = async (imageFile: File, userPrompt: string): Promise<string> => {
    try {
        const ai = getGenAI();
        const model = 'gemini-flash-latest'; // Multimodal model

        const base64Image = await fileToBase64(imageFile);

        const imagePart = {
            inlineData: {
                mimeType: imageFile.type,
                data: base64Image,
            },
        };
        
        const promptText = userPrompt 
            ? `Generate a short, engaging, and cool social media caption for this image. The user provided this additional context: "${userPrompt}". Make it sound natural and add 2-3 relevant hashtags. Do not wrap the response in markdown. Just return the plain text caption.`
            : `Generate a short, engaging, and cool social media caption for this image. Make it sound natural and add 2-3 relevant hashtags. Do not wrap the response in markdown. Just return the plain text caption.`;
        
        const textPart = { text: promptText };

        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [imagePart, textPart] },
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error generating caption from image with Gemini API:", error);
        return "Sorry, I couldn't analyze the image to create a caption.";
    }
};