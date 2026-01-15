
import { GoogleGenAI } from "@google/genai";

export const getTravelAdvice = async (prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Tu es un assistant de voyage expert pour l'agence 'Cheap Travel'. Réponds toujours en français. Donne des conseils concis et professionnels sur les visas, les vols et les destinations. Ton but est d'aider les clients algériens à planifier leurs voyages (Omrah, Visa, Billets).",
        temperature: 0.7,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Désolé, j'ai des difficultés à me connecter à ma base de données. Veuillez réessayer dans un instant !";
  }
};
