export interface CompanyAttributes {
  languages: string[];
  frameworks: string[];
  skills: string[];
  experience: string;
  contributions: string;
}

export interface Company {
  id: number;
  name: string;
  logo: string;
  industry: string;
  description: string;
  color: string;
  website?: string;
  // attributes: CompanyAttributes; // Removed in favor of flat structure
  languages: string[];
  frameworks: string[];
  skills: string[];
  lookingFor: string;
  experience?: string;
  contributions?: string;
  // Enriched fields
  compensation?: string;
  benefits?: string;
  locations?: string[];
  roleTypes?: string[];
}

export interface CompanyMatch extends Company {
  matchScore: number;
  matchReason?: string;
  matchedLanguages?: string[];
  matchedFrameworks?: string[];
  matchedSkills?: string[];
  missingLanguages?: string[];
  missingFrameworks?: string[];
  missingSkills?: string[];
}

export interface RepoSummary {
  name: string;
  description: string;
  languages: string[];
  frameworks: string[];
  skills: string[];
  purpose: string;
  stars: number;
  isPrivate: boolean;
  url: string;
}

export interface GitHubAnalysis {
  languages: string[];
  frameworks: string[];
  skills: string[];
  totalRepos: number;
  totalContributions: number;
  topRepoStars: number;
  repoSummaries?: RepoSummary[];
  error?: string;
}

export interface UserPreferences {
  industries: string[];
  optOutIds: number[];
  specialRequests: string;
}

export interface SynthesizedPortfolio {
  name: string;
  title: string;
  summary: string;
  technicalExpertise: {
    category: string;
    skills: string[];
  }[];
  projectHighlights: {
    name: string;
    description: string;
    techStack: string[];
    isPrivate: boolean;
    evidence: string;
  }[];
  experienceSummary: string;
  careerGoals: string;
}

export interface AgentMatchResult {
  score: number;
  thought: string;
  summary: string;
  strengths: string[];
  alignment: {
    technical: number;
    cultural: number;
    industry: number;
  };
}
