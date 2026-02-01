import OpenAI from 'openai';
import { SynthesizedPortfolio, UserPreferences, AgentMatchResult, Company, GitHubAnalysis } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
export async function recruiterMatcherAgent(
  portfolio: SynthesizedPortfolio,
  companies: Company[],
  preferences: UserPreferences
) {
  // Filter out opted-out companies
  const filteredCompanies = companies.filter(c => !preferences.optOutIds.includes(c.id));

  // To ensure extremely specific and unique scores, we pass all companies to a single prompt
  // that can compare and rank them relatively.
  const prompt = `
    You are an elite Technical Recruiter and Talent Strategist.
    Evaluate the fit between the candidate's portfolio and the following list of companies.
    
    Candidate Portfolio:
    ${JSON.stringify(portfolio)}
    
    User Industry Preferences: ${preferences.industries.join(', ')}
    Special Requests: ${preferences.specialRequests}
    
    Companies to Evaluate:
    ${filteredCompanies.map(c => `- ID: ${c.id}, Name: ${c.name}, Industry: ${c.industry}, 
      Stack: ${JSON.stringify({ languages: c.languages, frameworks: c.frameworks, skills: c.skills })},
      Context: ${c.description}
      (MISSION & CULTURE): ${c.lookingFor}`).join('\n')}
    
    Task Instructions:
    1. THOUGHT: Perform a comparative analysis of all companies against the candidate. Think long and hard about the specific technical evidence provided in the portfolio. Analyze the technical depth, team-fit potential based on collaborators, and industry alignment.
    2. UNIQUE SCORING: Provide a unique, high-precision score (range: 0.00 to 100.00) for EVERY company. 
       MANDATORY: Use exactly 2 decimal places for the final score (e.g., 91.24). 
       MANDATORY: No two companies should have the same score. This is a strict ranking.
    3. DETAILED EVALUATION: For each company, provide:
       - A LONG and EXTREMELY DETAILED summary of fit (at least 4-6 paragraphs, Markdown supported).
       - In the summary, MANDATORY: Reference specific projects, technical evidence, stack details, and even collaborator-inferred team experience from the candidate's portfolio.
       - Alignment scores (0.000 to 1.000) for Technical, Cultural, and Industry with high precision (3 decimal places).
    4. SCRAPE EVERYTHING: Use all available context from the company profiles and the user's comprehensive portfolio. No detail is too small.
    
    Return a strictly valid JSON object with the following structure:
    {
      "evaluations": [
        {
          "companyId": number,
          "thought": "Deep reasoning for this specific match, analyzing technical synergy and potential impact.",
          "score": number, // 0-100 scale (e.g. 92.57)
          "summary": "Comprehensive, long-form feedback referencing specific user projects (Markdown).",
          "strengths": ["Strength 1", "Strength 2", "Strength 3"],
          "alignment": {
            "technical": number, // 0-1 scale
            "cultural": number, // 0-1 scale
            "industry": number // 0-1 scale
          }
        },
        ...
      ]
    }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "developer", content: "You are an expert technical evaluator. Perform a comparative ranking then output JSON only. Ensure the output is a single valid JSON object." },
        { role: "user", content: prompt }
      ],
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("Empty response from OpenAI");

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : content;

    const parsed = JSON.parse(jsonString) as {
      evaluations: {
        companyId: number;
        thought: string;
        score: number;
        summary: string;
        strengths: string[];
        alignment: {
          technical: number;
          cultural: number;
          industry: number;
        }
      }[]
    };

    return parsed.evaluations.map(evaluation => {
      const company = filteredCompanies.find(c => c.id === evaluation.companyId);
      return {
        ...company,
        matchScore: evaluation.score,
        matchReason: evaluation.summary,
        agentEvaluation: evaluation
      };
    }).sort((a, b) => b.matchScore - a.matchScore);

  } catch (error) {
    console.error("Recruiter Matcher Orchestrator Error:", error);
    // Fallback if the large prompt fails
    return [];
  }
}
