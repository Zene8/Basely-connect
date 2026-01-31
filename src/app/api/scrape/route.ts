import { NextRequest, NextResponse } from 'next/server';
import { scrapeCareerPage } from '@/lib/scraper';

export async function POST(request: NextRequest) {
  try {
    const { urls } = await request.json();
    const results = [];

    for (const url of urls) {
      const data = await scrapeCareerPage(url);
      if (data) results.push(data);
      await new Promise(r => setTimeout(r, 1000));
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    return NextResponse.json({ error: 'Scraping failed' }, { status: 500 });
  }
}
