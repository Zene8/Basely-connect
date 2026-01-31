import { NextResponse } from 'next/server';
import { getGitHubProfile } from '@/lib/github';
import { matchCandidateToCompanies } from '@/lib/matcher';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // 1. Fetch GitHub Data
    const githubData = await getGitHubProfile(username);
    
    // 2. Fetch Companies from DB
    const companies = await prisma.company.findMany();
    
    if (companies.length === 0) {
      // Auto-seed if empty for demo purposes? 
      // Or just return error. We'll return error but suggesting to seed.
      return NextResponse.json({ error: 'No companies in database. Please ask admin to seed.' }, { status: 500 });
    }

    // 3. Match
    const result = await matchCandidateToCompanies(githubData, companies);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Match Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
