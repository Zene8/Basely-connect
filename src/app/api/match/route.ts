import { NextResponse } from 'next/server';
import { getGitHubProfile } from '@/lib/github';
import { generateMatchAnalysis } from '@/lib/ai';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // 1. Fetch GitHub Data
    // @ts-ignore
    const token = session?.accessToken;
    const githubData = await getGitHubProfile(username, token);
    
    // 2. Fetch Companies from DB
    const companiesRaw = await prisma.company.findMany();
    
    if (companiesRaw.length === 0) {
      return NextResponse.json({ error: 'No companies found' }, { status: 404 });
    }

    // 3. Parse Company Data & Initial Scoring (Heuristic)
    const candidates = companiesRaw.map(c => {
      const languages = JSON.parse(c.languages) as string[];
      const frameworks = JSON.parse(c.frameworks) as string[];
      const skills = JSON.parse(c.skills) as string[];

      // Calculate Overlap
      const matchedLanguages = languages.filter(l => githubData.topLanguages.includes(l));
      // Heuristic: frameworks/skills match if present in bio or inferred (simplified)
      
      const score = (matchedLanguages.length / languages.length) * 100 || 0;

      return {
        ...c,
        attributes: {
            languages,
            frameworks,
            skills,
            experience: c.experience,
            contributions: c.contributions
        },
        matchScore: score,
        matchedLanguages,
        matchedFrameworks: [], // Need deeper analysis for this
        matchedSkills: [],
        missingLanguages: languages.filter(l => !githubData.topLanguages.includes(l)),
        missingFrameworks: frameworks,
        missingSkills: skills
      };
    });

    // 4. Sort by Heuristic Score
    const sorted = candidates.sort((a, b) => b.matchScore - a.matchScore);
    const topMatches = sorted.slice(0, 3);
    const rest = sorted.slice(3);

    // 5. Enhance Top Matches with AI (if Key exists)
    if (process.env.OPENAI_API_KEY) {
      const enhancedMatches = await Promise.all(topMatches.map(async (company) => {
        const analysis = await generateMatchAnalysis(
          { 
            languages: githubData.topLanguages, 
            bio: githubData.bio, 
            repos: githubData.repos.map(r => ({ name: r.name, desc: r.description, lang: r.language })) 
          },
          {
            name: company.name,
            desc: company.description,
            requirements: company.attributes
          }
        );

        return {
          ...company,
          matchScore: analysis.score, // Override with AI score
          matchReason: analysis.reasoning,
          // Merge AI insights if needed
        };
      }));
      
      return NextResponse.json([...enhancedMatches, ...rest]);
    }

    return NextResponse.json(sorted);

  } catch (error: any) {
    console.error('Match Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}