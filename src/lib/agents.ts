import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { SynthesizedPortfolio, UserPreferences, AgentMatchResult, Company, GitHubAnalysis } from '@/types';

// PLACEHOLDER: Attempt to use Claude API if available, fall back to OpenAI
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getAIClient = () => {
  // Try Claude first
  if (process.env.CLAUDE_API_KEY) {
    console.log('[AI] Using Claude API (Code Interpreter enabled)');
    return new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });
  }

  // Fall back to OpenAI
  if (process.env.OPENAI_API_KEY) {
    console.log('[AI] Using OpenAI API (Claude not available)');
    return new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  throw new Error("Missing both CLAUDE_API_KEY and OPENAI_API_KEY environment variables");
};

const getOpenAI = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

// Helper to clean Markdown code blocks from JSON
const cleanJson = (text: string): string => {
  if (!text) return "{}";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : text;
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
    1. EXTREME DETAIL & NO STONE UNTURNED: Provide a detailed, concise, and accurate synthesis. Use EVERY single data point provided. If there's a small mention of a technology, library, or a collaborator in a repository, investigate its significance.
    2. RESUME & LINKEDIN INTEGRATION (HIGHEST PRIORITY): Treat the Resume and LinkedIn text as the "Source of Truth" for professional experience and seniority. 
       - EXTRACT: Work History (roles, dates, companies), Education, Certifications, and specific "bullet point" achievements.
       - MAP: Connect resume-based achievements to GitHub evidence where possible.
       - DETECT: Look for non-code skills like "Agile," "Leadership," "Stakeholder Management," "Project Management" which GitHub misses.
       - SENIORITY: Determine the actual career level (e.g., Senior, Staff, Lead) from the professional history, not just years of coding.
    3. GITHUB DEEP DIVE: Mine every data point from the provided GitHub data, especially the summarized repository information (repoSummaries). These summaries provide a deep look into:
       - Repo purpose, languages, frameworks, and specific technical skills.
       - Use these to build a comprehensive picture of the user's technical stack.
       - Analyze repository-specific language breakdowns (repoLanguages) where available to identify precise tech stacks.
       - Detected frameworks and libraries (frameworks) from package.json and other configuration files.
       - Collaborators to infer team size and project scale.
       - Metadata (stars, size, update frequency) to weigh project significance.
       - Profile README and bio for personal branding.
    4. FRAMEWORK & LIBRARY ANALYSIS: Pay special attention to the frameworks and libraries detected in each repository and the summarized skills. Analyze how they are used together (e.g., Next.js + Tailwind + Prisma) to infer the candidate's architectural preferences and proficiency levels.
    5. PRIVATE REPO INFERENCE: For any private repositories, provide high-fidelity "evidence" of impact and complexity based on metadata (size, topics, languages, frameworks). Use technical terminology (e.g., "Architected a multi-tenant microservices architecture using Go and gRPC").
    6. TEAM DYNAMICS: Analyze collaborators and organizations to describe the candidate's experience in collaborative environments and open-source contributions.
    7. MARKDOWN FORMATTING: Use rich markdown (bold, tables, lists, subheadings) within the strings to create a professional, structured document.
    8. STRATEGIC POSITIONING: Create an authoritative "title" and "summary" that reflects a unique technical identity based on the TOTALITY of data.
    9. THINKING PROCESS: Before providing the JSON, perform a deep "THOUGHT" step where you cross-reference all data sources (Resume + GitHub + LinkedIn). Think long and hard about hidden patterns in their engineering footprint.
    10. MODEL SELECTION: Ensure you are using the highest reasoning capabilities (OpenAI GPT-4o) to deliver an elite-level technical report.
    11. CONCISENESS & ACCURACY: While being detailed, ensure all information is concise and accurately reflects the provided data without hallucinating extra achievements.
    
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

    try {
      const parsed = JSON.parse(jsonString) as SynthesizedPortfolio;
      // Ensure technicalExpertise is not empty
      if (!parsed.technicalExpertise || parsed.technicalExpertise.length === 0) {
        parsed.technicalExpertise = [{
          category: "Languages",
          skills: (userData.github?.topLanguages || userData.github?.languages) || []
        }];
      }
      return parsed;
    } catch (parseError) {
      console.error("Portfolio JSON Parse Error:", parseError, "Raw string:", jsonString);
      throw parseError;
    }
  } catch (error) {
    console.error("Portfolio Agent Error:", error);
    // Fallback basic synthesis
    return {
      name: userData.github?.name || "Candidate",
      title: "Technical Professional",
      summary: userData.github?.bio || "Highly motivated developer.",
      technicalExpertise: [{ category: "Languages", skills: (userData.github?.topLanguages || userData.github?.languages) || [] }],
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
    1. THOUGHT: Perform a detailed internal analysis. Compare the candidate's specific technical evidence and PROFESSIONAL HISTORY (from resume/LinkedIn) against the company's stack, culture, and specific mission-critical projects identified in the company data.
    2. TOTAL SIGNAL: Do not just match GitHub repos. Use the candidate's entire professional narrative (Education, Seniority, Industry Experience) extracted from their synthesized portfolio.
    3. SCORES: Provide EXTREMELY SPECIFIC, CONCISE, and ACCURATE scores (range: 0.00 to 100.00). Use 2 decimal places (e.g., 92.57). You MUST use the full range of the scale; do not cluster scores around averages.
    4. SUMMARY: Provide a LONG and EXTREMELY DETAILED feedback summary (at least 5-6 paragraphs, Markdown supported). Reference specific projects, technical evidence, AND career milestones from the candidate's portfolio. Mention why this candidate is a top-tier "Strategic Match".
    5. STRENGTHS: Identify top 3-5 strengths with specific references to the candidate's footprint and how they map to the company's specific needs. Be detailed and accurate.
    6. ALIGNMENT: Rate alignment in Technical, Cultural, and Industry fit (0.000 to 1.000). Use 3 decimal places for granular accuracy.
    
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
    Task: Initial High-Level Screening.
    
    Candidate: ${portfolio.name}, ${portfolio.title}
    Expertise: ${portfolio.technicalExpertise.map(e => e.skills.join(', ')).join('; ')}
    Summary: ${portfolio.summary.slice(0, 1500)}
    Experience: ${portfolio.experienceSummary.slice(0, 1500)}
    Goals: ${portfolio.careerGoals.slice(0, 500)}
    
    Companies:
    ${filteredCompanies.map(c => `
      [ID: ${c.id}] ${c.name}
      Stack: ${c.languages?.join(', ')}, ${c.frameworks?.join(', ')}
      Looking For: ${c.lookingFor?.slice(0, 300)}
    `).join('\n')}
    
    Evaluate each company against the candidate. 
    CRITICAL SCORING RULES: 
    1.  Use a strict 0.00 to 100.00 scale. 
    2.  Use 2 decimal places (e.g., 65.40, 89.12).
    3.  Do NOT default to low scores (e.g. 5-10%) unless it is a clear mismatch. If there is potential, score fairly (e.g. 50-70%).
    4.  Be accurate and granular. Use the FULL scale 0-100%.
    5.  REASONING: Provide a detailed, concise, and accurate 2-3 sentence explanation of the initial alignment.
    
    Return pure JSON object: { "results": [{ "id": number, "score": number, "reason": "reasoning" }] }
  `;


  let screenedResults: Array<{ id: number, score: number, reason: string }> = [];

  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Phase 1 timed out')), 30000)
    );

    const screenResponse = (await Promise.race([
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "developer", content: "Output JSON object with a 'results' key containing the array. Provide detailed reasons." },
          { role: "user", content: screeningPrompt }
        ],
        response_format: { type: "json_object" }
      }),
      timeoutPromise
    ])) as { choices: { message: { content: string | null } }[] };



    const raw = screenResponse.choices[0].message.content || '{"results": []}';
    console.log("Phase 1 Raw Response:", raw);
    const parsed = JSON.parse(cleanJson(raw));
    screenedResults = parsed.results || parsed.matches || (Array.isArray(parsed) ? parsed : []);
    console.log(`Phase 1 screened ${screenedResults.length} results`);

    // Fallback if parsing fails to find array
    if (!Array.isArray(screenedResults)) {
      console.warn("Screened results is not an array, attempting to extract from values");
      if (typeof screenedResults === 'object' && screenedResults !== null) {
        screenedResults = Object.values(screenedResults).filter(v => Array.isArray(v))[0] || [];
      } else {
        screenedResults = [];
      }
    }

  } catch (error) {
    console.error("Screening Phase Failed:", error);
    // Fallback: everyone gets 50
    screenedResults = filteredCompanies.map(c => ({ id: c.id, score: 50, reason: "Screening failed, manual review needed." }));
  }

  // Sort by score and filter out non-matches
  screenedResults.sort((a, b) => b.score - a.score);

  // Ensure we have IDs and scores are valid
  screenedResults = screenedResults.filter(r => r && (typeof r.id === 'number' || typeof r.id === 'string'));

  // Map string IDs back to numbers if needed
  screenedResults = screenedResults.map(r => ({
    ...r,
    id: typeof r.id === 'string' ? parseInt(r.id) : r.id,
    score: typeof r.score === 'string' ? parseFloat(r.score) : r.score
  }));

  // --- PHASE 1.5: Mid-Level Analysis (Top 12) ---
  // A bridge between broad screening and deep dive.
  const midLevelIds = new Set(screenedResults
    .filter(r => r.score > 20)
    .slice(0, 12)
    .map(r => r.id)
  );

  console.log(`Phase 1.5: Mid-level analysis for ${midLevelIds.size} companies...`);

  const midLevelCompanies = filteredCompanies.filter(c => midLevelIds.has(c.id));
  let midLevelResults: Array<{ id: number, score: number, reason: string }> = [];

  if (midLevelCompanies.length > 0) {
    const midLevelPrompt = `
      Role: Expert Technical Reviewer.
      Task: Perform a more detailed "mid-level" search and evaluation for the following companies.
      
      Candidate Portfolio Summary:
      ${portfolio.summary}
      Professional Experience: ${portfolio.experienceSummary}
      Career Goals: ${portfolio.careerGoals}
      Technical Skills: ${portfolio.technicalExpertise.map(e => `${e.category}: ${e.skills.join(', ')}`).join('\n')}
      
      Review the candidate's alignment with these specific companies in more depth. Look for subtle technical matches or cultural resonance.
      
      Companies:
      ${midLevelCompanies.map(c => `
        [ID: ${c.id}] ${c.name}
        Description: ${c.description}
        Stack: ${c.languages?.join(', ')}, ${c.frameworks?.join(', ')}, ${c.skills?.join(', ')}
        Looking For: ${c.lookingFor}
      `).join('\n')}
      
      Return pure JSON object: { "results": [{ "id": number, "score": number, "reason": "A detailed, concise, and accurate mid-level analysis (4-5 sentences) explaining the fit. Score must be between 0.00 and 100.00 with 2 decimal places." }] }
    `;

    try {
      // Create a timeout promise for Phase 1.5
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Phase 1.5 timed out')), 40000)
      );

      const midResponse = (await Promise.race([
        openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "developer", content: "You are an expert technical evaluator. Think carefully and output JSON." },
            { role: "user", content: midLevelPrompt }
          ],
          response_format: { type: "json_object" }
        }),
        timeoutPromise
      ])) as { choices: { message: { content: string | null } }[] };

      const midRaw = midResponse.choices[0].message.content || '{"results": []}';
      const midParsed = JSON.parse(cleanJson(midRaw));
      midLevelResults = midParsed.results || midParsed.matches || (Array.isArray(midParsed) ? midParsed : []);

      // Update screenedResults with mid-level insights
      midLevelResults.forEach(mlr => {
        const idx = screenedResults.findIndex(sr => sr.id === (typeof mlr.id === 'string' ? parseInt(mlr.id) : mlr.id));
        if (idx !== -1) {
          screenedResults[idx].score = typeof mlr.score === 'string' ? parseFloat(mlr.score) : mlr.score;
          screenedResults[idx].reason = mlr.reason;
        }
      });

      screenedResults.sort((a, b) => b.score - a.score);
      console.log(`Phase 1.5 completed for ${midLevelResults.length} companies`);
    } catch (error) {
      console.error("Mid-Level Phase Failed:", error);
    }
  }

  // --- PHASE 2: Deep Dive (Top 5 Only) ---
  // Select top 5 for identifying the "Strategic Matches"
  // ONLY take companies with a score > 0 to avoid deep analyzing non-matches
  const topCompanyIds = new Set(screenedResults
    .filter(r => r.score > 0)
    .slice(0, 5)
    .map(r => r.id)
  );

  console.log(`Phase 2: Deep analyzing top ${topCompanyIds.size} companies...`);

  // Parallel execution of deep analysis for top matches
  // Filter to only those in top 5 to keep it efficient
  const topMatches = filteredCompanies.filter(c => topCompanyIds.has(c.id));
  const otherMatches = filteredCompanies.filter(c => !topCompanyIds.has(c.id));

  console.log(`Deep analyzing ${topMatches.length} top candidates...`);

  // Use a timeout for each deep analysis to prevent hanging
  const deepResults = await Promise.all(topMatches.map(async (company) => {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Deep analysis timed out')), 25000)
      );

      // Race the analysis against the timeout
      const topResult = await Promise.race([
        recruiterAgent(portfolio, company, preferences),
        timeoutPromise
      ]) as AgentMatchResult;

      return {
        ...company,
        matchScore: topResult.score,
        matchReason: topResult.summary,
        agentEvaluation: topResult
      };
    } catch (e) {
      console.error(`Deep analysis failed or timed out for ${company.name}`, e);
      const screenData = screenedResults.find(r => r.id === company.id);
      return {
        ...company,
        matchScore: screenData?.score || 0,
        matchReason: screenData?.reason || "Analysis encountered an issue.",
        agentEvaluation: {
          score: screenData?.score || 0,
          thought: "Analysis timeout or error.",
          summary: "Deep analysis failed to complete in time.",
          strengths: [],
          alignment: { technical: 0, cultural: 0, industry: 0 }
        }
      };
    }
  }));

  const otherResults = otherMatches.map(company => {
    const screenData = screenedResults.find(r => r.id === company.id);
    return {
      ...company,
      matchScore: screenData?.score || 0,
      matchReason: screenData?.reason || "Not a primary match.",
      agentEvaluation: {
        score: screenData?.score || 0,
        thought: "Screened out",
        summary: "Not a primary match.",
        strengths: [],
        alignment: { technical: 0, cultural: 0, industry: 0 }
      }
    };
  });

  const finalMatches = [...deepResults, ...otherResults];

  if (finalMatches.length === 0 && filteredCompanies.length > 0) {
    console.warn("No final matches after merge, using screened results as backup");
    return filteredCompanies.map(c => {
      const s = screenedResults.find(r => r.id === c.id);
      return {
        ...c,
        matchScore: s?.score || 0,
        matchReason: s?.reason || "No specific reason provided.",
        agentEvaluation: {
          score: s?.score || 0,
          thought: "Used backup screening result",
          summary: s?.reason || "Screening result used as fallback.",
          strengths: [],
          alignment: { technical: 0, cultural: 0, industry: 0 }
        }
      };
    });
  }

  // Re-sort final results
  return finalMatches.sort((a, b) => b.matchScore - a.matchScore);
}
