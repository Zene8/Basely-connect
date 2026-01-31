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
  attributes: CompanyAttributes;
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

export interface GitHubAnalysis {
  languages: string[];
  frameworks: string[];
  skills: string[];
  totalRepos: number;
  totalContributions: number;
  topRepoStars: number;
  error?: string;
}
