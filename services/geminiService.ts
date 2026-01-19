
import { GoogleGenAI } from "@google/genai";

// Always use the named parameter and direct process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeConsumption(data: any) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise o seguinte resumo de consumo de condomínio e forneça um insight curto (máx 150 caracteres) em português sobre a eficiência: ${JSON.stringify(data)}`,
    });
    // Correctly accessing the text property from GenerateContentResponse
    return response.text || "Dados analisados com sucesso.";
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return "Mantenha o monitoramento para otimizar gastos.";
  }
}
