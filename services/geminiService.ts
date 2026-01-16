/// <reference types="vite/client" />

import { GoogleGenAI } from "@google/genai";
import { TravelPackage } from "../types";

// Helper to generate simple mock responses effectively simulating the AI logic
const mockAIResponse = (prompt: string, context: TravelPackage[]): string => {
  const pLower = prompt.toLowerCase();

  if (pLower.includes('bonjour') || pLower.includes('salut')) {
    return "Bonjour ! Je suis l'assistant Cheap Travel. Je vois que nous avons actuellement " + context.length + " offres disponibles. Comment puis-je vous aider ?";
  }

  if (pLower.includes('visa')) {
    const visaPackages = context.filter(p => p.type.includes('VISA'));
    if (visaPackages.length > 0) {
      return `Nous avons ${visaPackages.length} options de Visa / E-Visa disponibles, notamment : ${visaPackages.map(p => p.title).join(', ')}. Souhaitez-vous des détails ?`;
    }
    return "Nous proposons des services de Visa pour de nombreuses destinations. Dites-moi quel pays vous intéresse.";
  }

  if (pLower.includes('omrah') || pLower.includes('haj')) {
    const omrah = context.filter(p => p.type === 'OMRAH');
    if (omrah.length > 0) {
      return `Pour l'Omrah, nous avons des offres exceptionnelles comme "${omrah[0].title}" à partir de ${omrah[0].price.toLocaleString()} DA.`;
    }
  }

  if (pLower.includes('prix') || pLower.includes('cout')) {
    const cheapest = [...context].sort((a, b) => a.price - b.price)[0];
    if (cheapest) return `Nos offres commencent à partir de ${cheapest.price.toLocaleString()} DA avec "${cheapest.title}".`;
  }

  return "Je peux vous renseigner sur nos offres de Vols, Visas et Omrah. N'hésitez pas à me poser une question précise sur nos destinations !";
};

export const getTravelAdvice = async (prompt: string, contextData: TravelPackage[] = []) => {
  // VITE_GEMINI_API_KEY is the standard for Vite env vars
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

  // Use Mock if no key or placeholder
  if (!apiKey || apiKey.includes('PLACEHOLDER')) {
    console.warn("Gemini API Key missing. Using Mock AI.");
    await new Promise(r => setTimeout(r, 1000)); // Simulate network latency
    return mockAIResponse(prompt, contextData);
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const contextStr = contextData.map(p => `- ${p.title} (${p.type}): ${p.price} DA`).join('\n');
    const fullPrompt = `Context (Offres disponibles):\n${contextStr}\n\nQuestion Client: ${prompt}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp', // Updated to latest/valid model if possible, or fallback
      contents: fullPrompt,
      config: {
        systemInstruction: "Tu es un assistant expert pour l'agence 'Cheap Travel'. Utilise le contexte des offres ci-dessus pour répondre. Réponds en français, de manière courte et commerciale.",
        temperature: 0.7,
      }
    });

    // In @google/genai, text can be a direct property depending on version/response type wrapper
    // Safely accessing it
    return (response as any).text || "Je n'ai pas pu générer de réponse.";

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback to mock instead of scary error
    return mockAIResponse(prompt, contextData);
  }
};
