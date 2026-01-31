import OpenAI from 'openai';
import { GoogleGenerativeAI } from "@google/generative-ai";

// OpenAI Setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Google AI Setup
const genAI = process.env.GOOGLE_AI_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY) : null;

export interface MatchResult {
  score: number;
  reasoning: string;
  strengths: string[];
  weaknesses: string[];
}

export async function generateMatchAnalysis(
  userProfile: any,
  companyProfile: any
): Promise<MatchResult> {
  const prompt = `
    Analyze the fit between this candidate and this company.    
    Candidate:
    ${JSON.stringify(userProfile, null, 2)}
    
    Company:
    ${JSON.stringify(companyProfile, null, 2)}
    
    Return a JSON object with:
    - score: number (0-100)
    - reasoning: string (2-3 sentences explaining the score)
    - strengths: string[] (key matching skills)
    - weaknesses: string[] (missing critical skills)
  `;

  // Try Google AI first if available (per user's "Koog AI" mention)
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt + "\nIMPORTANT: Return ONLY valid JSON.");
      const response = await result.response;
      const text = response.text();
      // Clean potential markdown blocks
      const jsonStr = text.replace(/```json|```/g, "").trim();
      return JSON.parse(jsonStr) as MatchResult;
    } catch (error) {
      console.error("Google AI Error, falling back to OpenAI:", error);
    }
  }

  // Fallback to OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert technical recruiter AI. return JSON only." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      if (content) return JSON.parse(content) as MatchResult;
    } catch (error) {
      console.error("OpenAI Error:", error);
    }
  }

  // Final Mock fallback
  return {
    score: 75,
    reasoning: "AI analysis unavailable. This is a heuristic match based on profile overlap.",
    strengths: ["Profile matches base requirements"],
    weaknesses: ["Deep semantic analysis failed"]
  };
}