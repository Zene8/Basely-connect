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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userProfile: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    - Name: ${userProfile.name}
    - Bio: ${userProfile.bio}
    - Company/Location: ${userProfile.company} / ${userProfile.location}
    - Website: ${userProfile.blog}
    - Languages: ${userProfile.languages.join(', ')}
    - Organizations: ${JSON.stringify(userProfile.organizations)}
    - Socials: ${JSON.stringify(userProfile.socials)}
    - Profile README: ${userProfile.profileReadme ? userProfile.profileReadme.substring(0, 1500) : 'None'}
    - Personal Statement: "${userProfile.statement || 'Not provided'}"
    - Resume Excerpt: "${(userProfile.resume || '').substring(0, 2000)}..." (truncated)
    - Key Repositories: ${JSON.stringify(userProfile.repos)}
    
    Company Requirements:
    - Name: ${companyProfile.name}
    - Description: ${companyProfile.desc}
    - Tech Stack: ${JSON.stringify(companyProfile.requirements)}
    
    Task:
    Provide a deep semantic analysis of the technical and cultural fit. 
    Use the Profile README and Repositories to find specific evidence of expertise.
    
    Return a strictly valid JSON object:
    {
      "score": number (0-100),
      "reasoning": "Deep explanation focusing on the synergy between their open-source footprint, organizations, and the company goals.",
      "strengths": ["Top 3 matching skills/traits"],
      "weaknesses": ["Key missing requirements"]
    }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: "You are a recruiter. Output JSON only." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
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