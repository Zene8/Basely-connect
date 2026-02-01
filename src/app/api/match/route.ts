import { NextResponse } from 'next/server';
import { getGitHubProfile } from '@/lib/github';
import { getCompanies } from '@/lib/db';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createPortfolioAgent, recruiterMatcherAgent } from "@/lib/agents";
import { sendMatchEmail } from '@/lib/email';

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

    // @ts-expect-error Session type extension needed
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

    // 3. Fetch Companies (from local JSON DB)
    const formattedCompanies = await getCompanies();

    // 4. Recruiter Agent - Orchestrated matching
    const matches = await recruiterMatcherAgent(
      portfolio,
      formattedCompanies,
      {
        industries: preferredIndustries || [],
        optOutIds: (excludedCompanyIds || []).map(Number),
        specialRequests: additionalContext || ''
      }
    );

    // 5. Store Matches and Send Email
    // Only store/send if we have valid matches
    const validMatches = matches.filter(m => m.matchScore > 0);
    const matchData = validMatches.map(m => ({
      username: username || 'GUEST',
      companyName: m.name || 'Unknown Company',
      score: m.matchScore
    }));

    try {
      // Upload to database
      if (matchData.length > 0) {
        await prisma.userMatch.createMany({
          data: matchData
        });
      }

      // Send Email
      await sendMatchEmail(username || 'GUEST', matchData);
    } catch (dbError) {
      console.error("Failed to store matches or send email:", dbError);
    }

    return NextResponse.json({
      portfolio,
      matches: matches
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Match Error:', error);
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
