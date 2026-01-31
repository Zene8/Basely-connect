import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  if (!process.env.OPENAI_API_KEY) {
    return {
      score: 50,
      reasoning: "AI analysis is currently disabled.",
      strengths: ["Profile data received"],
      weaknesses: ["Deep semantic matching inactive"]
    };
  }

  const prompt = `
    Analyze the fit between this candidate and this company.
    
    Candidate Data:
    - Bio: ${userProfile.bio}
    - Languages: ${userProfile.languages.join(', ')}
    - Personal Statement: "${userProfile.statement || 'Not provided'}"
    - Resume Excerpt: "${(userProfile.resume || '').substring(0, 1000)}..." (truncated)
    
    Company Requirements:
    - Name: ${companyProfile.name}
    - Description: ${companyProfile.desc}
    - Tech Stack: ${JSON.stringify(companyProfile.requirements)}
    
    Task:
    Return a strictly valid JSON object:
    {
      "score": number (0-100),
      "reasoning": "Concise explanation focusing on why the candidate fits the specific tech stack and culture.",
      "strengths": ["Top 3 matching skills/traits"],
      "weaknesses": ["Key missing requirements"]
    }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a recruiter. Output JSON only." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("Empty response");
    
    return JSON.parse(content) as MatchResult;
  } catch (error) {
    console.error("OpenAI Match Error:", error);
    return {
      score: 0,
      reasoning: "Analysis failed.",
      strengths: [],
      weaknesses: []
    };
  }
}