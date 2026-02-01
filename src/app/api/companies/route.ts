import { getCompanies } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const companies = await getCompanies();
    return NextResponse.json(companies);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}
