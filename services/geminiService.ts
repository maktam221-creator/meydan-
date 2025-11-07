import { supabase } from './supabaseClient';
import { fileToBase64 } from "../utils/fileUtils";

// A helper to invoke the function and handle different kinds of errors
const invokeCaptionFunction = async (body: object): Promise<string> => {
  // Supabase function invocation
  const { data, error } = await supabase.functions.invoke('generate-caption', { body });
  
  // Handles network or Supabase-level errors
  if (error) {
    console.error("Error invoking edge function:", error);
    throw new Error(`Function invocation failed: ${error.message}`);
  }

  // Handles errors returned from within the function itself (e.g., Gemini API error)
  if (data.error) {
    console.error("Error from edge function:", data.error);
    throw new Error(data.error);
  }

  // Handles cases where the function returns a success status but no caption
  if (typeof data.caption !== 'string') {
    throw new Error("Invalid or missing caption in response from the server.");
  }

  return data.caption;
};


// Generates a caption based on user-provided text by calling the secure edge function
export const generateCaptionFromText = async (userPrompt: string): Promise<string> => {
  if (!userPrompt) {
    return "Please provide some text to generate a caption.";
  }
  try {
    return await invokeCaptionFunction({ type: 'text', prompt: userPrompt });
  } catch (error) {
    console.error("Error generating caption from text:", error);
    return "Sorry, I couldn't come up with a caption right now.";
  }
};

// Generates a caption by analyzing an image via the secure edge function
export const generateCaptionFromImage = async (imageFile: File, userPrompt: string): Promise<string> => {
    try {
        const base64Image = await fileToBase64(imageFile);
        return await invokeCaptionFunction({
          type: 'image',
          prompt: userPrompt,
          image: {
            data: base64Image,
            mimeType: imageFile.type,
          }
        });
    } catch (error) {
        console.error("Error generating caption from image:", error);
        return "Sorry, I couldn't analyze the image to create a caption.";
    }
};
