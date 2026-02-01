import OpenAI from 'openai';
import { RepoSummary, EnrichedRepo } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function summarizeRepoBatch(repos: EnrichedRepo[]): Promise<RepoSummary[]> {
  if (repos.length === 0) return [];

  const prompt = `
    You are a Technical Repository Analyzer. Analyze the following batch of GitHub repositories and provide a concise summary for each.
    
    For each repository, identify:
    1. Primary Languages used.
    2. Frameworks and Libraries detected.
    3. Specific Technical Skills demonstrated (e.g., "REST API Design", "Asynchronous Programming", "Microservices").
    4. A brief "Purpose" of what the repository does.
    
    If a repository is empty or lacks clear technical content, indicate its purpose as "Empty or initialization repository".
    
    Repositories:
    ${repos.map(r => `
      - Name: ${r.name}
        Description: ${r.description || 'No description'}
        Languages: ${JSON.stringify(r.repoLanguages)}
        Frameworks: ${r.frameworks.join(', ')}
        Topics: ${r.topics.join(', ')}
        Stars: ${r.stars}
        Private: ${r.isPrivate}
    `).join('\n')}
    
    Return a strictly valid JSON object matching this structure:
    {
      "repos": [
        {
          "name": "repo-name",
          "description": "original description",
          "languages": ["Lang1", "Lang2"],
          "frameworks": ["Frame1", "Lib1"],
          "skills": ["Skill1", "Skill2"],
          "purpose": "Concise summary of what it is and what it uses.",
          "stars": number,
          "isPrivate": boolean
        }
      ]
    }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "developer", content: "You are a technical analyzer. Output JSON only." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("Empty response from OpenAI");

    // Aggressively clean markdown or non-JSON artifacts
    let jsonString = content.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const parsed = JSON.parse(jsonString);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let summaries: any[] = [];

    if (Array.isArray(parsed)) {
      summaries = parsed;
    } else if (parsed.repos && Array.isArray(parsed.repos)) {
      summaries = parsed.repos;
    } else if (parsed.summaries && Array.isArray(parsed.summaries)) {
      summaries = parsed.summaries;
    } else {
      // If it's an object where values are the repos
      const values = Object.values(parsed);
      if (values.length > 0 && Array.isArray(values[0])) {
        summaries = values[0] as any[];
      } else {
        summaries = values;
      }
    }

    if (!Array.isArray(summaries)) {
      console.warn("Parsed response is not an array, using fallback", parsed);
      throw new Error("Parsed response is not an array");
    }

    // Map back URLs as they might be lost or need to be preserved
    // and ensure we match the correct repo by name if possible, otherwise index
    return repos.map((originalRepo, index) => {
      const summary = summaries.find(s => s.name?.toLowerCase() === originalRepo.name?.toLowerCase()) || summaries[index];
      return {
        name: originalRepo.name,
        description: summary?.description || originalRepo.description || "",
        languages: summary?.languages || (originalRepo.language ? [originalRepo.language] : []),
        frameworks: summary?.frameworks || originalRepo.frameworks || [],
        skills: summary?.skills || originalRepo.topics || [],
        purpose: summary?.purpose || originalRepo.description || "GitHub Repository",
        stars: originalRepo.stars,
        isPrivate: originalRepo.isPrivate,
        url: originalRepo.url
      };
    });

  } catch (error) {
    console.error("Repo Batch Summary Error:", error);
    // Fallback basic summary
    return repos.map(r => ({
      name: r.name,
      description: r.description || "",
      languages: r.language ? [r.language] : [],
      frameworks: r.frameworks || [],
      skills: r.topics || [],
      purpose: r.description || "GitHub Repository",
      stars: r.stars,
      isPrivate: r.isPrivate,
      url: r.url
    }));
  }
}

export async function analyzeAllRepos(enrichedRepos: EnrichedRepo[]): Promise<RepoSummary[]> {
  const batchSize = 5;
  const batches = [];

  for (let i = 0; i < enrichedRepos.length; i += batchSize) {
    batches.push(enrichedRepos.slice(i, i + batchSize));
  }

  // Process batches in parallel
  const summaryResults = await Promise.all(batches.map(batch => summarizeRepoBatch(batch)));

  return summaryResults.flat();
}
