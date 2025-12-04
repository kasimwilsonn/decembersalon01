import { GoogleGenAI } from "@google/genai";

// Ideally this comes from a secure backend proxy, but for this prototype we use client-side
const apiKey = process.env.API_KEY || ''; 

export const generateMarketingContent = async (
  campaignType: string,
  customerName: string,
  offerDetails: string
): Promise<string> => {
  if (!apiKey) return "Error: AI API Key not configured.";

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a short, professional, and catchy SMS/WhatsApp marketing message for a salon.
      Context:
      - Campaign Type: ${campaignType} (e.g., Birthday, Discount, Reminder)
      - Customer Name: ${customerName}
      - Offer/Details: ${offerDetails}
      
      Keep it under 30 words. Include emojis.`,
    });

    return response.text || "Could not generate content.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to generate marketing message. Please try again.";
  }
};