import { NextResponse } from 'next/server';
import { getGitHubProfile } from '@/lib/github';
import { generateMatchAnalysis } from '@/lib/ai';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { username, resumeText, statement, excludedCompanyIds, preferredIndustries, additionalContext } = await request.json();

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // @ts-expect-error extending session type
    const token = session?.accessToken;

    // Default empty profile
    let githubData = {
      username: username,
      name: username === 'GUEST' || username === 'GUEST_USER' ? 'Guest Candidate' : username,
      bio: '',
      blog: '',
      company: '',
      location: '',
      email: '',
      hireable: false,
      publicRepos: 0,
      followers: 0,
      following: 0,
      totalRepos: 0,
      topLanguages: [] as string[],
      totalStars: 0,
      totalSize: 0,
      organizations: [] as any[],
      socialAccounts: [] as any[],
      profileReadme: '',
      deepTechStack: [] as string[], // API specific field
      repos: [] as any[]
    };

    // Only scrape if it's a real username (not the guest placeholder)
    if (username && username !== 'GUEST' && username !== 'GUEST_USER') {
      try {
        console.log(`Attempting public scrape for: ${username}`);
        githubData = await getGitHubProfile(username, token);
      } catch (error) {
        console.warn(`GitHub scraping failed for ${username}. Proceeding with resume only.`, error);
        // We keep the default empty object so the flow continues
      }
    }
    const companiesRaw = await prisma.company.findMany();

    // Debug exclusion logic
    console.log('Excluded IDs received:', excludedCompanyIds, 'Type:', typeof excludedCompanyIds?.[0]);
    
    // Filter Excluded Companies
    const activeCompanies = companiesRaw.filter(c => {
      const isExcluded = (excludedCompanyIds || []).map(Number).includes(Number(c.id));
      if (isExcluded) console.log(`Excluding company: ${c.name} (ID: ${c.id})`);
      return !isExcluded;
    });

    console.log(`Active companies count: ${activeCompanies.length} / ${companiesRaw.length}`);

    // Heuristic Filter
    const candidates = activeCompanies.map(c => {
      const languages = JSON.parse(c.languages || '[]') as string[];
      // Basic overlap check
      const matchCount = languages.filter(l => githubData.topLanguages.includes(l)).length;
      let heuristicScore = (matchCount / (languages.length || 1)) * 100;

      // Boost heuristic if in preferred industry
      if (preferredIndustries && preferredIndustries.includes(c.industry)) {
        heuristicScore += 15;
      }

      return { ...c, heuristicScore };
    });

    // Top 5 for AI Analysis
    const topCandidates = candidates.sort((a, b) => b.heuristicScore - a.heuristicScore).slice(0, 5);

    if (process.env.OPENAI_API_KEY) {
      const results = await Promise.all(topCandidates.map(async (company) => {
        const companyLangs = JSON.parse(company.languages || '[]');
        const companySkills = JSON.parse(company.skills || '[]');

        const analysis = await generateMatchAnalysis(
          {
            languages: githubData.topLanguages || [],
            bio: githubData.bio || '',
            name: githubData.name || 'Candidate',
            company: githubData.company || '',
            blog: githubData.blog || '',
            location: githubData.location || '',
            organizations: githubData.organizations || [],
            socials: githubData.socialAccounts || [],
            profileReadme: githubData.profileReadme || '',
            deepTechStack: githubData.deepTechStack || [],
            statement: statement,
            resume: resumeText,
            preferredIndustries: preferredIndustries,
            additionalContext: additionalContext,
            repos: (githubData.repos || []).map(r => ({
              name: r.name,
              desc: r.description,
              lang: r.language,
              topics: r.topics
            }))
          },
          {
            name: company.name,
            desc: company.description,
            requirements: {
              langs: companyLangs,
              skills: companySkills
            }
          }
        );

        return {
          ...company,
          matchScore: analysis.score,
          matchReason: analysis.reasoning,
          matchedLanguages: analysis.strengths,
          missingSkills: analysis.weaknesses
        };
      }));

      return NextResponse.json(results.sort((a, b) => b.matchScore - a.matchScore));
    }

    return NextResponse.json(topCandidates);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Match Error:', error);
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
