import { NextResponse } from 'next/server';
import { getGitHubProfile } from '@/lib/github';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createPortfolioAgent, recruiterMatcherAgent } from "@/lib/agents";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const {
      username,
      resumeText,
      linkedinText,
      statement,
      excludedCompanyIds,
      preferredIndustries,
      additionalContext
    } = await request.json();

    // @ts-ignore
    const token = session?.accessToken;

    // 1. Get GitHub Data
    let githubData = null;
    if (username && username !== 'GUEST' && username !== 'GUEST_USER') {
      try {
        githubData = await getGitHubProfile(username, token);
      } catch (error) {
        console.warn(`GitHub fetch failed for ${username}`, error);
      }
    }

    // 2. Portfolio Creator Agent
    const portfolio = await createPortfolioAgent(
      {
        github: githubData,
        resume: resumeText,
        linkedin: linkedinText,
        statement: statement
      },
      {
        industries: preferredIndustries || [],
        optOutIds: (excludedCompanyIds || []).map(Number),
        specialRequests: additionalContext || ''
      }
    );

    // 3. Fetch Companies (and incorporate data from companies.json if possible)
    const companiesRaw = await prisma.company.findMany();

    // We can also use the companies.json for more detailed context if the database is lagging
    // or doesn't have the full scraped content.
    const formattedCompanies = companiesRaw.map(c => {
      return {
        ...c,
        attributes: {
          languages: JSON.parse(c.languages || '[]'),
          frameworks: JSON.parse(c.frameworks || '[]'),
          skills: JSON.parse(c.skills || '[]'),
          experience: c.experience,
          contributions: c.contributions
        }
      };
    });

    // 4. Recruiter Agent - Orchestrated matching
    const matches = await recruiterMatcherAgent(
      portfolio,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formattedCompanies as any,
      {
        industries: preferredIndustries || [],
        optOutIds: (excludedCompanyIds || []).map(Number),
        specialRequests: additionalContext || ''
      }
    );

    // Filter to top 5 for results display
    const topMatches = matches.slice(0, 5);

    return NextResponse.json({
      portfolio,
      matches: topMatches
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Match Error:', error);
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
