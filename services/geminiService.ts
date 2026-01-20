/// <reference types="vite/client" />

import { GoogleGenAI } from "@google/genai";
import { TravelPackage } from "../types";

// Helper to generate simple mock responses effectively simulating the AI logic
const mockAIResponse = (prompt: string, context: TravelPackage[]): string => {
  const pLower = prompt.toLowerCase();

  if (pLower.includes('bonjour') || pLower.includes('salut') || pLower.includes('hello')) {
    return `Bonjour ! Ravi de vous voir. Nous avons ${context.length} offres disponibles aujourd'hui. Comment puis-je vous renseigner sur nos prestations ?`;
  }

  if (pLower.includes('visa')) {
    const visas = context.filter(p => p.type.includes('VISA'));
    if (visas.length > 0) {
      return `Nous avons des services de Visa pour : ${visas.map(v => v.title).join(', ')}. Lequel vous intéresse ?`;
    }
    return "Nous traitons les visas pour de nombreuses destinations (Dubaï, Turquie, Europe...). Précisez le pays souhaité !";
  }

  if (pLower.includes('omrah') || pLower.includes('omra')) {
    return "Nos packages Omrah incluent le vol, l'hôtel et le visa. Quel mois souhaitez-vous partir ?";
  }

  if (pLower.includes('prix') || pLower.includes('tarif') || pLower.includes('combien')) {
    return "Nos tarifs dépendent de la saison. Les vols commencent à 25.000 DA et les Visas à 15.000 DA. Souhaitez-vous un devis précis ?";
  }

  if (pLower.includes('test')) {
    return "Test reçu ! Je suis branché et prêt à vous aider. Demandez-moi n'importe quoi sur nos voyages.";
  }

  // Very dynamic fallback
  const randomFallbacks = [
    "C'est une excellente question. Pour vous répondre précisément, auriez-vous une destination ou une date en tête ?",
    "Je peux vous renseigner sur les Visas, l'Omrah ou nos Voyages Organisés. Que préférez-vous ?",
    "Désolé, je n'ai pas bien saisi votre demande. Pourriez-vous reformuler votre question sur nos services de voyage ?",
    "Nous avons beaucoup d'offres en ce moment ! Vous cherchez plutôt un vol sec ou un séjour complet ?"
  ];

  return randomFallbacks[Math.floor(Math.random() * randomFallbacks.length)];
};

export const getTravelAdvice = async (prompt: string, contextData: TravelPackage[] = []) => {
  // Check multiple variable locations because of custom vite.config.ts
  const apiKey =
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    (import.meta as any).env?.GEMINI_API_KEY ||
    (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '') ||
    '';

  console.log("DEBUG AI: Searching for key...", apiKey ? "Key found (starts with " + apiKey.substring(0, 4) + ")" : "No key found");

  // Basic validation: must start with AIza
  if (!apiKey || !apiKey.trim().startsWith('AIza')) {
    console.warn("Gemini Service: No valid API key found. Falling back to Mock.");
    return mockAIResponse(prompt, contextData);
  }

  try {
    // Masked log for debugging
    console.log(`Gemini Service: Initializing with key ${apiKey.substring(0, 6)}...`);

    // SDK 1.x pattern
    const genAI = new (GoogleGenAI as any)(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const contextStr = contextData.length > 0
      ? `Voici mes offres actuelles :\n${contextData.map(p => `- ${p.title} (${p.price} DA)`).join('\n')}`
      : "Aucune offre spécifique en catalogue pour le moment.";

    const fullPrompt = `${contextStr}\n\nEn tant qu'expert Cheap Travel, réponds à : ${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    if (text) return text;
    return "L'IA a répondu mais le texte est vide.";

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes('403') || error.message?.includes('key')) {
      return "Erreur d'authentification IA (403). Ma clé API est peut-être restreinte ou invalide.";
    }
    return mockAIResponse(prompt, contextData);
  }
};

export const extractPassportData = async (base64Image: string) => {
  const apiKey =
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    (import.meta as any).env?.GEMINI_API_KEY ||
    (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '') ||
    '';

  if (!apiKey || !apiKey.trim().startsWith('AIza')) {
    throw new Error("Clé API Gemini manquante pour le scanner.");
  }

  try {
    const genAI = new (GoogleGenAI as any)(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Clean base64
    const base64Data = base64Image.split(',')[1] || base64Image;

    const prompt = `Extraire les informations de ce passeport en format JSON uniquement avec les clés : 
    "firstName" (Prénom), "lastName" (Nom de famille), "dateOfBirth" (Format YYYY-MM-DD), "passportNumber".
    Si une donnée est illisible, laisse-la vide. Ne mets pas de bloc de code markdown, juste le JSON pur.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      }
    ]);

    const response = await result.response;
    const text = response.text().replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch (error: any) {
    console.error("OCR Error:", error);
    throw new Error("Erreur de lecture du passeport. Essayez de reprendre la photo.");
  }
};
