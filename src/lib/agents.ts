import OpenAI from 'openai';
import { SynthesizedPortfolio, UserPreferences, AgentMatchResult, Company, GitHubAnalysis } from '@/types';

const getOpenAI = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

/**
 * PORTFOLIO CREATOR AGENT
 * Synthesizes multiple data sources into a cohesive professional portfolio using detailed markdown.
 */
export async function createPortfolioAgent(
  userData: {
    github: GitHubAnalysis | null;
    resume?: string;
    linkedin?: string;
    statement?: string;
  },
  preferences: UserPreferences
): Promise<SynthesizedPortfolio> {
  const openai = getOpenAI();
  const prompt = `
    You are an expert Career Coach and Technical Brand Strategist. 
    Your task is to synthesize the following raw data into a cohesive, high-impact professional portfolio.
    
    Raw Data:
    - GitHub: ${JSON.stringify(userData.github)}
    - Resume: ${userData.resume || 'Not provided'}
    - LinkedIn Profile: ${userData.linkedin || 'Not provided'}
    - Personal Statement: ${userData.statement || 'Not provided'}
    - User Preferences & Special Requests: ${preferences.specialRequests || 'None'}
    
    Guidelines for Comprehensive Synthesis:
    1. EXTREME DETAIL & NO STONE UNTURNED: Do not summarize. Dive deep into the technical nuances. Use EVERY single data point provided. If there's a small mention of a technology, library, or a collaborator in a repository, investigate its significance.
    2. GITHUB DEEP DIVE: Mine every data point from the provided GitHub data, especially the summarized repository information (repoSummaries). These summaries provide a deep look into:
       - Repo purpose, languages, frameworks, and specific technical skills.
       - Use these to build a comprehensive picture of the user's technical stack.
       - Analyze repository-specific language breakdowns (repoLanguages) where available to identify precise tech stacks.
       - Detected frameworks and libraries (frameworks) from package.json and other configuration files.
       - Collaborators to infer team size and project scale.
       - Metadata (stars, size, update frequency) to weigh project significance.
       - Profile README and bio for personal branding.
    3. FRAMEWORK & LIBRARY ANALYSIS: Pay special attention to the frameworks and libraries detected in each repository and the summarized skills. Analyze how they are used together (e.g., Next.js + Tailwind + Prisma) to infer the candidate's architectural preferences and proficiency levels.
    4. RESUME & LINKEDIN INTEGRATION: Scrape every bit of data from the resume and linkedin text provided. Extract frameworks, tools, methodologies, and specific achievements.
    5. PRIVATE REPO INFERENCE: For any private repositories, provide high-fidelity "evidence" of impact and complexity based on metadata (size, topics, languages, frameworks). Use technical terminology (e.g., "Architected a multi-tenant microservices architecture using Go and gRPC").
    6. TEAM DYNAMICS: Analyze collaborators and organizations to describe the candidate's experience in collaborative environments and open-source contributions.
    7. MARKDOWN FORMATTING: Use rich markdown (bold, tables, lists, subheadings) within the strings to create a professional, structured document.
    8. STRATEGIC POSITIONING: Create an authoritative "title" and "summary" that reflects a unique technical identity.
    9. THINKING PROCESS: Before providing the JSON, perform a deep "THOUGHT" step where you cross-reference all data sources (Resume + GitHub + LinkedIn). Think long and hard about hidden patterns in their engineering footprint.
    10. MODEL SELECTION: Ensure you are using the highest reasoning capabilities (OpenAI GPT-4o) to deliver an elite-level technical report.
    
    Return a strictly valid JSON object matching the SynthesizedPortfolio interface:
    {
      "name": "Full Name",
      "title": "Professional Title",
      "summary": "Detailed professional summary (Markdown supported)",
      "technicalExpertise": [{"category": "e.g. Frontend", "skills": ["React", "Next.js"]}],
      "projectHighlights": [{
        "name": "Project Name",
        "description": "Short description",
        "techStack": ["Skill"],
        "isPrivate": boolean,
        "evidence": "Extremely detailed description of technical challenges and impact (Markdown supported)."
      }],
      "experienceSummary": "Executive summary of career (Markdown supported)",
      "careerGoals": "Short and long term goals (Markdown supported)"
    }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "developer", content: "You are a professional portfolio architect. Analyze deeply then output JSON only. Ensure the output is a single valid JSON object." },
        { role: "user", content: prompt }
      ],
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("Empty response from OpenAI");

    // Clean markdown if o1 wraps it
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : content;

    return JSON.parse(jsonString) as SynthesizedPortfolio;
  } catch (error) {
    console.error("Portfolio Agent Error:", error);
    // Fallback basic synthesis
    return {
      name: userData.github?.name || "Candidate",
      title: "Technical Professional",
      summary: userData.github?.bio || "Highly motivated developer.",
      technicalExpertise: [{ category: "Languages", skills: userData.github?.languages || [] }],
      projectHighlights: [],
      experienceSummary: "Experience in software development.",
      careerGoals: userData.statement || "Advancing technical career."
    };
  }
}

/**
 * RECRUITER AGENT
 * Consolidates evaluation and matching logic. Uses ReAct-style thinking for deep analysis.
 */
export async function recruiterAgent(
  portfolio: SynthesizedPortfolio,
  company: Company,
  preferences: UserPreferences
): Promise<AgentMatchResult> {
  const prompt = `
    You are an elite Technical Recruiter and Talent Strategist. 
    Evaluate the fit between the candidate's portfolio and the company's requirements using a ReAct (Reasoning and Acting) framework.
    
    Candidate Portfolio:
    ${JSON.stringify(portfolio)}
    
    User Industry Preferences: ${preferences.industries.join(', ')}
    Special Requests: ${preferences.specialRequests}
    
    Company Profile:
    - Name: ${company.name}
    - Industry: ${company.industry}
    - Description: ${company.description}
    - Core Tech Stack: ${JSON.stringify({
    languages: company.languages,
    frameworks: company.frameworks,
    skills: company.skills
  })}
    - Locations: ${JSON.stringify(company.locations || [])}
    - Compensation: ${company.compensation || 'Not specified'}
    - Benefits: ${company.benefits || 'Not specified'}
    
    Education Data (Deep Insights):
    ${JSON.stringify(company)}

    Task Instructions:
    1. THOUGHT: Perform a detailed internal analysis. Compare the candidate's specific technical evidence against the company's stack, culture, and specific mission-critical projects identified in the company data. Think long and hard.
    2. SCORES: Provide EXTREMELY SPECIFIC and UNIQUE scores (range: 0.00 to 100.00). Use 2 decimal places (e.g., 92.57). 
    3. SUMMARY: Provide a LONG and EXTREMELY DETAILED feedback summary (at least 3-4 paragraphs, Markdown supported). Reference specific projects and technical evidence from the candidate's portfolio.
    4. STRENGTHS: Identify top 3 strengths with specific references to the candidate's footprint and how they map to the company's specific needs.
    5. ALIGNMENT: Rate alignment in Technical, Cultural, and Industry fit (0.000 to 1.000).
    
    Return a strictly valid JSON object:
    {
      "thought": "Your internal ReAct-style reasoning process (Detailed)",
      "score": number (e.g. 92.55), // 0-100 scale
      "summary": "Extremely detailed, long-form explanation of fit referencing user projects (Markdown supported)",
      "strengths": ["Strength 1", "Strength 2", "Strength 3"],
      "alignment": {
        "technical": number (0-1 range),
        "cultural": number (0-1 range),
        "industry": number (0-1 range)
      }
    }
  `;

  try {
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "developer", content: "You are an expert technical evaluator. Think step-by-step then output JSON only. Ensure the output is a single valid JSON object." },
        { role: "user", content: prompt }
      ],
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("Empty response");

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : content;

    return JSON.parse(jsonString) as AgentMatchResult;
  } catch (error) {
    console.error("Recruiter Agent Error:", error);
    return {
      thought: "Failed to process evaluation.",
      score: 0,
      summary: "Evaluation failed.",
      strengths: [],
      alignment: { technical: 0, cultural: 0, industry: 0 }
    };
  }
}

/**
 * RECRUITER / MATCHER ORCHESTRATOR
 * Orchestrates matching across multiple companies and filters results using the Recruiter Agent.
 */
// Two-Phase Matching Optimization

export async function recruiterMatcherAgent(
  portfolio: SynthesizedPortfolio,
  companies: Company[],
  preferences: UserPreferences
) {
  // Filter out opted-out companies
  const filteredCompanies = companies.filter(c => !preferences.optOutIds.includes(c.id));
  if (filteredCompanies.length === 0) return [];

  const openai = getOpenAI();

  // --- PHASE 1: Quick Screening (Batch Processing) ---
  // Rate all companies 0-100 quickly.
  console.log(`Phase 1: Screening ${filteredCompanies.length} companies...`);

  // We can screen ~20 companies in one fast prompt or split into chunks if needed. 
  // With GPT-4o, 20 items is trivial for a simple score.
  const screeningPrompt = `
    Role: Elite Technical Recruiter.
    Task: Quick Screen. Rate the fit of the candidate for each company (0-100).
    
    Candidate: ${portfolio.name}, ${portfolio.title}
    Expertise: ${portfolio.technicalExpertise.map(e => e.skills.join(', ')).join('; ')}
    Summary: ${portfolio.summary.slice(0, 500)}...
    
    Companies:
    ${filteredCompanies.map(c => `
      [ID: ${c.id}] ${c.name}
      Stack: ${c.languages?.join(', ')}, ${c.frameworks?.join(', ')}
      Looking For: ${c.lookingFor?.slice(0, 200)}
    `).join('\n')}
    
    Return pure JSON array: [{ "id": number, "score": number, "reason": "1 concise sentence" }]
  `;

  let screenedResults: Array<{ id: number, score: number, reason: string }> = [];

  try {
    const screenResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "developer", content: "Output JSON array only." },
        { role: "user", content: screeningPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const raw = screenResponse.choices[0].message.content || '{"results": []}';
    // Handle potential wrapper keys
    const parsed = JSON.parse(raw);
    screenedResults = Array.isArray(parsed) ? parsed : (parsed.results || parsed.matches || []);

    // Fallback if parsing fails to find array
    if (!Array.isArray(screenedResults)) screenedResults = [];

  } catch (error) {
    console.error("Screening Phase Failed:", error);
    // Fallback: everyone gets 50
    screenedResults = filteredCompanies.map(c => ({ id: c.id, score: 50, reason: "Screening failed, manual review needed." }));
  }

  // Sort by score
  screenedResults.sort((a, b) => b.score - a.score);

  // --- PHASE 2: Deep Dive (Top 5 Only) ---
  // Select top 5 for identifying the "Strategic Matches"
  const topCompanyIds = new Set(screenedResults.slice(0, 5).map(r => r.id));

  console.log(`Phase 2: Deep analyzing top ${topCompanyIds.size} companies...`);

  // Parallel execution of deep analysis for top matches
  const processedMatches = await Promise.all(filteredCompanies.map(async (company) => {

    // Basic result structure
    const baseResult = {
      ...company,
      matchScore: 0,
      matchReason: "",
      agentEvaluation: {
        companyId: company.id,
        thought: "Screened out",
        score: 0,
        summary: "Not a primary match.",
        strengths: [],
        alignment: { technical: 0, cultural: 0, industry: 0 }
      }
    };

    // Find screening score
    const screenData = screenedResults.find(r => r.id === company.id);
    if (screenData) {
      baseResult.matchScore = screenData.score;
      baseResult.matchReason = screenData.reason;
      baseResult.agentEvaluation.score = screenData.score;
    }

    // If NOT in top 5, return concise version immediately
    if (!topCompanyIds.has(company.id)) {
      return baseResult;
    }

    // If IN top 5, Run Deep Analysis
    try {
      const topResult = await recruiterAgent(portfolio, company, preferences);
      return {
        ...company,
        matchScore: topResult.score,
        matchReason: topResult.summary, // Use detailed summary for top matches
        agentEvaluation: topResult
      };
    } catch (e) {
      console.error(`Deep analysis failed for ${company.name}`, e);
      return baseResult;
    }
  }));

  // Re-sort final results
  return processedMatches.sort((a, b) => b.matchScore - a.matchScore);
}
