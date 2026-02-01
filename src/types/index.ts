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
  agentEvaluation?: AgentMatchResult;
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

export interface Organization {
  login: string;
  description: string | null;
}

export interface SocialAccount {
  provider: string;
  url: string;
}

export interface EnrichedRepo {
  name: string;
  description: string;
  language: string;
  stars: number;
  url: string;
  topics: string[];
  isPrivate: boolean;
  updatedAt: string | null;
  size: number;
  owner: string;
  collaborators: string[];
  repoLanguages: Record<string, number>;
  frameworks: string[];
}
export interface GitHubAnalysis {
  username?: string;
  name?: string;
  bio?: string;
  blog?: string;
  company?: string;
  location?: string;
  email?: string;
  hireable?: boolean;
  publicRepos?: number;
  followers?: number;
  following?: number;
  languages?: string[]; // Note: "languages" in original type probably meant topLanguages? 
  topLanguages?: string[];
  frameworks?: string[];
  skills?: string[];
  totalRepos: number;
  totalContributions?: number;
  topRepoStars?: number;
  totalStars?: number; // Added
  totalSize?: number; // Added
  organizations?: Organization[];
  socialAccounts?: SocialAccount[];
  profileReadme?: string;
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
