interface CandidateProfile {
  username: string;
  bio: string | null;
  topLanguages: string[];
  repos: any[];
}

interface Company {
  id: string;
  name: string;
  industry: string;
  description: string;
  requiredSkills: string; // JSON
  preferredLangs: string; // JSON
}

export async function matchCandidateToCompanies(candidate: CandidateProfile, companies: Company[]) {
  // Mock AI Analysis of candidate bio/repos
  // In a real app, this would be an LLM call: "Extract skills from this bio and repo list"
  const candidateSkills = new Set([
    ...candidate.topLanguages,
    // Add some heuristic skills based on keywords in bio/repos
    ...(candidate.bio?.toLowerCase().includes('react') ? ['React'] : []),
    ...(candidate.bio?.toLowerCase().includes('backend') ? ['Node.js', 'Python'] : []),
    ...(candidate.bio?.toLowerCase().includes('full stack') ? ['React', 'Node.js'] : []),
  ]);

  let bestMatch = null;
  let highestScore = -1;
  let matchReason = "";

  for (const company of companies) {
    const required = new Set(JSON.parse(company.requiredSkills) as string[]);
    const preferred = new Set(JSON.parse(company.preferredLangs) as string[]);
    
    let score = 0;
    const matches: string[] = [];

    // Calculate score based on overlap
    candidateSkills.forEach(skill => {
      if (required.has(skill)) {
        score += 10;
        matches.push(skill);
      } else if (preferred.has(skill)) {
        score += 5;
        matches.push(skill);
      }
    });

    // Normalize score (simple version)
    // Max potential score is rough, just relative comparison needed
    
    if (score > highestScore) {
      highestScore = score;
      bestMatch = company;
      matchReason = `Matched on strong overlap in: ${matches.join(', ')}. Your profile indicates experience relevant to their ${company.industry} focus.`;
    }
  }

  // Fallback if no specific skills match (just for demo purposes)
  if (!bestMatch && companies.length > 0) {
    bestMatch = companies[0];
    matchReason = "General match based on open developer roles.";
    highestScore = 10; // Low score
  }

  return {
    company: bestMatch,
    matchScore: Math.min(100, highestScore * 10), // Rough scaling
    matchReason
  };
}
