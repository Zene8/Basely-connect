import { NextResponse } from 'next/server';
import { getGitHubProfile } from '@/lib/github';
import { generateMatchAnalysis } from '@/lib/ai';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { username, resumeText, statement } = await request.json();

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // @ts-ignore
    const token = session?.accessToken;
    const githubData = await getGitHubProfile(username, token);
    const companiesRaw = await prisma.company.findMany();
    
    // Heuristic Filter
    const candidates = companiesRaw.map(c => {
      const languages = JSON.parse(c.languages) as string[];
      // Basic overlap check
      const matchCount = languages.filter(l => githubData.topLanguages.includes(l)).length;
      const heuristicScore = (matchCount / (languages.length || 1)) * 100;
      return { ...c, heuristicScore };
    });

    // Top 5 for AI Analysis
    const topCandidates = candidates.sort((a, b) => b.heuristicScore - a.heuristicScore).slice(0, 5);

    if (process.env.OPENAI_API_KEY) {
      const results = await Promise.all(topCandidates.map(async (company) => {
        const analysis = await generateMatchAnalysis(
          { 
            languages: githubData.topLanguages, 
            bio: githubData.bio,
            statement: statement,
            resume: resumeText,
            repos: githubData.repos.map(r => ({ name: r.name, desc: r.description, lang: r.language })) 
          },
          {
            name: company.name,
            desc: company.description,
            requirements: {
               langs: JSON.parse(company.languages),
               skills: JSON.parse(company.skills)
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

  } catch (error: any) {
    console.error('Match Error:', error);
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
