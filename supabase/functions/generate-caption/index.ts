import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { GoogleGenAI } from 'npm:@google/genai'

// CORS headers to allow requests from the browser
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // This is needed for the browser to make a CORS request.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, prompt, image } = await req.json();

    // Securely get the Gemini API key from Supabase secrets.
    // @ts-ignore: Deno is a global variable in Supabase Edge Functions
    const apiKey = Deno.env.get('API_KEY');
    if (!apiKey) {
      throw new Error('API_KEY environment variable not set in Supabase secrets.');
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-flash-latest';
    let responseText = '';

    if (type === 'text') {
        const fullPrompt = `Generate a short, engaging, and cool social media caption. The user is writing about: "${prompt}". Make it sound natural and add 2-3 relevant hashtags. Do not wrap the response in markdown. Just return the plain text caption.`;
        const response = await ai.models.generateContent({ model, contents: fullPrompt });
        responseText = response.text;
    } else if (type === 'image' && image) {
        const imagePart = {
            inlineData: {
                mimeType: image.mimeType,
                data: image.data,
            },
        };
        const promptText = prompt 
            ? `Generate a short, engaging, and cool social media caption for this image. The user provided this additional context: "${prompt}". Make it sound natural and add 2-3 relevant hashtags. Do not wrap the response in markdown. Just return the plain text caption.`
            : `Generate a short, engaging, and cool social media caption for this image. Make it sound natural and add 2-3 relevant hashtags. Do not wrap the response in markdown. Just return the plain text caption.`;
        const textPart = { text: promptText };
        const response = await ai.models.generateContent({ model, contents: { parts: [imagePart, textPart] } });
        responseText = response.text;
    } else {
        throw new Error('Invalid request type or missing image data.');
    }

    return new Response(
      JSON.stringify({ caption: responseText.trim() }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in Edge Function:', error.message);
    return new Response(
        JSON.stringify({ error: error.message }),
        {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        }
    )
  }
})